import React, { useCallback, useEffect, useState } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
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

interface FinancialRow { label: string; value: number; isBold?: boolean; }
interface FinancialSection { id: string; title: string; rows: FinancialRow[]; }

export default function FinancialScreen() {
  const navigation = useNavigation<Nav>();
  const { company, selectedFY } = useAuthStore();
  const [data, setData] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ pl: true, bs: false, tb: false });
  const [bsTab, setBsTab] = useState<'liability' | 'assets'>('liability');

  const fetch = useCallback(async () => {
    if (!company?.guid) return;
    setLoading(true); setError(null);
    try {
      const res = await apiClient.get('/reports/financial', { params: { companyGuid: company.guid, fy: selectedFY } });
      setData(res.data);
    } catch (e: any) { setError(e?.message ?? 'Failed to load financial data'); }
    finally { setLoading(false); }
  }, [company?.guid, selectedFY]);

  useEffect(() => { fetch(); }, [fetch]);

  const fmt = (v: number) => `₹${Math.abs(v).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  const toggle = (id: string) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}><AppText style={s.back}>←</AppText></TouchableOpacity>
        <AppText style={s.title}>Financial</AppText>
        <AppText style={s.fy}>{selectedFY}</AppText>
      </View>
      {error && <ErrorBanner message={error} onRetry={fetch} />}

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* ── P&L ── */}
        <TouchableOpacity onPress={() => toggle('pl')} style={s.sectionBtn} activeOpacity={0.7}>
          <AppText style={s.sectionTitle}>Profit & Loss</AppText>
          <AppText style={s.chevron}>{expanded.pl ? '▲' : '▼'}</AppText>
        </TouchableOpacity>
        {expanded.pl && (
          <Card style={s.sectionCard}>
            {data ? (
              [
                { label: 'Opening Stock', value: data.pl?.openingStock ?? 0 },
                { label: 'Closing Stock', value: data.pl?.closingStock ?? 0 },
                { label: 'Purchase', value: data.pl?.purchase ?? 0 },
                { label: 'Sales', value: data.pl?.sales ?? 0 },
                { label: 'Direct Expense', value: data.pl?.directExpense ?? 0 },
                { label: 'Indirect Expense', value: data.pl?.indirectExpense ?? 0 },
                { label: 'Direct Income', value: data.pl?.directIncome ?? 0 },
                { label: 'Indirect Income', value: data.pl?.indirectIncome ?? 0 },
                { label: 'Gross Profit', value: data.pl?.grossProfit ?? 0, isBold: true },
                { label: 'Net Profit', value: data.pl?.netProfit ?? 0, isBold: true },
              ].map((row, i) => (
                <View key={i} style={[s.row, row.isBold && s.boldRow]}>
                  <AppText style={[s.rowLabel, row.isBold && s.boldText]}>{row.label}</AppText>
                  <AppText style={[s.rowValue, row.isBold && s.boldText, row.value < 0 && { color: Colors.negativeText }]}>{fmt(row.value)}</AppText>
                </View>
              ))
            ) : <EmptyState />}
          </Card>
        )}

        {/* ── Balance Sheet ── */}
        <TouchableOpacity onPress={() => toggle('bs')} style={s.sectionBtn} activeOpacity={0.7}>
          <AppText style={s.sectionTitle}>Balance Sheet</AppText>
          <AppText style={s.chevron}>{expanded.bs ? '▲' : '▼'}</AppText>
        </TouchableOpacity>
        {expanded.bs && (
          <Card style={s.sectionCard}>
            <View style={s.tabRow}>
              {(['liability', 'assets'] as const).map(t => (
                <TouchableOpacity key={t} onPress={() => setBsTab(t)} style={[s.tab, bsTab === t && s.tabActive]}>
                  <AppText style={[s.tabText, bsTab === t && s.tabTextActive]}>{t.charAt(0).toUpperCase() + t.slice(1)}</AppText>
                </TouchableOpacity>
              ))}
            </View>
            {data ? (
              (bsTab === 'liability' ? [
                { label: 'Capital Account', value: data.bs?.capitalAccount ?? 0 },
                { label: 'Current Liability', value: data.bs?.currentLiability ?? 0 },
                { label: 'Loan Liabilities', value: data.bs?.loanLiabilities ?? 0 },
                { label: 'Profit & Loss', value: data.bs?.profitLoss ?? 0 },
                { label: 'Total Liabilities', value: data.bs?.totalLiabilities ?? 0, isBold: true },
              ] : [
                { label: 'Fixed Asset', value: data.bs?.fixedAsset ?? 0 },
                { label: 'Current Assets', value: data.bs?.currentAssets ?? 0 },
                { label: 'Investments', value: data.bs?.investments ?? 0 },
                { label: 'Total Assets', value: data.bs?.totalAssets ?? 0, isBold: true },
              ]).map((row, i) => (
                <View key={i} style={[s.row, row.isBold && s.boldRow]}>
                  <AppText style={[s.rowLabel, row.isBold && s.boldText]}>{row.label}</AppText>
                  <AppText style={[s.rowValue, row.isBold && s.boldText]}>{fmt(row.value)}</AppText>
                </View>
              ))
            ) : <EmptyState />}
          </Card>
        )}

        {/* ── Trial Balance ── */}
        <TouchableOpacity onPress={() => toggle('tb')} style={s.sectionBtn} activeOpacity={0.7}>
          <AppText style={s.sectionTitle}>Trial Balance</AppText>
          <AppText style={s.chevron}>{expanded.tb ? '▲' : '▼'}</AppText>
        </TouchableOpacity>
        {expanded.tb && (
          <Card style={s.sectionCard}>
            {data ? (
              [
                { label: 'Current Assets', value: data.tb?.currentAssets ?? 0 },
                { label: 'Sales Account', value: data.tb?.salesAccount ?? 0 },
                { label: 'Purchase Accounts', value: data.tb?.purchaseAccounts ?? 0 },
              ].map((row, i) => (
                <View key={i} style={s.row}>
                  <AppText style={s.rowLabel}>{row.label}</AppText>
                  <AppText style={s.rowValue}>{fmt(row.value)}</AppText>
                </View>
              ))
            ) : <EmptyState />}
          </Card>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function EmptyState() {
  return <View style={{ alignItems: 'center', padding: Spacing.xl }}><AppText style={{ fontSize: Typography.sm, color: Colors.textTertiary }}>No data — sync Tally first</AppText></View>;
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.pageBg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: 10, backgroundColor: Colors.cardBg, borderBottomWidth: 1, borderBottomColor: Colors.borderDefault },
  back: { fontSize: 22, color: Colors.textPrimary, marginRight: Spacing.sm },
  title: { flex: 1, fontSize: Typography.md, fontWeight: Typography.weightSemibold },
  fy: { fontSize: Typography.sm, color: Colors.textSecondary },
  content: { padding: Spacing.base },
  sectionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.sm, paddingHorizontal: 4, marginTop: Spacing.sm },
  sectionTitle: { fontSize: Typography.base, fontWeight: Typography.weightSemibold, color: Colors.textPrimary },
  chevron: { fontSize: Typography.sm, color: Colors.textTertiary },
  sectionCard: { marginBottom: Spacing.sm, padding: 0, overflow: 'hidden' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.borderDefault },
  boldRow: { backgroundColor: Colors.pageBg },
  rowLabel: { fontSize: Typography.base, color: Colors.textSecondary },
  rowValue: { fontSize: Typography.base, color: Colors.textPrimary },
  boldText: { fontWeight: Typography.weightSemibold, color: Colors.textPrimary },
  tabRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.borderDefault },
  tab: { flex: 1, paddingVertical: Spacing.sm, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.brandPrimary },
  tabText: { fontSize: Typography.sm, color: Colors.textSecondary },
  tabTextActive: { color: Colors.brandPrimary, fontWeight: Typography.weightSemibold },
});
