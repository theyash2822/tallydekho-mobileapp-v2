import React, { useCallback, useEffect, useState } from 'react';
import {
  View, ScrollView, TouchableOpacity, StyleSheet, Dimensions,
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
import type { RootStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
const { width: SCREEN_W } = Dimensions.get('window');
const CHART_W = SCREEN_W - Spacing.base * 2 - 32;

// ── Gauge Chart (semi-circle for GST compliance) ──────────────────
function GaugeChart({ percent }: { percent: number }) {
  // Simple visual gauge using bar segments
  const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
  const filled = Math.round((percent / 100) * 12);
  return (
    <View style={gauge.container}>
      <AppText style={gauge.label}>GST filed</AppText>
      <View style={gauge.segRow}>
        {months.map((m, i) => (
          <View key={m} style={gauge.segWrap}>
            <View style={[gauge.seg, i < filled ? gauge.segFilled : gauge.segEmpty]} />
            <AppText style={gauge.segLabel}>{m}</AppText>
          </View>
        ))}
      </View>
      <AppText style={gauge.pct}>{percent}%</AppText>
    </View>
  );
}

export default function ReportsScreen() {
  const navigation = useNavigation<Nav>();
  const { company } = useAuthStore();

  const [financialData, setFinancialData] = useState<{ revenue: number[]; expenses: number[] } | null>(null);
  const [aiData, setAiData] = useState<{ forecast: number[]; actual: number[] } | null>(null);
  const [gstPercent, setGstPercent] = useState(75);
  const [auditCount, setAuditCount] = useState(14);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const CHART_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
  const AI_LABELS = ['Wk1', 'Wk2', 'Wk3', 'Wk4', 'Wk5', 'Wk6', 'Wk7', 'Wk8'];

  const fetchReports = useCallback(async () => {
    // Real API call when endpoints are ready
    // For now show structured zero state — no fake numbers
    setFinancialData(null);
    setAiData(null);
  }, [company?.guid]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const chartConfig = {
    backgroundGradientFrom: Colors.cardBg,
    backgroundGradientTo: Colors.cardBg,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(26, 26, 26, ${opacity})`,
    labelColor: () => Colors.textTertiary,
    propsForDots: { r: '3', strokeWidth: '1', stroke: Colors.brandPrimary },
    propsForBackgroundLines: { stroke: Colors.borderDefault, strokeDasharray: '' },
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <AppText variant="h3" style={styles.headerTitle}>Reports Dashboard</AppText>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {error && <ErrorBanner message={error} onRetry={fetchReports} />}

        {/* ── Financial Card ── */}
        <Card style={styles.reportCard}>
          <TouchableOpacity
            style={styles.cardHeader}
            onPress={() => navigation.navigate('Financial')}
            activeOpacity={0.7}
          >
            <View style={styles.cardIconWrap}>
              <AppText style={styles.cardIcon}>📊</AppText>
            </View>
            <AppText style={styles.cardTitle}>Financial</AppText>
            <AppText style={styles.chevron}>›</AppText>
          </TouchableOpacity>

          {financialData ? (
            <LineChart
              data={{
                labels: CHART_LABELS,
                datasets: [
                  { data: financialData.revenue, color: () => Colors.positiveText, strokeWidth: 2 },
                  { data: financialData.expenses, color: () => Colors.warningText, strokeWidth: 2 },
                ],
                legend: ['Revenue', 'Expenses'],
              }}
              width={CHART_W}
              height={160}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
              withDots
              withInnerLines
              withOuterLines={false}
            />
          ) : (
            <View style={styles.chartPlaceholder}>
              <AppText style={styles.placeholderText}>Connect Tally to see financial charts</AppText>
            </View>
          )}
        </Card>

        {/* ── Compliance Card ── */}
        <Card style={styles.reportCard}>
          <TouchableOpacity
            style={styles.cardHeader}
            onPress={() => navigation.navigate('Compliance')}
            activeOpacity={0.7}
          >
            <View style={styles.cardIconWrap}>
              <AppText style={styles.cardIcon}>🛡</AppText>
            </View>
            <AppText style={styles.cardTitle}>Compliance</AppText>
            <AppText style={styles.chevron}>›</AppText>
          </TouchableOpacity>
          <GaugeChart percent={gstPercent} />
        </Card>

        {/* ── Audit Trail Card ── */}
        <Card style={styles.reportCard}>
          <TouchableOpacity
            style={styles.cardHeader}
            onPress={() => navigation.navigate('AuditTrail')}
            activeOpacity={0.7}
          >
            <View style={styles.cardIconWrap}>
              <AppText style={styles.cardIcon}>#</AppText>
            </View>
            <AppText style={styles.cardTitle}>Audit Trail</AppText>
            <AppText style={styles.chevron}>›</AppText>
          </TouchableOpacity>
          <View style={styles.auditRow}>
            <AppText style={styles.auditLabel}>Unreconciled vouchers</AppText>
            <AppText style={styles.auditCount}>{auditCount}</AppText>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${Math.min((auditCount / 50) * 100, 100)}%` }]} />
          </View>
        </Card>

        {/* ── AI Insights Card ── */}
        <Card style={styles.reportCard}>
          <TouchableOpacity
            style={styles.cardHeader}
            onPress={() => navigation.navigate('AIInsights')}
            activeOpacity={0.7}
          >
            <View style={styles.cardIconWrap}>
              <AppText style={styles.cardIcon}>✦</AppText>
            </View>
            <AppText style={styles.cardTitle}>AI Insights</AppText>
            <AppText style={styles.chevron}>›</AppText>
          </TouchableOpacity>

          {aiData ? (
            <LineChart
              data={{
                labels: AI_LABELS,
                datasets: [
                  { data: aiData.forecast, color: () => Colors.positiveText, strokeWidth: 2 },
                  { data: aiData.actual, color: () => Colors.warningText, strokeWidth: 2 },
                ],
                legend: ['Sales forecast', 'Actual'],
              }}
              width={CHART_W}
              height={140}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
              withDots={false}
              withInnerLines
              withOuterLines={false}
            />
          ) : (
            <View style={styles.chartPlaceholder}>
              <AppText style={styles.placeholderText}>No AI data yet — sync Tally data first</AppText>
            </View>
          )}
        </Card>

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Gauge styles ──────────────────────────────────────────────────
const gauge = StyleSheet.create({
  container: { paddingVertical: Spacing.sm, alignItems: 'center' },
  label: { fontSize: Typography.sm, color: Colors.textSecondary, marginBottom: Spacing.sm },
  segRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 4 },
  segWrap: { alignItems: 'center', width: 28 },
  seg: { width: 20, height: 8, borderRadius: 4, marginBottom: 2 },
  segFilled: { backgroundColor: Colors.positiveText },
  segEmpty: { backgroundColor: Colors.borderDefault },
  segLabel: { fontSize: 8, color: Colors.textTertiary },
  pct: { fontSize: Typography.xl, fontWeight: Typography.weightBold, color: Colors.textPrimary, marginTop: Spacing.sm },
});

const styles = StyleSheet.create({
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
  cardIconWrap: {
    width: 36, height: 36, borderRadius: Radius.sm,
    backgroundColor: Colors.pageBg, borderWidth: 1, borderColor: Colors.borderDefault,
    alignItems: 'center', justifyContent: 'center', marginRight: Spacing.sm,
  },
  cardIcon: { fontSize: 18 },
  cardTitle: { flex: 1, fontSize: Typography.base, fontWeight: Typography.weightSemibold, color: Colors.textPrimary },
  chevron: { fontSize: 22, color: Colors.textTertiary },

  chart: { borderRadius: Radius.sm, marginTop: Spacing.xs },
  chartPlaceholder: {
    height: 100, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.pageBg, borderRadius: Radius.sm,
    borderWidth: 1, borderColor: Colors.borderDefault, borderStyle: 'dashed',
  },
  placeholderText: { fontSize: Typography.sm, color: Colors.textTertiary, textAlign: 'center' },

  auditRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  auditLabel: { fontSize: Typography.base, color: Colors.textSecondary },
  auditCount: { fontSize: Typography.base, fontWeight: Typography.weightSemibold, color: Colors.textPrimary },
  progressBarBg: { height: 6, backgroundColor: Colors.borderDefault, borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: 6, backgroundColor: Colors.positiveText, borderRadius: 3 },
});
