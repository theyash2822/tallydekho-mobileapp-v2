import React, { useCallback, useEffect, useState } from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet, TextInput, ScrollView, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Spacing, Radius, Typography } from '../../constants';
import { AppText } from '../../components/common/Text';
import { ErrorBanner } from '../../components/common/ErrorBanner';
import { useAuthStore } from '../../store/authStore';
import { salesApi } from '../../services/api/salesApi';
import type { RootStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface EWayBill {
  id: string;
  partyName: string;
  invoiceNumber: string;
  invoiceDate: string;
  ewbNumber: string;
  status: 'generated' | 'pending' | 'cancelled' | 'expired';
  validUntil?: string;
}

const STATUS_COLOR: Record<string, string> = {
  generated: Colors.positiveText,
  pending: Colors.warningText,
  cancelled: Colors.negativeText,
  expired: Colors.textTertiary,
};
const STATUS_BG: Record<string, string> = {
  generated: Colors.positiveBg,
  pending: Colors.warningBg,
  cancelled: Colors.negativeBg,
  expired: Colors.pageBg,
};

export default function EWayBillsScreen() {
  const navigation = useNavigation<Nav>();
  const { company, selectedFY } = useAuthStore();
  const [bills, setBills] = useState<EWayBill[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const kpis = {
    generated: bills.filter(b => b.status === 'generated').length,
    pending: bills.filter(b => b.status === 'pending').length,
    cancelled: bills.filter(b => b.status === 'cancelled').length,
  };

  const fetch = useCallback(async () => {
    if (!company?.guid) return;
    setLoading(true); setError(null);
    try {
      const res = await salesApi.getEWayBills(company.guid, { fy: selectedFY, status: statusFilter === 'All' ? undefined : statusFilter });
      setBills(res.data?.data ?? res.data ?? []);
    } catch (e: any) { setError(e?.message ?? 'Failed to load E-way Bills'); }
    finally { setLoading(false); }
  }, [company?.guid, selectedFY, statusFilter]);

  useEffect(() => { fetch(); }, [fetch]);

  const filtered = bills.filter(b =>
    !search.trim() ||
    b.partyName.toLowerCase().includes(search.toLowerCase()) ||
    b.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
    b.ewbNumber.toLowerCase().includes(search.toLowerCase())
  );

  const renderItem = ({ item }: { item: EWayBill }) => (
    <TouchableOpacity style={s.card} activeOpacity={0.7}>
      <View style={s.cardTop}>
        <AppText style={s.partyName} numberOfLines={1}>{item.partyName}</AppText>
        <View style={[s.statusBadge, { backgroundColor: STATUS_BG[item.status], borderColor: STATUS_COLOR[item.status] }]}>
          <AppText style={[s.statusText, { color: STATUS_COLOR[item.status] }]}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </AppText>
        </View>
      </View>
      <View style={s.cardMid}>
        <AppText style={s.invoiceNo}>{item.invoiceNumber}</AppText>
        <AppText style={s.invoiceDate}>{new Date(item.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</AppText>
      </View>
      <AppText style={s.ewbNo}>EWB: {item.ewbNumber}</AppText>
      <View style={s.cardActions}>
        <TouchableOpacity style={s.actionBtn}>
          <AppText style={s.actionText}>Extend Validity</AppText>
        </TouchableOpacity>
        <TouchableOpacity style={[s.actionBtn, s.cancelBtn]}>
          <AppText style={[s.actionText, { color: Colors.negativeText }]}>Cancel</AppText>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}><AppText style={s.back}>←</AppText></TouchableOpacity>
        <AppText style={s.title}>E-Way Bills</AppText>
        <View style={{ width: 44 }} />
      </View>

      {/* KPI Strip */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.kpiStrip}>
        {[{ label: 'Generated', value: kpis.generated, color: Colors.positiveText }, { label: 'Pending', value: kpis.pending, color: Colors.warningText }, { label: 'Cancelled', value: kpis.cancelled, color: Colors.negativeText }].map(k => (
          <View key={k.label} style={s.kpiChip}>
            <AppText style={s.kpiValue}>{k.value}</AppText>
            <AppText style={[s.kpiLabel, { color: k.color }]}>{k.label}</AppText>
          </View>
        ))}
      </ScrollView>

      {/* Filter + Search */}
      <View style={s.filterRow}>
        {['All', 'generated', 'pending', 'cancelled'].map(f => (
          <TouchableOpacity key={f} onPress={() => setStatusFilter(f)} style={[s.filterChip, statusFilter === f && s.filterChipA]}>
            <AppText style={[s.filterText, statusFilter === f && s.filterTextA]}>{f === 'All' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}</AppText>
          </TouchableOpacity>
        ))}
      </View>

      <View style={s.searchBar}>
        <AppText style={s.searchIcon}>🔍</AppText>
        <TextInput style={s.searchInput} placeholder="Invoice #, EWB-No, Vehicle, Party" placeholderTextColor={Colors.textTertiary} value={search} onChangeText={setSearch} allowFontScaling={false} />
      </View>

      {error && <ErrorBanner message={error} onRetry={fetch} />}

      <FlatList
        data={filtered} keyExtractor={i => i.id}
        renderItem={renderItem} refreshing={loading} onRefresh={fetch}
        contentContainerStyle={s.list}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        ListEmptyComponent={!loading ? <View style={s.empty}><AppText style={s.emptyText}>{error ? '' : 'No E-way Bills found'}</AppText></View> : null}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.pageBg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: 10, backgroundColor: Colors.cardBg, borderBottomWidth: 1, borderBottomColor: Colors.borderDefault },
  back: { fontSize: 22, color: Colors.textPrimary, marginRight: Spacing.sm },
  title: { flex: 1, fontSize: Typography.md, fontWeight: Typography.weightSemibold, textAlign: 'center' },
  kpiStrip: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, gap: Spacing.sm },
  kpiChip: { backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.borderDefault, borderRadius: Radius.md, paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, alignItems: 'center', minWidth: 90 },
  kpiValue: { fontSize: Typography.xl, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  kpiLabel: { fontSize: Typography.xs, fontWeight: Typography.weightMedium, marginTop: 2 },
  filterRow: { flexDirection: 'row', paddingHorizontal: Spacing.base, paddingBottom: Spacing.sm, gap: Spacing.sm },
  filterChip: { paddingHorizontal: Spacing.md, paddingVertical: 5, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.borderDefault, backgroundColor: Colors.cardBg },
  filterChipA: { backgroundColor: Colors.brandPrimary, borderColor: Colors.brandPrimary },
  filterText: { fontSize: Typography.xs, color: Colors.textSecondary },
  filterTextA: { color: Colors.white, fontWeight: Typography.weightSemibold },
  searchBar: { flexDirection: 'row', alignItems: 'center', marginHorizontal: Spacing.base, marginBottom: Spacing.sm, paddingHorizontal: Spacing.md, paddingVertical: 8, borderWidth: 1, borderColor: Colors.borderDefault, borderRadius: Radius.md, backgroundColor: Colors.cardBg },
  searchIcon: { fontSize: 14, marginRight: 6 },
  searchInput: { flex: 1, fontSize: Typography.base, color: Colors.textPrimary },
  list: { paddingHorizontal: Spacing.base, paddingBottom: 80 },
  card: { backgroundColor: Colors.cardBg, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.borderDefault, padding: Spacing.base },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  partyName: { flex: 1, fontSize: Typography.base, fontWeight: Typography.weightSemibold, color: Colors.textPrimary, marginRight: Spacing.sm },
  statusBadge: { borderWidth: 1, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  statusText: { fontSize: 11, fontWeight: '600' },
  cardMid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  invoiceNo: { fontSize: Typography.sm, color: Colors.textSecondary },
  invoiceDate: { fontSize: Typography.sm, color: Colors.textTertiary },
  ewbNo: { fontSize: Typography.xs, color: Colors.textTertiary, marginBottom: Spacing.sm },
  cardActions: { flexDirection: 'row', gap: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.borderDefault, paddingTop: Spacing.sm },
  actionBtn: { flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.borderDefault },
  cancelBtn: { borderColor: Colors.negativeText },
  actionText: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.weightMedium },
  empty: { alignItems: 'center', paddingVertical: Spacing.xxl },
  emptyText: { fontSize: Typography.base, color: Colors.textTertiary },
});
