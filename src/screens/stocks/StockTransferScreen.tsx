import React, { useCallback, useEffect, useState } from 'react';
import { View, ScrollView, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { Colors, Spacing, Radius, Typography } from '../../constants';
import { AppText } from '../../components/common/Text';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { ErrorBanner } from '../../components/common/ErrorBanner';
import { useAuthStore } from '../../store/authStore';
import { stocksApi } from '../../services/api/stocksApi';
import type { RootStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'StockTransfer'>;

export default function StockTransferScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { company } = useAuthStore();
  const preItemId = route.params?.itemId;

  const [itemSearch, setItemSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [itemSuggestions, setItemSuggestions] = useState<any[]>([]);
  const [fromWarehouse, setFromWarehouse] = useState('');
  const [toWarehouse, setToWarehouse] = useState('');
  const [quantity, setQuantity] = useState('');
  const [narration, setNarration] = useState('');
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!company?.guid) return;
    stocksApi.getWarehouses(company.guid).then(r => setWarehouses(r.data?.data ?? r.data ?? [])).catch(() => {});
    if (preItemId) {
      stocksApi.getStockItem(preItemId, company.guid).then(r => { setSelectedItem(r.data); setItemSearch(r.data?.name ?? ''); }).catch(() => {});
    }
  }, [company?.guid, preItemId]);

  const searchItems = async (q: string) => {
    setItemSearch(q);
    if (!q.trim() || !company?.guid) { setItemSuggestions([]); return; }
    try {
      const res = await stocksApi.getTotalStock(company.guid, undefined, q);
      setItemSuggestions((res.data?.data ?? res.data ?? []).slice(0, 8));
    } catch { setItemSuggestions([]); }
  };

  const handleSubmit = async () => {
    if (!selectedItem) { setError('Select an item'); return; }
    if (!fromWarehouse || !toWarehouse) { setError('Select both warehouses'); return; }
    if (!quantity || parseFloat(quantity) <= 0) { setError('Enter valid quantity'); return; }
    if (fromWarehouse === toWarehouse) { setError('From and To warehouse cannot be the same'); return; }
    setLoading(true); setError(null);
    try {
      await stocksApi.transferStock({ companyGuid: company?.guid ?? '', itemId: selectedItem.id, fromWarehouse, toWarehouse, quantity: parseFloat(quantity), narration });
      setSuccess(true);
    } catch (e: any) { setError(e?.message ?? 'Transfer failed'); }
    finally { setLoading(false); }
  };

  if (success) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.successScreen}>
          <AppText style={s.successIcon}>✓</AppText>
          <AppText style={s.successTitle}>Item Transferred!</AppText>
          <AppText style={s.successSub}>Your item has just been transferred.</AppText>
          <AppText style={s.successDetail}>Transfer Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</AppText>
          <Button label="View Stocks" onPress={() => navigation.goBack()} style={s.successBtn} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}><AppText style={s.back}>←</AppText></TouchableOpacity>
          <AppText style={s.title}>Stock Transfer</AppText>
          <View style={{ width: 44 }} />
        </View>
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {error && <ErrorBanner message={error} onRetry={() => setError(null)} />}

          <F label="Select Item *" value={itemSearch} onChange={searchItems} placeholder="Search stock item..." />
          {itemSuggestions.length > 0 && (
            <View style={s.suggestions}>
              {itemSuggestions.map((i: any) => (
                <TouchableOpacity key={i.id} style={s.suggItem} onPress={() => { setSelectedItem(i); setItemSearch(i.name); setItemSuggestions([]); }}>
                  <AppText style={s.suggText}>{i.name}</AppText>
                  <AppText style={s.suggStock}>{i.currentStock} {i.unit}</AppText>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {selectedItem && (
            <Card style={s.itemPreview}>
              <AppText style={s.itemName}>{selectedItem.name}</AppText>
              <AppText style={s.itemStock}>Current Stock: {selectedItem.currentStock} {selectedItem.unit}</AppText>
            </Card>
          )}

          <AppText style={s.lbl}>From Warehouse *</AppText>
          <View style={s.wRow}>{warehouses.map(w => <TouchableOpacity key={w.id} onPress={() => setFromWarehouse(w.id)} style={[s.wChip, fromWarehouse === w.id && s.wChipA]}><AppText style={[s.wChipT, fromWarehouse === w.id && s.wChipTA]}>{w.name}</AppText></TouchableOpacity>)}</View>

          <AppText style={s.lbl}>To Warehouse *</AppText>
          <View style={s.wRow}>{warehouses.map(w => <TouchableOpacity key={w.id} onPress={() => setToWarehouse(w.id)} style={[s.wChip, toWarehouse === w.id && s.wChipA]}><AppText style={[s.wChipT, toWarehouse === w.id && s.wChipTA]}>{w.name}</AppText></TouchableOpacity>)}</View>

          <F label="Quantity *" value={quantity} onChange={setQuantity} placeholder="Enter quantity" keyboardType="decimal-pad" />
          <F label="Narration" value={narration} onChange={setNarration} placeholder="Optional notes" multiline />

          <View style={{ height: 100 }} />
        </ScrollView>
        <View style={s.footer}><Button label={loading ? 'Transferring...' : 'Transfer Stock'} onPress={handleSubmit} loading={loading} /></View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function F({ label, value, onChange, placeholder, keyboardType, multiline }: any) {
  return (<View style={{ marginBottom: Spacing.sm }}><AppText style={s.lbl}>{label}</AppText><TextInput style={[s.inp, multiline && { height: 72, textAlignVertical: 'top' }]} value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={Colors.textTertiary} keyboardType={keyboardType ?? 'default'} multiline={multiline} allowFontScaling={false} /></View>);
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.pageBg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: 10, backgroundColor: Colors.cardBg, borderBottomWidth: 1, borderBottomColor: Colors.borderDefault },
  back: { fontSize: 22, color: Colors.textPrimary, marginRight: Spacing.sm },
  title: { flex: 1, fontSize: Typography.md, fontWeight: Typography.weightSemibold, textAlign: 'center' },
  content: { padding: Spacing.base },
  lbl: { fontSize: Typography.sm, fontWeight: Typography.weightMedium, color: Colors.textSecondary, marginBottom: 4 },
  inp: { borderWidth: 1, borderColor: Colors.borderDefault, borderRadius: Radius.sm, backgroundColor: Colors.cardBg, paddingHorizontal: Spacing.md, paddingVertical: 10, fontSize: Typography.base, color: Colors.textPrimary, marginBottom: Spacing.xs },
  suggestions: { backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.borderDefault, borderRadius: Radius.sm, marginBottom: Spacing.sm },
  suggItem: { flexDirection: 'row', justifyContent: 'space-between', padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderDefault },
  suggText: { fontSize: Typography.base, color: Colors.textPrimary },
  suggStock: { fontSize: Typography.sm, color: Colors.textTertiary },
  itemPreview: { marginBottom: Spacing.base, padding: Spacing.md },
  itemName: { fontSize: Typography.base, fontWeight: Typography.weightSemibold, color: Colors.textPrimary },
  itemStock: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  wRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.base },
  wChip: { paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.borderDefault, backgroundColor: Colors.cardBg },
  wChipA: { backgroundColor: Colors.brandPrimary, borderColor: Colors.brandPrimary },
  wChipT: { fontSize: Typography.sm, color: Colors.textSecondary },
  wChipTA: { color: Colors.white },
  footer: { padding: Spacing.base, backgroundColor: Colors.cardBg, borderTopWidth: 1, borderTopColor: Colors.borderDefault },
  successScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  successIcon: { fontSize: 56, marginBottom: Spacing.base },
  successTitle: { fontSize: Typography.xl, fontWeight: Typography.weightBold, color: Colors.positiveText, marginBottom: Spacing.xs },
  successSub: { fontSize: Typography.base, color: Colors.textSecondary, marginBottom: Spacing.sm },
  successDetail: { fontSize: Typography.sm, color: Colors.textTertiary, marginBottom: Spacing.xl },
  successBtn: { minWidth: 200 },
});
