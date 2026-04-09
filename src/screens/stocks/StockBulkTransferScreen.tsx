import React, { useCallback, useEffect, useState } from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import { Colors, Spacing, Radius, Typography } from '../../constants';
import { AppText } from '../../components/common/Text';
import { Button } from '../../components/common/Button';
import { ErrorBanner } from '../../components/common/ErrorBanner';
import { useAuthStore } from '../../store/authStore';
import { stocksApi } from '../../services/api/stocksApi';
import type { StockItem, RootStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
interface Selection { itemId: string; quantity: string; }

export default function StockBulkTransferScreen() {
  const navigation = useNavigation<Nav>();
  const { company } = useAuthStore();
  const [items, setItems] = useState<StockItem[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [fromWarehouse, setFromWarehouse] = useState('');
  const [toWarehouse, setToWarehouse] = useState('');
  const [selections, setSelections] = useState<Selection[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!company?.guid) return;
    setLoading(true); setError(null);
    try {
      const [stockRes, whRes] = await Promise.all([
        stocksApi.getTotalStock(company.guid, fromWarehouse || undefined, search),
        stocksApi.getWarehouses(company.guid),
      ]);
      setItems(stockRes.data?.data ?? stockRes.data ?? []);
      setWarehouses(whRes.data?.data ?? whRes.data ?? []);
    } catch (e: any) { setError(e?.message ?? 'Failed to load'); }
    finally { setLoading(false); }
  }, [company?.guid, fromWarehouse, search]);

  useEffect(() => { fetch(); }, [fetch]);

  const toggle = (itemId: string) => {
    setSelections(prev => prev.find(s => s.itemId === itemId) ? prev.filter(s => s.itemId !== itemId) : [...prev, { itemId, quantity: '1' }]);
  };

  const updateQty = (itemId: string, qty: string) => {
    setSelections(prev => prev.map(s => s.itemId === itemId ? { ...s, quantity: qty } : s));
  };

  const handleBulkTransfer = async () => {
    if (!fromWarehouse || !toWarehouse) { setError('Select both warehouses'); return; }
    if (fromWarehouse === toWarehouse) { setError('From and To cannot be same'); return; }
    if (selections.length === 0) { setError('Select at least one item'); return; }
    setLoading(true); setError(null);
    try {
      await Promise.all(selections.map(s =>
        stocksApi.transferStock({ companyGuid: company?.guid ?? '', itemId: s.itemId, fromWarehouse, toWarehouse, quantity: parseFloat(s.quantity) || 1 })
      ));
      Toast.show({ type: 'success', text1: `${selections.length} items transferred!` });
      navigation.goBack();
    } catch (e: any) { setError(e?.message ?? 'Transfer failed'); }
    finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}><AppText style={s.back}>←</AppText></TouchableOpacity>
        <AppText style={s.title}>Bulk Transfer</AppText>
        <View style={{ width: 44 }} />
      </View>

      {/* Warehouse selectors */}
      <View style={s.warehouseSection}>
        <View style={s.wCol}>
          <AppText style={s.wLabel}>From</AppText>
          <View style={s.wChips}>{warehouses.map(w => <TouchableOpacity key={w.id} onPress={() => setFromWarehouse(w.id)} style={[s.wChip, fromWarehouse === w.id && s.wChipA]}><AppText style={[s.wChipT, fromWarehouse === w.id && s.wChipTA]}>{w.name}</AppText></TouchableOpacity>)}</View>
        </View>
        <AppText style={s.arrow}>→</AppText>
        <View style={s.wCol}>
          <AppText style={s.wLabel}>To</AppText>
          <View style={s.wChips}>{warehouses.map(w => <TouchableOpacity key={w.id} onPress={() => setToWarehouse(w.id)} style={[s.wChip, toWarehouse === w.id && s.wChipA]}><AppText style={[s.wChipT, toWarehouse === w.id && s.wChipTA]}>{w.name}</AppText></TouchableOpacity>)}</View>
        </View>
      </View>

      <View style={s.searchBar}>
        <AppText style={s.searchIcon}>🔍</AppText>
        <TextInput style={s.searchInput} placeholder="Search items..." placeholderTextColor={Colors.textTertiary} value={search} onChangeText={setSearch} onSubmitEditing={fetch} allowFontScaling={false} />
      </View>

      {error && <ErrorBanner message={error} onRetry={() => setError(null)} />}

      {selections.length > 0 && (
        <View style={s.selBanner}>
          <AppText style={s.selText}>{selections.length} item{selections.length > 1 ? 's' : ''} selected</AppText>
        </View>
      )}

      <FlatList
        data={items} keyExtractor={i => i.id}
        renderItem={({ item }) => {
          const sel = selections.find(s => s.itemId === item.id);
          return (
            <TouchableOpacity onPress={() => toggle(item.id)} style={[s.row, sel && s.rowSel]} activeOpacity={0.7}>
              <View style={[s.checkbox, sel && s.checkboxSel]}>
                {sel && <AppText style={s.checkmark}>✓</AppText>}
              </View>
              <View style={s.rowInfo}>
                <AppText style={s.rowName}>{item.name}</AppText>
                <AppText style={s.rowStock}>{item.currentStock} {item.unit}</AppText>
              </View>
              {sel && (
                <TextInput style={s.qtyInput} value={sel.quantity} onChangeText={q => updateQty(item.id, q)} keyboardType="decimal-pad" placeholder="Qty" placeholderTextColor={Colors.textTertiary} allowFontScaling={false} />
              )}
            </TouchableOpacity>
          );
        }}
        refreshing={loading} onRefresh={fetch} contentContainerStyle={s.list}
        ItemSeparatorComponent={() => <View style={s.sep} />}
        ListEmptyComponent={!loading ? <View style={s.empty}><AppText style={s.emptyText}>{error ? '' : 'No items found'}</AppText></View> : null}
      />

      <View style={s.footer}>
        <Button label={loading ? 'Transferring...' : `Transfer ${selections.length > 0 ? `(${selections.length})` : ''}`} onPress={handleBulkTransfer} loading={loading} disabled={selections.length === 0} />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.pageBg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: 10, backgroundColor: Colors.cardBg, borderBottomWidth: 1, borderBottomColor: Colors.borderDefault },
  back: { fontSize: 22, color: Colors.textPrimary, marginRight: Spacing.sm },
  title: { flex: 1, fontSize: Typography.md, fontWeight: Typography.weightSemibold, textAlign: 'center' },
  warehouseSection: { flexDirection: 'row', alignItems: 'center', padding: Spacing.base, backgroundColor: Colors.cardBg, borderBottomWidth: 1, borderBottomColor: Colors.borderDefault },
  wCol: { flex: 1 },
  wLabel: { fontSize: Typography.xs, color: Colors.textTertiary, marginBottom: 4, textTransform: 'uppercase' },
  wChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  wChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.borderDefault, backgroundColor: Colors.pageBg },
  wChipA: { backgroundColor: Colors.brandPrimary, borderColor: Colors.brandPrimary },
  wChipT: { fontSize: 11, color: Colors.textSecondary },
  wChipTA: { color: Colors.white },
  arrow: { fontSize: 20, color: Colors.textTertiary, marginHorizontal: Spacing.sm },
  searchBar: { flexDirection: 'row', alignItems: 'center', margin: Spacing.sm, paddingHorizontal: Spacing.md, paddingVertical: 8, borderWidth: 1, borderColor: Colors.borderDefault, borderRadius: Radius.md, backgroundColor: Colors.cardBg },
  searchIcon: { fontSize: 14, marginRight: 6 },
  searchInput: { flex: 1, fontSize: Typography.base, color: Colors.textPrimary },
  selBanner: { backgroundColor: Colors.activeBg, paddingHorizontal: Spacing.base, paddingVertical: 6 },
  selText: { fontSize: Typography.sm, color: Colors.textPrimary, fontWeight: Typography.weightSemibold },
  list: { paddingBottom: 80 },
  sep: { height: 1, backgroundColor: Colors.borderDefault },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.cardBg, paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, gap: Spacing.md },
  rowSel: { backgroundColor: Colors.pageBg },
  checkbox: { width: 22, height: 22, borderRadius: 4, borderWidth: 1.5, borderColor: Colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  checkboxSel: { backgroundColor: Colors.brandPrimary, borderColor: Colors.brandPrimary },
  checkmark: { fontSize: 14, color: Colors.white, fontWeight: '700' },
  rowInfo: { flex: 1 },
  rowName: { fontSize: Typography.base, fontWeight: Typography.weightMedium, color: Colors.textPrimary },
  rowStock: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  qtyInput: { width: 60, borderWidth: 1, borderColor: Colors.borderDefault, borderRadius: Radius.sm, paddingHorizontal: Spacing.sm, paddingVertical: 6, fontSize: Typography.base, textAlign: 'center', backgroundColor: Colors.cardBg, color: Colors.textPrimary },
  footer: { padding: Spacing.base, backgroundColor: Colors.cardBg, borderTopWidth: 1, borderTopColor: Colors.borderDefault },
  empty: { alignItems: 'center', paddingVertical: Spacing.xxl },
  emptyText: { fontSize: Typography.base, color: Colors.textTertiary },
});
