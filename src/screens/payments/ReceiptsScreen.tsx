import React, { useCallback, useEffect, useState } from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Spacing, Typography } from '../../constants';
import { AppText } from '../../components/common/Text';
import { Card } from '../../components/common/Card';
import { ErrorBanner } from '../../components/common/ErrorBanner';
import { useAuthStore } from '../../store/authStore';
import { dashboardApi } from '../../services/api/dashboardApi';
import type { RootStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
interface ReceiptEntry { id: string; date: string; partyName: string; amount: number; mode: string; voucherNumber: string; }

export default function ReceiptsScreen() {
  const navigation = useNavigation<Nav>();
  const { company } = useAuthStore();
  const [items, setItems] = useState<ReceiptEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!company?.guid) return;
    setLoading(true); setError(null);
    try {
      const res = await dashboardApi.getReceivablesPayables(company.guid);
      const data = res.data?.receipts ?? [];
      setItems(data);
      setTotal(data.reduce((s: number, i: ReceiptEntry) => s + i.amount, 0));
    } catch (e: any) { setError(e?.message ?? 'Failed to load receipts'); }
    finally { setLoading(false); }
  }, [company?.guid]);

  useEffect(() => { fetch(); }, [fetch]);

  const fmt = (v: number) => `₹${v.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}><AppText style={s.back}>←</AppText></TouchableOpacity>
        <AppText style={s.title}>Receipts</AppText>
        <View style={{ width: 44 }} />
      </View>
      {error && <ErrorBanner message={error} onRetry={fetch} />}
      <Card style={s.totalCard}><AppText style={s.totalLabel}>Total Receipts</AppText><AppText style={s.totalValue}>{fmt(total)}</AppText></Card>
      <FlatList
        data={items} keyExtractor={i => i.id}
        renderItem={({ item }) => (
          <View style={s.row}>
            <View style={s.left}>
              <AppText style={s.date}>{new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</AppText>
              <View style={s.info}><AppText style={s.party}>{item.partyName}</AppText><AppText style={s.voucher}>{item.voucherNumber} · {item.mode}</AppText></View>
            </View>
            <AppText style={s.amount}>{fmt(item.amount)}</AppText>
          </View>
        )}
        refreshing={loading} onRefresh={fetch} contentContainerStyle={s.list}
        ItemSeparatorComponent={() => <View style={s.sep} />}
        ListEmptyComponent={!loading ? <View style={s.empty}><AppText style={s.emptyText}>{error ? '' : 'No receipts found'}</AppText></View> : null}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.pageBg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: 10, backgroundColor: Colors.cardBg, borderBottomWidth: 1, borderBottomColor: Colors.borderDefault },
  back: { fontSize: 22, color: Colors.textPrimary, marginRight: Spacing.sm },
  title: { flex: 1, fontSize: Typography.md, fontWeight: Typography.weightSemibold, textAlign: 'center' },
  totalCard: { margin: Spacing.base, padding: Spacing.xl, alignItems: 'center' },
  totalLabel: { fontSize: Typography.sm, color: Colors.textSecondary, marginBottom: 4 },
  totalValue: { fontSize: 32, fontWeight: Typography.weightBold, color: Colors.positiveText },
  list: { paddingBottom: 80 },
  sep: { height: 1, backgroundColor: Colors.borderDefault },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.cardBg, paddingHorizontal: Spacing.base, paddingVertical: Spacing.md },
  left: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  date: { fontSize: Typography.xs, color: Colors.textTertiary, width: 40 },
  info: { flex: 1 },
  party: { fontSize: Typography.base, fontWeight: Typography.weightMedium, color: Colors.textPrimary },
  voucher: { fontSize: Typography.xs, color: Colors.textTertiary, marginTop: 2 },
  amount: { fontSize: Typography.base, fontWeight: Typography.weightBold, color: Colors.positiveText },
  empty: { alignItems: 'center', paddingVertical: Spacing.xxl },
  emptyText: { fontSize: Typography.base, color: Colors.textTertiary },
});
