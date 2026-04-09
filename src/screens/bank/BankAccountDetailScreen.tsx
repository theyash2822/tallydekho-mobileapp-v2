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
import apiClient from '../../services/api/client';
import type { RootStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'BankAccountDetail'>;

interface BankTx { id: string; date: string; description: string; amount: number; type: 'credit' | 'debit'; balance: number; refNo?: string; }

export default function BankAccountDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { accountId } = route.params;
  const { company } = useAuthStore();
  const [account, setAccount] = useState<any>(null);
  const [transactions, setTransactions] = useState<BankTx[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!company?.guid) return;
    setLoading(true); setError(null);
    try {
      const res = await apiClient.get(`/bank-accounts/${accountId}`, { params: { companyGuid: company.guid } });
      setAccount(res.data?.account ?? res.data);
      setTransactions(res.data?.transactions ?? []);
    } catch (e: any) { setError(e?.message ?? 'Failed to load account'); }
    finally { setLoading(false); }
  }, [company?.guid, accountId]);

  useEffect(() => { fetch(); }, [fetch]);

  const fmt = (v: number) => `₹${v.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}><AppText style={s.back}>←</AppText></TouchableOpacity>
        <AppText style={s.title} numberOfLines={1}>{account?.name ?? 'Account Detail'}</AppText>
        <View style={{ width: 44 }} />
      </View>
      {error && <ErrorBanner message={error} onRetry={fetch} />}
      {account && (
        <Card style={s.summaryCard}>
          <AppText style={s.balLabel}>Total Balance</AppText>
          <AppText style={s.balValue}>{fmt(account.balance ?? 0)}</AppText>
          {account.accountNumber && <AppText style={s.accNo}>A/C: •••• {account.accountNumber.slice(-4)}</AppText>}
          {account.bankName && <AppText style={s.bankName}>{account.bankName} {account.ifsc ? `· ${account.ifsc}` : ''}</AppText>}
        </Card>
      )}
      <FlatList
        data={transactions} keyExtractor={i => i.id}
        renderItem={({ item }) => (
          <View style={s.txRow}>
            <View style={s.txLeft}>
              <AppText style={s.txDate}>{new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</AppText>
              <View style={s.txInfo}>
                <AppText style={s.txDesc} numberOfLines={1}>{item.description}</AppText>
                {item.refNo && <AppText style={s.txRef}>Ref: {item.refNo}</AppText>}
              </View>
            </View>
            <View style={s.txRight}>
              <AppText style={[s.txAmt, { color: item.type === 'credit' ? Colors.positiveText : Colors.negativeText }]}>
                {item.type === 'credit' ? '+' : '-'}{fmt(item.amount)}
              </AppText>
              <AppText style={s.txBal}>Bal {fmt(item.balance)}</AppText>
            </View>
          </View>
        )}
        refreshing={loading} onRefresh={fetch} contentContainerStyle={s.list}
        ItemSeparatorComponent={() => <View style={s.sep} />}
        ListEmptyComponent={!loading ? <View style={s.empty}><AppText style={s.emptyText}>{error ? '' : 'No transactions'}</AppText></View> : null}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.pageBg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: 10, backgroundColor: Colors.cardBg, borderBottomWidth: 1, borderBottomColor: Colors.borderDefault },
  back: { fontSize: 22, color: Colors.textPrimary, marginRight: Spacing.sm },
  title: { flex: 1, fontSize: Typography.md, fontWeight: Typography.weightSemibold, textAlign: 'center' },
  summaryCard: { margin: Spacing.base, padding: Spacing.xl, alignItems: 'center' },
  balLabel: { fontSize: Typography.sm, color: Colors.textSecondary, marginBottom: 4 },
  balValue: { fontSize: 32, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  accNo: { fontSize: Typography.sm, color: Colors.textTertiary, marginTop: 4 },
  bankName: { fontSize: Typography.sm, color: Colors.textTertiary },
  list: { paddingBottom: 80 },
  sep: { height: 1, backgroundColor: Colors.borderDefault },
  txRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.cardBg, paddingHorizontal: Spacing.base, paddingVertical: Spacing.md },
  txLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  txDate: { fontSize: Typography.xs, color: Colors.textTertiary, width: 40 },
  txInfo: { flex: 1 },
  txDesc: { fontSize: Typography.base, fontWeight: Typography.weightMedium, color: Colors.textPrimary },
  txRef: { fontSize: Typography.xs, color: Colors.textTertiary, marginTop: 2 },
  txRight: { alignItems: 'flex-end' },
  txAmt: { fontSize: Typography.base, fontWeight: Typography.weightBold },
  txBal: { fontSize: Typography.xs, color: Colors.textTertiary, marginTop: 2 },
  empty: { alignItems: 'center', paddingVertical: Spacing.xxl },
  emptyText: { fontSize: Typography.base, color: Colors.textTertiary },
});
