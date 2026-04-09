import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, FlatList, TouchableOpacity, StyleSheet, TextInput, Share,
} from 'react-native';
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
const STATUS_FILTERS: StatusFilter[] = ['All', 'Paid', 'Unpaid', 'Partial'];

const STATUS_COLOR: Record<string, string> = {
  paid: Colors.positiveText,
  unpaid: Colors.negativeText,
  partial: Colors.warningText,
  draft: Colors.textTertiary,
};

export default function SalesRegisterScreen() {
  const navigation = useNavigation<Nav>();
  const { company, selectedFY } = useAuthStore();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [kpis, setKpis] = useState({ total: 0, tax: 0, avg: 0, count: 0 });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const searchTimer = useRef<any>(null);

  const fetch = useCallback(async (q = search, status = statusFilter) => {
    if (!company?.guid) return;
    setLoading(true); setError(null);
    try {
      const res = await salesApi.getSales(company.guid, {
        search: q,
        status: status === 'All' ? undefined : status.toLowerCase(),
      });
      const data: Invoice[] = res.data?.data ?? res.data ?? [];
      setInvoices(data);
      const total = data.reduce((s, i) => s + i.amount, 0);
      const tax = data.reduce((s, i) => s + (i.taxes?.total ?? 0), 0);
      setKpis({ total, tax, avg: data.length ? total / data.length : 0, count: data.length });
    } catch (e: any) { setError(e?.message ?? 'Failed to load sales'); }
    finally { setLoading(false); }
  }, [company?.guid, statusFilter]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleSearch = (text: string) => {
    setSearch(text);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetch(text), 400);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleBulkShare = async () => {
    await Share.share({ message: `Sharing ${selectedIds.length} sales invoices` });
  };

  const fmt = (v: number) => v >= 1_00_000 ? `₹${(v / 1_00_000).toFixed(2)}L` : `₹${v.toLocaleString('en-IN')}`;

  const renderInvoice = ({ item }: { item: Invoice }) => {
    const isSelected = selectedIds.includes(item.id);
    return (
      <TouchableOpacity
        onPress={() => selectedIds.length > 0 ? toggleSelect(item.id) : navigation.navigate('InvoiceDetail', { voucherId: item.id })}
        onLongPress={() => toggleSelect(item.id)}
        activeOpacity={0.7}
        style={[s.invoiceRow, isSelected && s.invoiceRowSelected]}
      >
        {isSelected && <View style={s.selectedIndicator} />}
        <View style={s.invoiceLeft}>
          <AppText style={s.invoiceDate}>
            {new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
          </AppText>
          <View style={s.invoiceInfo}>
            <AppText style={s.invoiceNo}>{item.voucherNumber}</AppText>
            <AppText style={s.invoiceParty} numberOfLines={1}>{item.partyName}</AppText>
          </View>
        </View>
        <View style={s.invoiceRight}>
          <AppText style={s.invoiceAmount}>{fmt(item.amount)}</AppText>
          <View style={[s.statusBadge, { borderColor: STATUS_COLOR[item.status] }]}>
            <AppText style={[s.statusText, { color: STATUS_COLOR[item.status] }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </AppText>
          </View>
          {item.irnStatus === 'pending' && (
            <AppText style={s.irnBadge}>IRN✗</AppText>
          )}
        </View>
        {/* Swipe hint */}
        <TouchableOpacity
          style={s.shareAction}
          onPress={async () => await Share.share({ message: `Invoice ${item.voucherNumber}` })}
        >
          <AppText style={s.shareActionText}>↗</AppText>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <AppText style={s.back}>←</AppText>
        </TouchableOpacity>
        <AppText style={s.headerTitle}>Sales Register</AppText>
        <TouchableOpacity onPress={() => navigation.navigate('EWayBills')} style={s.ewayBtn}>
          <AppText style={s.ewayText}>E-Way</AppText>
        </TouchableOpacity>
      </View>

      {/* KPI Row */}
      <View style={s.kpiRow}>
        {[
          { label: 'Total', value: fmt(kpis.total) },
          { label: 'Tax', value: fmt(kpis.tax) },
          { label: 'Avg', value: fmt(kpis.avg) },
          { label: 'Docs', value: String(kpis.count) },
        ].map(k => (
          <View key={k.label} style={s.kpiItem}>
            <AppText style={s.kpiLabel}>{k.label}</AppText>
            <AppText style={s.kpiValue}>{k.value}</AppText>
          </View>
        ))}
      </View>

      {/* Search */}
      <View style={s.searchRow}>
        <View style={s.searchBar}>
          <AppText style={s.searchIcon}>🔍</AppText>
          <TextInput
            style={s.searchInput}
            placeholder="Search by party or invoice #"
            placeholderTextColor={Colors.textTertiary}
            value={search} onChangeText={handleSearch}
            allowFontScaling={false}
          />
        </View>
      </View>

      {/* Status filters */}
      <View style={s.filterRow}>
        {STATUS_FILTERS.map(f => (
          <TouchableOpacity key={f} onPress={() => { setStatusFilter(f); fetch(search, f); }}
            style={[s.filterChip, statusFilter === f && s.filterChipActive]}>
            <AppText style={[s.filterText, statusFilter === f && s.filterTextActive]}>{f}</AppText>
          </TouchableOpacity>
        ))}
      </View>

      {error && <ErrorBanner message={error} onRetry={() => fetch()} />}

      {/* Multi-select FAB */}
      {selectedIds.length > 0 && (
        <View style={s.multiFab}>
          <TouchableOpacity onPress={handleBulkShare} style={s.multiFabBtn}>
            <AppText style={s.multiFabText}>↗ Share ({selectedIds.length})</AppText>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSelectedIds([])} style={s.multiFabClose}>
            <AppText style={s.multiFabCloseText}>✕</AppText>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={invoices}
        keyExtractor={i => i.id}
        renderItem={renderInvoice}
        refreshing={loading}
        onRefresh={() => fetch()}
        contentContainerStyle={s.list}
        ItemSeparatorComponent={() => <View style={s.sep} />}
        ListEmptyComponent={
          !loading ? <View style={s.empty}><AppText style={s.emptyText}>{error ? '' : 'No invoices found'}</AppText></View> : null
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.pageBg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: 10, backgroundColor: Colors.cardBg, borderBottomWidth: 1, borderBottomColor: Colors.borderDefault },
  back: { fontSize: 22, color: Colors.textPrimary, marginRight: Spacing.sm },
  headerTitle: { flex: 1, fontSize: Typography.md, fontWeight: Typography.weightSemibold },
  ewayBtn: { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderWidth: 1, borderColor: Colors.borderDefault, borderRadius: Radius.sm },
  ewayText: { fontSize: Typography.xs, color: Colors.textSecondary },
  kpiRow: { flexDirection: 'row', backgroundColor: Colors.cardBg, borderBottomWidth: 1, borderBottomColor: Colors.borderDefault },
  kpiItem: { flex: 1, alignItems: 'center', paddingVertical: Spacing.sm },
  kpiLabel: { fontSize: Typography.xs, color: Colors.textTertiary },
  kpiValue: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: Colors.textPrimary },
  searchRow: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.borderDefault, borderRadius: Radius.md, backgroundColor: Colors.cardBg, paddingHorizontal: Spacing.md, paddingVertical: 8 },
  searchIcon: { fontSize: 14, marginRight: 6 },
  searchInput: { flex: 1, fontSize: Typography.base, color: Colors.textPrimary },
  filterRow: { flexDirection: 'row', paddingHorizontal: Spacing.base, paddingBottom: Spacing.sm, gap: Spacing.sm },
  filterChip: { paddingHorizontal: Spacing.md, paddingVertical: 5, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.borderDefault, backgroundColor: Colors.cardBg },
  filterChipActive: { backgroundColor: Colors.brandPrimary, borderColor: Colors.brandPrimary },
  filterText: { fontSize: Typography.xs, color: Colors.textSecondary },
  filterTextActive: { color: Colors.white, fontWeight: Typography.weightSemibold },
  list: { paddingBottom: 80 },
  sep: { height: 1, backgroundColor: Colors.borderDefault },
  invoiceRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.cardBg, paddingHorizontal: Spacing.base, paddingVertical: Spacing.md },
  invoiceRowSelected: { backgroundColor: Colors.activeBg },
  selectedIndicator: { width: 3, height: '100%', backgroundColor: Colors.brandPrimary, position: 'absolute', left: 0 },
  invoiceLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  invoiceDate: { fontSize: Typography.xs, color: Colors.textTertiary, width: 36, textAlign: 'center' },
  invoiceInfo: { flex: 1 },
  invoiceNo: { fontSize: Typography.base, fontWeight: Typography.weightMedium, color: Colors.textPrimary },
  invoiceParty: { fontSize: Typography.sm, color: Colors.textSecondary },
  invoiceRight: { alignItems: 'flex-end', gap: 2 },
  invoiceAmount: { fontSize: Typography.base, fontWeight: Typography.weightSemibold, color: Colors.textPrimary },
  statusBadge: { borderWidth: 1, borderRadius: Radius.full, paddingHorizontal: 6, paddingVertical: 1 },
  statusText: { fontSize: 10, fontWeight: '600' },
  irnBadge: { fontSize: 10, color: Colors.warningText, backgroundColor: Colors.warningBg, paddingHorizontal: 4, borderRadius: 4 },
  shareAction: { paddingLeft: Spacing.sm, paddingVertical: 4 },
  shareActionText: { fontSize: 16, color: Colors.textTertiary },
  multiFab: { flexDirection: 'row', margin: Spacing.sm, borderRadius: Radius.md, backgroundColor: Colors.brandPrimary, overflow: 'hidden' },
  multiFabBtn: { flex: 1, paddingVertical: Spacing.md, alignItems: 'center' },
  multiFabText: { color: Colors.white, fontWeight: Typography.weightSemibold },
  multiFabClose: { paddingHorizontal: Spacing.base, alignItems: 'center', justifyContent: 'center', borderLeftWidth: 1, borderLeftColor: Colors.brandHover },
  multiFabCloseText: { color: Colors.white, fontSize: 16 },
  empty: { alignItems: 'center', paddingVertical: Spacing.xxl },
  emptyText: { fontSize: Typography.base, color: Colors.textTertiary },
});
