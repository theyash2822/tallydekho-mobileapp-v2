import React, { useEffect, useRef, useState } from 'react';
import {
  View, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, Modal, KeyboardAvoidingView, Platform, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import { Colors, Spacing, Radius, Typography } from '../../constants';
import { AppText } from '../../components/common/Text';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { ErrorBanner } from '../../components/common/ErrorBanner';
import { useAuthStore } from '../../store/authStore';
import { createApi } from '../../services/api/createApi';
import { salesApi } from '../../services/api/salesApi';
import { stocksApi } from '../../services/api/stocksApi';
import {
  STATIC_PAYMENT_TERMS, STATIC_UNITS, STATIC_GST_RATES, STATIC_LOGISTICS_TYPES,
} from '../../constants/staticData';
import type { RootStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface LineItem {
  id: string;
  productName: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  discountType: '%' | '₹';
  discount: string;
  taxRate: number;
  warehouseId: string;
  hsnCode: string;
}

interface LogisticsEntry {
  id: string;
  type: string;
  amount: string;
  trackingNo: string;
  remarks: string;
}

const newLineItem = (): LineItem => ({
  id: Date.now().toString(),
  productName: '', quantity: '1', unit: 'Pcs',
  unitPrice: '', discountType: '%', discount: '0',
  taxRate: 18, warehouseId: '', hsnCode: '',
});

const newLogisticsEntry = (): LogisticsEntry => ({
  id: Date.now().toString(),
  type: 'Courier', amount: '', trackingNo: '', remarks: '',
});

function calcItem(item: LineItem) {
  const qty = parseFloat(item.quantity) || 0;
  const price = parseFloat(item.unitPrice) || 0;
  const base = qty * price;
  const disc = item.discountType === '%'
    ? base * (parseFloat(item.discount) || 0) / 100
    : parseFloat(item.discount) || 0;
  const afterDisc = base - disc;
  const tax = afterDisc * item.taxRate / 100;
  return { base, disc, afterDisc, tax, subtotal: afterDisc + tax };
}

export default function CreateSalesInvoiceScreen() {
  const navigation = useNavigation<Nav>();
  const { company } = useAuthStore();

  // Form state
  const [ledger, setLedger] = useState('Cash Sales');
  const [isOptional, setIsOptional] = useState(false);
  const [invoiceNo, setInvoiceNo] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [customerName, setCustomerName] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [paymentTerm, setPaymentTerm] = useState('Paid');
  const [dueDate, setDueDate] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([newLineItem()]);
  const [logistics, setLogistics] = useState<LogisticsEntry[]>([]);
  const [logisticsTax, setLogisticsTax] = useState(18);
  const [attachUPI, setAttachUPI] = useState(false);
  const [collectNow, setCollectNow] = useState(false);
  const [narration, setNarration] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Party search
  const [partySearch, setPartySearch] = useState('');
  const [partySuggestions, setPartySuggestions] = useState<{id:string;name:string}[]>([]);
  const partyTimer = useRef<any>(null);

  useEffect(() => {
    // Get next invoice number
    if (company?.guid) {
      createApi.getNextVoucherNumber(company.guid, 'sales-invoice')
        .then(r => setInvoiceNo(r.data?.number ?? ''))
        .catch(() => {});
    }
  }, [company?.guid]);

  const searchParties = (q: string) => {
    setPartySearch(q);
    setCustomerName(q);
    clearTimeout(partyTimer.current);
    if (!q.trim() || !company?.guid) { setPartySuggestions([]); return; }
    partyTimer.current = setTimeout(async () => {
      try {
        const res = await salesApi.getParties(company.guid, q);
        setPartySuggestions(res.data?.data ?? res.data ?? []);
      } catch { setPartySuggestions([]); }
    }, 300);
  };

  // Totals
  const itemTotals = lineItems.map(calcItem);
  const subtotal = itemTotals.reduce((s, t) => s + t.afterDisc, 0);
  const totalDiscount = itemTotals.reduce((s, t) => s + t.disc, 0);
  const totalTax = itemTotals.reduce((s, t) => s + t.tax, 0);
  const totalLogistics = logistics.reduce((s, l) => s + (parseFloat(l.amount) || 0), 0);
  const logisticsTaxAmt = totalLogistics * logisticsTax / 100;
  const grandTotal = subtotal + totalTax + totalLogistics + logisticsTaxAmt;

  const updateItem = (id: string, key: keyof LineItem, value: string | number) =>
    setLineItems(prev => prev.map(item => item.id === id ? { ...item, [key]: value } : item));

  const removeItem = (id: string) =>
    setLineItems(prev => prev.filter(item => item.id !== id));

  const updateLogistics = (id: string, key: keyof LogisticsEntry, value: string) =>
    setLogistics(prev => prev.map(l => l.id === id ? { ...l, [key]: value } : l));

  const handleSubmit = async () => {
    if (!customerName.trim()) { setError('Customer name is required'); return; }
    if (lineItems.some(i => !i.productName || !i.unitPrice)) {
      setError('All items must have a product name and price'); return;
    }
    setLoading(true); setError(null);
    try {
      await createApi.createSalesInvoice({
        companyGuid: company?.guid,
        ledger, isOptional, invoiceNo, invoiceDate,
        customerName, customerId, paymentTerm, dueDate, narration,
        items: lineItems.map((item, idx) => ({
          ...item, ...calcItem(item), sortOrder: idx,
        })),
        logistics: logistics.map(l => ({ ...l, taxRate: logisticsTax })),
        totalLogistics, grandTotal,
      });
      Toast.show({ type: 'success', text1: 'Invoice created!', text2: `${invoiceNo}` });
      navigation.goBack();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <AppText style={styles.backText}>←</AppText>
          </TouchableOpacity>
          <AppText style={styles.headerTitle}>Invoice Creation</AppText>
          <View style={styles.optionalRow}>
            <AppText style={styles.optionalLabel}>Optional</AppText>
            <Switch value={isOptional} onValueChange={setIsOptional}
              trackColor={{ true: Colors.brandPrimary, false: Colors.borderDefault }}
              thumbColor={Colors.white} />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {error && <ErrorBanner message={error} onRetry={() => setError(null)} />}

          {/* ── Section: Party Info ── */}
          <SectionHeader title="Party Information" />
          <Field label="Ledger *" value={ledger} onChange={setLedger} placeholder="Cash Sales" />
          <View style={styles.row2}>
            <View style={styles.flex1}>
              <Field label="Invoice No." value={invoiceNo} onChange={setInvoiceNo} placeholder="Auto" />
            </View>
            <View style={styles.flex1}>
              <Field label="Invoice Date" value={invoiceDate} onChange={setInvoiceDate} placeholder="YYYY-MM-DD" />
            </View>
          </View>

          {/* Party search with suggestions */}
          <AppText style={styles.fieldLabel}>Customer *</AppText>
          <View>
            <TextInput
              style={styles.input}
              value={partySearch}
              onChangeText={searchParties}
              placeholder="Search or type customer name"
              placeholderTextColor={Colors.textTertiary}
              allowFontScaling={false}
            />
            {partySuggestions.length > 0 && (
              <View style={styles.suggestions}>
                {partySuggestions.map(p => (
                  <TouchableOpacity key={p.id} style={styles.suggestionItem}
                    onPress={() => { setCustomerName(p.name); setCustomerId(p.id); setPartySearch(p.name); setPartySuggestions([]); }}>
                    <AppText style={styles.suggestionText}>{p.name}</AppText>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.row2}>
            <View style={styles.flex1}>
              <AppText style={styles.fieldLabel}>Payment Terms</AppText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                {STATIC_PAYMENT_TERMS.map(t => (
                  <TouchableOpacity key={t} onPress={() => setPaymentTerm(t)}
                    style={[styles.termChip, paymentTerm === t && styles.termChipActive]}>
                    <AppText style={[styles.termText, paymentTerm === t && styles.termTextActive]}>{t}</AppText>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          {/* ── Section: Items ── */}
          <SectionHeader title="Items / Products" />
          {lineItems.map((item, idx) => (
            <LineItemRow
              key={item.id}
              item={item}
              index={idx}
              onChange={(k, v) => updateItem(item.id, k, v)}
              onRemove={() => removeItem(item.id)}
              totals={itemTotals[idx]}
            />
          ))}
          <TouchableOpacity onPress={() => setLineItems(p => [...p, newLineItem()])} style={styles.addRow}>
            <AppText style={styles.addRowText}>+ Add Item</AppText>
          </TouchableOpacity>

          {/* ── Section: Logistics ── */}
          <SectionHeader title="Logistics / Shipping" />
          {logistics.map(l => (
            <LogisticsRow
              key={l.id}
              entry={l}
              onChange={(k, v) => updateLogistics(l.id, k, v)}
              onRemove={() => setLogistics(p => p.filter(x => x.id !== l.id))}
            />
          ))}
          <TouchableOpacity onPress={() => setLogistics(p => [...p, newLogisticsEntry()])} style={styles.addRow}>
            <AppText style={styles.addRowText}>+ Add Logistics</AppText>
          </TouchableOpacity>

          {/* ── Section: Payment ── */}
          <SectionHeader title="Payment" />
          <View style={styles.toggleRow}>
            <AppText style={styles.toggleLabel}>Attach UPI QR Code</AppText>
            <Switch value={attachUPI} onValueChange={setAttachUPI}
              trackColor={{ true: Colors.brandPrimary, false: Colors.borderDefault }}
              thumbColor={Colors.white} />
          </View>
          <View style={styles.toggleRow}>
            <AppText style={styles.toggleLabel}>Collect Payment Now</AppText>
            <Switch value={collectNow} onValueChange={setCollectNow}
              trackColor={{ true: Colors.brandPrimary, false: Colors.borderDefault }}
              thumbColor={Colors.white} />
          </View>

          <Field label="Narration" value={narration} onChange={setNarration} placeholder="Optional notes" multiline />

          {/* ── Summary (sticky) ── */}
          <Card style={styles.summaryCard}>
            <AppText style={styles.summaryTitle}>Summary</AppText>
            <SummaryRow label="Subtotal" value={subtotal} />
            <SummaryRow label="Discount" value={-totalDiscount} negative />
            <SummaryRow label="Taxes" value={totalTax} />
            {totalLogistics > 0 && <SummaryRow label="Logistics" value={totalLogistics + logisticsTaxAmt} />}
            <View style={styles.divider} />
            <View style={styles.grandRow}>
              <AppText style={styles.grandLabel}>Grand Total</AppText>
              <AppText style={styles.grandValue}>₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</AppText>
            </View>
          </Card>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Sticky Footer */}
        <View style={styles.footer}>
          <Button label={loading ? 'Submitting...' : 'Submit Invoice'} onPress={handleSubmit} loading={loading} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Sub-components ────────────────────────────────────────────────
function SectionHeader({ title }: { title: string }) {
  return (
    <View style={sub.sectionHeader}>
      <AppText style={sub.sectionTitle}>{title}</AppText>
    </View>
  );
}

function Field({ label, value, onChange, placeholder, keyboardType, multiline }: any) {
  return (
    <View style={{ marginBottom: Spacing.sm }}>
      <AppText style={styles.fieldLabel}>{label}</AppText>
      <TextInput
        style={[styles.input, multiline && { height: 72, textAlignVertical: 'top' }]}
        value={value} onChangeText={onChange} placeholder={placeholder}
        placeholderTextColor={Colors.textTertiary}
        keyboardType={keyboardType ?? 'default'} multiline={multiline}
        allowFontScaling={false}
      />
    </View>
  );
}

function SummaryRow({ label, value, negative }: { label: string; value: number; negative?: boolean }) {
  const display = negative && value !== 0 ? `-₹${Math.abs(value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  return (
    <View style={sub.summaryRow}>
      <AppText style={sub.summaryLabel}>{label}</AppText>
      <AppText style={[sub.summaryValue, negative && value !== 0 && { color: Colors.negativeText }]}>{display}</AppText>
    </View>
  );
}

function LineItemRow({ item, index, onChange, onRemove, totals }: {
  item: LineItem; index: number;
  onChange: (k: keyof LineItem, v: string | number) => void;
  onRemove: () => void;
  totals: ReturnType<typeof calcItem>;
}) {
  return (
    <Card style={sub.lineCard}>
      <View style={sub.lineHeader}>
        <AppText style={sub.lineTitle}>Item {index + 1}</AppText>
        <TouchableOpacity onPress={onRemove}><AppText style={sub.removeText}>✕</AppText></TouchableOpacity>
      </View>
      <TextInput style={styles.input} value={item.productName} onChangeText={v => onChange('productName', v)}
        placeholder="Product name" placeholderTextColor={Colors.textTertiary} allowFontScaling={false} />
      <View style={sub.lineRow}>
        <View style={sub.qtyWrap}>
          <AppText style={styles.fieldLabel}>Qty</AppText>
          <TextInput style={[styles.input, sub.smallInput]} value={item.quantity} onChangeText={v => onChange('quantity', v)}
            keyboardType="decimal-pad" allowFontScaling={false} />
        </View>
        <View style={sub.unitWrap}>
          <AppText style={styles.fieldLabel}>Unit</AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 4 }}>
            {STATIC_UNITS.slice(0, 5).map(u => (
              <TouchableOpacity key={u} onPress={() => onChange('unit', u)}
                style={[sub.unitChip, item.unit === u && sub.unitChipActive]}>
                <AppText style={[sub.unitText, item.unit === u && sub.unitTextActive]}>{u}</AppText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        <View style={sub.priceWrap}>
          <AppText style={styles.fieldLabel}>Price</AppText>
          <TextInput style={[styles.input, sub.smallInput]} value={item.unitPrice} onChangeText={v => onChange('unitPrice', v)}
            keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={Colors.textTertiary} allowFontScaling={false} />
        </View>
      </View>
      {/* Discount + Tax */}
      <View style={sub.lineRow}>
        <View style={{ flex: 1 }}>
          <AppText style={styles.fieldLabel}>Discount</AppText>
          <View style={sub.discRow}>
            <TouchableOpacity onPress={() => onChange('discountType', item.discountType === '%' ? '₹' : '%')}
              style={sub.discToggle}>
              <AppText style={sub.discToggleText}>{item.discountType}</AppText>
            </TouchableOpacity>
            <TextInput style={[styles.input, { flex: 1 }]} value={item.discount} onChangeText={v => onChange('discount', v)}
              keyboardType="decimal-pad" allowFontScaling={false} />
          </View>
        </View>
        <View style={{ flex: 1, marginLeft: Spacing.sm }}>
          <AppText style={styles.fieldLabel}>GST %</AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 4 }}>
            {STATIC_GST_RATES.map(r => (
              <TouchableOpacity key={r} onPress={() => onChange('taxRate', r)}
                style={[sub.unitChip, item.taxRate === r && sub.unitChipActive]}>
                <AppText style={[sub.unitText, item.taxRate === r && sub.unitTextActive]}>{r}%</AppText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
      {item.hsnCode ? <AppText style={sub.hsnBadge}>HSN: {item.hsnCode}</AppText> : null}
      <View style={sub.lineFooter}>
        <AppText style={sub.subtotalLabel}>Subtotal:</AppText>
        <AppText style={sub.subtotalValue}>₹{totals.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</AppText>
      </View>
    </Card>
  );
}

function LogisticsRow({ entry, onChange, onRemove }: {
  entry: LogisticsEntry;
  onChange: (k: keyof LogisticsEntry, v: string) => void;
  onRemove: () => void;
}) {
  return (
    <Card style={sub.lineCard}>
      <View style={sub.lineHeader}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 4 }}>
          {STATIC_LOGISTICS_TYPES.map(t => (
            <TouchableOpacity key={t} onPress={() => onChange('type', t)}
              style={[sub.unitChip, entry.type === t && sub.unitChipActive]}>
              <AppText style={[sub.unitText, entry.type === t && sub.unitTextActive]}>{t}</AppText>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity onPress={onRemove}><AppText style={sub.removeText}>✕</AppText></TouchableOpacity>
      </View>
      <View style={sub.lineRow}>
        <View style={{ flex: 1 }}>
          <TextInput style={styles.input} value={entry.amount} onChangeText={v => onChange('amount', v)}
            placeholder="Amount" placeholderTextColor={Colors.textTertiary} keyboardType="decimal-pad" allowFontScaling={false} />
        </View>
        <View style={{ flex: 1, marginLeft: Spacing.sm }}>
          <TextInput style={styles.input} value={entry.trackingNo} onChangeText={v => onChange('trackingNo', v)}
            placeholder="Tracking No." placeholderTextColor={Colors.textTertiary} allowFontScaling={false} />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.pageBg },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.base, paddingVertical: 10,
    backgroundColor: Colors.cardBg, borderBottomWidth: 1, borderBottomColor: Colors.borderDefault,
  },
  backBtn: { padding: 4 },
  backText: { fontSize: 22, color: Colors.textPrimary },
  headerTitle: { flex: 1, fontSize: Typography.md, fontWeight: Typography.weightSemibold, textAlign: 'center' },
  optionalRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  optionalLabel: { fontSize: Typography.xs, color: Colors.textSecondary },
  content: { padding: Spacing.base },
  fieldLabel: { fontSize: Typography.sm, fontWeight: Typography.weightMedium, color: Colors.textSecondary, marginBottom: 4 },
  input: {
    borderWidth: 1, borderColor: Colors.borderDefault, borderRadius: Radius.sm,
    backgroundColor: Colors.cardBg, paddingHorizontal: Spacing.md, paddingVertical: 10,
    fontSize: Typography.base, color: Colors.textPrimary, marginBottom: Spacing.xs,
  },
  row2: { flexDirection: 'row', gap: Spacing.sm },
  flex1: { flex: 1 },
  suggestions: {
    backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.borderDefault,
    borderRadius: Radius.sm, marginBottom: Spacing.sm, zIndex: 10,
  },
  suggestionItem: { padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderDefault },
  suggestionText: { fontSize: Typography.base, color: Colors.textPrimary },
  termChip: { paddingHorizontal: Spacing.sm, paddingVertical: 5, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.borderDefault, backgroundColor: Colors.cardBg },
  termChipActive: { backgroundColor: Colors.brandPrimary, borderColor: Colors.brandPrimary },
  termText: { fontSize: Typography.xs, color: Colors.textSecondary },
  termTextActive: { color: Colors.white },
  addRow: { paddingVertical: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.borderDefault, borderRadius: Radius.sm, borderStyle: 'dashed', marginBottom: Spacing.base },
  addRowText: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.weightMedium },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.sm, marginBottom: Spacing.xs },
  toggleLabel: { fontSize: Typography.base, color: Colors.textPrimary },
  summaryCard: { marginVertical: Spacing.base },
  summaryTitle: { fontSize: Typography.base, fontWeight: Typography.weightSemibold, marginBottom: Spacing.sm },
  divider: { height: 1, backgroundColor: Colors.borderDefault, marginVertical: Spacing.sm },
  grandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  grandLabel: { fontSize: Typography.md, fontWeight: Typography.weightBold },
  grandValue: { fontSize: Typography.xl, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  footer: { padding: Spacing.base, backgroundColor: Colors.cardBg, borderTopWidth: 1, borderTopColor: Colors.borderDefault },
});

const sub = StyleSheet.create({
  sectionHeader: { marginTop: Spacing.base, marginBottom: Spacing.sm, paddingBottom: Spacing.xs, borderBottomWidth: 1, borderBottomColor: Colors.borderDefault },
  sectionTitle: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8 },
  lineCard: { marginBottom: Spacing.sm, padding: Spacing.sm },
  lineHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.xs },
  lineTitle: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: Colors.textSecondary },
  removeText: { fontSize: 16, color: Colors.negativeText, padding: 4 },
  lineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.xs, marginBottom: Spacing.xs },
  qtyWrap: { width: 70 },
  unitWrap: { flex: 1 },
  priceWrap: { width: 80 },
  smallInput: { paddingVertical: 6, paddingHorizontal: 8, fontSize: Typography.sm },
  unitChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.borderDefault, backgroundColor: Colors.pageBg },
  unitChipActive: { backgroundColor: Colors.brandPrimary, borderColor: Colors.brandPrimary },
  unitText: { fontSize: 11, color: Colors.textSecondary },
  unitTextActive: { color: Colors.white },
  discRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  discToggle: { width: 36, height: 40, backgroundColor: Colors.pageBg, borderWidth: 1, borderColor: Colors.borderDefault, borderRadius: Radius.xs, alignItems: 'center', justifyContent: 'center' },
  discToggleText: { fontSize: Typography.sm, fontWeight: '600', color: Colors.textPrimary },
  hsnBadge: { fontSize: 10, color: Colors.infoText, backgroundColor: Colors.infoBg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.full, alignSelf: 'flex-start', marginBottom: 4 },
  lineFooter: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 6, borderTopWidth: 1, borderTopColor: Colors.borderDefault, paddingTop: Spacing.xs },
  subtotalLabel: { fontSize: Typography.sm, color: Colors.textSecondary },
  subtotalValue: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: Colors.textPrimary },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  summaryLabel: { fontSize: Typography.base, color: Colors.textSecondary },
  summaryValue: { fontSize: Typography.base, color: Colors.textPrimary, fontWeight: Typography.weightMedium },
});
