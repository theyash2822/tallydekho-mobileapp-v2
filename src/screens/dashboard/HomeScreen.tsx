import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, Animated, Dimensions, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Feather';
import { Colors, Spacing, Radius, Typography } from '../../constants';
import { AppText } from '../../components/common/Text';
import { ErrorBanner } from '../../components/common/ErrorBanner';
import { useAuthStore } from '../../store/authStore';
import { useDashboardStore } from '../../store/dashboardStore';
import { dashboardApi } from '../../services/api/dashboardApi';
import { STATIC_FY_OPTIONS } from '../../constants/staticData';
import type { RootStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Period = '7D' | '1M' | '3M' | '6M';
const PERIODS: Period[] = ['7D', '1M', '3M', '6M'];
const { width: SW } = Dimensions.get('window');

// ── KPI Chip data ─────────────────────────────────────────────────
const KPI_DEFS = [
  { id: 'cashInHand',   label: 'Cash In Hand',  icon: 'dollar-sign',  route: 'CashInHand' },
  { id: 'bankBalance',  label: 'Bank Balance',   icon: 'credit-card',  route: 'BankBalance' },
  { id: 'receivables',  label: 'Receivable',     icon: 'trending-up',  route: 'Receivables' },
  { id: 'payables',     label: 'Payable',        icon: 'trending-down',route: 'Payables' },
  { id: 'loansODs',     label: 'Loans & ODs',    icon: 'briefcase',    route: 'LoansODs' },
  { id: 'payments',     label: 'Payments',       icon: 'arrow-up-circle', route: 'Payments' },
  { id: 'receipts',     label: 'Receipts',       icon: 'arrow-down-circle', route: 'Receipts' },
] as const;

// ── Donut Ring Chart (View-based, no lib) ─────────────────────────
function DonutChart({
  netCash, grossCash, netRealisable, grossProfit, netProfit,
}: {
  netCash: number; grossCash: number; netRealisable: number;
  grossProfit: number; netProfit: number;
}) {
  const fmt = (v: number) =>
    v >= 1_00_00_000 ? `₹${(v / 1_00_00_000).toFixed(1)}Cr`
    : v >= 1_00_000 ? `₹${(v / 1_00_000).toFixed(1)}L`
    : v >= 1_000 ? `₹${(v / 1_000).toFixed(0)}K`
    : `₹${v.toLocaleString('en-IN')}`;

  return (
    <View style={ds.container}>
      {/* Donut ring — View-based concentric circles */}
      <View style={ds.ringWrap}>
        <View style={ds.ringOuter}>
          <View style={ds.ringMiddle}>
            <View style={ds.ringInner}>
              <AppText style={ds.centerLabel}>Net Cash</AppText>
              <AppText style={ds.centerValue}>{fmt(netCash)}</AppText>
            </View>
          </View>
        </View>
        {/* Decorative arc indicators */}
        <View style={[ds.arcSegment, ds.arcGreen]} />
        <View style={[ds.arcSegment, ds.arcYellow]} />
      </View>

      {/* Values grid below ring */}
      <View style={ds.valuesGrid}>
        {[
          { label: 'Gross Cash',    value: grossCash,     color: Colors.positiveText },
          { label: 'Net Realisable',value: netRealisable, color: Colors.infoText },
          { label: 'Gross Profit',  value: grossProfit,   color: Colors.warningText },
          { label: 'Net Profit',    value: netProfit,     color: Colors.positiveText },
        ].map(item => (
          <View key={item.label} style={ds.valueItem}>
            <View style={[ds.valueDot, { backgroundColor: item.color }]} />
            <View>
              <AppText style={ds.valueLabel}>{item.label}</AppText>
              <AppText style={[ds.valueAmount, { color: item.color }]}>{fmt(item.value)}</AppText>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const ds = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: Spacing.base },
  ringWrap: { width: 160, height: 160, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.base, position: 'relative' },
  ringOuter: {
    width: 160, height: 160, borderRadius: 80,
    borderWidth: 22, borderColor: Colors.positiveText,
    alignItems: 'center', justifyContent: 'center',
    borderTopColor: Colors.positiveText,
    borderRightColor: Colors.warningText,
    borderBottomColor: Colors.infoText,
    borderLeftColor: Colors.warningBg,
  },
  ringMiddle: {
    width: 116, height: 116, borderRadius: 58,
    backgroundColor: Colors.cardBg,
    alignItems: 'center', justifyContent: 'center',
  },
  ringInner: { alignItems: 'center' },
  centerLabel: { fontSize: Typography.xs, color: Colors.textTertiary, marginBottom: 2 },
  centerValue: { fontSize: Typography.base, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  arcSegment: { position: 'absolute', width: 8, height: 8, borderRadius: 4 },
  arcGreen: { top: 10, right: 30, backgroundColor: Colors.positiveText },
  arcYellow: { bottom: 15, left: 20, backgroundColor: Colors.warningText },
  valuesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.base, paddingHorizontal: Spacing.sm, justifyContent: 'center' },
  valueItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, width: '45%' },
  valueDot: { width: 8, height: 8, borderRadius: 4 },
  valueLabel: { fontSize: Typography.xs, color: Colors.textTertiary },
  valueAmount: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold },
});

// ── Mini sparkline (View-based bars) ─────────────────────────────
function Sparkline({ positive }: { positive: boolean }) {
  const bars = [30, 50, 40, 70, 55, 80, 65, 90];
  const max = Math.max(...bars);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 24 }}>
      {bars.map((v, i) => (
        <View key={i} style={{
          width: 4,
          height: (v / max) * 24,
          borderRadius: 2,
          backgroundColor: positive ? Colors.positiveText : Colors.negativeText,
          opacity: 0.6 + (i / bars.length) * 0.4,
        }} />
      ))}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { company, selectedFY, setSelectedFY } = useAuthStore();
  const { data, status, error, period, setPeriod, setData, setLoading, setError } = useDashboardStore();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [alertCounts, setAlertCounts] = useState({ pendingIRN: 0, pendingEWB: 0, expiredEWB: 0, unmatchedGST: 0 });
  const [showFYPicker, setShowFYPicker] = useState(false);

  const fetchDashboard = useCallback(async () => {
    if (!company?.guid) return;
    setLoading();
    try {
      const res = await dashboardApi.getDashboard(company.guid, selectedFY, period);
      setData(res.data?.data ?? res.data);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load dashboard');
    }
  }, [company?.guid, selectedFY, period]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  useEffect(() => {
    if (!company?.guid) return;
    dashboardApi.getAlerts(company.guid)
      .then(r => {
        const d = r.data?.data ?? {};
        setAlerts(d.alerts ?? []);
        setAlertCounts({ pendingIRN: d.pendingIRNCount ?? 0, pendingEWB: d.pendingEWBCount ?? 0, expiredEWB: d.expiredEWBCount ?? 0, unmatchedGST: d.unmatchedGSTCount ?? 0 });
      })
      .catch(() => {});
  }, [company?.guid]);

  const fmt = (v: number) =>
    v >= 1_00_00_000 ? `₹${(v / 1_00_00_000).toFixed(1)}Cr`
    : v >= 1_00_000 ? `₹${(v / 1_00_000).toFixed(1)}L`
    : v >= 1_000 ? `₹${(v / 1_000).toFixed(0)}K`
    : `₹${v.toLocaleString('en-IN')}`;

  const totalAlerts = alertCounts.pendingIRN + alertCounts.pendingEWB + alertCounts.expiredEWB + alertCounts.unmatchedGST;

  const d = data as any;

  return (
    <SafeAreaView style={s.safe}>
      {/* ── Header ── */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <View style={s.logoMark}>
            <AppText style={s.logoMarkText}>✦</AppText>
          </View>
          <View>
            <AppText style={s.appName}>TallyDekho</AppText>
            <TouchableOpacity onPress={() => setShowFYPicker(!showFYPicker)} style={s.fyPill}>
              <AppText style={s.fyText}>{selectedFY}</AppText>
              <Icon name="chevron-down" size={12} color={Colors.textTertiary} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={s.headerRight}>
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={s.iconBtn}>
            <Icon name="bell" size={20} color={Colors.textPrimary} />
            {totalAlerts > 0 && (
              <View style={s.badge}><AppText style={s.badgeText}>{totalAlerts > 9 ? '9+' : totalAlerts}</AppText></View>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={s.iconBtn}>
            <Icon name="menu" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* FY Picker Dropdown */}
      {showFYPicker && (
        <View style={s.fyDropdown}>
          {STATIC_FY_OPTIONS.map(opt => (
            <TouchableOpacity key={opt.value} style={s.fyOption} onPress={() => { setSelectedFY(opt.label); setShowFYPicker(false); }}>
              <AppText style={[s.fyOptionText, selectedFY === opt.label && s.fyOptionActive]}>{opt.label}</AppText>
              {selectedFY === opt.label && <Icon name="check" size={14} color={Colors.brandPrimary} />}
            </TouchableOpacity>
          ))}
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={status === 'loading'} onRefresh={fetchDashboard} tintColor={Colors.textSecondary} />}
      >
        {error && <ErrorBanner message={error} onRetry={fetchDashboard} />}

        {/* ── Search Bar ── */}
        <TouchableOpacity style={s.searchBar} activeOpacity={0.8}>
          <Icon name="search" size={16} color={Colors.textTertiary} style={{ marginRight: 8 }} />
          <AppText style={s.searchPlaceholder}>Search for recent transactions...</AppText>
          <Icon name="mic" size={16} color={Colors.textTertiary} />
        </TouchableOpacity>

        {/* ── Tally Sync Banner ── */}
        <View style={s.syncBanner}>
          <View style={s.syncLeft}>
            <Icon name="refresh-cw" size={16} color={Colors.white} />
            <AppText style={s.syncText}>Sync your account with Tally!</AppText>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('SyncTally')} style={s.syncAction}>
            <AppText style={s.syncActionText}>Sync now</AppText>
            <Icon name="arrow-right" size={14} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* ── KPI Chips — Horizontal Scroll ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.kpiScroll}>
          {KPI_DEFS.map(chip => {
            const val = d?.[chip.id] ?? 0;
            return (
              <TouchableOpacity key={chip.id} onPress={() => navigation.navigate(chip.route as any)} style={s.kpiChip} activeOpacity={0.7}>
                <View style={s.kpiIconWrap}>
                  <Icon name={chip.icon} size={16} color={Colors.textSecondary} />
                </View>
                <View style={s.kpiTexts}>
                  <AppText style={s.kpiLabel}>{chip.label}</AppText>
                  <AppText style={s.kpiValue}>{fmt(val)}</AppText>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Period Filter — Pill Tabs ── */}
        <View style={s.periodRow}>
          {PERIODS.map(p => (
            <TouchableOpacity key={p} onPress={() => setPeriod(p)} style={[s.periodTab, period === p && s.periodTabActive]}>
              <AppText style={[s.periodText, period === p && s.periodTextActive]}>{p}</AppText>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Trend Tiles — Expense / Sales / Purchase ── */}
        <View style={s.trendCard}>
          {[
            { key: 'totalSales',    label: 'Sales',     icon: 'trending-up' },
            { key: 'totalPurchase', label: 'Purchases', icon: 'shopping-cart' },
            { key: 'totalPayments', label: 'Expenses',  icon: 'activity' },
          ].map((tile, idx) => {
            const val = d?.[tile.key] ?? 0;
            const change = d?.trendData?.[tile.key === 'totalSales' ? 'sales' : tile.key === 'totalPurchase' ? 'purchases' : 'expenses']?.change ?? 0;
            const isPositive = change >= 0;
            return (
              <View key={tile.key}>
                {idx > 0 && <View style={s.trendDivider} />}
                <View style={s.trendRow}>
                  <View style={s.trendLeft}>
                    <View style={s.trendIconWrap}>
                      <Icon name={tile.icon} size={16} color={Colors.textSecondary} />
                    </View>
                    <View>
                      <AppText style={s.trendLabel}>{tile.label}</AppText>
                      <AppText style={s.trendValue}>{fmt(val)}</AppText>
                    </View>
                  </View>
                  <View style={s.trendRight}>
                    <Sparkline positive={isPositive} />
                    <View style={[s.changeBadge, { backgroundColor: isPositive ? Colors.positiveBg : Colors.negativeBg }]}>
                      <Icon name={isPositive ? 'arrow-up' : 'arrow-down'} size={10} color={isPositive ? Colors.positiveText : Colors.negativeText} />
                      <AppText style={[s.changePct, { color: isPositive ? Colors.positiveText : Colors.negativeText }]}>
                        {Math.abs(change).toFixed(1)}%
                      </AppText>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* ── Cash Flow — Donut Ring Chart ── */}
        <View style={s.sectionHeader}>
          <AppText style={s.sectionTitle}>Cash Flow</AppText>
        </View>
        <View style={s.cashFlowCard}>
          <DonutChart
            netCash={d?.netCash ?? 0}
            grossCash={d?.grossCash ?? 0}
            netRealisable={d?.netRealisableBalance ?? 0}
            grossProfit={d?.grossProfit ?? 0}
            netProfit={d?.netProfit ?? 0}
          />
        </View>

        {/* ── Alerts Carousel ── */}
        {alerts.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.alertsScroll}>
            {alerts.map((alert: any) => (
              <View key={alert.id} style={[s.alertCard, { borderColor: alert.severity === 'error' ? Colors.negativeText : Colors.warningText }]}>
                <View style={s.alertLeft}>
                  <Icon name="alert-triangle" size={14} color={alert.severity === 'error' ? Colors.negativeText : Colors.warningText} />
                  <AppText style={[s.alertMsg, { color: alert.severity === 'error' ? Colors.negativeText : Colors.warningText }]}>
                    {alert.message}
                  </AppText>
                </View>
                <TouchableOpacity onPress={() => {
                  if (alert.type === 'irn') (navigation as any).navigate('EInvoiceIntegration');
                  else if (alert.type === 'ewb') navigation.navigate('EWayBills');
                  else if (alert.type === 'gst') navigation.navigate('GSTFiling');
                }}>
                  <AppText style={s.alertAction}>Fix →</AppText>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}

        {/* ── Recent Activity ── */}
        <View style={s.sectionHeader}>
          <AppText style={s.sectionTitle}>Recent Activity</AppText>
        </View>
        <View style={s.activityCard}>
          {(d?.recentActivity?.length ?? 0) === 0 ? (
            <View style={s.emptyActivity}>
              <Icon name="clock" size={20} color={Colors.textTertiary} />
              <AppText style={s.emptyText}>No recent activity</AppText>
            </View>
          ) : (
            d?.recentActivity?.slice(0, 5).map((item: any, idx: number) => (
              <View key={item.id ?? idx}>
                {idx > 0 && <View style={s.actDivider} />}
                <View style={s.actRow}>
                  <View style={s.actDot} />
                  <View style={s.actContent}>
                    <AppText style={s.actDesc} numberOfLines={1}>{item.description}</AppText>
                    <AppText style={s.actTime}>{item.timestamp}</AppText>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.pageBg },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, backgroundColor: Colors.cardBg, borderBottomWidth: 1, borderBottomColor: Colors.borderDefault },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  logoMark: { width: 34, height: 34, borderRadius: 10, backgroundColor: Colors.brandPrimary, alignItems: 'center', justifyContent: 'center' },
  logoMarkText: { fontSize: 16, color: Colors.white },
  appName: { fontSize: Typography.base, fontWeight: Typography.weightBold, color: Colors.textPrimary, lineHeight: 18 },
  fyPill: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 1 },
  fyText: { fontSize: Typography.xs, color: Colors.textTertiary },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconBtn: { padding: 8, position: 'relative' },
  badge: { position: 'absolute', top: 2, right: 2, minWidth: 15, height: 15, borderRadius: 8, backgroundColor: Colors.negativeText, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2 },
  badgeText: { fontSize: 8, color: Colors.white, fontWeight: '700' },

  // FY Dropdown
  fyDropdown: { backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.borderDefault, borderRadius: Radius.sm, marginHorizontal: Spacing.base, marginTop: 4, overflow: 'hidden', zIndex: 10 },
  fyOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.borderDefault },
  fyOptionText: { fontSize: Typography.base, color: Colors.textSecondary },
  fyOptionActive: { color: Colors.brandPrimary, fontWeight: Typography.weightSemibold },

  // Search
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.borderDefault, borderRadius: Radius.full, marginHorizontal: Spacing.base, marginTop: Spacing.md, marginBottom: Spacing.sm, paddingHorizontal: Spacing.base, paddingVertical: 10 },
  searchPlaceholder: { flex: 1, fontSize: Typography.sm, color: Colors.textTertiary },

  // Sync Banner
  syncBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.brandPrimary, marginHorizontal: Spacing.base, marginBottom: Spacing.sm, borderRadius: Radius.md, paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm },
  syncLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 },
  syncText: { fontSize: Typography.sm, color: Colors.white, fontWeight: Typography.weightMedium },
  syncAction: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  syncActionText: { fontSize: Typography.sm, color: Colors.white, fontWeight: Typography.weightSemibold },

  // KPI Chips
  kpiScroll: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.sm, gap: Spacing.sm },
  kpiChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.borderDefault, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: Spacing.sm, minWidth: 140 },
  kpiIconWrap: { width: 32, height: 32, borderRadius: Radius.sm, backgroundColor: Colors.pageBg, alignItems: 'center', justifyContent: 'center' },
  kpiTexts: {},
  kpiLabel: { fontSize: Typography.xs, color: Colors.textTertiary, marginBottom: 1 },
  kpiValue: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: Colors.textPrimary },

  // Period filter
  periodRow: { flexDirection: 'row', paddingHorizontal: Spacing.base, paddingBottom: Spacing.sm, gap: Spacing.sm },
  periodTab: { paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.borderDefault, backgroundColor: Colors.cardBg },
  periodTabActive: { backgroundColor: Colors.brandPrimary, borderColor: Colors.brandPrimary },
  periodText: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.weightMedium },
  periodTextActive: { color: Colors.white, fontWeight: Typography.weightSemibold },

  // Trend Tiles — single card with rows
  trendCard: { marginHorizontal: Spacing.base, marginBottom: Spacing.sm, backgroundColor: Colors.cardBg, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.borderDefault, overflow: 'hidden' },
  trendDivider: { height: 1, backgroundColor: Colors.borderDefault },
  trendRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md },
  trendLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  trendIconWrap: { width: 36, height: 36, borderRadius: Radius.sm, backgroundColor: Colors.pageBg, alignItems: 'center', justifyContent: 'center' },
  trendLabel: { fontSize: Typography.xs, color: Colors.textTertiary, marginBottom: 2 },
  trendValue: { fontSize: Typography.base, fontWeight: Typography.weightSemibold, color: Colors.textPrimary },
  trendRight: { alignItems: 'flex-end', gap: 4 },
  changeBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.full },
  changePct: { fontSize: 10, fontWeight: Typography.weightSemibold },

  // Cash Flow
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingBottom: Spacing.xs, marginTop: Spacing.xs },
  sectionTitle: { fontSize: Typography.base, fontWeight: Typography.weightSemibold, color: Colors.textPrimary },
  cashFlowCard: { marginHorizontal: Spacing.base, marginBottom: Spacing.sm, backgroundColor: Colors.cardBg, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.borderDefault },

  // Alerts
  alertsScroll: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.sm, gap: Spacing.sm },
  alertCard: { borderWidth: 1, borderRadius: Radius.md, padding: Spacing.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minWidth: 240, backgroundColor: Colors.cardBg },
  alertLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, flex: 1 },
  alertMsg: { fontSize: Typography.xs, fontWeight: Typography.weightMedium, flex: 1 },
  alertAction: { fontSize: Typography.xs, fontWeight: Typography.weightBold, color: Colors.textPrimary, marginLeft: Spacing.sm },

  // Recent Activity
  activityCard: { marginHorizontal: Spacing.base, marginBottom: Spacing.sm, backgroundColor: Colors.cardBg, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.borderDefault, overflow: 'hidden' },
  actRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, gap: Spacing.sm },
  actDivider: { height: 1, backgroundColor: Colors.borderDefault },
  actDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.textTertiary },
  actContent: { flex: 1 },
  actDesc: { fontSize: Typography.sm, color: Colors.textPrimary },
  actTime: { fontSize: Typography.xs, color: Colors.textTertiary, marginTop: 1 },
  emptyActivity: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.sm },
  emptyText: { fontSize: Typography.sm, color: Colors.textTertiary },
});
