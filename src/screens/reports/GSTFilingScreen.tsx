import React, { useCallback, useEffect, useState } from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
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
type GSTReturn = 'GSTR-1' | 'GSTR-2A' | 'GSTR-3B' | 'GSTR-9' | 'GSTR-4' | 'GSTR-9C' | 'CMP-08';
const GST_RETURNS: GSTReturn[] = ['GSTR-1', 'GSTR-2A', 'GSTR-3B', 'GSTR-9', 'GSTR-4', 'GSTR-9C', 'CMP-08'];

export default function GSTFilingScreen() {
  const navigation = useNavigation<Nav>();
  const { company, selectedFY } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [activeReturn, setActiveReturn] = useState<GSTReturn>('GSTR-1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!company?.guid) return;
    setLoading(true); setError(null);
    try {
      const res = await apiClient.get('/reports/gst', { params: { companyGuid: company.guid, fy: selectedFY, returnType: activeReturn } });
      setData(res.data?.summary);
      setVouchers(res.data?.vouchers ?? []);
    } catch (e: any) { setError(e?.message ?? 'Failed to load GST data'); }
    finally { setLoading(false); }
  }, [company?.guid, selectedFY, activeReturn]);

  useEffect(() => { fetch(); }, [fetch]);

  const fmt = (v: number) => v >= 1_00_000 ? `₹${(v / 1_00_000).toFixed(1)}L` : `₹${v.toLocaleString('en-IN')}`;

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}><AppText style={s.back}>←</AppText></TouchableOpacity>
        <AppText style={s.title}>GST Filing</AppText>
        <TouchableOpacity style={s.shareBtn}><AppText style={s.shareIcon}>↗</AppText></TouchableOpacity>
      </View>

      {/* KPI Row */}
      {data && (
        <View style={s.kpiRow}>
          <View style={s.kpi}><AppText style={s.kpiLbl}>GST Collected</AppText><AppText style={s.kpiVal}>{fmt(data.collected ?? 0)}</AppText></View>
          <View style={s.kpi}><AppText style={s.kpiLbl}>ITC Balance</AppText><AppText style={s.kpiVal}>{fmt(data.itc ?? 0)}</AppText></View>
          <View style={s.kpi}><AppText style={s.kpiLbl}>Net Payable</AppText><AppText style={[s.kpiVal, { color: Colors.warningText }]}>{fmt(data.payable ?? 0)}</AppText></View>
          <TouchableOpacity style={s.kpi} onPress={() => navigation.navigate('UnmatchedList')}>
            <AppText style={s.kpiLbl}>Unmatched</AppText>
            <AppText style={[s.kpiVal, { color: Colors.negativeText }]}>{data.unmatched ?? 0}</AppText>
          </TouchableOpacity>
        </View>
      )}

      {/* Return type chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.returnChips}>
        {GST_RETURNS.map(r => (
          <TouchableOpacity key={r} onPress={() => setActiveReturn(r)} style={[s.returnChip, activeReturn === r && s.returnChipA]}>
            <AppText style={[s.returnChipT, activeReturn === r && s.returnChipTA]}>{r}</AppText>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {error && <ErrorBanner message={error} onRetry={fetch} />}

      <FlatList
        data={vouchers} keyExtractor={i => i.id ?? i.voucherNumber}
        renderItem={({ item }) => (
          <View style={s.row}>
            <View style={s.rowLeft}>
              <AppText style={s.partyName}>{item.partyName}</AppText>
              <AppText style={s.voucherNo}>{item.voucherNumber} · {new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</AppText>
            </View>
            <AppText style={s.gstAmt}>{fmt(item.gstAmount ?? 0)}</AppText>
          </View>
        )}
        refreshing={loading} onRefresh={fetch} contentContainerStyle={s.list}
        ItemSeparatorComponent={() => <View style={s.sep} />}
        ListEmptyComponent={!loading ? <View style={s.empty}><AppText style={s.emptyText}>{error ? '' : `No ${activeReturn} data`}</AppText></View> : null}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.pageBg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: 10, backgroundColor: Colors.cardBg, borderBottomWidth: 1, borderBottomColor: Colors.borderDefault },
  back: { fontSize: 22, color: Colors.textPrimary, marginRight: Spacing.sm },
  title: { flex: 1, fontSize: Typography.md, fontWeight: Typography.weightSemibold },
  shareBtn: { padding: 6 },
  shareIcon: { fontSize: 20, color: Colors.textSecondary },
  kpiRow: { flexDirection: 'row', backgroundColor: Colors.cardBg, borderBottomWidth: 1, borderBottomColor: Colors.borderDefault },
  kpi: { flex: 1, alignItems: 'center', paddingVertical: Spacing.sm },
  kpiLbl: { fontSize: 9, color: Colors.textTertiary, marginBottom: 2 },
  kpiVal: { fontSize: Typography.sm, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  returnChips: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, gap: Spacing.sm },
  returnChip: { paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.borderDefault, backgroundColor: Colors.cardBg },
  returnChipA: { backgroundColor: Colors.brandPrimary, borderColor: Colors.brandPrimary },
  returnChipT: { fontSize: Typography.sm, color: Colors.textSecondary },
  returnChipTA: { color: Colors.white, fontWeight: Typography.weightSemibold },
  list: { paddingBottom: 80 },
  sep: { height: 1, backgroundColor: Colors.borderDefault },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.cardBg, paddingHorizontal: Spacing.base, paddingVertical: Spacing.md },
  rowLeft: { flex: 1 },
  partyName: { fontSize: Typography.base, fontWeight: Typography.weightMedium, color: Colors.textPrimary },
  voucherNo: { fontSize: Typography.xs, color: Colors.textTertiary, marginTop: 2 },
  gstAmt: { fontSize: Typography.base, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  empty: { alignItems: 'center', paddingVertical: Spacing.xxl },
  emptyText: { fontSize: Typography.base, color: Colors.textTertiary },
});
