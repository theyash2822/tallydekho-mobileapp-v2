import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, TextInput, FlatList, TouchableOpacity,
  StyleSheet, Modal, ScrollView, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Spacing, Radius, Typography } from '../../constants';
import { AppText } from '../../components/common/Text';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { ErrorBanner } from '../../components/common/ErrorBanner';
import { useAuthStore } from '../../store/authStore';
import { ledgerApi } from '../../services/api/ledgerApi';
import { STATIC_LEDGER_NATURES } from '../../constants/staticData';
import type { Ledger, RootStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type BalanceFilter = 'All' | 'Debit' | 'Credit';
type SortKey = 'name' | 'balance';
type SortDir = 'asc' | 'desc';

export default function LedgerScreen() {
  const navigation = useNavigation<Nav>();
  const { company } = useAuthStore();

  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [balanceFilter, setBalanceFilter] = useState<BalanceFilter>('All');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [showFilter, setShowFilter] = useState(false);
  const [showAddLedger, setShowAddLedger] = useState(false);
  const [hideZero, setHideZero] = useState(false);
  const [filterNatures, setFilterNatures] = useState<string[]>([]);
  const searchTimer = useRef<any>(null);

  const fetchLedgers = useCallback(async (q = search) => {
    if (!company?.guid) return;
    setLoading(true);
    setError(null);
    try {
      const res = await ledgerApi.getLedgers(company.guid, {
        search: q,
        hideZero,
        sortBy: sortKey,
        sortDir,
        nature: filterNatures.join(',') || undefined,
      });
      setLedgers(res.data?.data ?? res.data ?? []);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load ledgers');
    } finally {
      setLoading(false);
    }
  }, [company?.guid, hideZero, sortKey, sortDir, filterNatures]);

  useEffect(() => { fetchLedgers(); }, [fetchLedgers]);

  const handleSearch = (text: string) => {
    setSearch(text);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchLedgers(text), 400);
  };

  const toggleSort = () => {
    if (sortKey === 'name') {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey('name');
      setSortDir('asc');
    }
  };

  const filtered = balanceFilter === 'All'
    ? ledgers
    : ledgers.filter(l =>
        balanceFilter === 'Debit'
          ? l.closingBalanceType === 'Dr'
          : l.closingBalanceType === 'Cr'
      );

  const formatBalance = (val: number, type: 'Dr' | 'Cr') => {
    const abs = Math.abs(val);
    const str = abs >= 1_00_000
      ? `₹${(abs / 1_00_000).toFixed(1)}L`
      : `₹${abs.toLocaleString('en-IN')}`;
    return `${str} ${type}`;
  };

  const renderLedger = ({ item }: { item: Ledger }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('LedgerDetail', { ledgerId: item.id, ledgerName: item.name })}
      activeOpacity={0.7}
      style={styles.ledgerRow}
    >
      <View style={styles.ledgerInfo}>
        <AppText style={styles.ledgerName} numberOfLines={1}>{item.name}</AppText>
        <AppText style={styles.ledgerGroup}>{item.group}</AppText>
      </View>
      <AppText style={[
        styles.ledgerBalance,
        { color: item.closingBalanceType === 'Dr' ? Colors.positiveText : Colors.negativeText }
      ]}>
        {formatBalance(item.closingBalance, item.closingBalanceType)}
      </AppText>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <AppText variant="h3" style={styles.headerTitle}>Ledgers</AppText>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setShowFilter(true)} style={styles.iconBtn}>
            <AppText style={styles.icon}>⚙</AppText>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowAddLedger(true)} style={styles.addBtn}>
            <AppText style={styles.addBtnText}>+ Add</AppText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <AppText style={styles.searchIcon}>🔍</AppText>
          <TextInput
            style={styles.searchInput}
            placeholder="Search ledgers..."
            placeholderTextColor={Colors.textTertiary}
            value={search}
            onChangeText={handleSearch}
            allowFontScaling={false}
          />
        </View>
        <TouchableOpacity onPress={toggleSort} style={styles.sortBtn}>
          <AppText style={styles.sortText}>
            {sortDir === 'asc' ? 'A→Z' : 'Z→A'}
          </AppText>
        </TouchableOpacity>
      </View>

      {/* Balance chips */}
      <View style={styles.chipRow}>
        {(['All', 'Debit', 'Credit'] as BalanceFilter[]).map(f => (
          <TouchableOpacity
            key={f}
            onPress={() => setBalanceFilter(f)}
            style={[styles.chip, balanceFilter === f && styles.chipActive]}
          >
            <AppText style={[styles.chipText, balanceFilter === f && styles.chipTextActive]}>
              {f}
            </AppText>
          </TouchableOpacity>
        ))}
      </View>

      {error && <ErrorBanner message={error} onRetry={() => fetchLedgers()} />}

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={renderLedger}
        refreshing={loading}
        onRefresh={() => fetchLedgers()}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <AppText style={styles.emptyText}>
                {error ? '' : 'No ledgers found'}
              </AppText>
            </View>
          ) : null
        }
      />

      {/* Filter Modal */}
      <Modal visible={showFilter} animationType="slide" transparent onRequestClose={() => setShowFilter(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowFilter(false)} />
        <View style={styles.bottomSheet}>
          <View style={styles.sheetHandle} />
          <AppText variant="h3" style={styles.sheetTitle}>Filters</AppText>

          <AppText style={styles.filterLabel}>Nature</AppText>
          <View style={styles.natureRow}>
            {STATIC_LEDGER_NATURES.map(n => (
              <TouchableOpacity
                key={n}
                onPress={() => setFilterNatures(prev =>
                  prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n]
                )}
                style={[styles.natureChip, filterNatures.includes(n) && styles.natureChipActive]}
              >
                <AppText style={[styles.natureChipText, filterNatures.includes(n) && styles.natureChipTextActive]}>
                  {n}
                </AppText>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.toggleRow}>
            <AppText style={styles.toggleLabel}>Hide Zero Balance</AppText>
            <Switch
              value={hideZero}
              onValueChange={setHideZero}
              trackColor={{ true: Colors.brandPrimary, false: Colors.borderDefault }}
              thumbColor={Colors.white}
            />
          </View>

          <Button label="Apply" onPress={() => { setShowFilter(false); fetchLedgers(); }} />
        </View>
      </Modal>

      {/* Add Ledger Modal */}
      <AddLedgerModal
        visible={showAddLedger}
        onClose={() => setShowAddLedger(false)}
        onSuccess={() => { setShowAddLedger(false); fetchLedgers(); }}
        companyGuid={company?.guid ?? ''}
      />
    </SafeAreaView>
  );
}

// ── Add Ledger Modal ──────────────────────────────────────────────
interface AddLedgerModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  companyGuid: string;
}

function AddLedgerModal({ visible, onClose, onSuccess, companyGuid }: AddLedgerModalProps) {
  const [name, setName] = useState('');
  const [nature, setNature] = useState('');
  const [group, setGroup] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const [openingType, setOpeningType] = useState<'Dr' | 'Cr'>('Dr');
  const [narration, setNarration] = useState('');
  const [showMore, setShowMore] = useState(false);
  const [gstin, setGstin] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!name.trim() || !nature || !group) {
      setError('Name, Nature and Group are required');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await ledgerApi.createLedger(companyGuid, {
        name: name.trim(), nature, group,
        openingBalance: openingBalance ? parseFloat(openingBalance) : undefined,
        openingBalanceType: openingType,
        narration, gstin, mobile, email, address,
      });
      onSuccess();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to create ledger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose} />
      <View style={[styles.bottomSheet, { maxHeight: '90%' }]}>
        <View style={styles.sheetHandle} />
        <AppText variant="h3" style={styles.sheetTitle}>Ledger Creation</AppText>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {error && <ErrorBanner message={error} />}
          <Field label="Ledger Name *" value={name} onChange={setName} placeholder="e.g. ABC Traders" />
          <AppText style={styles.fieldLabel}>Nature *</AppText>
          <View style={styles.natureRow}>
            {STATIC_LEDGER_NATURES.map(n => (
              <TouchableOpacity key={n} onPress={() => setNature(n)}
                style={[styles.natureChip, nature === n && styles.natureChipActive]}>
                <AppText style={[styles.natureChipText, nature === n && styles.natureChipTextActive]}>{n}</AppText>
              </TouchableOpacity>
            ))}
          </View>
          <Field label="Group *" value={group} onChange={setGroup} placeholder="e.g. Sundry Debtors" />
          <View style={styles.amountRow}>
            <View style={{ flex: 1 }}>
              <Field label="Opening Balance" value={openingBalance} onChange={setOpeningBalance}
                placeholder="0.00" keyboardType="decimal-pad" />
            </View>
            <TouchableOpacity onPress={() => setOpeningType(t => t === 'Dr' ? 'Cr' : 'Dr')}
              style={[styles.drCrToggle, { backgroundColor: openingType === 'Dr' ? Colors.positiveText : Colors.negativeText }]}>
              <AppText style={styles.drCrText}>{openingType}</AppText>
            </TouchableOpacity>
          </View>
          <Field label="Narration" value={narration} onChange={setNarration} placeholder="Optional notes" multiline />

          <TouchableOpacity onPress={() => setShowMore(v => !v)} style={styles.moreToggle}>
            <AppText style={styles.moreText}>{showMore ? '▲ Less Info' : '▼ More Information'}</AppText>
          </TouchableOpacity>

          {showMore && (
            <>
              <Field label="GSTIN" value={gstin} onChange={setGstin} placeholder="27ABCDE1234F2Z5" />
              <Field label="Mobile" value={mobile} onChange={setMobile} placeholder="+91 XXXXX XXXXX" keyboardType="phone-pad" />
              <Field label="Email" value={email} onChange={setEmail} placeholder="email@example.com" keyboardType="email-address" />
              <Field label="Address" value={address} onChange={setAddress} placeholder="Full address" multiline />
            </>
          )}
          <Button label="Submit" onPress={handleSubmit} loading={loading} style={{ marginTop: Spacing.base }} />
          <View style={{ height: 24 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

function Field({ label, value, onChange, placeholder, keyboardType, multiline }: any) {
  return (
    <View style={{ marginBottom: Spacing.sm }}>
      <AppText style={styles.fieldLabel}>{label}</AppText>
      <TextInput
        style={[styles.fieldInput, multiline && { height: 72, textAlignVertical: 'top' }]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={Colors.textTertiary}
        keyboardType={keyboardType ?? 'default'}
        multiline={multiline}
        allowFontScaling={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.pageBg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm,
    backgroundColor: Colors.cardBg, borderBottomWidth: 1, borderBottomColor: Colors.borderDefault,
  },
  headerTitle: { fontSize: Typography.lg, fontWeight: Typography.weightSemibold },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  iconBtn: { padding: 6 },
  icon: { fontSize: 20, color: Colors.textSecondary },
  addBtn: {
    backgroundColor: Colors.brandPrimary, borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md, paddingVertical: 6,
  },
  addBtnText: { fontSize: Typography.sm, color: Colors.white, fontWeight: Typography.weightSemibold },
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, gap: Spacing.sm,
  },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.borderDefault, borderRadius: Radius.md,
    backgroundColor: Colors.cardBg, paddingHorizontal: Spacing.md, paddingVertical: 8,
  },
  searchIcon: { fontSize: 14, marginRight: 6 },
  searchInput: { flex: 1, fontSize: Typography.base, color: Colors.textPrimary },
  sortBtn: {
    borderWidth: 1, borderColor: Colors.borderDefault, borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm, paddingVertical: 8, backgroundColor: Colors.cardBg,
  },
  sortText: { fontSize: Typography.sm, color: Colors.textSecondary },
  chipRow: { flexDirection: 'row', paddingHorizontal: Spacing.base, paddingBottom: Spacing.sm, gap: Spacing.sm },
  chip: {
    paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: Radius.full,
    borderWidth: 1, borderColor: Colors.borderDefault, backgroundColor: Colors.cardBg,
  },
  chipActive: { backgroundColor: Colors.brandPrimary, borderColor: Colors.brandPrimary },
  chipText: { fontSize: Typography.sm, color: Colors.textSecondary },
  chipTextActive: { color: Colors.white, fontWeight: Typography.weightSemibold },
  list: { paddingHorizontal: Spacing.base, paddingBottom: 80 },
  ledgerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.cardBg, paddingVertical: Spacing.md, paddingHorizontal: Spacing.base,
  },
  ledgerInfo: { flex: 1, marginRight: Spacing.base },
  ledgerName: { fontSize: Typography.base, fontWeight: Typography.weightMedium, color: Colors.textPrimary },
  ledgerGroup: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  ledgerBalance: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold },
  separator: { height: 1, backgroundColor: Colors.borderDefault },
  empty: { alignItems: 'center', paddingVertical: Spacing.xxl },
  emptyText: { fontSize: Typography.base, color: Colors.textTertiary },
  // Modal / Sheet
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  bottomSheet: {
    backgroundColor: Colors.cardBg, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl,
    padding: Spacing.base, maxHeight: '80%',
  },
  sheetHandle: { width: 40, height: 4, backgroundColor: Colors.borderStrong, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.md },
  sheetTitle: { fontSize: Typography.lg, fontWeight: Typography.weightSemibold, marginBottom: Spacing.base },
  filterLabel: { fontSize: Typography.sm, fontWeight: Typography.weightMedium, color: Colors.textSecondary, marginBottom: Spacing.xs },
  natureRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.base },
  natureChip: {
    paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: Radius.full,
    borderWidth: 1, borderColor: Colors.borderDefault, backgroundColor: Colors.pageBg,
  },
  natureChipActive: { backgroundColor: Colors.brandPrimary, borderColor: Colors.brandPrimary },
  natureChipText: { fontSize: Typography.sm, color: Colors.textSecondary },
  natureChipTextActive: { color: Colors.white },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.base },
  toggleLabel: { fontSize: Typography.base, color: Colors.textPrimary },
  fieldLabel: { fontSize: Typography.sm, fontWeight: Typography.weightMedium, color: Colors.textSecondary, marginBottom: 4 },
  fieldInput: {
    borderWidth: 1, borderColor: Colors.borderDefault, borderRadius: Radius.sm,
    backgroundColor: Colors.cardBg, paddingHorizontal: Spacing.md, paddingVertical: 10,
    fontSize: Typography.base, color: Colors.textPrimary,
  },
  amountRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm },
  drCrToggle: {
    width: 48, height: 42, borderRadius: Radius.sm,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm,
  },
  drCrText: { color: Colors.white, fontWeight: Typography.weightBold, fontSize: Typography.sm },
  moreToggle: { paddingVertical: Spacing.sm, alignItems: 'center' },
  moreText: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.weightMedium },
});
