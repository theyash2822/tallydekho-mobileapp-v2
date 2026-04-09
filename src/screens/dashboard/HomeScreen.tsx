import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Spacing, Radius, Typography } from '../../constants';
import { AppText } from '../../components/common/Text';
import { Card } from '../../components/common/Card';
import { ErrorBanner } from '../../components/common/ErrorBanner';
import { useAuthStore } from '../../store/authStore';
import { useDashboardStore } from '../../store/dashboardStore';
import { dashboardApi } from '../../services/api/dashboardApi';
import { STATIC_FY_OPTIONS, STATIC_KPI_CHIPS } from '../../constants/staticData';
import type { RootStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Period = '7D' | '1M' | '3M' | '6M';

const PERIODS: Period[] = ['7D', '1M', '3M', '6M'];

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
      setData(res.data);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load dashboard');
    }
  }, [company?.guid, selectedFY, period]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Fetch alerts separately
  useEffect(() => {
    if (!company?.guid) return;
    dashboardApi.getAlerts(company.guid)
      .then(r => {
        const d = r.data?.data ?? {};
        setAlerts(d.alerts ?? []);
        setAlertCounts({
          pendingIRN:  d.pendingIRNCount ?? 0,
          pendingEWB:  d.pendingEWBCount ?? 0,
          expiredEWB:  d.expiredEWBCount ?? 0,
          unmatchedGST: d.unmatchedGSTCount ?? 0,
        });
      })
      .catch(() => { /* non-fatal */ });
  }, [company?.guid]);

  const formatAmount = (val: number) => {
    if (val >= 1_00_00_000) return `₹${(val / 1_00_00_000).toFixed(1)}Cr`;
    if (val >= 1_00_000) return `₹${(val / 1_00_000).toFixed(1)}L`;
    if (val >= 1_000) return `₹${(val / 1_000).toFixed(1)}K`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  // Show IRN/EWB badge on notification icon
  const totalAlerts = alertCounts.pendingIRN + alertCounts.pendingEWB + alertCounts.expiredEWB + alertCounts.unmatchedGST;

  const kpiChips = STATIC_KPI_CHIPS.map(chip => ({
    ...chip,
    value: data ? (data as any)[chip.id === 'cash' ? 'cashInHand' : chip.id === 'bank' ? 'bankBalance' : chip.id === 'receivable' ? 'receivables' : chip.id === 'payable' ? 'payables' : chip.id === 'loans' ? 'loansODs' : chip.id === 'payments' ? 'payments' : 'receipts'] ?? 0 : 0,
  }));

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.companyPill}
          onPress={() => setShowFYPicker(false)}
          activeOpacity={0.7}
        >
          <AppText style={styles.companyName} numberOfLines={1}>
            {company?.name ?? 'Select Company'}
          </AppText>
          <AppText style={styles.chevronDown}>⌄</AppText>
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Notifications')}
            style={styles.iconBtn}
          >
            <View>
              <AppText style={styles.icon}>🔔</AppText>
              {totalAlerts > 0 && (
                <View style={styles.alertBadge}>
                  <AppText style={styles.alertBadgeText}>{totalAlerts > 9 ? '9+' : totalAlerts}</AppText>
                </View>
              )}
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('Settings')}
            style={styles.iconBtn}
          >
            <AppText style={styles.icon}>⚙</AppText>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={status === 'loading'}
            onRefresh={fetchDashboard}
            tintColor={Colors.textSecondary}
          />
        }
      >
        {/* ── Error Banner ── */}
        {status === 'error' && error && (
          <ErrorBanner message={error} onRetry={fetchDashboard} />
        )}

        {/* ── Search Bar ── */}
        <TouchableOpacity style={styles.searchBar} activeOpacity={0.8}>
          <AppText style={styles.searchIcon}>🔍</AppText>
          <AppText style={styles.searchPlaceholder}>Search for recent transactions...</AppText>
        </TouchableOpacity>

        {/* ── Tally Sync Banner ── */}
        <View style={styles.syncBanner}>
          <AppText style={styles.syncText}>Sync your account with Tally!</AppText>
          <TouchableOpacity onPress={() => navigation.navigate('SyncTally')}>
            <AppText style={styles.syncAction}>Sync now →</AppText>
          </TouchableOpacity>
        </View>

        {/* ── FY Filter ── */}
        <View style={styles.fyRow}>
          <TouchableOpacity
            style={styles.fyPicker}
            onPress={() => setShowFYPicker(!showFYPicker)}
          >
            <AppText style={styles.fyText}>{selectedFY}</AppText>
            <AppText style={styles.chevronDown}>⌄</AppText>
          </TouchableOpacity>
        </View>

        {showFYPicker && (
          <View style={styles.fyDropdown}>
            {STATIC_FY_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={styles.fyOption}
                onPress={() => { setSelectedFY(opt.label); setShowFYPicker(false); }}
              >
                <AppText style={[styles.fyOptionText, selectedFY === opt.label && styles.fyOptionActive]}>
                  {opt.label}
                </AppText>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── KPI Chips ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.kpiRow}
        >
          {kpiChips.map(chip => (
            <TouchableOpacity
              key={chip.id}
              onPress={() => navigation.navigate(chip.route as any)}
              style={styles.kpiChip}
              activeOpacity={0.7}
            >
              <AppText style={styles.kpiLabel}>{chip.label}</AppText>
              <AppText style={styles.kpiValue}>{formatAmount(chip.value)}</AppText>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Period Filter ── */}
        <View style={styles.periodRow}>
          {PERIODS.map(p => (
            <TouchableOpacity
              key={p}
              onPress={() => setPeriod(p)}
              style={[styles.periodBtn, period === p && styles.periodBtnActive]}
            >
              <AppText style={[styles.periodText, period === p && styles.periodTextActive]}>
                {p}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Trend Tiles ── */}
        <View style={styles.trendRow}>
          {[
            { label: 'Expenses', key: 'expenses' },
            { label: 'Sales', key: 'sales' },
            { label: 'Purchases', key: 'purchases' },
          ].map(tile => {
            const tileData = data?.trendData?.[tile.key as keyof typeof data.trendData];
            const change = tileData?.change ?? 0;
            return (
              <Card key={tile.label} style={styles.trendCard}>
                <AppText style={styles.trendLabel}>{tile.label}</AppText>
                <AppText style={styles.trendValue}>{formatAmount(tileData?.value ?? 0)}</AppText>
                <AppText style={[styles.trendChange, { color: change >= 0 ? Colors.positiveText : Colors.negativeText }]}>
                  {change >= 0 ? '↑' : '↓'}{Math.abs(change)}%
                </AppText>
              </Card>
            );
          })}
        </View>

        {/* ── Alerts Carousel ── */}
        {alerts.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.alertsRow}
          >
            {alerts.map((alert: any) => (
              <View
                key={alert.id}
                style={[
                  styles.alertCard,
                  { borderColor: alert.severity === 'error' ? Colors.negativeText : Colors.warningText,
                    backgroundColor: alert.severity === 'error' ? Colors.negativeBg : Colors.warningBg }
                ]}
              >
                <AppText style={[
                  styles.alertMessage,
                  { color: alert.severity === 'error' ? Colors.negativeText : Colors.warningText }
                ]}>
                  {alert.severity === 'error' ? '⚠️ ' : '⚠ '}{alert.message}
                </AppText>
                <TouchableOpacity
                  style={styles.alertAction}
                  onPress={() => {
                    if (alert.type === 'irn') navigation.navigate('EInvoiceIntegration' as any);
                    else if (alert.type === 'ewb') navigation.navigate('EWayBills');
                    else if (alert.type === 'gst') navigation.navigate('GSTFiling');
                  }}
                >
                  <AppText style={styles.alertActionText}>Fix now →</AppText>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}

        {/* ── Cash Flow ── */}
        <Card style={styles.cashFlowCard}>
          <AppText variant="h3" style={styles.sectionTitle}>Cash Flow</AppText>
          {[
            { label: 'Net Cash',           key: 'netCash' },
            { label: 'Gross Cash',         key: 'grossCash' },
            { label: 'Net Realisable',     key: 'netRealisableBalance' },
            { label: 'Gross Profit',       key: 'grossProfit' },
            { label: 'Net Profit',         key: 'netProfit' },
          ].map(row => (
            <View key={row.label} style={styles.cashRow}>
              <AppText style={styles.cashLabel}>{row.label}</AppText>
              <AppText style={styles.cashValue}>
                {formatAmount((data as any)?.[row.key] ?? 0)}
              </AppText>
            </View>
          ))}
        </Card>

        {/* ── Recent Activity ── */}
        <View style={styles.activitySection}>
          <AppText variant="h3" style={styles.sectionTitle}>Recent Activity</AppText>
          {(data?.recentActivity?.length ?? 0) === 0 ? (
            <AppText style={styles.emptyText}>No recent activity</AppText>
          ) : (
            data?.recentActivity?.map(item => (
              <View key={item.id} style={styles.activityItem}>
                <AppText style={styles.activityDot}>•</AppText>
                <AppText style={styles.activityDesc}>{item.description}</AppText>
                <AppText style={styles.activityTime}>{item.timestamp}</AppText>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.pageBg },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderDefault,
  },
  companyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    marginRight: Spacing.sm,
  },
  companyName: {
    fontSize: Typography.sm,
    fontWeight: Typography.weightSemibold,
    color: Colors.textPrimary,
    flex: 1,
  },
  chevronDown: { fontSize: 14, color: Colors.textSecondary, marginLeft: 4 },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { padding: Spacing.xs, marginLeft: 4 },
  icon: { fontSize: 20 },
  alertBadge: { position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: Colors.negativeText, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2 },
  alertBadgeText: { fontSize: 9, color: Colors.white, fontWeight: '700' },

  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBg,
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    borderRadius: Radius.full,
    margin: Spacing.base,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  searchIcon: { fontSize: 16, marginRight: Spacing.sm },
  searchPlaceholder: { fontSize: Typography.base, color: Colors.textTertiary },

  // Sync Banner
  syncBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.brandPrimary,
    marginHorizontal: Spacing.base,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  syncText: { color: Colors.white, fontSize: Typography.sm },
  syncAction: { color: Colors.white, fontSize: Typography.sm, fontWeight: Typography.weightSemibold },

  // FY
  fyRow: { paddingHorizontal: Spacing.base, marginBottom: Spacing.sm },
  fyPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    backgroundColor: Colors.cardBg,
  },
  fyText: { fontSize: Typography.sm, color: Colors.textPrimary },
  fyDropdown: {
    marginHorizontal: Spacing.base,
    backgroundColor: Colors.cardBg,
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  fyOption: { padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderDefault },
  fyOptionText: { fontSize: Typography.base, color: Colors.textSecondary },
  fyOptionActive: { color: Colors.textPrimary, fontWeight: Typography.weightSemibold },

  // KPI chips
  kpiRow: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.sm, gap: Spacing.sm },
  kpiChip: {
    backgroundColor: Colors.cardBg,
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    minWidth: 120,
  },
  kpiLabel: { fontSize: Typography.xs, color: Colors.textSecondary, marginBottom: 2 },
  kpiValue: { fontSize: Typography.md, fontWeight: Typography.weightSemibold, color: Colors.textPrimary },

  // Period filter
  periodRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.base,
    gap: Spacing.sm,
  },
  periodBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    backgroundColor: Colors.cardBg,
  },
  periodBtnActive: { backgroundColor: Colors.brandPrimary, borderColor: Colors.brandPrimary },
  periodText: { fontSize: Typography.sm, color: Colors.textSecondary },
  periodTextActive: { color: Colors.white, fontWeight: Typography.weightSemibold },

  // Trend tiles
  trendRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  trendCard: { flex: 1, padding: Spacing.sm },
  trendLabel: { fontSize: Typography.xs, color: Colors.textSecondary },
  trendValue: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: Colors.textPrimary, marginTop: 2 },
  trendChange: { fontSize: Typography.xs, marginTop: 2 },

  // Cash flow
  cashFlowCard: { marginHorizontal: Spacing.base, marginBottom: Spacing.base },
  sectionTitle: { fontSize: Typography.md, fontWeight: Typography.weightSemibold, marginBottom: Spacing.sm },
  cashRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderDefault,
  },
  cashLabel: { fontSize: Typography.base, color: Colors.textSecondary },
  cashValue: { fontSize: Typography.base, fontWeight: Typography.weightMedium, color: Colors.textPrimary },

  // Recent activity
  activitySection: { paddingHorizontal: Spacing.base, marginBottom: Spacing.base },
  activityItem: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 6 },
  activityDot: { fontSize: 16, color: Colors.textTertiary, marginRight: Spacing.sm },
  activityDesc: { flex: 1, fontSize: Typography.sm, color: Colors.textSecondary },
  activityTime: { fontSize: Typography.xs, color: Colors.textTertiary, marginLeft: Spacing.sm },
  emptyText: { fontSize: Typography.sm, color: Colors.textTertiary, fontStyle: 'italic', paddingVertical: Spacing.sm },
  // Alerts
  alertsRow: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.base, gap: Spacing.sm },
  alertCard: {
    borderWidth: 1, borderRadius: Radius.md,
    padding: Spacing.sm, minWidth: 240, maxWidth: 280,
  },
  alertMessage: { fontSize: Typography.sm, fontWeight: Typography.weightMedium, marginBottom: 6 },
  alertAction: { alignSelf: 'flex-end' },
  alertActionText: { fontSize: Typography.sm, fontWeight: Typography.weightBold, color: Colors.textPrimary },
});
