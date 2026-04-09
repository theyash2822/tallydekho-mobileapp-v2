import React, { useCallback, useEffect, useState } from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Spacing, Radius, Typography } from '../../constants';
import { AppText } from '../../components/common/Text';
import { Card } from '../../components/common/Card';
import { ErrorBanner } from '../../components/common/ErrorBanner';
import { useAuthStore } from '../../store/authStore';
import apiClient from '../../services/api/client';
import type { RootStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type AuditTab = 'Log' | 'My Entries';

interface AuditEntry {
  id: string;
  action: string;
  voucherNumber?: string;
  user: string;
  timestamp: string;
  status?: 'pending' | 'pushed' | 'failed';
  type: 'log' | 'write_queue';
}

const STATUS_COLOR: Record<string, string> = {
  pending: Colors.warningText,
  pushed: Colors.positiveText,
  failed: Colors.negativeText,
};

export default function AuditTrailScreen() {
  const navigation = useNavigation<Nav>();
  const { company } = useAuthStore();
  const [tab, setTab] = useState<AuditTab>('Log');
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [myEntries, setMyEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreconciledCount, setUnreconciledCount] = useState(0);

  const fetch = useCallback(async () => {
    if (!company?.guid) return;
    setLoading(true); setError(null);
    try {
      const [logRes, queueRes] = await Promise.all([
        apiClient.get('/tally/audit-trail', { params: { companyGuid: company.guid } }),
        apiClient.get('/tally/audit-trail', { params: { companyGuid: company.guid, type: 'write_queue' } }),
      ]);
      const logData: AuditEntry[] = logRes.data?.data ?? logRes.data ?? [];
      const queueData: AuditEntry[] = queueRes.data?.data ?? queueRes.data ?? [];
      setEntries(logData);
      setMyEntries(queueData);
      setUnreconciledCount(logData.filter((e: AuditEntry) => e.status === 'pending').length);
    } catch (e: any) { setError(e?.message ?? 'Failed to load audit trail'); }
    finally { setLoading(false); }
  }, [company?.guid]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleRetry = async (id: string) => {
    try {
      await apiClient.post(`/tally/audit-trail/${id}/retry`);
      fetch();
    } catch { /* non-fatal */ }
  };

  const renderLog = ({ item }: { item: AuditEntry }) => (
    <View style={s.entry}>
      <View style={s.entryLeft}>
        <AppText style={s.entryAction}>{item.action}</AppText>
        {item.voucherNumber && <AppText style={s.entryVoucher}>{item.voucherNumber}</AppText>}
        <AppText style={s.entryMeta}>{item.user} · {new Date(item.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</AppText>
      </View>
      {item.status && (
        <View style={[s.statusBadge, { borderColor: STATUS_COLOR[item.status] }]}>
          <AppText style={[s.statusText, { color: STATUS_COLOR[item.status] }]}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </AppText>
        </View>
      )}
    </View>
  );

  const renderMyEntry = ({ item }: { item: AuditEntry }) => (
    <View style={s.entry}>
      <View style={s.entryLeft}>
        <AppText style={s.entryAction}>{item.action}</AppText>
        {item.voucherNumber && <AppText style={s.entryVoucher}>{item.voucherNumber}</AppText>}
        <AppText style={s.entryMeta}>{new Date(item.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</AppText>
      </View>
      <View style={s.entryRight}>
        <View style={[s.statusBadge, { borderColor: STATUS_COLOR[item.status ?? 'pending'] }]}>
          <AppText style={[s.statusText, { color: STATUS_COLOR[item.status ?? 'pending'] }]}>
            {(item.status ?? 'pending').charAt(0).toUpperCase() + (item.status ?? 'pending').slice(1)}
          </AppText>
        </View>
        {item.status === 'failed' && (
          <TouchableOpacity onPress={() => handleRetry(item.id)} style={s.retryBtn}>
            <AppText style={s.retryText}>Push</AppText>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const currentData = tab === 'Log' ? entries : myEntries;

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <AppText style={s.back}>←</AppText>
        </TouchableOpacity>
        <AppText style={s.title}>Audit Trail</AppText>
        <View style={{ width: 44 }} />
      </View>

      {/* Unreconciled pill */}
      {unreconciledCount > 0 && (
        <View style={s.unreconciledBanner}>
          <AppText style={s.unreconciledText}>⚠ {unreconciledCount} unreconciled vouchers</AppText>
        </View>
      )}

      {/* Tabs */}
      <View style={s.tabs}>
        {(['Log', 'My Entries'] as AuditTab[]).map(t => (
          <TouchableOpacity key={t} onPress={() => setTab(t)} style={[s.tab, tab === t && s.tabActive]}>
            <AppText style={[s.tabText, tab === t && s.tabTextActive]}>{t}</AppText>
            {t === 'My Entries' && myEntries.filter(e => e.status === 'pending').length > 0 && (
              <View style={s.tabBadge}>
                <AppText style={s.tabBadgeText}>{myEntries.filter(e => e.status === 'pending').length}</AppText>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {error && <ErrorBanner message={error} onRetry={fetch} />}

      <FlatList
        data={currentData}
        keyExtractor={i => i.id}
        renderItem={tab === 'Log' ? renderLog : renderMyEntry}
        refreshing={loading}
        onRefresh={fetch}
        contentContainerStyle={s.list}
        ItemSeparatorComponent={() => <View style={s.sep} />}
        ListEmptyComponent={
          !loading ? (
            <View style={s.empty}>
              <AppText style={s.emptyText}>{error ? '' : tab === 'Log' ? 'No audit entries' : 'No entries from you yet'}</AppText>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.pageBg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: 10, backgroundColor: Colors.cardBg, borderBottomWidth: 1, borderBottomColor: Colors.borderDefault },
  back: { fontSize: 22, color: Colors.textPrimary, marginRight: Spacing.sm },
  title: { flex: 1, fontSize: Typography.md, fontWeight: Typography.weightSemibold },
  unreconciledBanner: { backgroundColor: Colors.warningBg, paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm },
  unreconciledText: { fontSize: Typography.sm, color: Colors.warningText, fontWeight: Typography.weightMedium },
  tabs: { flexDirection: 'row', backgroundColor: Colors.cardBg, borderBottomWidth: 1, borderBottomColor: Colors.borderDefault },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.sm, gap: 6 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.brandPrimary },
  tabText: { fontSize: Typography.sm, color: Colors.textSecondary },
  tabTextActive: { color: Colors.brandPrimary, fontWeight: Typography.weightSemibold },
  tabBadge: { backgroundColor: Colors.warningText, borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1 },
  tabBadgeText: { fontSize: 9, color: Colors.white, fontWeight: '700' },
  list: { paddingBottom: 80 },
  sep: { height: 1, backgroundColor: Colors.borderDefault },
  entry: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.cardBg, paddingHorizontal: Spacing.base, paddingVertical: Spacing.md },
  entryLeft: { flex: 1 },
  entryAction: { fontSize: Typography.base, fontWeight: Typography.weightMedium, color: Colors.textPrimary },
  entryVoucher: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  entryMeta: { fontSize: Typography.xs, color: Colors.textTertiary, marginTop: 2 },
  entryRight: { alignItems: 'flex-end', gap: 6 },
  statusBadge: { borderWidth: 1, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  statusText: { fontSize: 11, fontWeight: '600' },
  retryBtn: { backgroundColor: Colors.brandPrimary, borderRadius: Radius.sm, paddingHorizontal: Spacing.sm, paddingVertical: 4 },
  retryText: { fontSize: Typography.xs, color: Colors.white, fontWeight: Typography.weightSemibold },
  empty: { alignItems: 'center', paddingVertical: Spacing.xxl },
  emptyText: { fontSize: Typography.base, color: Colors.textTertiary },
});
