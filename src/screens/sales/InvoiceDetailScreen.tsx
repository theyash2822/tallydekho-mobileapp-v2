import React, { useCallback, useEffect, useState } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Share, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Colors, Spacing, Radius, Typography } from '../../constants';
import { AppText } from '../../components/common/Text';
import { Card } from '../../components/common/Card';
import { ErrorBanner } from '../../components/common/ErrorBanner';
import { useAuthStore } from '../../store/authStore';
import { salesApi } from '../../services/api/salesApi';
import type { Invoice, RootStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'InvoiceDetail'>;

const STATUS_COLOR: Record<string, string> = {
  paid: Colors.positiveText,
  unpaid: Colors.negativeText,
  partial: Colors.warningText,
  draft: Colors.textTertiary,
};

export default function InvoiceDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { voucherId } = route.params;
  const { company } = useAuthStore();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!company?.guid) return;
    setLoading(true); setError(null);
    try {
      const res = await salesApi.getVoucherDetail(voucherId, company.guid);
      setInvoice(res.data);
    } catch (e: any) { setError(e?.message ?? 'Failed to load invoice'); }
    finally { setLoading(false); }
  }, [company?.guid, voucherId]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleShare = async () => {
    await Share.share({ message: `Invoice ${invoice?.voucherNumber} — ₹${invoice?.amount.toLocaleString('en-IN')}` });
  };

  const fmt = (v: number) => `₹${v.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  if (loading) {
    return <SafeAreaView style={s.safe}><View style={s.center}><ActivityIndicator color={Colors.textPrimary} size="large" /></View></SafeAreaView>;
  }

  if (error || !invoice) {
    return <SafeAreaView style={s.safe}><ErrorBanner message={error ?? 'Invoice not found'} onRetry={fetch} /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <AppText style={s.back}>←</AppText>
        </TouchableOpacity>
        <AppText style={s.title} numberOfLines={1}>{invoice.voucherNumber}</AppText>
        <TouchableOpacity onPress={handleShare} style={s.shareBtn}>
          <AppText style={s.shareIcon}>↗</AppText>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Status + Amount */}
        <Card style={s.summaryCard}>
          <View style={s.summaryTop}>
            <View>
              <AppText style={s.amountLabel}>Amount</AppText>
              <AppText style={s.amount}>{fmt(invoice.amount)}</AppText>
            </View>
            <View style={[s.statusBadge, { borderColor: STATUS_COLOR[invoice.status] }]}>
              <AppText style={[s.statusText, { color: STATUS_COLOR[invoice.status] }]}>
                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
              </AppText>
            </View>
          </View>
          <View style={s.metaRow}>
            <AppText style={s.metaLabel}>Date</AppText>
            <AppText style={s.metaValue}>{new Date(invoice.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</AppText>
          </View>
          <View style={s.metaRow}>
            <AppText style={s.metaLabel}>Party</AppText>
            <AppText style={s.metaValue}>{invoice.partyName}</AppText>
          </View>
          {invoice.irnStatus && (
            <View style={s.metaRow}>
              <AppText style={s.metaLabel}>IRN</AppText>
              <AppText style={[s.metaValue, { color: invoice.irnStatus === 'generated' ? Colors.positiveText : Colors.warningText }]}>
                {invoice.irnStatus.charAt(0).toUpperCase() + invoice.irnStatus.slice(1)}
              </AppText>
            </View>
          )}
        </Card>

        {/* Line Items */}
        {invoice.items && invoice.items.length > 0 && (
          <>
            <AppText style={s.sectionLabel}>Items</AppText>
            <Card style={s.itemsCard}>
              {invoice.items.map((item, idx) => (
                <View key={item.id ?? idx}>
                  {idx > 0 && <View style={s.sep} />}
                  <View style={s.itemRow}>
                    <View style={s.itemLeft}>
                      <AppText style={s.itemName}>{item.productName}</AppText>
                      <AppText style={s.itemMeta}>{item.quantity} {item.unit} × {fmt(item.unitPrice)}</AppText>
                      {item.hsnCode && <AppText style={s.hsnBadge}>HSN: {item.hsnCode}</AppText>}
                    </View>
                    <AppText style={s.itemSubtotal}>{fmt(item.subtotal)}</AppText>
                  </View>
                </View>
              ))}
            </Card>
          </>
        )}

        {/* Tax breakdown */}
        {invoice.taxes && (
          <>
            <AppText style={s.sectionLabel}>Tax Breakup</AppText>
            <Card style={s.taxCard}>
              {invoice.taxes.cgst > 0 && <TaxRow label="CGST" value={invoice.taxes.cgst} />}
              {invoice.taxes.sgst > 0 && <TaxRow label="SGST" value={invoice.taxes.sgst} />}
              {invoice.taxes.igst > 0 && <TaxRow label="IGST" value={invoice.taxes.igst} />}
              <View style={s.sep} />
              <TaxRow label="Total Tax" value={invoice.taxes.total} bold />
            </Card>
          </>
        )}

        {/* Grand Total */}
        <Card style={s.grandCard}>
          <View style={s.grandRow}>
            <AppText style={s.grandLabel}>Grand Total</AppText>
            <AppText style={s.grandValue}>{fmt(invoice.amount)}</AppText>
          </View>
        </Card>

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Footer */}
      <View style={s.footer}>
        <TouchableOpacity onPress={handleShare} style={s.footerBtn}>
          <AppText style={s.footerBtnText}>↗ Share PDF</AppText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function TaxRow({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <View style={s.taxRow}>
      <AppText style={[s.taxLabel, bold && s.boldText]}>{label}</AppText>
      <AppText style={[s.taxValue, bold && s.boldText]}>₹{value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</AppText>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.pageBg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: 10, backgroundColor: Colors.cardBg, borderBottomWidth: 1, borderBottomColor: Colors.borderDefault },
  back: { fontSize: 22, color: Colors.textPrimary, marginRight: Spacing.sm },
  title: { flex: 1, fontSize: Typography.md, fontWeight: Typography.weightSemibold },
  shareBtn: { padding: 6 },
  shareIcon: { fontSize: 20, color: Colors.textSecondary },
  content: { padding: Spacing.base },
  summaryCard: { padding: Spacing.base, marginBottom: Spacing.base },
  summaryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.md },
  amountLabel: { fontSize: Typography.sm, color: Colors.textSecondary },
  amount: { fontSize: 28, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  statusBadge: { borderWidth: 1.5, borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 4 },
  statusText: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: Colors.borderDefault },
  metaLabel: { fontSize: Typography.sm, color: Colors.textTertiary },
  metaValue: { fontSize: Typography.sm, color: Colors.textPrimary, fontWeight: Typography.weightMedium },
  sectionLabel: { fontSize: Typography.xs, fontWeight: Typography.weightSemibold, color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.xs, marginTop: Spacing.sm },
  itemsCard: { padding: 0, marginBottom: Spacing.base, overflow: 'hidden' },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', padding: Spacing.base },
  itemLeft: { flex: 1 },
  itemName: { fontSize: Typography.base, fontWeight: Typography.weightMedium, color: Colors.textPrimary },
  itemMeta: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  hsnBadge: { fontSize: 10, color: Colors.infoText, backgroundColor: Colors.infoBg, paddingHorizontal: 6, paddingVertical: 1, borderRadius: Radius.full, alignSelf: 'flex-start', marginTop: 4 },
  itemSubtotal: { fontSize: Typography.base, fontWeight: Typography.weightSemibold, color: Colors.textPrimary },
  taxCard: { padding: 0, marginBottom: Spacing.base, overflow: 'hidden' },
  taxRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingVertical: 10 },
  taxLabel: { fontSize: Typography.base, color: Colors.textSecondary },
  taxValue: { fontSize: Typography.base, color: Colors.textPrimary },
  boldText: { fontWeight: Typography.weightSemibold, color: Colors.textPrimary },
  grandCard: { padding: Spacing.base, marginBottom: Spacing.base },
  grandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  grandLabel: { fontSize: Typography.md, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  grandValue: { fontSize: Typography.xl, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  sep: { height: 1, backgroundColor: Colors.borderDefault },
  footer: { padding: Spacing.base, backgroundColor: Colors.cardBg, borderTopWidth: 1, borderTopColor: Colors.borderDefault },
  footerBtn: { backgroundColor: Colors.brandPrimary, borderRadius: Radius.md, paddingVertical: Spacing.md, alignItems: 'center' },
  footerBtnText: { fontSize: Typography.base, color: Colors.white, fontWeight: Typography.weightSemibold },
});
