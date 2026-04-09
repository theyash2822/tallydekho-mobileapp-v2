import React, { useCallback, useEffect, useState } from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Colors, Spacing, Radius, Typography } from '../../constants';
import { AppText } from '../../components/common/Text';
import { Card } from '../../components/common/Card';
import { ErrorBanner } from '../../components/common/ErrorBanner';
import { useAuthStore } from '../../store/authStore';
import { stocksApi } from '../../services/api/stocksApi';
import type { RootStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'WarehouseDetail'>;

export default function WarehouseDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { warehouseId } = route.params;
  const { company } = useAuthStore();
  const [warehouse, setWarehouse] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!company?.guid) return;
    setLoading(true); setError(null);
    try {
      const res = await stocksApi.getWarehouseDetail(warehouseId, company.guid);
      setWarehouse(res.data?.warehouse ?? res.data);
      setItems(res.data?.items ?? []);
    } catch (e: any) { setError(e?.message ?? 'Failed to load warehouse'); }
    finally { setLoading(false); }
  }, [company?.guid, warehouseId]);

  useEffect(() => { fetch(); }, [fetch]);

  const totalValue = items.reduce((s, i) => s + (i.totalValue ?? 0), 0);
  const fmt = (v: number) => v >= 1_00_000 ? `₹${(v / 1_00_000).toFixed(1)}L` : `₹${v.toLocaleString('en-IN')}`;

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}><AppText style={s.back}>←</AppText></TouchableOpacity>
        <AppText style={s.title} numberOfLines={1}>{warehouse?.name ?? 'Warehouse Detail'}</AppText>
        <View style={{ width: 44 }} />
      </View>
      {error && <ErrorBanner message={error} onRetry={fetch} />}
      {warehouse && (
        <View style={s.summaryRow}>
          <Card style={s.kpi}><AppText style={s.kpiLbl}>Total Items</AppText><AppText style={s.kpiVal}>{items.length}</AppText></Card>
          <Card style={s.kpi}><AppText style={s.kpiLbl}>Total Value</AppText><AppText style={s.kpiVal}>{fmt(totalValue)}</AppText></Card>
          {warehouse.location && <Card style={s.kpi}><AppText style={s.kpiLbl}>Location</AppText><AppText style={s.kpiVal} numberOfLines={1}>{warehouse.location}</AppText></Card>}
        </View>
      )}
      <FlatList
        data={items} keyExtractor={i => i.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.row} activeOpacity={0.7} onPress={() => navigation.navigate('StockItemDetail', { itemId: item.id })}>
            <View style={s.rowLeft}>
              <AppText style={s.rowName}>{item.name}</AppText>
              {item.hsnCode && <AppText style={s.rowHsn}>HSN: {item.hsnCode}</AppText>}
            </View>
            <View style={s.rowRight}>
              <AppText style={s.rowQty}>{item.currentStock} {item.unit}</AppText>
              <AppText style={s.rowValue}>{fmt(item.totalValue ?? 0)}</AppText>
            </View>
          </TouchableOpacity>
        )}
        refreshing={loading} onRefresh={fetch} contentContainerStyle={s.list}
        ItemSeparatorComponent={() => <View style={s.sep} />}
        ListEmptyComponent={!loading ? <View style={s.empty}><AppText style={s.emptyText}>{error ? '' : 'No items in warehouse'}</AppText></View> : null}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.pageBg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: 10, backgroundColor: Colors.cardBg, borderBottomWidth: 1, borderBottomColor: Colors.borderDefault },
  back: { fontSize: 22, color: Colors.textPrimary, marginRight: Spacing.sm },
  title: { flex: 1, fontSize: Typography.md, fontWeight: Typography.weightSemibold, textAlign: 'center' },
  summaryRow: { flexDirection: 'row', padding: Spacing.base, gap: Spacing.sm },
  kpi: { flex: 1, padding: Spacing.sm, alignItems: 'center' },
  kpiLbl: { fontSize: Typography.xs, color: Colors.textTertiary, marginBottom: 2 },
  kpiVal: { fontSize: Typography.base, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  list: { paddingBottom: 80 },
  sep: { height: 1, backgroundColor: Colors.borderDefault },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.cardBg, paddingHorizontal: Spacing.base, paddingVertical: Spacing.md },
  rowLeft: { flex: 1 },
  rowName: { fontSize: Typography.base, fontWeight: Typography.weightMedium, color: Colors.textPrimary },
  rowHsn: { fontSize: Typography.xs, color: Colors.textTertiary, marginTop: 2 },
  rowRight: { alignItems: 'flex-end' },
  rowQty: { fontSize: Typography.base, fontWeight: Typography.weightSemibold, color: Colors.textPrimary },
  rowValue: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  empty: { alignItems: 'center', paddingVertical: Spacing.xxl },
  emptyText: { fontSize: Typography.base, color: Colors.textTertiary },
});
