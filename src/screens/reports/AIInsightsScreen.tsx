import React, { useCallback, useEffect, useState } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LineChart } from 'react-native-chart-kit';
import { Colors, Spacing, Radius, Typography } from '../../constants';
import { AppText } from '../../components/common/Text';
import { Card } from '../../components/common/Card';
import { ErrorBanner } from '../../components/common/ErrorBanner';
import { useAuthStore } from '../../store/authStore';
import apiClient from '../../services/api/client';
import type { RootStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
const { width: W } = Dimensions.get('window');

export default function AIInsightsScreen() {
  const navigation = useNavigation<Nav>();
  const { company } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!company?.guid) return;
    setLoading(true); setError(null);
    try {
      const res = await apiClient.get('/reports/ai-insights', { params: { companyGuid: company.guid } });
      setData(res.data);
    } catch (e: any) { setError(e?.message ?? 'Failed to load AI insights'); }
    finally { setLoading(false); }
  }, [company?.guid]);

  useEffect(() => { fetch(); }, [fetch]);

  const chartConfig = {
    backgroundGradientFrom: Colors.cardBg, backgroundGradientTo: Colors.cardBg,
    decimalPlaces: 0, color: (opacity = 1) => `rgba(26,26,26,${opacity})`,
    labelColor: () => Colors.textTertiary,
    propsForBackgroundLines: { stroke: Colors.borderDefault },
  };

  const LABELS = ['Wk1', 'Wk2', 'Wk3', 'Wk4', 'Wk5', 'Wk6', 'Wk7', 'Wk8'];

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}><AppText style={s.back}>←</AppText></TouchableOpacity>
        <AppText style={s.title}>AI Insights</AppText>
        <View style={{ width: 44 }} />
      </View>
      {error && <ErrorBanner message={error} onRetry={fetch} />}
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Sales forecast chart */}
        <Card style={s.card}>
          <AppText style={s.cardTitle}>Sales Forecast vs Actual</AppText>
          <AppText style={s.cardSub}>Last 8 weeks</AppText>
          {data?.salesForecast ? (
            <LineChart
              data={{ labels: LABELS, datasets: [{ data: data.salesForecast as number[], color: () => Colors.positiveText, strokeWidth: 2 }, { data: data.salesActual as number[], color: () => Colors.warningText, strokeWidth: 2 }], legend: ['Forecast', 'Actual'] }}
              width={W - Spacing.base * 2 - 32} height={180} chartConfig={chartConfig} bezier style={s.chart} withDots withInnerLines withOuterLines={false}
            />
          ) : <View style={s.placeholder}><AppText style={s.placeholderText}>Sync Tally data to see AI forecasts</AppText></View>}
        </Card>

        {/* Top insights */}
        <AppText style={s.sectionLabel}>Key Insights</AppText>
        {(data?.insights ?? []).length === 0 ? (
          <Card style={s.card}><View style={s.placeholder}><AppText style={s.placeholderText}>No insights available yet</AppText></View></Card>
        ) : (
          (data?.insights ?? []).map((insight: any, i: number) => (
            <Card key={i} style={s.insightCard}>
              <View style={s.insightRow}>
                <AppText style={s.insightIcon}>{insight.type === 'positive' ? '↑' : insight.type === 'warning' ? '⚠' : '💡'}</AppText>
                <View style={s.insightText}><AppText style={s.insightTitle}>{insight.title}</AppText><AppText style={s.insightBody}>{insight.body}</AppText></View>
              </View>
            </Card>
          ))
        )}

        {/* Growth metrics */}
        {data?.growth && (
          <>
            <AppText style={s.sectionLabel}>Growth Metrics</AppText>
            <View style={s.metricsRow}>
              {[{ label: 'Revenue Growth', value: `${data.growth.revenue ?? 0}%` }, { label: 'Customer Growth', value: `${data.growth.customers ?? 0}%` }, { label: 'Avg Ticket', value: `₹${(data.growth.avgTicket ?? 0).toLocaleString('en-IN')}` }].map(m => (
                <Card key={m.label} style={s.metricCard}>
                  <AppText style={s.metricLbl}>{m.label}</AppText>
                  <AppText style={s.metricVal}>{m.value}</AppText>
                </Card>
              ))}
            </View>
          </>
        )}
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
  content: { padding: Spacing.base },
  card: { padding: Spacing.base, marginBottom: Spacing.base },
  cardTitle: { fontSize: Typography.base, fontWeight: Typography.weightSemibold, color: Colors.textPrimary },
  cardSub: { fontSize: Typography.xs, color: Colors.textTertiary, marginBottom: Spacing.sm },
  chart: { borderRadius: Radius.sm },
  placeholder: { height: 100, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.pageBg, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.borderDefault, borderStyle: 'dashed' },
  placeholderText: { fontSize: Typography.sm, color: Colors.textTertiary, textAlign: 'center' },
  sectionLabel: { fontSize: Typography.xs, fontWeight: Typography.weightSemibold, color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.xs, marginTop: Spacing.sm },
  insightCard: { padding: Spacing.base, marginBottom: Spacing.sm },
  insightRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  insightIcon: { fontSize: 22, marginTop: 2 },
  insightText: { flex: 1 },
  insightTitle: { fontSize: Typography.base, fontWeight: Typography.weightSemibold, color: Colors.textPrimary, marginBottom: 2 },
  insightBody: { fontSize: Typography.sm, color: Colors.textSecondary, lineHeight: 18 },
  metricsRow: { flexDirection: 'row', gap: Spacing.sm },
  metricCard: { flex: 1, padding: Spacing.sm, alignItems: 'center' },
  metricLbl: { fontSize: Typography.xs, color: Colors.textTertiary, marginBottom: 2, textAlign: 'center' },
  metricVal: { fontSize: Typography.base, fontWeight: Typography.weightBold, color: Colors.textPrimary },
});
