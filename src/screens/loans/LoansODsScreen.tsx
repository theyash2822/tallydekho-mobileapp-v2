import React, { useCallback, useEffect, useState } from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Spacing, Radius, Typography } from '../../constants';
import { AppText } from '../../components/common/Text';
import { Card } from '../../components/common/Card';
import { ErrorBanner } from '../../components/common/ErrorBanner';
import { useAuthStore } from '../../store/authStore';
import { dashboardApi } from '../../services/api/dashboardApi';
import type { RootStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
interface LoanAccount { id: string; name: string; principal: number; utilised: number; available: number; type: 'loan' | 'od' | 'cc'; interestRate?: number; }

export default function LoansODsScreen() {
  const navigation = useNavigation<Nav>();
  const { company } = useAuthStore();
  const [accounts, setAccounts] = useState<LoanAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!company?.guid) return;
    setLoading(true); setError(null);
    try {
      const res = await dashboardApi.getLoans(company.guid);
      setAccounts(res.data?.accounts ?? res.data?.data ?? []);
    } catch (e: any) { setError(e?.message ?? 'Failed to load loans'); }
    finally { setLoading(false); }
  }, [company?.guid]);

  useEffect(() => { fetch(); }, [fetch]);

  const fmt = (v: number) => v >= 1_00_000 ? `₹${(v / 1_00_000).toFixed(2)}L` : `₹${v.toLocaleString('en-IN')}`;
  const totalPrincipal = accounts.reduce((s, a) => s + a.principal, 0);
  const totalUtilised = accounts.reduce((s, a) => s + a.utilised, 0);

  const TYPE_LABEL: Record<string, string> = { loan: 'Loan', od: 'OD', cc: 'CC' };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}><AppText style={s.back}>←</AppText></TouchableOpacity>
        <AppText style={s.title}>Loans & ODs</AppText>
        <View style={{ width: 44 }} />
      </View>
      {error && <ErrorBanner message={error} onRetry={fetch} />}

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Summary */}
        <View style={s.summaryRow}>
          <Card style={s.summaryCard}>
            <AppText style={s.summaryLabel}>Total Principal</AppText>
            <AppText style={s.summaryValue}>{fmt(totalPrincipal)}</AppText>
          </Card>
          <Card style={s.summaryCard}>
            <AppText style={s.summaryLabel}>Utilised</AppText>
            <AppText style={[s.summaryValue, { color: Colors.negativeText }]}>{fmt(totalUtilised)}</AppText>
          </Card>
        </View>

        {accounts.length === 0 && !loading ? (
          <View style={s.empty}><AppText style={s.emptyText}>{error ? '' : 'No loan accounts found'}</AppText></View>
        ) : (
          accounts.map(acc => {
            const usedPct = acc.principal > 0 ? (acc.utilised / acc.principal) * 100 : 0;
            return (
              <Card key={acc.id} onPress={() => navigation.navigate('LedgerDetail', { ledgerId: acc.id, ledgerName: acc.name })} style={s.accCard}>
                <View style={s.accHeader}>
                  <View style={s.accTypeWrap}><AppText style={s.accType}>{TYPE_LABEL[acc.type] ?? 'Loan'}</AppText></View>
                  <AppText style={s.accName} numberOfLines={1}>{acc.name}</AppText>
                  {acc.interestRate && <AppText style={s.accRate}>{acc.interestRate}% p.a.</AppText>}
                </View>
                <View style={s.accAmounts}>
                  <View><AppText style={s.amtLabel}>Principal</AppText><AppText style={s.amtValue}>{fmt(acc.principal)}</AppText></View>
                  <View><AppText style={s.amtLabel}>Utilised</AppText><AppText style={[s.amtValue, { color: Colors.negativeText }]}>{fmt(acc.utilised)}</AppText></View>
                  <View><AppText style={s.amtLabel}>Available</AppText><AppText style={[s.amtValue, { color: Colors.positiveText }]}>{fmt(acc.available)}</AppText></View>
                </View>
                {/* Progress bar */}
                <View style={s.progressBg}>
                  <View style={[s.progressFill, { width: `${Math.min(usedPct, 100)}%`, backgroundColor: usedPct > 80 ? Colors.negativeText : usedPct > 60 ? Colors.warningText : Colors.positiveText }]} />
                </View>
                <AppText style={s.progressLabel}>{usedPct.toFixed(0)}% utilised</AppText>
              </Card>
            );
          })
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
  title: { flex: 1, fontSize: Typography.md, fontWeight: Typography.weightSemibold, textAlign: 'center' },
  content: { padding: Spacing.base },
  summaryRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.base },
  summaryCard: { flex: 1, padding: Spacing.base, alignItems: 'center' },
  summaryLabel: { fontSize: Typography.xs, color: Colors.textSecondary, marginBottom: 4 },
  summaryValue: { fontSize: Typography.lg, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  accCard: { marginBottom: Spacing.sm, padding: Spacing.base },
  accHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm, gap: Spacing.sm },
  accTypeWrap: { backgroundColor: Colors.pageBg, borderWidth: 1, borderColor: Colors.borderDefault, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  accType: { fontSize: 10, fontWeight: '700', color: Colors.textSecondary },
  accName: { flex: 1, fontSize: Typography.base, fontWeight: Typography.weightSemibold, color: Colors.textPrimary },
  accRate: { fontSize: Typography.xs, color: Colors.textTertiary },
  accAmounts: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  amtLabel: { fontSize: Typography.xs, color: Colors.textTertiary, marginBottom: 2 },
  amtValue: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: Colors.textPrimary },
  progressBg: { height: 6, backgroundColor: Colors.borderDefault, borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  progressFill: { height: 6, borderRadius: 3 },
  progressLabel: { fontSize: Typography.xs, color: Colors.textTertiary, textAlign: 'right' },
  empty: { alignItems: 'center', paddingVertical: Spacing.xxl },
  emptyText: { fontSize: Typography.base, color: Colors.textTertiary },
});
