import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet, TextInput, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Spacing, Radius, Typography } from '../../constants';
import { AppText } from '../../components/common/Text';
import { ErrorBanner } from '../../components/common/ErrorBanner';
import { useAuthStore } from '../../store/authStore';
import { salesApi } from '../../services/api/salesApi';
import type { Invoice, RootStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type StatusFilter = 'All' | 'Paid' | 'Unpaid' | 'Partial';

const STATUS_COLOR: Record<string, string> = {
  paid: Colors.positiveText,
  unpaid: Colors.negativeText,
  partial: Colors.warningText,
  draft: Colors.textTertiary,
};

export default function PurchaseRegisterScreen() {
  const nav = useNavigation<Nav>();
  const { company } = useAuthStore();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [kpis, setKpis] = useState({ total: 0, tax: 0, avg: 0, count: 0 });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const timer = useRef<any>(null);

  const fetch = useCallback(async (q = search, status = statusFilter) => {
    if (!company?.guid) return;
    setLoading(true); setError(null);
    try {
      const res = await salesApi.getPurchases(company.guid, { search: q, status: status === 'All' ? undefined : status.toLowerCase() });
      const data: Invoice[] = res.data?.data ?? res.data ?? [];
      setInvoices(data);
      const total = data.reduce((s, i) => s + i.amount, 0);
      setKpis({ total, tax: data.reduce((s, i) => s + (i.taxes?.total ?? 0), 0), avg: data.length ? total / data.length : 0, count: data.length });
    } catch (e: any) { setError(e?.message ?? 'Failed to load purchases'); }
    finally { setLoading(false); }
  }, [company?.guid, statusFilter]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleSearch = (t: string) => {
    setSearch(t);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => fetch(t), 400);
  };

  const fmt = (v: number) => v >= 100000 ? `₹${(v / 100000).toFixed(2)}L` : `₹${v.toLocaleString('en-IN')}`;

  const renderItem = ({ item }: { item: Invoice }) => {
    const sel = selectedIds.includes(item.id);
    return (
      <TouchableOpacity
        onPress={() => sel ? setSelectedIds(p => p.filter(x => x !== item.id)) : selectedIds.length > 0 ? setSelectedIds(p => [...p, item.id]) : null}
        onLongPress={() => setSelectedIds(p => [...p, item.id])}
        activeOpacity={0.7}
        style={[s.row, sel && s.rowSel]}
      >
        <View style={s.rLeft}>
          <AppText style={s.rDate}>{new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</AppText>
          <View style={s.rInfo}>
            <AppText style={s.rNo}>{item.voucherNumber}</AppText>
            <AppText style={s.rParty} numberOfLines={1}>{item.partyName}</AppText>
          </View>
        </View>
        <View style={s.rRight}>
          <AppText style={s.rAmt}>{fmt(item.amount)}</AppText>
          <View style={[s.badge, { borderColor: STATUS_COLOR[item.status] }]}>
            <AppText style={[s.badgeT, { color: STATUS_COLOR[item.status] }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </AppText>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => nav.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}><AppText style={s.back}>←</AppText></TouchableOpacity>
        <AppText style={s.title}>Purchase Register</AppText>
        <View style={{ width: 44 }} />
      </View>
      <View style={s.kpiRow}>
        {[{ label: 'Total', value: fmt(kpis.total) }, { label: 'Tax', value: fmt(kpis.tax) }, { label: 'Avg', value: fmt(kpis.avg) }, { label: 'Docs', value: String(kpis.count) }].map(k => (
          <View key={k.label} style={s.kpiItem}><AppText style={s.kpiLbl}>{k.label}</AppText><AppText style={s.kpiVal}>{k.value}</AppText></View>
        ))}
      </View>
      <View style={s.searchRow}>
        <View style={s.searchBar}><AppText style={s.searchIcon}>🔍</AppText><TextInput style={s.searchInput} placeholder="Search by vendor or invoice #" placeholderTextColor={Colors.textTertiary} value={search} onChangeText={handleSearch} allowFontScaling={false} /></View>
      </View>
      <View style={s.filterRow}>
        {(['All', 'Paid', 'Unpaid', 'Partial'] as StatusFilter[]).map(f => (
          <TouchableOpacity key={f} onPress={() => { setStatusFilter(f); fetch(search, f); }} style={[s.fChip, statusFilter === f && s.fChipA]}>
            <AppText style={[s.fText, statusFilter === f && s.fTextA]}>{f}</AppText>
          </TouchableOpacity>
        ))}
      </View>
      {error && <ErrorBanner message={error} onRetry={() => fetch()} />}
      {selectedIds.length > 0 && (
        <View style={s.fab}>
          <TouchableOpacity onPress={async () => { await Share.share({ message: `Sharing ${selectedIds.length} purchase invoices` }); }} style={s.fabBtn}><AppText style={s.fabT}>↗ Share ({selectedIds.length})</AppText></TouchableOpacity>
          <TouchableOpacity onPress={() => setSelectedIds([])} style={s.fabClose}><AppText style={s.fabCloseT}>✕</AppText></TouchableOpacity>
        </View>
      )}
      <FlatList
        data={invoices} keyExtractor={i => i.id} renderItem={renderItem}
        refreshing={loading} onRefresh={() => fetch()} contentContainerStyle={s.list}
        ItemSeparatorComponent={() => <View style={s.sep} />}
        ListEmptyComponent={!loading ? <View style={s.empty}><AppText style={s.emptyT}>{error ? '' : 'No purchases found'}</AppText></View> : null}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.pageBg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: 10, backgroundColor: Colors.cardBg, borderBottomWidth: 1, borderBottomColor: Colors.borderDefault },
  back: { fontSize: 22, color: Colors.textPrimary, marginRight: Spacing.sm },
  title: { flex: 1, fontSize: Typography.md, fontWeight: Typography.weightSemibold },
  kpiRow: { flexDirection: 'row', backgroundColor: Colors.cardBg, borderBottomWidth: 1, borderBottomColor: Colors.borderDefault },
  kpiItem: { flex: 1, alignItems: 'center', paddingVertical: Spacing.sm },
  kpiLbl: { fontSize: Typography.xs, color: Colors.textTertiary },
  kpiVal: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: Colors.textPrimary },
  searchRow: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.borderDefault, borderRadius: Radius.md, backgroundColor: Colors.cardBg, paddingHorizontal: Spacing.md, paddingVertical: 8 },
  searchIcon: { fontSize: 14, marginRight: 6 },
  searchInput: { flex: 1, fontSize: Typography.base, color: Colors.textPrimary },
  filterRow: { flexDirection: 'row', paddingHorizontal: Spacing.base, paddingBottom: Spacing.sm, gap: Spacing.sm },
  fChip: { paddingHorizontal: Spacing.md, paddingVertical: 5, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.borderDefault, backgroundColor: Colors.cardBg },
  fChipA: { backgroundColor: Colors.brandPrimary, borderColor: Colors.brandPrimary },
  fText: { fontSize: Typography.xs, color: Colors.textSecondary },
  fTextA: { color: Colors.white, fontWeight: Typography.weightSemibold },
  list: { paddingBottom: 80 },
  sep: { height: 1, backgroundColor: Colors.borderDefault },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.cardBg, paddingHorizontal: Spacing.base, paddingVertical: Spacing.md },
  rowSel: { backgroundColor: Colors.activeBg },
  rLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  rDate: { fontSize: Typography.xs, color: Colors.textTertiary, width: 36, textAlign: 'center' },
  rInfo: { flex: 1 },
  rNo: { fontSize: Typography.base, fontWeight: Typography.weightMedium, color: Colors.textPrimary },
  rParty: { fontSize: Typography.sm, color: Colors.textSecondary },
  rRight: { alignItems: 'flex-end', gap: 2 },
  rAmt: { fontSize: Typography.base, fontWeight: Typography.weightSemibold, color: Colors.textPrimary },
  badge: { borderWidth: 1, borderRadius: Radius.full, paddingHorizontal: 6, paddingVertical: 1 },
  badgeT: { fontSize: 10, fontWeight: '600' },
  fab: { flexDirection: 'row', margin: Spacing.sm, borderRadius: Radius.md, backgroundColor: Colors.brandPrimary, overflow: 'hidden' },
  fabBtn: { flex: 1, paddingVertical: Spacing.md, alignItems: 'center' },
  fabT: { color: Colors.white, fontWeight: Typography.weightSemibold },
  fabClose: { paddingHorizontal: Spacing.base, alignItems: 'center', justifyContent: 'center', borderLeftWidth: 1, borderLeftColor: Colors.brandHover },
  fabCloseT: { color: Colors.white, fontSize: 16 },
  empty: { alignItems: 'center', paddingVertical: Spacing.xxl },
  emptyT: { fontSize: Typography.base, color: Colors.textTertiary },
});
