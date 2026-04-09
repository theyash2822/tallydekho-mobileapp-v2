import React, { useEffect, useRef, useState } from 'react';
import {
  View, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, Switch, KeyboardAvoidingView, Platform, Image,
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

const newItem = (): LineItem => ({
  id: Date.now().toString(), productName: '',
  quantity: '1', unit: 'Pcs', unitPrice: '',
  discountType: '%', discount: '0', taxRate: 18,
  warehouseId: '', hsnCode: '',
});

const newLogistics = (): LogisticsEntry => ({
  id: Date.now().toString(), type: 'Courier',
  amount: '', trackingNo: '', remarks: '',
});

function calcItem(item: LineItem) {
  const qty = parseFloat(item.quantity) || 0;
  const price = parseFloat(item.unitPrice) || 0;
  const base = qty * price;
  const disc = item.discountType === '%' ? base * (parseFloat(item.discount) || 0) / 100 : parseFloat(item.discount) || 0;
  const afterDisc = base - disc;
  const tax = afterDisc * item.taxRate / 100;
  return { base, disc, afterDisc, tax, subtotal: afterDisc + tax };
}

export default function CreatePurchaseInvoiceScreen() {
  const navigation = useNavigation<Nav>();
  const { company } = useAuthStore();

  const [isOptional, setIsOptional] = useState(false);
  const [invoiceNo, setInvoiceNo] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [ledger, setLedger] = useState('Purchase - Finished Goods');
  const [vendorName, setVendorName] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [purchaseRef, setPurchaseRef] = useState('');
  const [paymentTerm, setPaymentTerm] = useState('Paid');
  const [lineItems, setLineItems] = useState<LineItem[]>([newItem()]);
  const [logistics, setLogistics] = useState<LogisticsEntry[]>([]);
  const [logisticsTax, setLogisticsTax] = useState(18);
  const [narration, setNarration] = useState('');
  const [scannedImageUri, setScannedImageUri] = useState<string | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const partyTimer = useRef<any>(null);
  const [partySuggestions, setPartySuggestions] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (company?.guid) {
      createApi.getNextVoucherNumber(company.guid, 'purchase-invoice')
        .then(r => setInvoiceNo(r.data?.number ?? ''))
        .catch(() => {});
    }
  }, [company?.guid]);

  const searchVendors = (q: string) => {
    setVendorName(q);
    clearTimeout(partyTimer.current);
    if (!q.trim() || !company?.guid) { setPartySuggestions([]); return; }
    partyTimer.current = setTimeout(async () => {
      try {
        const res = await salesApi.getParties(company.guid, q);
        setPartySuggestions(res.data?.data ?? res.data ?? []);
      } catch { setPartySuggestions([]); }
    }, 300);
  };

  const handleOCRScan = async () => {
    // TODO: integrate react-native-camera + react-native-mlkit-ocr
    // For now show placeholder
    Toast.show({ type: 'info', text1: 'OCR scan', text2: 'Camera integration coming soon' });
  };

  const itemTotals = lineItems.map(calcItem);
  const subtotal = itemTotals.reduce((s, t) => s + t.afterDisc, 0);
  const totalDiscount = itemTotals.reduce((s, t) => s + t.disc, 0);
  const totalTax = itemTotals.reduce((s, t) => s + t.tax, 0);
  const totalLogistics = logistics.reduce((s, l) => s + (parseFloat(l.amount) || 0), 0);
  const logisticsTaxAmt = totalLogistics * logisticsTax / 100;
  const grandTotal = subtotal + totalTax + totalLogistics + logisticsTaxAmt;

  const updateItem = (id: string, key: keyof LineItem, value: string | number) =>
    setLineItems(prev => prev.map(i => i.id === id ? { ...i, [key]: value } : i));

  const updateLogistics = (id: string, key: keyof LogisticsEntry, value: string) =>
    setLogistics(prev => prev.map(l => l.id === id ? { ...l, [key]: value } : l));

  const handleSubmit = async () => {
    if (!vendorName.trim()) { setError('Vendor name is required'); return; }
    if (lineItems.some(i => !i.productName || !i.unitPrice)) { setError('All items must have a name and price'); return; }
    setLoading(true); setError(null);
    try {
      await createApi.createPurchaseInvoice({
        companyGuid: company?.guid,
        ledger, isOptional, invoiceNo, invoiceDate,
        vendorName, vendorId, purchaseRef, paymentTerm, narration,
        items: lineItems.map((item, idx) => ({ ...item, ...calcItem(item), sortOrder: idx })),
        logistics: logistics.map(l => ({ ...l, taxRate: logisticsTax })),
        grandTotal,
      });
      Toast.show({ type: 'success', text1: 'Purchase invoice created!', text2: invoiceNo });
      navigation.goBack();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to create purchase invoice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <AppText style={s.back}>←</AppText>
          </TouchableOpacity>
          <AppText style={s.headerTitle}>Purchase Invoice</AppText>
          <View style={s.optRow}>
            <AppText style={s.optLabel}>Optional</AppText>
            <Switch value={isOptional} onValueChange={setIsOptional}
              trackColor={{ true: Colors.brandPrimary, false: Colors.borderDefault }} thumbColor={Colors.white} />
          </View>
        </View>

        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {error && <ErrorBanner message={error} onRetry={() => setError(null)} />}

          {/* ── OCR Scan Section ── */}
          <Card style={s.ocrCard}>
            <AppText style={s.sectionLabel}>Invoice Scanning & Upload (OCR)</AppText>
            <AppText style={s.ocrHint}>
              Scan vendor's invoice → fields auto-fill. Review before submitting.
            </AppText>
            <View style={s.ocrBtns}>
              <TouchableOpacity onPress={handleOCRScan} style={s.ocrBtn}>
                <AppText style={s.ocrIcon}>📷</AppText>
                <AppText style={s.ocrBtnText}>Scan Invoice</AppText>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleOCRScan} style={s.ocrBtn}>
                <AppText style={s.ocrIcon}>📄</AppText>
                <AppText style={s.ocrBtnText}>Upload PDF</AppText>
              </TouchableOpacity>
            </View>
            {scannedImageUri && (
              <Image source={{ uri: scannedImageUri }} style={s.ocrPreview} resizeMode="contain" />
            )}
          </Card>

          {/* Ledger + Invoice details */}
          <F label="Ledger *" value={ledger} onChange={setLedger} placeholder="Purchase - Finished Goods" />
          <View style={s.row2}>
            <View style={s.flex1}>
              <F label="Invoice No." value={invoiceNo} onChange={setInvoiceNo} placeholder="Auto" />
            </View>
            <View style={s.flex1}>
              <F label="Invoice Date" value={invoiceDate} onChange={setInvoiceDate} placeholder="YYYY-MM-DD" />
            </View>
          </View>

          {/* Vendor search */}
          <AppText style={s.fieldLabel}>Vendor *</AppText>
          <TextInput style={s.input} value={vendorName} onChangeText={searchVendors}
            placeholder="Search or type vendor name" placeholderTextColor={Colors.textTertiary} allowFontScaling={false} />
          {partySuggestions.length > 0 && (
            <View style={s.suggestions}>
              {partySuggestions.map(p => (
                <TouchableOpacity key={p.id} style={s.suggItem}
                  onPress={() => { setVendorName(p.name); setVendorId(p.id); setPartySuggestions([]); }}>
                  <AppText style={s.suggText}>{p.name}</AppText>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <F label="Purchase Reference No." value={purchaseRef} onChange={setPurchaseRef} placeholder="Internal reference" />

          <AppText style={s.fieldLabel}>Payment Terms</AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: Spacing.base }}>
            {STATIC_PAYMENT_TERMS.map(t => (
              <TouchableOpacity key={t} onPress={() => setPaymentTerm(t)}
                style={[s.termChip, paymentTerm === t && s.termChipActive]}>
                <AppText style={[s.termText, paymentTerm === t && s.termTextActive]}>{t}</AppText>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Items */}
          <SH title="Stocks / Products" />
          {lineItems.map((item, idx) => (
            <ItemRow key={item.id} item={item} index={idx}
              onChange={(k: keyof LineItem, v: string | number) => updateItem(item.id, k, v)}
              onRemove={() => setLineItems(p => p.filter(i => i.id !== item.id))}
              totals={itemTotals[idx]} />
          ))}
          <TouchableOpacity onPress={() => setLineItems(p => [...p, newItem()])} style={s.addRow}>
            <AppText style={s.addRowText}>+ Add Item</AppText>
          </TouchableOpacity>

          {/* Logistics */}
          <SH title="Logistics / Shipping" />
          {logistics.map(l => (
            <LogRow key={l.id} entry={l}
              onChange={(k: keyof LogisticsEntry, v: string) => updateLogistics(l.id, k, v)}
              onRemove={() => setLogistics(p => p.filter(x => x.id !== l.id))} />
          ))}
          <TouchableOpacity onPress={() => setLogistics(p => [...p, newLogistics()])} style={s.addRow}>
            <AppText style={s.addRowText}>+ Add Logistics</AppText>
          </TouchableOpacity>

          <F label="Narration" value={narration} onChange={setNarration} placeholder="Optional notes" multiline />

          {/* Summary */}
          <Card style={s.summaryCard}>
            <AppText style={s.summaryTitle}>Summary</AppText>
            <SR label="Subtotal" value={subtotal} />
            <SR label="Discount" value={-totalDiscount} negative />
            <SR label="Taxes" value={totalTax} />
            {totalLogistics > 0 && <SR label="Logistics" value={totalLogistics + logisticsTaxAmt} />}
            <View style={s.divider} />
            <View style={s.grandRow}>
              <AppText style={s.grandLabel}>Grand Total</AppText>
              <AppText style={s.grandValue}>₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</AppText>
            </View>
          </Card>

          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={s.footer}>
          <View style={s.footerBtns}>
            <Button label="Save Draft" onPress={() => Toast.show({ type: 'info', text1: 'Saved as draft' })}
              variant="secondary" style={{ flex: 1 }} />
            <Button label={loading ? 'Submitting...' : 'Submit'} onPress={handleSubmit}
              loading={loading} style={{ flex: 2 }} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SH({ title }: { title: string }) {
  return (
    <View style={s.sH}>
      <AppText style={s.sHText}>{title}</AppText>
    </View>
  );
}

function F({ label, value, onChange, placeholder, keyboardType, multiline }: any) {
  return (
    <View style={{ marginBottom: Spacing.sm }}>
      <AppText style={s.fieldLabel}>{label}</AppText>
      <TextInput style={[s.input, multiline && { height: 72, textAlignVertical: 'top' }]}
        value={value} onChangeText={onChange} placeholder={placeholder}
        placeholderTextColor={Colors.textTertiary} keyboardType={keyboardType ?? 'default'}
        multiline={multiline} allowFontScaling={false} />
    </View>
  );
}

function SR({ label, value, negative }: { label: string; value: number; negative?: boolean }) {
  const display = negative && value !== 0 ? `-₹${Math.abs(value).toFixed(2)}` : `₹${value.toFixed(2)}`;
  return (
    <View style={s.sRow}>
      <AppText style={s.sLabel}>{label}</AppText>
      <AppText style={[s.sValue, negative && value !== 0 && { color: Colors.negativeText }]}>{display}</AppText>
    </View>
  );
}

function ItemRow({ item, index, onChange, onRemove, totals }: any) {
  return (
    <Card style={s.lineCard}>
      <View style={s.lineHead}>
        <AppText style={s.lineTitle}>Item {index + 1}</AppText>
        <TouchableOpacity onPress={onRemove}><AppText style={s.removeText}>✕</AppText></TouchableOpacity>
      </View>
      <TextInput style={s.input} value={item.productName} onChangeText={(v: string) => onChange('productName', v)}
        placeholder="Product name" placeholderTextColor={Colors.textTertiary} allowFontScaling={false} />
      <View style={s.row2}>
        <View style={{ width: 70 }}>
          <AppText style={s.fieldLabel}>Qty</AppText>
          <TextInput style={[s.input, s.smallInput]} value={item.quantity} onChangeText={(v: string) => onChange('quantity', v)}
            keyboardType="decimal-pad" allowFontScaling={false} />
        </View>
        <View style={{ flex: 1 }}>
          <AppText style={s.fieldLabel}>Unit</AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 4 }}>
            {STATIC_UNITS.slice(0, 5).map((u: string) => (
              <TouchableOpacity key={u} onPress={() => onChange('unit', u)}
                style={[s.chip, item.unit === u && s.chipActive]}>
                <AppText style={[s.chipText, item.unit === u && s.chipTextActive]}>{u}</AppText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        <View style={{ width: 80 }}>
          <AppText style={s.fieldLabel}>Price</AppText>
          <TextInput style={[s.input, s.smallInput]} value={item.unitPrice} onChangeText={(v: string) => onChange('unitPrice', v)}
            keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={Colors.textTertiary} allowFontScaling={false} />
        </View>
      </View>
      <View style={s.row2}>
        <View style={{ flex: 1 }}>
          <AppText style={s.fieldLabel}>Discount</AppText>
          <View style={{ flexDirection: 'row', gap: 4 }}>
            <TouchableOpacity onPress={() => onChange('discountType', item.discountType === '%' ? '₹' : '%')} style={s.dToggle}>
              <AppText style={s.dToggleText}>{item.discountType}</AppText>
            </TouchableOpacity>
            <TextInput style={[s.input, { flex: 1 }]} value={item.discount} onChangeText={(v: string) => onChange('discount', v)}
              keyboardType="decimal-pad" allowFontScaling={false} />
          </View>
        </View>
        <View style={{ flex: 1, marginLeft: Spacing.sm }}>
          <AppText style={s.fieldLabel}>GST %</AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 4 }}>
            {STATIC_GST_RATES.map((r: number) => (
              <TouchableOpacity key={r} onPress={() => onChange('taxRate', r)}
                style={[s.chip, item.taxRate === r && s.chipActive]}>
                <AppText style={[s.chipText, item.taxRate === r && s.chipTextActive]}>{r}%</AppText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
      <View style={s.lineFoot}>
        <AppText style={s.sLabel}>Subtotal</AppText>
        <AppText style={s.sValue}>₹{totals.subtotal.toFixed(2)}</AppText>
      </View>
    </Card>
  );
}

function LogRow({ entry, onChange, onRemove }: any) {
  return (
    <Card style={s.lineCard}>
      <View style={s.lineHead}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 4 }}>
          {STATIC_LOGISTICS_TYPES.map((t: string) => (
            <TouchableOpacity key={t} onPress={() => onChange('type', t)}
              style={[s.chip, entry.type === t && s.chipActive]}>
              <AppText style={[s.chipText, entry.type === t && s.chipTextActive]}>{t}</AppText>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity onPress={onRemove}><AppText style={s.removeText}>✕</AppText></TouchableOpacity>
      </View>
      <View style={s.row2}>
        <TextInput style={[s.input, { flex: 1 }]} value={entry.amount} onChangeText={(v: string) => onChange('amount', v)}
          placeholder="Amount" placeholderTextColor={Colors.textTertiary} keyboardType="decimal-pad" allowFontScaling={false} />
        <TextInput style={[s.input, { flex: 1 }]} value={entry.trackingNo} onChangeText={(v: string) => onChange('trackingNo', v)}
          placeholder="Tracking No." placeholderTextColor={Colors.textTertiary} allowFontScaling={false} />
      </View>
    </Card>
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
  headerTitle: { flex: 1, fontSize: Typography.md, fontWeight: Typography.weightSemibold },
  optRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  optLabel: { fontSize: Typography.xs, color: Colors.textSecondary },
  content: { padding: Spacing.base },
  ocrCard: { marginBottom: Spacing.base, padding: Spacing.md },
  sectionLabel: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 },
  ocrHint: { fontSize: Typography.sm, color: Colors.textSecondary, marginBottom: Spacing.sm },
  ocrBtns: { flexDirection: 'row', gap: Spacing.sm },
  ocrBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1, borderColor: Colors.borderDefault, borderRadius: Radius.sm,
    paddingVertical: Spacing.md, backgroundColor: Colors.pageBg,
  },
  ocrIcon: { fontSize: 20 },
  ocrBtnText: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.weightMedium },
  ocrPreview: { width: '100%', height: 160, borderRadius: Radius.sm, marginTop: Spacing.sm },
  row2: { flexDirection: 'row', gap: Spacing.sm },
  flex1: { flex: 1 },
  fieldLabel: { fontSize: Typography.sm, fontWeight: Typography.weightMedium, color: Colors.textSecondary, marginBottom: 4 },
  input: {
    borderWidth: 1, borderColor: Colors.borderDefault, borderRadius: Radius.sm,
    backgroundColor: Colors.cardBg, paddingHorizontal: Spacing.md, paddingVertical: 10,
    fontSize: Typography.base, color: Colors.textPrimary, marginBottom: Spacing.xs,
  },
  smallInput: { paddingVertical: 6, paddingHorizontal: 8, fontSize: Typography.sm },
  suggestions: { backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.borderDefault, borderRadius: Radius.sm, marginBottom: Spacing.sm },
  suggItem: { padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderDefault },
  suggText: { fontSize: Typography.base, color: Colors.textPrimary },
  termChip: { paddingHorizontal: Spacing.sm, paddingVertical: 5, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.borderDefault, backgroundColor: Colors.cardBg },
  termChipActive: { backgroundColor: Colors.brandPrimary, borderColor: Colors.brandPrimary },
  termText: { fontSize: Typography.xs, color: Colors.textSecondary },
  termTextActive: { color: Colors.white },
  sH: { marginTop: Spacing.sm, marginBottom: Spacing.sm, paddingBottom: Spacing.xs, borderBottomWidth: 1, borderBottomColor: Colors.borderDefault },
  sHText: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8 },
  addRow: { paddingVertical: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.borderDefault, borderRadius: Radius.sm, borderStyle: 'dashed', marginBottom: Spacing.base },
  addRowText: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.weightMedium },
  summaryCard: { marginVertical: Spacing.base },
  summaryTitle: { fontSize: Typography.base, fontWeight: Typography.weightSemibold, marginBottom: Spacing.sm },
  divider: { height: 1, backgroundColor: Colors.borderDefault, marginVertical: Spacing.sm },
  grandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  grandLabel: { fontSize: Typography.md, fontWeight: Typography.weightBold },
  grandValue: { fontSize: Typography.xl, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  sRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  sLabel: { fontSize: Typography.base, color: Colors.textSecondary },
  sValue: { fontSize: Typography.base, color: Colors.textPrimary, fontWeight: Typography.weightMedium },
  footer: { padding: Spacing.base, backgroundColor: Colors.cardBg, borderTopWidth: 1, borderTopColor: Colors.borderDefault },
  footerBtns: { flexDirection: 'row', gap: Spacing.sm },
  lineCard: { marginBottom: Spacing.sm, padding: Spacing.sm },
  lineHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.xs },
  lineTitle: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: Colors.textSecondary },
  removeText: { fontSize: 16, color: Colors.negativeText, padding: 4 },
  chip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.borderDefault, backgroundColor: Colors.pageBg },
  chipActive: { backgroundColor: Colors.brandPrimary, borderColor: Colors.brandPrimary },
  chipText: { fontSize: 11, color: Colors.textSecondary },
  chipTextActive: { color: Colors.white },
  dToggle: { width: 36, height: 40, backgroundColor: Colors.pageBg, borderWidth: 1, borderColor: Colors.borderDefault, borderRadius: Radius.xs, alignItems: 'center', justifyContent: 'center' },
  dToggleText: { fontSize: Typography.sm, fontWeight: '600', color: Colors.textPrimary },
  lineFoot: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 6, borderTopWidth: 1, borderTopColor: Colors.borderDefault, paddingTop: Spacing.xs },
});
