import React, { useCallback, useEffect, useState } from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
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
interface Receivable { id: string; partyName: string; amount: number; dueDate?: string; overdueBy?: number; }

export default function ReceivablesScreen() {
  const navigation = useNavigation<Nav>();
  const { company } = useAuthStore();
  const [items, setItems] = useState<Receivable[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetch = useCallback(async () => {
    if (!company?.guid) return;
    setLoading(true); setError(null);
    try {
      const res = await dashboardApi.getReceivablesPayables(company.guid);
      const data = res.data?.receivables ?? [];
      setItems(data);
      setTotal(data.reduce((s: number, i: Receivable) => s + i.amount, 0));
    } catch (e: any) { setError(e?.message ?? 'Failed to load receivables'); }
    finally { setLoading(false); }
  }, [company?.guid]);

  useEffect(() => { fetch(); }, [fetch]);

  const filtered = items.filter(i => !search.trim() || i.partyName.toLowerCase().includes(search.toLowerCase()));
  const fmt = (v: number) => `₹${v.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  const renderItem = ({ item }: { item: Receivable }) => (
    <TouchableOpacity style={s.row} activeOpacity={0.7} onPress={() => navigation.navigate('LedgerDetail', { ledgerId: item.id, ledgerName: item.partyName })}>
      <View style={s.rowLeft}>
        <AppText style={s.partyName}>{item.partyName}</AppText>
        {item.dueDate && <AppText style={s.dueDate}>Due: {new Date(item.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</AppText>}
      </View>
      <View style={s.rowRight}>
        <AppText style={s.amount}>{fmt(item.amount)}</AppText>
        {(item.overdueBy ?? 0) > 0 && (
          <View style={s.overdueBadge}><AppText style={s.overdueText}>{item.overdueBy}d overdue</AppText></View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}><AppText style={s.back}>←</AppText></TouchableOpacity>
        <AppText style={s.title}>Receivables</AppText>
        <View style={{ width: 44 }} />
      </View>
      {error && <ErrorBanner message={error} onRetry={fetch} />}
      <Card style={s.totalCard}><AppText style={s.totalLabel}>Total Receivable</AppText><AppText style={s.totalValue}>{fmt(total)}</AppText></Card>
      <View style={s.searchBar}>
        <AppText style={s.searchIcon}>🔍</AppText>
        <TextInput style={s.searchInput} placeholder="Search parties..." placeholderTextColor={Colors.textTertiary} value={search} onChangeText={setSearch} allowFontScaling={false} />
      </View>
      <FlatList data={filtered} keyExtractor={i => i.id} renderItem={renderItem} refreshing={loading} onRefresh={fetch} contentContainerStyle={s.list} ItemSeparatorComponent={() => <View style={s.sep} />}
        ListEmptyComponent={!loading ? <View style={s.empty}><AppText style={s.emptyText}>{error ? '' : 'No receivables'}</AppText></View> : null} />
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
  searchBar: { flexDirection: 'row', alignItems: 'center', marginHorizontal: Spacing.base, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.borderDefault, borderRadius: Radius.md, backgroundColor: Colors.cardBg, paddingHorizontal: Spacing.md, paddingVertical: 8 },
  searchIcon: { fontSize: 14, marginRight: 6 },
  searchInput: { flex: 1, fontSize: Typography.base, color: Colors.textPrimary },
  list: { paddingBottom: 80 },
  sep: { height: 1, backgroundColor: Colors.borderDefault },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.cardBg, paddingHorizontal: Spacing.base, paddingVertical: Spacing.md },
  rowLeft: { flex: 1 },
  partyName: { fontSize: Typography.base, fontWeight: Typography.weightMedium, color: Colors.textPrimary },
  dueDate: { fontSize: Typography.sm, color: Colors.textTertiary, marginTop: 2 },
  rowRight: { alignItems: 'flex-end' },
  amount: { fontSize: Typography.base, fontWeight: Typography.weightBold, color: Colors.positiveText },
  overdueBadge: { backgroundColor: Colors.negativeBg, borderRadius: Radius.full, paddingHorizontal: 6, paddingVertical: 1, marginTop: 2 },
  overdueText: { fontSize: 10, color: Colors.negativeText, fontWeight: '600' },
  empty: { alignItems: 'center', paddingVertical: Spacing.xxl },
  emptyText: { fontSize: Typography.base, color: Colors.textTertiary },
});
