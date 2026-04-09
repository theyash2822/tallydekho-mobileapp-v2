import React, { useCallback, useEffect, useState } from 'react';
import { View, ScrollView, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Colors, Spacing, Radius, Typography } from '../../constants';
import { AppText } from '../../components/common/Text';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { ErrorBanner } from '../../components/common/ErrorBanner';
import { useAuthStore } from '../../store/authStore';
import { stocksApi } from '../../services/api/stocksApi';
import { STATIC_ADJUSTMENT_TYPES } from '../../constants/staticData';
import type { RootStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'StockAdjust'>;

export default function StockAdjustScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { company } = useAuthStore();
  const preItemId = route.params?.itemId;

  const [itemSearch, setItemSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [adjustType, setAdjustType] = useState<string>(STATIC_ADJUSTMENT_TYPES[0]);
  const [quantity, setQuantity] = useState('');
  const [narration, setNarration] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!company?.guid) return;
    stocksApi.getWarehouses(company.guid).then(r => setWarehouses(r.data?.data ?? r.data ?? [])).catch(() => {});
    if (preItemId) {
      stocksApi.getStockItem(preItemId, company.guid).then(r => {
        const item = r.data?.item ?? r.data;
        setSelectedItem(item);
        setItemSearch(item?.name ?? '');
      }).catch(() => {});
    }
  }, [company?.guid, preItemId]);

  const searchItems = async (q: string) => {
    setItemSearch(q);
    if (!q.trim() || !company?.guid) { setSuggestions([]); return; }
    try {
      const res = await stocksApi.getTotalStock(company.guid, undefined, q);
      setSuggestions((res.data?.data ?? res.data ?? []).slice(0, 8));
    } catch { setSuggestions([]); }
  };

  const currentStock = selectedItem?.currentStock ?? 0;
  const adjustQty = parseFloat(quantity) || 0;
  const isDecrease = adjustType === 'Damage' || adjustType === 'Theft';
  const afterStock = isDecrease ? currentStock - adjustQty : currentStock + adjustQty;

  const handleSubmit = async () => {
    if (!selectedItem) { setError('Select an item'); return; }
    if (!selectedWarehouse) { setError('Select a warehouse'); return; }
    if (!quantity || adjustQty <= 0) { setError('Enter valid quantity'); return; }
    setLoading(true); setError(null);
    try {
      await stocksApi.adjustStock({
        companyGuid: company?.guid ?? '',
        itemId: selectedItem.id,
        warehouseId: selectedWarehouse,
        adjustmentType: adjustType,
        quantity: adjustQty,
        narration,
      });
      setSuccess(true);
    } catch (e: any) { setError(e?.message ?? 'Adjustment failed'); }
    finally { setLoading(false); }
  };

  if (success) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.successScreen}>
          <AppText style={s.successIcon}>✓</AppText>
          <AppText style={s.successTitle}>Item adjusted!</AppText>
          <AppText style={s.successSub}>Your item just updated!</AppText>
          <AppText style={s.successDate}>Adjustment Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</AppText>
          <Button label="View Item" onPress={() => { if (selectedItem) navigation.navigate('StockItemDetail', { itemId: selectedItem.id }); else navigation.goBack(); }} style={s.successBtn} />
          <Button label="Back to Stocks" onPress={() => navigation.goBack()} variant="ghost" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}><AppText style={s.back}>←</AppText></TouchableOpacity>
          <AppText style={s.title}>Adjust Stock</AppText>
          <View style={{ width: 44 }} />
        </View>
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {error && <ErrorBanner message={error} onRetry={() => setError(null)} />}

          {/* Item selector */}
          <AppText style={s.lbl}>Select Item *</AppText>
          <TextInput style={s.inp} value={itemSearch} onChangeText={searchItems} placeholder="Search stock item..." placeholderTextColor={Colors.textTertiary} allowFontScaling={false} />
          {suggestions.length > 0 && (
            <View style={s.suggestions}>
              {suggestions.map((i: any) => (
                <TouchableOpacity key={i.id} style={s.suggItem} onPress={() => { setSelectedItem(i); setItemSearch(i.name); setSuggestions([]); }}>
                  <AppText style={s.suggText}>{i.name}</AppText>
                  <AppText style={s.suggStock}>{i.currentStock} {i.unit}</AppText>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {selectedItem && (
            <Card style={s.stockPreview}>
              <View style={s.previewRow}>
                <AppText style={s.previewLabel}>Current Stock</AppText>
                <AppText style={s.previewValue}>{currentStock} {selectedItem.unit}</AppText>
              </View>
            </Card>
          )}

          {/* Adjustment type */}
          <AppText style={s.lbl}>Adjustment Type *</AppText>
          <View style={s.chipRow}>
            {STATIC_ADJUSTMENT_TYPES.map(t => (
              <TouchableOpacity key={t} onPress={() => setAdjustType(t)} style={[s.chip, adjustType === t && s.chipA]}>
                <AppText style={[s.chipT, adjustType === t && s.chipTA]}>{t}</AppText>
              </TouchableOpacity>
            ))}
          </View>

          {/* Warehouse */}
          <AppText style={s.lbl}>Warehouse *</AppText>
          <View style={s.chipRow}>
            {warehouses.map(w => (
              <TouchableOpacity key={w.id} onPress={() => setSelectedWarehouse(w.id)} style={[s.chip, selectedWarehouse === w.id && s.chipA]}>
                <AppText style={[s.chipT, selectedWarehouse === w.id && s.chipTA]}>{w.name}</AppText>
              </TouchableOpacity>
            ))}
          </View>

          {/* Quantity */}
          <AppText style={s.lbl}>Quantity *</AppText>
          <TextInput style={s.inp} value={quantity} onChangeText={setQuantity} placeholder="Enter quantity" placeholderTextColor={Colors.textTertiary} keyboardType="decimal-pad" allowFontScaling={false} />

          {/* Narration */}
          <AppText style={s.lbl}>Narration</AppText>
          <TextInput style={[s.inp, { height: 72, textAlignVertical: 'top' }]} value={narration} onChangeText={setNarration} placeholder="Optional notes" placeholderTextColor={Colors.textTertiary} multiline allowFontScaling={false} />

          {/* Preview */}
          {selectedItem && adjustQty > 0 && (
            <Card style={s.previewCard}>
              <AppText style={s.previewTitle}>Preview</AppText>
              <View style={s.previewRow}>
                <AppText style={s.previewLabel}>Before</AppText>
                <AppText style={s.previewValue}>{currentStock} {selectedItem.unit}</AppText>
              </View>
              <View style={s.previewRow}>
                <AppText style={s.previewLabel}>Adjustment</AppText>
                <AppText style={[s.previewValue, { color: isDecrease ? Colors.negativeText : Colors.positiveText }]}>
                  {isDecrease ? '-' : '+'}{adjustQty} {selectedItem.unit}
                </AppText>
              </View>
              <View style={[s.previewRow, s.previewTotal]}>
                <AppText style={s.previewTotalLabel}>After</AppText>
                <AppText style={[s.previewTotalValue, { color: afterStock < 0 ? Colors.negativeText : Colors.positiveText }]}>
                  {afterStock} {selectedItem.unit}
                </AppText>
              </View>
            </Card>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
        <View style={s.footer}><Button label={loading ? 'Saving...' : 'Submit Adjustment'} onPress={handleSubmit} loading={loading} /></View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.pageBg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: 10, backgroundColor: Colors.cardBg, borderBottomWidth: 1, borderBottomColor: Colors.borderDefault },
  back: { fontSize: 22, color: Colors.textPrimary, marginRight: Spacing.sm },
  title: { flex: 1, fontSize: Typography.md, fontWeight: Typography.weightSemibold, textAlign: 'center' },
  content: { padding: Spacing.base },
  lbl: { fontSize: Typography.sm, fontWeight: Typography.weightMedium, color: Colors.textSecondary, marginBottom: 4 },
  inp: { borderWidth: 1, borderColor: Colors.borderDefault, borderRadius: Radius.sm, backgroundColor: Colors.cardBg, paddingHorizontal: Spacing.md, paddingVertical: 10, fontSize: Typography.base, color: Colors.textPrimary, marginBottom: Spacing.base },
  suggestions: { backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.borderDefault, borderRadius: Radius.sm, marginBottom: Spacing.sm },
  suggItem: { flexDirection: 'row', justifyContent: 'space-between', padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderDefault },
  suggText: { fontSize: Typography.base, color: Colors.textPrimary },
  suggStock: { fontSize: Typography.sm, color: Colors.textTertiary },
  stockPreview: { marginBottom: Spacing.base, padding: Spacing.md },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.base },
  chip: { paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.borderDefault, backgroundColor: Colors.cardBg },
  chipA: { backgroundColor: Colors.brandPrimary, borderColor: Colors.brandPrimary },
  chipT: { fontSize: Typography.sm, color: Colors.textSecondary },
  chipTA: { color: Colors.white },
  previewCard: { padding: Spacing.base, marginBottom: Spacing.base },
  previewTitle: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: Colors.textSecondary, marginBottom: Spacing.sm, textTransform: 'uppercase', letterSpacing: 0.8 },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  previewLabel: { fontSize: Typography.base, color: Colors.textSecondary },
  previewValue: { fontSize: Typography.base, fontWeight: Typography.weightMedium, color: Colors.textPrimary },
  previewTotal: { borderTopWidth: 1, borderTopColor: Colors.borderDefault, marginTop: 4, paddingTop: 8 },
  previewTotalLabel: { fontSize: Typography.base, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  previewTotalValue: { fontSize: Typography.lg, fontWeight: Typography.weightBold },
  footer: { padding: Spacing.base, backgroundColor: Colors.cardBg, borderTopWidth: 1, borderTopColor: Colors.borderDefault },
  successScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.sm },
  successIcon: { fontSize: 56 },
  successTitle: { fontSize: Typography.xl, fontWeight: Typography.weightBold, color: Colors.positiveText },
  successSub: { fontSize: Typography.base, color: Colors.textSecondary },
  successDate: { fontSize: Typography.sm, color: Colors.textTertiary, marginBottom: Spacing.lg },
  successBtn: { minWidth: 200 },
});
