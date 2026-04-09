import React, { useCallback, useEffect, useState } from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Spacing, Radius, Typography } from '../../constants';
import { AppText } from '../../components/common/Text';
import { ErrorBanner } from '../../components/common/ErrorBanner';
import { useAuthStore } from '../../store/authStore';
import apiClient from '../../services/api/client';
import type { RootStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function UnmatchedListScreen() {
  const navigation = useNavigation<Nav>();
  const { company } = useAuthStore();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!company?.guid) return;
    setLoading(true); setError(null);
    try {
      const res = await apiClient.get('/reports/gst/unmatched', { params: { companyGuid: company.guid } });
      setItems(res.data?.data ?? res.data ?? []);
    } catch (e: any) { setError(e?.message ?? 'Failed to load'); }
    finally { setLoading(false); }
  }, [company?.guid]);

  useEffect(() => { fetch(); }, [fetch]);

  const REASON_COLOR: Record<string, string> = { 'HSN Code': Colors.warningText, 'GSTIN': Colors.negativeText, 'Amount': Colors.warningText };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}><AppText style={s.back}>←</AppText></TouchableOpacity>
        <AppText style={s.title}>Unmatched Invoices</AppText>
        <View style={{ width: 44 }} />
      </View>
      {error && <ErrorBanner message={error} onRetry={fetch} />}
      <FlatList
        data={items} keyExtractor={i => i.id ?? i.voucherNumber}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.row} activeOpacity={0.7} onPress={() => navigation.navigate('InvoiceDetail', { voucherId: item.id })}>
            <View style={s.rowLeft}>
              <AppText style={s.name}>{item.name}</AppText>
              <AppText style={s.voucher}>{item.voucherNumber} · {new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</AppText>
              <AppText style={s.type}>{item.voucherType}</AppText>
            </View>
            <View style={s.rowRight}>
              <AppText style={s.amount}>₹{(item.amount ?? 0).toLocaleString('en-IN')}</AppText>
              {item.reason && (
                <View style={[s.reasonBadge, { borderColor: REASON_COLOR[item.reason] ?? Colors.warningText }]}>
                  <AppText style={[s.reasonText, { color: REASON_COLOR[item.reason] ?? Colors.warningText }]}>{item.reason}</AppText>
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}
        refreshing={loading} onRefresh={fetch} contentContainerStyle={s.list}
        ItemSeparatorComponent={() => <View style={s.sep} />}
        ListEmptyComponent={!loading ? <View style={s.empty}><AppText style={s.emptyText}>{error ? '' : '✓ No unmatched invoices'}</AppText></View> : null}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.pageBg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: 10, backgroundColor: Colors.cardBg, borderBottomWidth: 1, borderBottomColor: Colors.borderDefault },
  back: { fontSize: 22, color: Colors.textPrimary, marginRight: Spacing.sm },
  title: { flex: 1, fontSize: Typography.md, fontWeight: Typography.weightSemibold },
  list: { paddingBottom: 80 },
  sep: { height: 1, backgroundColor: Colors.borderDefault },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.cardBg, paddingHorizontal: Spacing.base, paddingVertical: Spacing.md },
  rowLeft: { flex: 1 },
  name: { fontSize: Typography.base, fontWeight: Typography.weightMedium, color: Colors.textPrimary },
  voucher: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  type: { fontSize: Typography.xs, color: Colors.textTertiary },
  rowRight: { alignItems: 'flex-end', gap: 4 },
  amount: { fontSize: Typography.base, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  reasonBadge: { borderWidth: 1, borderRadius: Radius.full, paddingHorizontal: 6, paddingVertical: 1 },
  reasonText: { fontSize: 10, fontWeight: '600' },
  empty: { alignItems: 'center', paddingVertical: Spacing.xxl },
  emptyText: { fontSize: Typography.base, color: Colors.positiveText, fontWeight: Typography.weightMedium },
});
