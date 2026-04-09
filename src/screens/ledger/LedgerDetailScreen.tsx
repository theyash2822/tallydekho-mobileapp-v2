import React, { useCallback, useEffect, useState } from 'react';
import {
  View, FlatList, TouchableOpacity, StyleSheet,
  TextInput, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Colors, Spacing, Radius, Typography } from '../../constants';
import { AppText } from '../../components/common/Text';
import { Card } from '../../components/common/Card';
import { ErrorBanner } from '../../components/common/ErrorBanner';
import { useAuthStore } from '../../store/authStore';
import { ledgerApi } from '../../services/api/ledgerApi';
import type { LedgerTransaction, RootStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'LedgerDetail'>;

export default function LedgerDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { ledgerId, ledgerName } = route.params;
  const { company } = useAuthStore();

  const [ledger, setLedger] = useState<any>(null);
  const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showDrFilter, setShowDrFilter] = useState(false);
  const [showCrFilter, setShowCrFilter] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const fetch = useCallback(async () => {
    if (!company?.guid) return;
    setLoading(true); setError(null);
    try {
      const res = await ledgerApi.getLedgerDetail(ledgerId, company.guid);
      const d = res.data;
      setLedger(d);
      setTransactions(d.transactions ?? []);
    } catch (e: any) { setError(e?.message ?? 'Failed to load ledger'); }
    finally { setLoading(false); }
  }, [company?.guid, ledgerId]);

  useEffect(() => { fetch(); }, [fetch]);

  const filtered = transactions.filter(t => {
    const matchSearch = !search.trim() ||
      t.voucherNumber.toLowerCase().includes(search.toLowerCase()) ||
      t.voucherType.toLowerCase().includes(search.toLowerCase());
    const matchDr = !showDrFilter || t.type === 'Dr';
    const matchCr = !showCrFilter || t.type === 'Cr';
    return matchSearch && matchDr && matchCr;
  });

  // Group by month
  const grouped: { month: string; items: LedgerTransaction[] }[] = [];
  filtered.forEach(t => {
    const month = new Date(t.date).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
    const existing = grouped.find(g => g.month === month);
    if (existing) existing.items.push(t);
    else grouped.push({ month, items: [t] });
  });

  const totalDr = transactions.filter(t => t.type === 'Dr').reduce((s, t) => s + t.amount, 0);
  const totalCr = transactions.filter(t => t.type === 'Cr').reduce((s, t) => s + t.amount, 0);
  const total = totalDr + totalCr || 1;
  const drPct = Math.round((totalDr / total) * 100);
  const crPct = 100 - drPct;

  const fmt = (v: number) => v >= 1_00_000 ? `₹${(v / 1_00_000).toFixed(1)}L` : `₹${v.toLocaleString('en-IN')}`;

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <AppText style={s.back}>←</AppText>
        </TouchableOpacity>
        <AppText style={s.headerTitle} numberOfLines={1}>{ledgerName}</AppText>
        <TouchableOpacity onPress={() => setShowInfo(v => !v)} style={s.infoBtn}>
          <AppText style={s.infoIcon}>ℹ</AppText>
        </TouchableOpacity>
      </View>

      {error && <ErrorBanner message={error} onRetry={fetch} />}

      {/* Info Panel */}
      {showInfo && ledger && (
        <Card style={s.infoPanel}>
          {ledger.gstin && <InfoRow label="GSTIN" value={ledger.gstin} />}
          {ledger.mobile && (
            <TouchableOpacity onPress={() => Linking.openURL(`tel:${ledger.mobile}`)}>
              <InfoRow label="Mobile" value={ledger.mobile} />
            </TouchableOpacity>
          )}
          {ledger.email && <InfoRow label="Email" value={ledger.email} />}
          {ledger.address && <InfoRow label="Address" value={ledger.address} />}
          {ledger.bankDetails && (
            <>
              <InfoRow label="Bank" value={`${ledger.bankDetails.bankName} — ${ledger.bankDetails.accountNumber}`} />
              <InfoRow label="IFSC" value={ledger.bankDetails.ifsc} />
            </>
          )}
        </Card>
      )}

      {/* Donut + KPIs */}
      <View style={s.summarySection}>
        {/* Simple Donut (visual representation) */}
        <View style={s.donutWrap}>
          <View style={s.donutOuter}>
            <View style={[s.donutFill, { borderColor: Colors.positiveText, borderRightColor: Colors.negativeText }]} />
            <View style={s.donutCenter}>
              <AppText style={s.donutLabel}>Dr / Cr</AppText>
            </View>
          </View>
          <AppText style={[s.donutLegend, { color: Colors.positiveText }]}>Dr {drPct}%</AppText>
          <AppText style={[s.donutLegend, { color: Colors.negativeText }]}>Cr {crPct}%</AppText>
        </View>

        {/* KPI chips */}
        <View style={s.kpiChips}>
          {[
            { label: 'Opening', value: fmt(ledger?.openingBalance ?? 0) },
            { label: 'Closing', value: fmt(ledger?.closingBalance ?? 0) },
            { label: 'Total Dr', value: fmt(totalDr) },
            { label: 'Total Cr', value: fmt(totalCr) },
            { label: 'Vouchers', value: String(transactions.length) },
          ].map(chip => (
            <View key={chip.label} style={s.kpiChip}>
              <AppText style={s.kpiLabel}>{chip.label}</AppText>
              <AppText style={s.kpiValue}>{chip.value}</AppText>
            </View>
          ))}
        </View>
      </View>

      {/* Search + Dr/Cr filters */}
      <View style={s.searchRow}>
        <View style={s.searchBar}>
          <AppText style={s.searchIcon}>🔍</AppText>
          <TextInput
            style={s.searchInput}
            placeholder="Search vouchers..."
            placeholderTextColor={Colors.textTertiary}
            value={search} onChangeText={setSearch}
            allowFontScaling={false}
          />
        </View>
        <TouchableOpacity onPress={() => { setShowDrFilter(v => !v); setShowCrFilter(false); }}
          style={[s.filterChip, showDrFilter && s.filterChipActive]}>
          <AppText style={[s.filterChipText, showDrFilter && s.filterChipTextActive]}>Dr</AppText>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => { setShowCrFilter(v => !v); setShowDrFilter(false); }}
          style={[s.filterChip, showCrFilter && s.filterChipActive]}>
          <AppText style={[s.filterChipText, showCrFilter && s.filterChipTextActive]}>Cr</AppText>
        </TouchableOpacity>
      </View>

      {/* Transaction list with month separators */}
      <FlatList
        data={grouped}
        keyExtractor={g => g.month}
        refreshing={loading}
        onRefresh={fetch}
        contentContainerStyle={s.list}
        renderItem={({ item: group }) => (
          <View>
            <View style={s.monthHeader}>
              <AppText style={s.monthText}>{group.month}</AppText>
            </View>
            {group.items.map(t => (
              <TouchableOpacity key={t.id} style={s.txRow} activeOpacity={0.7}>
                <View style={s.txLeft}>
                  <AppText style={s.txDate}>{new Date(t.date).getDate()} {new Date(t.date).toLocaleDateString('en-IN', { month: 'short' })}</AppText>
                  <View style={s.txInfo}>
                    <AppText style={s.txVoucherNo}>{t.voucherNumber}</AppText>
                    <AppText style={s.txType}>{t.voucherType}</AppText>
                  </View>
                </View>
                <View style={s.txRight}>
                  <AppText style={[s.txAmount, { color: t.type === 'Dr' ? Colors.positiveText : Colors.negativeText }]}>
                    {t.type} ₹{t.amount.toLocaleString('en-IN')}
                  </AppText>
                  <AppText style={s.txBalance}>Bal {t.balanceType} ₹{t.balance.toLocaleString('en-IN')}</AppText>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
        ListEmptyComponent={
          !loading ? (
            <View style={s.empty}>
              <AppText style={s.emptyText}>{error ? '' : 'No transactions found'}</AppText>
            </View>
          ) : null
        }
      />

      {/* Share footer */}
      <View style={s.shareBar}>
        {['PDF', 'XLSX'].map(fmt => (
          <TouchableOpacity key={fmt} style={s.shareBtn}>
            <AppText style={s.shareBtnText}>Share {fmt}</AppText>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.infoRow}>
      <AppText style={s.infoLabel}>{label}</AppText>
      <AppText style={s.infoValue}>{value}</AppText>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.pageBg },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.base, paddingVertical: 10,
    backgroundColor: Colors.cardBg, borderBottomWidth: 1, borderBottomColor: Colors.borderDefault,
  },
  back: { fontSize: 22, color: Colors.textPrimary, marginRight: Spacing.sm },
  headerTitle: { flex: 1, fontSize: Typography.md, fontWeight: Typography.weightSemibold, textAlign: 'center' },
  infoBtn: { padding: 6 },
  infoIcon: { fontSize: 20, color: Colors.textSecondary },
  infoPanel: { margin: Spacing.base, padding: Spacing.base },
  infoRow: { flexDirection: 'row', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: Colors.borderDefault },
  infoLabel: { width: 80, fontSize: Typography.sm, color: Colors.textTertiary, fontWeight: Typography.weightMedium },
  infoValue: { flex: 1, fontSize: Typography.sm, color: Colors.textPrimary },
  summarySection: { flexDirection: 'row', padding: Spacing.base, gap: Spacing.base, backgroundColor: Colors.cardBg, borderBottomWidth: 1, borderBottomColor: Colors.borderDefault },
  donutWrap: { alignItems: 'center', justifyContent: 'center', width: 80 },
  donutOuter: {
    width: 64, height: 64, borderRadius: 32,
    borderWidth: 8, borderColor: Colors.positiveText,
    borderRightColor: Colors.negativeText, borderBottomColor: Colors.negativeText,
    alignItems: 'center', justifyContent: 'center',
  },
  donutFill: { position: 'absolute' },
  donutCenter: { alignItems: 'center', justifyContent: 'center' },
  donutLabel: { fontSize: 8, color: Colors.textTertiary },
  donutLegend: { fontSize: 9, fontWeight: '600', marginTop: 2 },
  kpiChips: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  kpiChip: { paddingHorizontal: 10, paddingVertical: 5, backgroundColor: Colors.pageBg, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.borderDefault },
  kpiLabel: { fontSize: 9, color: Colors.textTertiary },
  kpiValue: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: Colors.textPrimary },
  searchRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.sm, gap: Spacing.sm },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.borderDefault, borderRadius: Radius.sm, backgroundColor: Colors.cardBg, paddingHorizontal: Spacing.sm, paddingVertical: 6 },
  searchIcon: { fontSize: 12, marginRight: 4 },
  searchInput: { flex: 1, fontSize: Typography.sm, color: Colors.textPrimary },
  filterChip: { paddingHorizontal: Spacing.sm, paddingVertical: 6, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.borderDefault, backgroundColor: Colors.cardBg },
  filterChipActive: { backgroundColor: Colors.brandPrimary, borderColor: Colors.brandPrimary },
  filterChipText: { fontSize: Typography.xs, color: Colors.textSecondary, fontWeight: Typography.weightMedium },
  filterChipTextActive: { color: Colors.white },
  list: { paddingBottom: 60 },
  monthHeader: { paddingHorizontal: Spacing.base, paddingVertical: 6, backgroundColor: Colors.pageBg, borderBottomWidth: 1, borderBottomColor: Colors.borderDefault },
  monthText: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: Colors.textSecondary },
  txRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, backgroundColor: Colors.cardBg, borderBottomWidth: 1, borderBottomColor: Colors.borderDefault },
  txLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  txDate: { fontSize: Typography.sm, color: Colors.textSecondary, width: 36, textAlign: 'center' },
  txInfo: { flex: 1 },
  txVoucherNo: { fontSize: Typography.sm, fontWeight: Typography.weightMedium, color: Colors.textPrimary },
  txType: { fontSize: Typography.xs, color: Colors.textTertiary },
  txRight: { alignItems: 'flex-end' },
  txAmount: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold },
  txBalance: { fontSize: Typography.xs, color: Colors.textTertiary, marginTop: 2 },
  empty: { alignItems: 'center', paddingVertical: Spacing.xxl },
  emptyText: { fontSize: Typography.base, color: Colors.textTertiary },
  shareBar: { flexDirection: 'row', padding: Spacing.base, gap: Spacing.sm, backgroundColor: Colors.cardBg, borderTopWidth: 1, borderTopColor: Colors.borderDefault },
  shareBtn: { flex: 1, alignItems: 'center', paddingVertical: Spacing.sm, borderWidth: 1, borderColor: Colors.borderDefault, borderRadius: Radius.sm },
  shareBtnText: { fontSize: Typography.sm, color: Colors.textPrimary, fontWeight: Typography.weightMedium },
});
