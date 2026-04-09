import React, { useCallback, useEffect, useState } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
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
type Route = RouteProp<RootStackParamList, 'StockItemDetail'>;

interface Movement { id: string; date: string; type: 'IN' | 'OUT' | 'Transfer' | 'Adjust'; quantity: number; balance: number; warehouse: string; }

export default function StockItemDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { itemId } = route.params;
  const { company } = useAuthStore();
  const [item, setItem] = useState<any>(null);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!company?.guid || !itemId) return;
    setLoading(true); setError(null);
    try {
      const res = await stocksApi.getStockItem(itemId, company.guid);
      setItem(res.data?.item ?? res.data);
      setMovements(res.data?.movements ?? []);
    } catch (e: any) { setError(e?.message ?? 'Failed to load item'); }
    finally { setLoading(false); }
  }, [company?.guid, itemId]);

  useEffect(() => { fetch(); }, [fetch]);

  const fmt = (v: number) => `₹${v.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  // Simple bar chart — 8 bars, View-based
  const movementData = movements.slice(-8).map(m => m.quantity);
  const maxVal = Math.max(...movementData, 1);

  const MOVE_COLOR: Record<string, string> = { IN: Colors.positiveText, OUT: Colors.negativeText, Transfer: Colors.infoText, Adjust: Colors.warningText };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}><AppText style={s.back}>←</AppText></TouchableOpacity>
        <AppText style={s.title} numberOfLines={1}>{item?.name ?? 'Item Detail'}</AppText>
        <TouchableOpacity onPress={() => navigation.navigate('StockAdjust', { itemId })} style={s.editBtn}>
          <AppText style={s.editText}>Edit</AppText>
        </TouchableOpacity>
      </View>

      {error && <ErrorBanner message={error} onRetry={fetch} />}

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* KPI Row */}
        <View style={s.kpiRow}>
          {[
            { label: 'Current Stock', value: `${item?.currentStock ?? 0} ${item?.unit ?? ''}` },
            { label: 'Unit Price', value: fmt(item?.unitPrice ?? 0) },
            { label: 'Total Value', value: fmt(item?.totalValue ?? 0) },
            { label: 'Reorder Level', value: String(item?.reorderLevel ?? 0) },
          ].map(k => (
            <Card key={k.label} style={s.kpiCard}>
              <AppText style={s.kpiLabel}>{k.label}</AppText>
              <AppText style={s.kpiValue}>{k.value}</AppText>
            </Card>
          ))}
        </View>

        {/* HSN + SKU */}
        {(item?.hsnCode || item?.sku) && (
          <View style={s.badgeRow}>
            {item.hsnCode && <View style={s.badge}><AppText style={s.badgeText}>HSN: {item.hsnCode}</AppText></View>}
            {item.sku && <View style={s.badge}><AppText style={s.badgeText}>SKU: {item.sku}</AppText></View>}
          </View>
        )}

        {/* Warehouse Breakdown */}
        <AppText style={s.sectionLabel}>Warehouse Breakdown</AppText>
        <Card style={s.warehouseCard}>
          {(item?.warehouses ?? []).length === 0 ? (
            <AppText style={s.emptyText}>No warehouse data</AppText>
          ) : (
            (item?.warehouses ?? []).map((w: any) => (
              <View key={w.id} style={s.whRow}>
                <AppText style={s.whName}>{w.name}</AppText>
                <View style={s.whBarWrap}>
                  <View style={[s.whBar, { width: `${Math.min((w.stock / (item?.currentStock || 1)) * 100, 100)}%` }]} />
                </View>
                <AppText style={s.whQty}>{w.stock} {item?.unit}</AppText>
              </View>
            ))
          )}
        </Card>

        {/* Movement Analytics */}
        <AppText style={s.sectionLabel}>Movement Analytics</AppText>
        <Card style={s.analyticsCard}>
          <View style={s.analyticsRow}>
            <View style={s.analyticsKpi}>
              <AppText style={s.analyticsLabel}>Turnover Ratio</AppText>
              <AppText style={s.analyticsValue}>{item?.turnoverRatio?.toFixed(2) ?? '—'}</AppText>
            </View>
            <View style={s.analyticsKpi}>
              <AppText style={s.analyticsLabel}>DSI (Days)</AppText>
              <AppText style={s.analyticsValue}>{item?.dsi?.toFixed(0) ?? '—'}</AppText>
            </View>
          </View>
          {/* Bar chart */}
          {movementData.length > 0 && (
            <View style={s.barChart}>
              {movementData.map((v, i) => (
                <View key={i} style={s.barWrap}>
                  <View style={[s.bar, { height: Math.max((v / maxVal) * 80, 4) }]} />
                </View>
              ))}
            </View>
          )}
          <AppText style={s.chartCaption}>Last {movementData.length} movements</AppText>
        </Card>

        {/* Recent Movements */}
        <AppText style={s.sectionLabel}>Recent Movements</AppText>
        <Card style={s.movCard}>
          {movements.length === 0 ? (
            <View style={s.emptyWrap}><AppText style={s.emptyText}>No movement history</AppText></View>
          ) : (
            movements.slice(0, 15).map((m, idx) => (
              <View key={m.id}>
                {idx > 0 && <View style={s.sep} />}
                <View style={s.movRow}>
                  <AppText style={s.movDate}>{new Date(m.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</AppText>
                  <View style={[s.movTypeBadge, { borderColor: MOVE_COLOR[m.type] }]}>
                    <AppText style={[s.movType, { color: MOVE_COLOR[m.type] }]}>{m.type}</AppText>
                  </View>
                  <AppText style={s.movQty}>{m.quantity} {item?.unit}</AppText>
                  <AppText style={s.movBal}>Bal: {m.balance}</AppText>
                </View>
              </View>
            ))
          )}
        </Card>

        {/* Action buttons */}
        <View style={s.actionRow}>
          <TouchableOpacity onPress={() => navigation.navigate('StockTransfer', { itemId })} style={s.actionBtn}>
            <AppText style={s.actionIcon}>⇄</AppText>
            <AppText style={s.actionLabel}>Transfer</AppText>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('StockAdjust', { itemId })} style={s.actionBtn}>
            <AppText style={s.actionIcon}>✏</AppText>
            <AppText style={s.actionLabel}>Adjust</AppText>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionBtn}>
            <AppText style={s.actionIcon}>▦</AppText>
            <AppText style={s.actionLabel}>Barcode</AppText>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.pageBg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: 10, backgroundColor: Colors.cardBg, borderBottomWidth: 1, borderBottomColor: Colors.borderDefault },
  back: { fontSize: 22, color: Colors.textPrimary, marginRight: Spacing.sm },
  title: { flex: 1, fontSize: Typography.md, fontWeight: Typography.weightSemibold },
  editBtn: { padding: 6 },
  editText: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.weightMedium },
  content: { padding: Spacing.base },
  kpiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.base },
  kpiCard: { width: '47%', padding: Spacing.sm },
  kpiLabel: { fontSize: Typography.xs, color: Colors.textTertiary, marginBottom: 2 },
  kpiValue: { fontSize: Typography.base, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  badgeRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.base },
  badge: { backgroundColor: Colors.infoBg, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: Typography.xs, color: Colors.infoText, fontWeight: '600' },
  sectionLabel: { fontSize: Typography.xs, fontWeight: Typography.weightSemibold, color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.xs, marginTop: Spacing.sm },
  warehouseCard: { padding: Spacing.base, marginBottom: Spacing.sm },
  whRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: Spacing.sm },
  whName: { width: 100, fontSize: Typography.sm, color: Colors.textSecondary },
  whBarWrap: { flex: 1, height: 6, backgroundColor: Colors.borderDefault, borderRadius: 3, overflow: 'hidden' },
  whBar: { height: 6, backgroundColor: Colors.brandPrimary, borderRadius: 3 },
  whQty: { width: 60, fontSize: Typography.sm, color: Colors.textPrimary, fontWeight: Typography.weightMedium, textAlign: 'right' },
  analyticsCard: { padding: Spacing.base, marginBottom: Spacing.sm },
  analyticsRow: { flexDirection: 'row', gap: Spacing.base, marginBottom: Spacing.base },
  analyticsKpi: { flex: 1, alignItems: 'center', backgroundColor: Colors.pageBg, borderRadius: Radius.sm, padding: Spacing.sm },
  analyticsLabel: { fontSize: Typography.xs, color: Colors.textTertiary, marginBottom: 2 },
  analyticsValue: { fontSize: Typography.lg, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', height: 80, gap: 4, marginBottom: 4 },
  barWrap: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: 80 },
  bar: { width: '100%', backgroundColor: Colors.brandPrimary, borderRadius: 2, opacity: 0.8 },
  chartCaption: { fontSize: Typography.xs, color: Colors.textTertiary, textAlign: 'center' },
  movCard: { padding: 0, overflow: 'hidden', marginBottom: Spacing.base },
  movRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, gap: Spacing.sm },
  movDate: { fontSize: Typography.xs, color: Colors.textTertiary, width: 44 },
  movTypeBadge: { borderWidth: 1, borderRadius: Radius.full, paddingHorizontal: 6, paddingVertical: 1 },
  movType: { fontSize: 10, fontWeight: '700' },
  movQty: { flex: 1, fontSize: Typography.sm, color: Colors.textPrimary, fontWeight: Typography.weightMedium },
  movBal: { fontSize: Typography.xs, color: Colors.textTertiary },
  actionRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  actionBtn: { flex: 1, alignItems: 'center', backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.borderDefault, borderRadius: Radius.md, paddingVertical: Spacing.md },
  actionIcon: { fontSize: 22, marginBottom: 4 },
  actionLabel: { fontSize: Typography.xs, color: Colors.textSecondary, fontWeight: Typography.weightMedium },
  sep: { height: 1, backgroundColor: Colors.borderDefault },
  emptyWrap: { alignItems: 'center', padding: Spacing.xl },
  emptyText: { fontSize: Typography.sm, color: Colors.textTertiary },
});
