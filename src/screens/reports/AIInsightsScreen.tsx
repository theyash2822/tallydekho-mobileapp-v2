import React, { useCallback, useEffect, useState } from 'react';
import {
  View, ScrollView, TouchableOpacity, StyleSheet,
  Dimensions, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Spacing, Radius, Typography } from '../../constants';
import { AppText } from '../../components/common/Text';
import { Card } from '../../components/common/Card';
import { ErrorBanner } from '../../components/common/ErrorBanner';
import { useAuthStore } from '../../store/authStore';
import apiClient from '../../services/api/client';
import type { RootStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
const { width: W } = Dimensions.get('window');
const CHART_W = W - Spacing.base * 4;

interface AIData {
  salesForecast: number[];
  salesActual: number[];
  weekLabels: string[];
  growth: { revenue: number; weeklyGrowth: number; customers: number; avgTicket: number; grossMargin: number };
  inventory: { turnoverRatio: number; dsi: number; fastMoving: number; slowMoving: number; totalValue: number };
  topCustomers: { name: string; revenue: number; invoices: number; pct: number }[];
  forecast: { nextMonthSales: number; confidence: number; trend: 'up' | 'down' | 'flat' };
  insights: { type: string; title: string; body: string }[];
  hasEnoughData: boolean;
}

// ── View-based dual line chart ────────────────────────────────────
function DualLineChart({ actual, forecast, labels, width }: {
  actual: number[]; forecast: number[]; labels: string[]; width: number;
}) {
  const maxVal = Math.max(...actual, ...forecast, 1);
  const H = 120;
  const barW = Math.max(2, (width - 32) / Math.max(actual.length, 1) - 8);

  return (
    <View>
      <View style={lc.legend}>
        <View style={lc.legendItem}><View style={[lc.dot, { backgroundColor: Colors.positiveText }]} /><AppText style={lc.legendText}>Actual</AppText></View>
        <View style={lc.legendItem}><View style={[lc.dot, { backgroundColor: Colors.warningText, opacity: 0.7 }]} /><AppText style={lc.legendText}>Forecast (regression)</AppText></View>
      </View>
      <View style={[lc.chartArea, { height: H }]}>
        {actual.map((v, i) => {
          const aH = Math.max((v / maxVal) * (H - 20), 2);
          const fH = Math.max((forecast[i] / maxVal) * (H - 20), 2);
          return (
            <View key={i} style={lc.colGroup}>
              <View style={lc.bars}>
                <View style={[lc.barA, { height: aH, width: barW }]} />
                <View style={[lc.barF, { height: fH, width: barW }]} />
              </View>
              <AppText style={lc.label}>{labels[i]}</AppText>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const lc = StyleSheet.create({
  legend: { flexDirection: 'row', gap: Spacing.base, marginBottom: Spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: Typography.xs, color: Colors.textSecondary },
  chartArea: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  colGroup: { flex: 1, alignItems: 'center' },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  barA: { backgroundColor: Colors.positiveText, borderRadius: 2, opacity: 0.85 },
  barF: { backgroundColor: Colors.warningText, borderRadius: 2, opacity: 0.55 },
  label: { fontSize: 8, color: Colors.textTertiary, marginTop: 3 },
});

// ── Trend arrow ───────────────────────────────────────────────────
function TrendBadge({ value, suffix = '%' }: { value: number; suffix?: string }) {
  const color = value > 0 ? Colors.positiveText : value < 0 ? Colors.negativeText : Colors.textTertiary;
  const arrow = value > 0 ? '↑' : value < 0 ? '↓' : '→';
  return (
    <AppText style={{ color, fontWeight: Typography.weightBold, fontSize: Typography.sm }}>
      {arrow} {Math.abs(value).toFixed(1)}{suffix}
    </AppText>
  );
}

export default function AIInsightsScreen() {
  const navigation = useNavigation<Nav>();
  const { company } = useAuthStore();
  const [data, setData] = useState<AIData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!company?.guid) return;
    setLoading(true); setError(null);
    try {
      const res = await apiClient.get('/ai/ai-insights', { params: { companyGuid: company.guid } });
      setData(res.data?.data ?? null);
    } catch (e: any) { setError(e?.message ?? 'Failed to load AI insights'); }
    finally { setLoading(false); }
  }, [company?.guid]);

  useEffect(() => { fetch(); }, [fetch]);

  const fmt = (v: number) => v >= 1_00_000 ? `₹${(v / 1_00_000).toFixed(1)}L` : v >= 1000 ? `₹${(v / 1000).toFixed(0)}K` : `₹${v.toLocaleString('en-IN')}`;

  const INSIGHT_ICON: Record<string, string> = { positive: '↑', warning: '⚠', info: '💡' };
  const INSIGHT_COLOR: Record<string, string> = { positive: Colors.positiveText, warning: Colors.warningText, info: Colors.infoText };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <AppText style={s.back}>←</AppText>
        </TouchableOpacity>
        <AppText style={s.title}>AI Insights</AppText>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetch} tintColor={Colors.textSecondary} />}
      >
        {error && <ErrorBanner message={error} onRetry={fetch} />}

        {!data?.hasEnoughData && !loading && !error && (
          <Card style={s.noDataCard}>
            <AppText style={s.noDataIcon}>📊</AppText>
            <AppText style={s.noDataTitle}>Building your baseline</AppText>
            <AppText style={s.noDataBody}>
              AI insights improve as more data syncs from Tally. Currently showing available patterns from your existing data.
            </AppText>
          </Card>
        )}

        {/* ── Next Month Forecast ── */}
        {data?.forecast && (
          <Card style={s.forecastCard}>
            <View style={s.forecastHeader}>
              <AppText style={s.forecastLabel}>Next Month Sales Forecast</AppText>
              <View style={[s.confidenceBadge, { backgroundColor: data.forecast.confidence > 70 ? Colors.positiveBg : Colors.warningBg }]}>
                <AppText style={[s.confidenceText, { color: data.forecast.confidence > 70 ? Colors.positiveText : Colors.warningText }]}>
                  {data.forecast.confidence}% confidence
                </AppText>
              </View>
            </View>
            <AppText style={s.forecastValue}>{fmt(data.forecast.nextMonthSales)}</AppText>
            <View style={s.forecastTrend}>
              <AppText style={s.forecastTrendLabel}>Trend: </AppText>
              <AppText style={[s.forecastTrendValue, {
                color: data.forecast.trend === 'up' ? Colors.positiveText : data.forecast.trend === 'down' ? Colors.negativeText : Colors.textSecondary
              }]}>
                {data.forecast.trend === 'up' ? '↑ Upward' : data.forecast.trend === 'down' ? '↓ Downward' : '→ Flat'}
              </AppText>
            </View>
            <AppText style={s.forecastNote}>Based on linear regression on last {data.salesActual?.length ?? 8} weeks of actual sales data</AppText>
          </Card>
        )}

        {/* ── Sales Forecast Chart ── */}
        {data && (
          <Card style={s.card}>
            <AppText style={s.cardTitle}>Sales Forecast vs Actual (8 Weeks)</AppText>
            <DualLineChart
              actual={data.salesActual}
              forecast={data.salesForecast}
              labels={data.weekLabels}
              width={CHART_W}
            />
          </Card>
        )}

        {/* ── Growth Metrics ── */}
        {data?.growth && (
          <Card style={s.card}>
            <AppText style={s.cardTitle}>Growth Metrics</AppText>
            <View style={s.metricsGrid}>
              {[
                { label: 'MoM Revenue', value: data.growth.revenue, isTrend: true },
                { label: 'Weekly Growth', value: data.growth.weeklyGrowth, isTrend: true },
                { label: 'Avg Ticket', display: fmt(data.growth.avgTicket) },
                { label: 'Gross Margin', value: data.growth.grossMargin, suffix: '%' },
              ].map((m, i) => (
                <View key={i} style={s.metricCard}>
                  <AppText style={s.metricLabel}>{m.label}</AppText>
                  {m.isTrend
                    ? <TrendBadge value={m.value!} />
                    : m.display
                    ? <AppText style={s.metricValue}>{m.display}</AppText>
                    : <TrendBadge value={m.value!} suffix={m.suffix} />
                  }
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* ── Inventory Analytics ── */}
        {data?.inventory && (
          <Card style={s.card}>
            <AppText style={s.cardTitle}>Inventory Analytics</AppText>
            <View style={s.metricsGrid}>
              <View style={s.metricCard}>
                <AppText style={s.metricLabel}>Turnover Ratio</AppText>
                <AppText style={s.metricValue}>{data.inventory.turnoverRatio.toFixed(2)}x</AppText>
              </View>
              <View style={s.metricCard}>
                <AppText style={s.metricLabel}>DSI (Days)</AppText>
                <AppText style={[s.metricValue, { color: data.inventory.dsi > 90 ? Colors.warningText : Colors.textPrimary }]}>
                  {data.inventory.dsi === 0 ? '—' : data.inventory.dsi}
                </AppText>
              </View>
              <View style={s.metricCard}>
                <AppText style={s.metricLabel}>Fast-Moving</AppText>
                <AppText style={[s.metricValue, { color: Colors.positiveText }]}>{data.inventory.fastMoving}</AppText>
              </View>
              <View style={s.metricCard}>
                <AppText style={s.metricLabel}>Slow-Moving</AppText>
                <AppText style={[s.metricValue, { color: data.inventory.slowMoving > 5 ? Colors.warningText : Colors.textPrimary }]}>{data.inventory.slowMoving}</AppText>
              </View>
            </View>
            <View style={s.invTotal}>
              <AppText style={s.invTotalLabel}>Total Inventory Value</AppText>
              <AppText style={s.invTotalValue}>{fmt(data.inventory.totalValue)}</AppText>
            </View>
          </Card>
        )}

        {/* ── Top Customers ── */}
        {data?.topCustomers && data.topCustomers.length > 0 && (
          <Card style={s.card}>
            <AppText style={s.cardTitle}>Top Customers (This FY)</AppText>
            {data.topCustomers.map((c, i) => (
              <View key={i} style={s.custRow}>
                <View style={s.custRank}><AppText style={s.custRankText}>{i + 1}</AppText></View>
                <View style={s.custInfo}>
                  <AppText style={s.custName} numberOfLines={1}>{c.name}</AppText>
                  <View style={s.custBar}>
                    <View style={[s.custBarFill, { width: `${c.pct}%` }]} />
                  </View>
                </View>
                <View style={s.custRight}>
                  <AppText style={s.custRevenue}>{fmt(c.revenue)}</AppText>
                  <AppText style={s.custPct}>{c.pct}%</AppText>
                </View>
              </View>
            ))}
          </Card>
        )}

        {/* ── AI Insights ── */}
        {data?.insights && data.insights.length > 0 && (
          <Card style={s.card}>
            <AppText style={s.cardTitle}>Key Insights</AppText>
            {data.insights.map((insight, i) => (
              <View key={i} style={[s.insightRow, i < data.insights.length - 1 && s.insightBorder]}>
                <View style={[s.insightIconWrap, { backgroundColor: insight.type === 'positive' ? Colors.positiveBg : insight.type === 'warning' ? Colors.warningBg : Colors.infoBg }]}>
                  <AppText style={s.insightIcon}>{INSIGHT_ICON[insight.type] ?? '💡'}</AppText>
                </View>
                <View style={s.insightText}>
                  <AppText style={[s.insightTitle, { color: INSIGHT_COLOR[insight.type] ?? Colors.textPrimary }]}>{insight.title}</AppText>
                  <AppText style={s.insightBody}>{insight.body}</AppText>
                </View>
              </View>
            ))}
          </Card>
        )}

        {!data && !loading && !error && (
          <View style={s.empty}>
            <AppText style={s.emptyText}>Sync Tally data to generate AI insights</AppText>
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.pageBg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: 10, backgroundColor: Colors.cardBg, borderBottomWidth: 1, borderBottomColor: Colors.borderDefault },
  back: { fontSize: 22, color: Colors.textPrimary, marginRight: Spacing.sm },
  title: { flex: 1, fontSize: Typography.md, fontWeight: Typography.weightSemibold },
  content: { padding: Spacing.base },

  noDataCard: { padding: Spacing.xl, alignItems: 'center', marginBottom: Spacing.base },
  noDataIcon: { fontSize: 36, marginBottom: Spacing.sm },
  noDataTitle: { fontSize: Typography.base, fontWeight: Typography.weightSemibold, color: Colors.textPrimary, marginBottom: 4 },
  noDataBody: { fontSize: Typography.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },

  forecastCard: { padding: Spacing.base, marginBottom: Spacing.base, backgroundColor: Colors.cardBg },
  forecastHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  forecastLabel: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.weightMedium },
  confidenceBadge: { borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  confidenceText: { fontSize: 10, fontWeight: '600' },
  forecastValue: { fontSize: 36, fontWeight: Typography.weightBold, color: Colors.textPrimary, marginBottom: 4 },
  forecastTrend: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  forecastTrendLabel: { fontSize: Typography.sm, color: Colors.textSecondary },
  forecastTrendValue: { fontSize: Typography.sm, fontWeight: Typography.weightBold },
  forecastNote: { fontSize: Typography.xs, color: Colors.textTertiary, marginTop: 4, fontStyle: 'italic' },

  card: { padding: Spacing.base, marginBottom: Spacing.base },
  cardTitle: { fontSize: Typography.base, fontWeight: Typography.weightSemibold, color: Colors.textPrimary, marginBottom: Spacing.base },

  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  metricCard: { width: '47%', backgroundColor: Colors.pageBg, borderRadius: Radius.sm, padding: Spacing.sm },
  metricLabel: { fontSize: Typography.xs, color: Colors.textTertiary, marginBottom: 4 },
  metricValue: { fontSize: Typography.lg, fontWeight: Typography.weightBold, color: Colors.textPrimary },

  invTotal: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: Spacing.sm, marginTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.borderDefault },
  invTotalLabel: { fontSize: Typography.sm, color: Colors.textSecondary },
  invTotalValue: { fontSize: Typography.sm, fontWeight: Typography.weightBold, color: Colors.textPrimary },

  custRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, gap: Spacing.sm },
  custRank: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.pageBg, borderWidth: 1, borderColor: Colors.borderDefault, alignItems: 'center', justifyContent: 'center' },
  custRankText: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary },
  custInfo: { flex: 1 },
  custName: { fontSize: Typography.sm, fontWeight: Typography.weightMedium, color: Colors.textPrimary, marginBottom: 4 },
  custBar: { height: 4, backgroundColor: Colors.borderDefault, borderRadius: 2, overflow: 'hidden' },
  custBarFill: { height: 4, backgroundColor: Colors.brandPrimary, borderRadius: 2, opacity: 0.7 },
  custRight: { alignItems: 'flex-end' },
  custRevenue: { fontSize: Typography.sm, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  custPct: { fontSize: Typography.xs, color: Colors.textTertiary },

  insightRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: Spacing.sm, gap: Spacing.md },
  insightBorder: { borderBottomWidth: 1, borderBottomColor: Colors.borderDefault },
  insightIconWrap: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  insightIcon: { fontSize: 14 },
  insightText: { flex: 1 },
  insightTitle: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, marginBottom: 2 },
  insightBody: { fontSize: Typography.sm, color: Colors.textSecondary, lineHeight: 18 },

  empty: { alignItems: 'center', paddingVertical: Spacing.xxxl },
  emptyText: { fontSize: Typography.base, color: Colors.textTertiary },
});
