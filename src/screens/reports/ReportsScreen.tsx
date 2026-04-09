import React, { useCallback, useEffect, useState } from 'react';
import {
  View, ScrollView, TouchableOpacity, StyleSheet, Dimensions, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LineChart } from 'react-native-chart-kit';
import { Colors, Spacing, Radius, Typography } from '../../constants';
import { AppText } from '../../components/common/Text';
import { Card } from '../../components/common/Card';
import { ErrorBanner } from '../../components/common/ErrorBanner';
import { useAuthStore } from '../../store/authStore';
import { dashboardApi } from '../../services/api/dashboardApi';
import type { RootStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
const { width: SCREEN_W } = Dimensions.get('window');
const CHART_W = SCREEN_W - Spacing.base * 2 - 32;

interface ReportsData {
  financialChart: { labels: string[]; revenue: number[]; expenses: number[] };
  gstPercent: number;
  gstFiledMonths: number;
  gstTotalMonths: number;
  auditCount: number;
  aiChart: { labels: string[]; actual: number[]; forecast: number[] };
}

// ── GST Gauge — monthly segment bar ──────────────────────────────
function GSTGauge({ percent, filed, total }: { percent: number; filed: number; total: number }) {
  const MONTHS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
  return (
    <View style={gauge.container}>
      <AppText style={gauge.label}>GST filed (Apr–Mar)</AppText>
      <View style={gauge.segRow}>
        {MONTHS.map((m, i) => (
          <View key={m} style={gauge.segWrap}>
            <View style={[
              gauge.seg,
              i < filed ? gauge.segFiled : i < total ? gauge.segCurrent : gauge.segEmpty,
            ]} />
            <AppText style={gauge.segLabel}>{m.slice(0, 1)}</AppText>
          </View>
        ))}
      </View>
      <View style={gauge.pctRow}>
        <AppText style={gauge.pct}>{percent}%</AppText>
        <AppText style={gauge.pctSub}>{filed}/{total} months filed</AppText>
      </View>
    </View>
  );
}

// ── View-based bar chart for AI (no external lib quirks) ──────────
function MiniBarChart({ actual, forecast, labels }: { actual: number[]; forecast: number[]; labels: string[] }) {
  const maxVal = Math.max(...actual, ...forecast, 1);
  return (
    <View style={bar.container}>
      <View style={bar.legend}>
        <View style={bar.legendItem}><View style={[bar.dot, { backgroundColor: Colors.positiveText }]} /><AppText style={bar.legendText}>Actual</AppText></View>
        <View style={bar.legendItem}><View style={[bar.dot, { backgroundColor: Colors.warningText }]} /><AppText style={bar.legendText}>Forecast</AppText></View>
      </View>
      <View style={bar.chart}>
        {labels.map((l, i) => (
          <View key={l} style={bar.group}>
            <View style={bar.bars}>
              <View style={[bar.barA, { height: Math.max((actual[i] / maxVal) * 80, 2) }]} />
              <View style={[bar.barF, { height: Math.max((forecast[i] / maxVal) * 80, 2) }]} />
            </View>
            <AppText style={bar.lbl}>{l}</AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function ReportsScreen() {
  const navigation = useNavigation<Nav>();
  const { company } = useAuthStore();

  const [reportData, setReportData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!company?.guid) return;
    setLoading(true); setError(null);
    try {
      const res = await dashboardApi.getReportsDashboard(company.guid);
      setReportData(res.data?.data ?? null);
    } catch (e: any) { setError(e?.message ?? 'Failed to load reports'); }
    finally { setLoading(false); }
  }, [company?.guid]);

  useEffect(() => { fetch(); }, [fetch]);

  const chartConfig = {
    backgroundGradientFrom: Colors.cardBg,
    backgroundGradientTo: Colors.cardBg,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(26, 26, 26, ${opacity})`,
    labelColor: () => Colors.textTertiary,
    propsForDots: { r: '3', strokeWidth: '1', stroke: Colors.brandPrimary },
    propsForBackgroundLines: { stroke: Colors.borderDefault },
  };

  const hasFinancial = reportData && reportData.financialChart?.labels?.length > 0;
  const hasAI = reportData && reportData.aiChart?.actual?.some(v => v > 0);
  const gstPct = reportData?.gstPercent ?? 0;
  const auditCount = reportData?.auditCount ?? 0;
  const financialLabels = hasFinancial ? reportData!.financialChart.labels : ['Apr', 'May', 'Jun', 'Jul', 'Aug'];
  const revenue  = hasFinancial ? reportData!.financialChart.revenue  : [0, 0, 0, 0, 0];
  const expenses = hasFinancial ? reportData!.financialChart.expenses : [0, 0, 0, 0, 0];

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <AppText variant="h3" style={s.headerTitle}>Reports Dashboard</AppText>
      </View>

      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetch} tintColor={Colors.textSecondary} />}
      >
        {error && <ErrorBanner message={error} onRetry={fetch} />}

        {/* ── 1. Financial Card ── */}
        <Card style={s.reportCard}>
          <TouchableOpacity style={s.cardHeader} onPress={() => navigation.navigate('Financial')} activeOpacity={0.7}>
            <View style={s.iconWrap}><AppText style={s.cardIcon}>📊</AppText></View>
            <View style={s.cardMeta}>
              <AppText style={s.cardTitle}>Financial</AppText>
              <AppText style={s.cardSub}>Revenue vs Expenses</AppText>
            </View>
            <AppText style={s.chevron}>›</AppText>
          </TouchableOpacity>

          {hasFinancial ? (
            <LineChart
              data={{
                labels: financialLabels,
                datasets: [
                  { data: revenue.length > 0 ? revenue : [0], color: () => Colors.positiveText, strokeWidth: 2 },
                  { data: expenses.length > 0 ? expenses : [0], color: () => Colors.warningText, strokeWidth: 2 },
                ],
                legend: ['Revenue', 'Expenses'],
              }}
              width={CHART_W}
              height={160}
              chartConfig={chartConfig}
              bezier
              style={s.chart}
              withDots
              withInnerLines
              withOuterLines={false}
            />
          ) : (
            <EmptyChart message={loading ? 'Loading chart data...' : 'No financial data — sync Tally first'} />
          )}
        </Card>

        {/* ── 2. Compliance / GST Gauge ── */}
        <Card style={s.reportCard}>
          <TouchableOpacity style={s.cardHeader} onPress={() => navigation.navigate('Compliance')} activeOpacity={0.7}>
            <View style={s.iconWrap}><AppText style={s.cardIcon}>🛡</AppText></View>
            <View style={s.cardMeta}>
              <AppText style={s.cardTitle}>Compliance</AppText>
              <AppText style={s.cardSub}>GST, E-Way Bill, E-Invoicing</AppText>
            </View>
            <AppText style={s.chevron}>›</AppText>
          </TouchableOpacity>
          <GSTGauge
            percent={gstPct}
            filed={reportData?.gstFiledMonths ?? 0}
            total={reportData?.gstTotalMonths ?? 0}
          />
          {gstPct === 0 && !loading && (
            <AppText style={s.gstHint}>
              IRN generation enables GST tracking. Set up E-Invoice integration to track compliance.
            </AppText>
          )}
        </Card>

        {/* ── 3. Audit Trail ── */}
        <Card style={s.reportCard}>
          <TouchableOpacity style={s.cardHeader} onPress={() => navigation.navigate('AuditTrail')} activeOpacity={0.7}>
            <View style={s.iconWrap}><AppText style={s.cardIcon}>#</AppText></View>
            <View style={s.cardMeta}>
              <AppText style={s.cardTitle}>Audit Trail</AppText>
              <AppText style={s.cardSub}>Pending entries & write queue</AppText>
            </View>
            <AppText style={s.chevron}>›</AppText>
          </TouchableOpacity>

          <View style={s.auditContent}>
            <View style={s.auditKpi}>
              <AppText style={[s.auditCount, { color: auditCount > 0 ? Colors.warningText : Colors.positiveText }]}>
                {auditCount}
              </AppText>
              <AppText style={s.auditLabel}>
                {auditCount === 0 ? 'All reconciled ✓' : 'unreconciled vouchers'}
              </AppText>
            </View>
            {auditCount > 0 && (
              <>
                <View style={s.progressBg}>
                  <View style={[s.progressFill, {
                    width: `${Math.min((auditCount / 50) * 100, 100)}%`,
                    backgroundColor: auditCount > 20 ? Colors.negativeText : Colors.warningText,
                  }]} />
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('AuditTrail')} style={s.fixBtn}>
                  <AppText style={s.fixBtnText}>Review & push →</AppText>
                </TouchableOpacity>
              </>
            )}
          </View>
        </Card>

        {/* ── 4. AI Insights ── */}
        <Card style={s.reportCard}>
          <TouchableOpacity style={s.cardHeader} onPress={() => navigation.navigate('AIInsights')} activeOpacity={0.7}>
            <View style={s.iconWrap}><AppText style={s.cardIcon}>✦</AppText></View>
            <View style={s.cardMeta}>
              <AppText style={s.cardTitle}>AI Insights</AppText>
              <AppText style={s.cardSub}>Sales forecast vs actual (8 weeks)</AppText>
            </View>
            <AppText style={s.chevron}>›</AppText>
          </TouchableOpacity>

          {hasAI ? (
            <MiniBarChart
              actual={reportData!.aiChart.actual}
              forecast={reportData!.aiChart.forecast}
              labels={reportData!.aiChart.labels}
            />
          ) : (
            <EmptyChart message={loading ? 'Loading AI data...' : 'Sync Tally data to see weekly sales trends'} />
          )}
        </Card>

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <View style={s.emptyChart}>
      <AppText style={s.emptyChartText}>{message}</AppText>
    </View>
  );
}

// Gauge styles
const gauge = StyleSheet.create({
  container: { paddingVertical: Spacing.sm, alignItems: 'center' },
  label: { fontSize: Typography.xs, color: Colors.textSecondary, marginBottom: Spacing.sm, textTransform: 'uppercase', letterSpacing: 0.6 },
  segRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 3, marginBottom: Spacing.sm },
  segWrap: { alignItems: 'center', width: 26 },
  seg: { width: 18, height: 10, borderRadius: 3, marginBottom: 3 },
  segFiled: { backgroundColor: Colors.positiveText },
  segCurrent: { backgroundColor: Colors.borderStrong },
  segEmpty: { backgroundColor: Colors.borderDefault },
  segLabel: { fontSize: 8, color: Colors.textTertiary },
  pctRow: { alignItems: 'center' },
  pct: { fontSize: 28, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  pctSub: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2 },
});

// Bar chart styles
const bar = StyleSheet.create({
  container: { paddingTop: Spacing.sm },
  legend: { flexDirection: 'row', gap: Spacing.base, marginBottom: Spacing.sm, paddingHorizontal: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: Typography.xs, color: Colors.textSecondary },
  chart: { flexDirection: 'row', alignItems: 'flex-end', height: 100, gap: 4 },
  group: { flex: 1, alignItems: 'center' },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 80, marginBottom: 4 },
  barA: { width: 8, backgroundColor: Colors.positiveText, borderRadius: 2, opacity: 0.85 },
  barF: { width: 8, backgroundColor: Colors.warningText, borderRadius: 2, opacity: 0.6 },
  lbl: { fontSize: 8, color: Colors.textTertiary, textAlign: 'center' },
});

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.pageBg },
  header: {
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm,
    backgroundColor: Colors.cardBg, borderBottomWidth: 1, borderBottomColor: Colors.borderDefault,
    alignItems: 'center',
  },
  headerTitle: { fontSize: Typography.lg, fontWeight: Typography.weightSemibold },
  content: { padding: Spacing.base },
  reportCard: { marginBottom: Spacing.base, padding: Spacing.base },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  iconWrap: {
    width: 40, height: 40, borderRadius: Radius.sm,
    backgroundColor: Colors.pageBg, borderWidth: 1, borderColor: Colors.borderDefault,
    alignItems: 'center', justifyContent: 'center', marginRight: Spacing.sm,
  },
  cardIcon: { fontSize: 18 },
  cardMeta: { flex: 1 },
  cardTitle: { fontSize: Typography.base, fontWeight: Typography.weightSemibold, color: Colors.textPrimary },
  cardSub: { fontSize: Typography.xs, color: Colors.textTertiary, marginTop: 1 },
  chevron: { fontSize: 22, color: Colors.textTertiary },
  chart: { borderRadius: Radius.sm, marginTop: Spacing.xs },
  emptyChart: {
    height: 90, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.pageBg, borderRadius: Radius.sm,
    borderWidth: 1, borderColor: Colors.borderDefault, borderStyle: 'dashed',
  },
  emptyChartText: { fontSize: Typography.sm, color: Colors.textTertiary, textAlign: 'center', paddingHorizontal: Spacing.base },
  gstHint: { fontSize: Typography.xs, color: Colors.textTertiary, textAlign: 'center', marginTop: Spacing.xs, fontStyle: 'italic' },
  auditContent: { paddingTop: Spacing.xs },
  auditKpi: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm, marginBottom: Spacing.sm },
  auditCount: { fontSize: 28, fontWeight: Typography.weightBold },
  auditLabel: { fontSize: Typography.sm, color: Colors.textSecondary },
  progressBg: { height: 6, backgroundColor: Colors.borderDefault, borderRadius: 3, overflow: 'hidden', marginBottom: Spacing.sm },
  progressFill: { height: 6, borderRadius: 3 },
  fixBtn: { alignSelf: 'flex-end' },
  fixBtnText: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.weightSemibold },
});
