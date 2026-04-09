import React, { useCallback, useEffect, useState } from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Spacing, Typography, Radius } from '../../constants';
import { AppText } from '../../components/common/Text';
import { Card } from '../../components/common/Card';
import { ErrorBanner } from '../../components/common/ErrorBanner';
import { useAuthStore } from '../../store/authStore';
import { dashboardApi } from '../../services/api/dashboardApi';
import type { RootStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
interface CashTx { id: string; date: string; voucherNumber: string; type: 'IN' | 'OUT'; amount: number; balance: number; narration?: string; }

export default function CashInHandScreen() {
  const navigation = useNavigation<Nav>();
  const { company } = useAuthStore();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<CashTx[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!company?.guid) return;
    setLoading(true); setError(null);
    try {
      const res = await dashboardApi.getCashBank(company.guid);
      setBalance(res.data?.cashInHand ?? 0);
      setTransactions(res.data?.cashTransactions ?? []);
    } catch (e: any) { setError(e?.message ?? 'Failed to load cash data'); }
    finally { setLoading(false); }
  }, [company?.guid]);

  useEffect(() => { fetch(); }, [fetch]);

  const fmt = (v: number) => `₹${v.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  const renderItem = ({ item }: { item: CashTx }) => (
    <View style={s.txRow}>
      <View style={s.txLeft}>
        <AppText style={s.txDate}>{new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</AppText>
        <View style={s.txInfo}>
          <AppText style={s.txNo}>{item.voucherNumber}</AppText>
          {item.narration ? <AppText style={s.txNarr} numberOfLines={1}>{item.narration}</AppText> : null}
        </View>
      </View>
      <View style={s.txRight}>
        <AppText style={[s.txAmount, { color: item.type === 'IN' ? Colors.positiveText : Colors.negativeText }]}>
          {item.type === 'IN' ? '+' : '-'}{fmt(item.amount)}
        </AppText>
        <AppText style={s.txBalance}>Bal {fmt(item.balance)}</AppText>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <AppText style={s.back}>←</AppText>
        </TouchableOpacity>
        <AppText style={s.title}>Cash in Hand</AppText>
        <View style={{ width: 44 }} />
      </View>

      {error && <ErrorBanner message={error} onRetry={fetch} />}

      <Card style={s.balCard}>
        <AppText style={s.balLabel}>Current Cash Balance</AppText>
        <AppText style={s.balValue}>{fmt(balance)}</AppText>
      </Card>

      <FlatList
        data={transactions}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        refreshing={loading}
        onRefresh={fetch}
        contentContainerStyle={s.list}
        ItemSeparatorComponent={() => <View style={s.sep} />}
        ListEmptyComponent={!loading ? <View style={s.empty}><AppText style={s.emptyText}>{error ? '' : 'No cash transactions'}</AppText></View> : null}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.pageBg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: 10, backgroundColor: Colors.cardBg, borderBottomWidth: 1, borderBottomColor: Colors.borderDefault },
  back: { fontSize: 22, color: Colors.textPrimary, marginRight: Spacing.sm },
  title: { flex: 1, fontSize: Typography.md, fontWeight: Typography.weightSemibold, textAlign: 'center' },
  balCard: { margin: Spacing.base, padding: Spacing.xl, alignItems: 'center' },
  balLabel: { fontSize: Typography.sm, color: Colors.textSecondary, marginBottom: 4 },
  balValue: { fontSize: 32, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  list: { paddingBottom: 80 },
  sep: { height: 1, backgroundColor: Colors.borderDefault },
  txRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.cardBg, paddingHorizontal: Spacing.base, paddingVertical: Spacing.md },
  txLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  txDate: { fontSize: Typography.xs, color: Colors.textTertiary, width: 40 },
  txInfo: { flex: 1 },
  txNo: { fontSize: Typography.base, fontWeight: Typography.weightMedium, color: Colors.textPrimary },
  txNarr: { fontSize: Typography.xs, color: Colors.textSecondary },
  txRight: { alignItems: 'flex-end' },
  txAmount: { fontSize: Typography.base, fontWeight: Typography.weightSemibold },
  txBalance: { fontSize: Typography.xs, color: Colors.textTertiary, marginTop: 2 },
  empty: { alignItems: 'center', paddingVertical: Spacing.xxl },
  emptyText: { fontSize: Typography.base, color: Colors.textTertiary },
});
