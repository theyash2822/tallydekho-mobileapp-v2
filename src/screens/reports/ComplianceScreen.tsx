import React, { useCallback, useEffect, useState } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
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

export default function ComplianceScreen() {
  const navigation = useNavigation<Nav>();
  const { company, selectedFY } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!company?.guid) return;
    setLoading(true); setError(null);
    try {
      const res = await apiClient.get('/reports/compliance', { params: { companyGuid: company.guid, fy: selectedFY } });
      setData(res.data);
    } catch (e: any) { setError(e?.message ?? 'Failed to load compliance data'); }
    finally { setLoading(false); }
  }, [company?.guid, selectedFY]);

  useEffect(() => { fetch(); }, [fetch]);

  const cards = [
    {
      id: 'gst',
      title: 'GST Filing',
      icon: '🧾',
      status: data?.gst?.status ?? 'Pending',
      statusColor: data?.gst?.status === 'Submitted' ? Colors.positiveText : Colors.warningText,
      detail: `Unmatched: ${data?.gst?.unmatched ?? 0}`,
      onPress: () => navigation.navigate('GSTFiling'),
    },
    {
      id: 'eway',
      title: 'E-way Bill',
      icon: '🚚',
      status: `${data?.eway?.expiringSoon ?? 0} expiring soon`,
      statusColor: Colors.warningText,
      detail: `Active: ${data?.eway?.active ?? 0} | Expired: ${data?.eway?.expired ?? 0}`,
      onPress: () => navigation.navigate('EWayBills'),
    },
    {
      id: 'einvoice',
      title: 'E-Invoicing',
      icon: '📄',
      status: `${data?.einvoice?.unreconciled ?? 0} unreconciled`,
      statusColor: data?.einvoice?.unreconciled > 0 ? Colors.warningText : Colors.positiveText,
      detail: `IRN Generated: ${data?.einvoice?.generated ?? 0}`,
      onPress: () => {},
    },
    {
      id: 'othertax',
      title: 'Other Taxes',
      icon: '💰',
      status: data?.otherTax?.pending ? 'TDS Pending' : 'Up to date',
      statusColor: data?.otherTax?.pending ? Colors.warningText : Colors.positiveText,
      detail: data?.otherTax?.advanceTaxDue ? 'Advance Tax Due' : 'No pending taxes',
      onPress: () => {},
    },
  ];

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <AppText style={s.back}>←</AppText>
        </TouchableOpacity>
        <AppText style={s.title}>Compliance</AppText>
        <AppText style={s.fy}>{selectedFY}</AppText>
      </View>

      {error && <ErrorBanner message={error} onRetry={fetch} />}

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {cards.map(card => (
          <Card key={card.id} onPress={card.onPress} style={s.card}>
            <View style={s.cardHeader}>
              <View style={s.iconWrap}>
                <AppText style={s.icon}>{card.icon}</AppText>
              </View>
              <View style={s.cardInfo}>
                <AppText style={s.cardTitle}>{card.title}</AppText>
                <AppText style={[s.cardStatus, { color: card.statusColor }]}>{card.status}</AppText>
                <AppText style={s.cardDetail}>{card.detail}</AppText>
              </View>
              <AppText style={s.chevron}>›</AppText>
            </View>
          </Card>
        ))}

        {/* GST Filing Summary */}
        {data?.gst && (
          <Card style={s.gstCard}>
            <AppText style={s.gstTitle}>GST Summary</AppText>
            <View style={s.gstRow}>
              <View style={s.gstKpi}>
                <AppText style={s.gstKpiLabel}>Collected</AppText>
                <AppText style={s.gstKpiValue}>₹{((data.gst.collected ?? 0) / 1000).toFixed(0)}K</AppText>
              </View>
              <View style={s.gstKpi}>
                <AppText style={s.gstKpiLabel}>ITC Balance</AppText>
                <AppText style={s.gstKpiValue}>₹{((data.gst.itc ?? 0) / 1000).toFixed(0)}K</AppText>
              </View>
              <View style={s.gstKpi}>
                <AppText style={s.gstKpiLabel}>Net Payable</AppText>
                <AppText style={[s.gstKpiValue, { color: Colors.warningText }]}>₹{((data.gst.payable ?? 0) / 1000).toFixed(0)}K</AppText>
              </View>
            </View>
            {data.gst.unmatched > 0 && (
              <TouchableOpacity onPress={() => navigation.navigate('UnmatchedList')} style={s.unmatchedRow}>
                <AppText style={s.unmatchedText}>⚠ {data.gst.unmatched} Unmatched invoices</AppText>
                <AppText style={s.unmatchedLink}>Fix now →</AppText>
              </TouchableOpacity>
            )}
          </Card>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.pageBg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: 10, backgroundColor: Colors.cardBg, borderBottomWidth: 1, borderBottomColor: Colors.borderDefault },
  back: { fontSize: 22, color: Colors.textPrimary, marginRight: Spacing.sm },
  title: { flex: 1, fontSize: Typography.md, fontWeight: Typography.weightSemibold },
  fy: { fontSize: Typography.sm, color: Colors.textSecondary },
  content: { padding: Spacing.base },
  card: { marginBottom: Spacing.sm, padding: Spacing.base },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: { width: 44, height: 44, borderRadius: Radius.md, backgroundColor: Colors.pageBg, borderWidth: 1, borderColor: Colors.borderDefault, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  icon: { fontSize: 22 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: Typography.base, fontWeight: Typography.weightSemibold, color: Colors.textPrimary },
  cardStatus: { fontSize: Typography.sm, fontWeight: Typography.weightMedium, marginTop: 2 },
  cardDetail: { fontSize: Typography.xs, color: Colors.textTertiary, marginTop: 2 },
  chevron: { fontSize: 22, color: Colors.textTertiary },
  gstCard: { padding: Spacing.base },
  gstTitle: { fontSize: Typography.base, fontWeight: Typography.weightSemibold, color: Colors.textPrimary, marginBottom: Spacing.md },
  gstRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  gstKpi: { flex: 1, alignItems: 'center', backgroundColor: Colors.pageBg, borderRadius: Radius.sm, padding: Spacing.sm },
  gstKpiLabel: { fontSize: Typography.xs, color: Colors.textTertiary, marginBottom: 2 },
  gstKpiValue: { fontSize: Typography.base, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  unmatchedRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.warningBg, borderRadius: Radius.sm, padding: Spacing.sm },
  unmatchedText: { fontSize: Typography.sm, color: Colors.warningText },
  unmatchedLink: { fontSize: Typography.sm, color: Colors.warningText, fontWeight: Typography.weightSemibold },
});
