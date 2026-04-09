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

interface BankAccount { id: string; name: string; balance: number; accountNumber?: string; bankName?: string; }

export default function BankBalanceScreen() {
  const navigation = useNavigation<Nav>();
  const { company } = useAuthStore();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!company?.guid) return;
    setLoading(true); setError(null);
    try {
      const res = await dashboardApi.getCashBank(company.guid);
      const data = res.data?.bankAccounts ?? [];
      setAccounts(data);
      setTotalBalance(data.reduce((s: number, a: BankAccount) => s + a.balance, 0));
    } catch (e: any) { setError(e?.message ?? 'Failed to load bank balances'); }
    finally { setLoading(false); }
  }, [company?.guid]);

  useEffect(() => { fetch(); }, [fetch]);

  const fmt = (v: number) => `₹${v.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <AppText style={s.back}>←</AppText>
        </TouchableOpacity>
        <AppText style={s.title}>Bank Balances</AppText>
        <View style={{ width: 44 }} />
      </View>

      {error && <ErrorBanner message={error} onRetry={fetch} />}

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Card style={s.totalCard}>
          <AppText style={s.totalLabel}>Total Balance</AppText>
          <AppText style={s.totalValue}>{fmt(totalBalance)}</AppText>
        </Card>

        <AppText style={s.sectionLabel}>Accounts</AppText>
        {accounts.length === 0 && !loading ? (
          <View style={s.empty}><AppText style={s.emptyText}>{error ? '' : 'No bank accounts found'}</AppText></View>
        ) : (
          accounts.map(acc => (
            <Card key={acc.id} onPress={() => navigation.navigate('BankAccountDetail', { accountId: acc.id })} style={s.accCard}>
              <View style={s.accRow}>
                <View style={s.accIconWrap}><AppText style={s.accIcon}>🏦</AppText></View>
                <View style={s.accInfo}>
                  <AppText style={s.accName}>{acc.name}</AppText>
                  {acc.bankName && <AppText style={s.accBank}>{acc.bankName}{acc.accountNumber ? ` •••• ${acc.accountNumber.slice(-4)}` : ''}</AppText>}
                </View>
                <AppText style={[s.accBalance, { color: acc.balance >= 0 ? Colors.positiveText : Colors.negativeText }]}>
                  {fmt(acc.balance)}
                </AppText>
              </View>
            </Card>
          ))
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
  totalCard: { padding: Spacing.xl, alignItems: 'center', marginBottom: Spacing.base },
  totalLabel: { fontSize: Typography.sm, color: Colors.textSecondary, marginBottom: 4 },
  totalValue: { fontSize: 32, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  sectionLabel: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.sm },
  accCard: { marginBottom: Spacing.sm, padding: Spacing.base },
  accRow: { flexDirection: 'row', alignItems: 'center' },
  accIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.pageBg, borderWidth: 1, borderColor: Colors.borderDefault, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  accIcon: { fontSize: 20 },
  accInfo: { flex: 1 },
  accName: { fontSize: Typography.base, fontWeight: Typography.weightSemibold, color: Colors.textPrimary },
  accBank: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  accBalance: { fontSize: Typography.base, fontWeight: Typography.weightBold },
  empty: { alignItems: 'center', paddingVertical: Spacing.xxl },
  emptyText: { fontSize: Typography.base, color: Colors.textTertiary },
});
