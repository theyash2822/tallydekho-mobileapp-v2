import React, { useRef, useState } from 'react';
import {
  View, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, Switch, KeyboardAvoidingView, Platform,
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
  STATIC_UNITS, STATIC_GST_RATES, STATIC_LOGISTICS_TYPES, STATIC_TnC_TEMPLATES,
} from '../../constants/staticData';
import type { RootStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface QuoteItem {
  id: string; warehouse: string; productName: string;
  quantity: string; unit: string; unitPrice: string;
  discountType: '%' | '₹'; discount: string; taxRate: number;
}
interface LogisticsEntry { id: string; type: string; amount: string; trackingNo: string; }

const newItem = (): QuoteItem => ({
  id: Date.now().toString(), warehouse: '', productName: '',
  quantity: '1', unit: 'Pcs', unitPrice: '',
  discountType: '%', discount: '0', taxRate: 18,
});
const newLog = (): LogisticsEntry => ({ id: Date.now().toString(), type: 'Courier', amount: '', trackingNo: '' });

function calcItem(i: QuoteItem) {
  const qty = parseFloat(i.quantity) || 0, price = parseFloat(i.unitPrice) || 0;
  const base = qty * price;
  const disc = i.discountType === '%' ? base * (parseFloat(i.discount) || 0) / 100 : parseFloat(i.discount) || 0;
  const after = base - disc;
  const tax = after * i.taxRate / 100;
  return { base, disc, after, tax, subtotal: after + tax };
}

export default function CreateQuotationScreen() {
  const nav = useNavigation<Nav>();
  const { company } = useAuthStore();
  const [isOptional, setIsOptional] = useState(false);
  const [quotationNo, setQuotationNo] = useState('QTN-TD-0001');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [customerName, setCustomerName] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [partySuggestions, setPartySuggestions] = useState<{ id: string; name: string }[]>([]);
  const [validity, setValidity] = useState('30');
  const [referenceNo, setReferenceNo] = useState('');
  const [narration, setNarration] = useState('');
  const [items, setItems] = useState<QuoteItem[]>([newItem()]);
  const [logistics, setLogistics] = useState<LogisticsEntry[]>([]);
  const [logisticsTax, setLogisticsTax] = useState(18);
  const [tncChecked, setTncChecked] = useState<boolean[]>(STATIC_TnC_TEMPLATES.map(() => false));
  const [tncTexts, setTncTexts] = useState<string[]>([...STATIC_TnC_TEMPLATES]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const partyTimer = useRef<any>(null);

  const searchParties = (q: string) => {
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

  const totals = items.map(calcItem);
  const subtotal = totals.reduce((s, t) => s + t.after, 0);
  const totalDisc = totals.reduce((s, t) => s + t.disc, 0);
  const totalTax = totals.reduce((s, t) => s + t.tax, 0);
  const totalLog = logistics.reduce((s, l) => s + (parseFloat(l.amount) || 0), 0);
  const logTax = totalLog * logisticsTax / 100;
  const grandTotal = subtotal + totalTax + totalLog + logTax;

  const updateItem = (id: string, k: keyof QuoteItem, v: string | number) =>
    setItems(p => p.map(i => i.id === id ? { ...i, [k]: v } : i));
  const updateLog = (id: string, k: keyof LogisticsEntry, v: string) =>
    setLogistics(p => p.map(l => l.id === id ? { ...l, [k]: v } : l));

  const handleSubmit = async () => {
    if (!customerName.trim()) { setError('Customer name required'); return; }
    if (items.some(i => !i.productName || !i.unitPrice)) { setError('All items need name and price'); return; }
    setLoading(true); setError(null);
    try {
      await createApi.createQuotation({
        companyGuid: company?.guid, isOptional, quotationNo, date, customerName, customerId, validity, referenceNo, narration,
        items: items.map((i, idx) => ({ ...i, ...totals[idx], sortOrder: idx })),
        logistics: logistics.map(l => ({ ...l, taxRate: logisticsTax })),
        termsAndConditions: tncTexts.filter((_, i) => tncChecked[i]),
        grandTotal,
      });
      Toast.show({ type: 'success', text1: 'Quotation created!', text2: quotationNo });
      nav.goBack();
    } catch (e: any) { setError(e?.message ?? 'Failed to create quotation'); }
    finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => nav.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}><AppText style={s.back}>←</AppText></TouchableOpacity>
          <AppText style={s.title}>Create Quotation</AppText>
          <View style={s.optRow}><AppText style={s.optLbl}>Optional</AppText><Switch value={isOptional} onValueChange={setIsOptional} trackColor={{ true: Colors.brandPrimary, false: Colors.borderDefault }} thumbColor={Colors.white} /></View>
        </View>
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {error && <ErrorBanner message={error} onRetry={() => setError(null)} />}
          <View style={s.row2}><View style={s.f1}><F label="Quotation No." value={quotationNo} onChange={setQuotationNo} placeholder="QTN-TD-0001" /></View><View style={s.f1}><F label="Date" value={date} onChange={setDate} placeholder="YYYY-MM-DD" /></View></View>

          <AppText style={s.lbl}>Customer *</AppText>
          <TextInput style={s.inp} value={customerName} onChangeText={searchParties} placeholder="Search customer..." placeholderTextColor={Colors.textTertiary} allowFontScaling={false} />
          {partySuggestions.length > 0 && (
            <View style={s.suggestions}>
              {partySuggestions.map(p => (<TouchableOpacity key={p.id} style={s.suggItem} onPress={() => { setCustomerName(p.name); setCustomerId(p.id); setPartySuggestions([]); }}><AppText style={s.suggText}>{p.name}</AppText></TouchableOpacity>))}
            </View>
          )}

          <View style={s.row2}>
            <View style={s.f1}><F label="Valid for (days)" value={validity} onChange={setValidity} placeholder="30" keyboardType="numeric" /></View>
            <View style={s.f1}><F label="Reference No." value={referenceNo} onChange={setReferenceNo} placeholder="Optional" /></View>
          </View>
          <F label="Narration" value={narration} onChange={setNarration} placeholder="Optional notes..." multiline />

          {/* Items */}
          <View style={s.sH}><AppText style={s.sHT}>Quote Items</AppText></View>
          {items.map((item, idx) => (
            <Card key={item.id} style={s.iCard}>
              <View style={s.iHead}><AppText style={s.iTitle}>Item {idx + 1}</AppText><TouchableOpacity onPress={() => setItems(p => p.filter(i => i.id !== item.id))}><AppText style={s.rm}>✕</AppText></TouchableOpacity></View>
              <TextInput style={s.inp} value={item.productName} onChangeText={v => updateItem(item.id, 'productName', v)} placeholder="Product name" placeholderTextColor={Colors.textTertiary} allowFontScaling={false} />
              <View style={s.row2}>
                <View style={{ width: 70 }}><AppText style={s.lbl}>Qty</AppText><TextInput style={[s.inp, s.sm]} value={item.quantity} onChangeText={v => updateItem(item.id, 'quantity', v)} keyboardType="decimal-pad" allowFontScaling={false} /></View>
                <View style={{ flex: 1 }}><AppText style={s.lbl}>Unit</AppText><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 4 }}>{STATIC_UNITS.slice(0, 5).map(u => (<TouchableOpacity key={u} onPress={() => updateItem(item.id, 'unit', u)} style={[s.chip, item.unit === u && s.chipA]}><AppText style={[s.chipT, item.unit === u && s.chipTA]}>{u}</AppText></TouchableOpacity>))}</ScrollView></View>
                <View style={{ width: 80 }}><AppText style={s.lbl}>Price</AppText><TextInput style={[s.inp, s.sm]} value={item.unitPrice} onChangeText={v => updateItem(item.id, 'unitPrice', v)} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={Colors.textTertiary} allowFontScaling={false} /></View>
              </View>
              <View style={s.row2}>
                <View style={{ flex: 1 }}><AppText style={s.lbl}>GST %</AppText><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 4 }}>{STATIC_GST_RATES.map(r => (<TouchableOpacity key={r} onPress={() => updateItem(item.id, 'taxRate', r)} style={[s.chip, item.taxRate === r && s.chipA]}><AppText style={[s.chipT, item.taxRate === r && s.chipTA]}>{r}%</AppText></TouchableOpacity>))}</ScrollView></View>
              </View>
              <View style={s.iF}><AppText style={s.sLbl}>Subtotal</AppText><AppText style={s.sVal}>₹{(totals[idx]?.subtotal ?? 0).toFixed(2)}</AppText></View>
            </Card>
          ))}
          <TouchableOpacity onPress={() => setItems(p => [...p, newItem()])} style={s.addR}><AppText style={s.addRT}>+ Add Item</AppText></TouchableOpacity>

          {/* Logistics */}
          <View style={s.sH}><AppText style={s.sHT}>Logistics / Shipping</AppText></View>
          {logistics.map(l => (
            <Card key={l.id} style={s.iCard}>
              <View style={s.iHead}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 4 }}>{STATIC_LOGISTICS_TYPES.map(t => (<TouchableOpacity key={t} onPress={() => updateLog(l.id, 'type', t)} style={[s.chip, l.type === t && s.chipA]}><AppText style={[s.chipT, l.type === t && s.chipTA]}>{t}</AppText></TouchableOpacity>))}</ScrollView>
                <TouchableOpacity onPress={() => setLogistics(p => p.filter(x => x.id !== l.id))}><AppText style={s.rm}>✕</AppText></TouchableOpacity>
              </View>
              <View style={s.row2}>
                <TextInput style={[s.inp, { flex: 1 }]} value={l.amount} onChangeText={v => updateLog(l.id, 'amount', v)} placeholder="Amount" placeholderTextColor={Colors.textTertiary} keyboardType="decimal-pad" allowFontScaling={false} />
                <TextInput style={[s.inp, { flex: 1 }]} value={l.trackingNo} onChangeText={v => updateLog(l.id, 'trackingNo', v)} placeholder="Tracking No." placeholderTextColor={Colors.textTertiary} allowFontScaling={false} />
              </View>
            </Card>
          ))}
          <TouchableOpacity onPress={() => setLogistics(p => [...p, newLog()])} style={s.addR}><AppText style={s.addRT}>+ Add Logistics</AppText></TouchableOpacity>

          {/* Terms & Conditions */}
          <View style={s.sH}><AppText style={s.sHT}>Terms & Conditions</AppText></View>
          {STATIC_TnC_TEMPLATES.map((tnc, idx) => (
            <View key={idx} style={s.tncRow}>
              <TouchableOpacity onPress={() => setTncChecked(p => { const n = [...p]; n[idx] = !n[idx]; return n; })} style={[s.checkbox, tncChecked[idx] && s.checkboxA]}>
                {tncChecked[idx] && <AppText style={s.checkmark}>✓</AppText>}
              </TouchableOpacity>
              <TextInput style={[s.tncInput, !tncChecked[idx] && s.tncInputDisabled]} value={tncTexts[idx]} onChangeText={v => setTncTexts(p => { const n = [...p]; n[idx] = v; return n; })} editable={tncChecked[idx]} multiline allowFontScaling={false} />
            </View>
          ))}

          {/* Summary */}
          <Card style={s.sum}>
            <AppText style={s.sumTitle}>Summary</AppText>
            {[{ label: 'Subtotal', value: subtotal }, { label: 'Discounts', value: -totalDisc }, { label: 'Product Tax', value: totalTax }, { label: 'Logistics', value: totalLog }, { label: 'Logistics Tax', value: logTax }].map(r => (
              <View key={r.label} style={s.sR}><AppText style={s.sLbl}>{r.label}</AppText><AppText style={[s.sVal, r.value < 0 && { color: Colors.negativeText }]}>₹{Math.abs(r.value).toFixed(2)}</AppText></View>
            ))}
            <View style={s.div} />
            <View style={s.gRow}><AppText style={s.gLbl}>Grand Total</AppText><AppText style={s.gVal}>₹{grandTotal.toFixed(2)}</AppText></View>
          </Card>
          <View style={{ height: 100 }} />
        </ScrollView>
        <View style={s.footer}><Button label={loading ? 'Submitting...' : 'Submit Quotation'} onPress={handleSubmit} loading={loading} /></View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function F({ label, value, onChange, placeholder, keyboardType, multiline }: any) {
  return (<View style={{ marginBottom: Spacing.sm }}><AppText style={s.lbl}>{label}</AppText><TextInput style={[s.inp, multiline && { height: 72, textAlignVertical: 'top' }]} value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={Colors.textTertiary} keyboardType={keyboardType ?? 'default'} multiline={multiline} allowFontScaling={false} /></View>);
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.pageBg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: 10, backgroundColor: Colors.cardBg, borderBottomWidth: 1, borderBottomColor: Colors.borderDefault },
  back: { fontSize: 22, color: Colors.textPrimary, marginRight: Spacing.sm },
  title: { flex: 1, fontSize: Typography.md, fontWeight: Typography.weightSemibold },
  optRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  optLbl: { fontSize: Typography.xs, color: Colors.textSecondary },
  content: { padding: Spacing.base },
  row2: { flexDirection: 'row', gap: Spacing.sm },
  f1: { flex: 1 },
  lbl: { fontSize: Typography.sm, fontWeight: Typography.weightMedium, color: Colors.textSecondary, marginBottom: 4 },
  inp: { borderWidth: 1, borderColor: Colors.borderDefault, borderRadius: Radius.sm, backgroundColor: Colors.cardBg, paddingHorizontal: Spacing.md, paddingVertical: 10, fontSize: Typography.base, color: Colors.textPrimary, marginBottom: Spacing.xs },
  sm: { paddingVertical: 6, paddingHorizontal: 8, fontSize: Typography.sm },
  suggestions: { backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.borderDefault, borderRadius: Radius.sm, marginBottom: Spacing.sm },
  suggItem: { padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderDefault },
  suggText: { fontSize: Typography.base, color: Colors.textPrimary },
  sH: { marginTop: Spacing.sm, marginBottom: Spacing.sm, paddingBottom: Spacing.xs, borderBottomWidth: 1, borderBottomColor: Colors.borderDefault },
  sHT: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8 },
  addR: { paddingVertical: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.borderDefault, borderRadius: Radius.sm, borderStyle: 'dashed', marginBottom: Spacing.base },
  addRT: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.weightMedium },
  iCard: { marginBottom: Spacing.sm, padding: Spacing.sm },
  iHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.xs },
  iTitle: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: Colors.textSecondary },
  rm: { fontSize: 16, color: Colors.negativeText, padding: 4 },
  chip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.borderDefault, backgroundColor: Colors.pageBg },
  chipA: { backgroundColor: Colors.brandPrimary, borderColor: Colors.brandPrimary },
  chipT: { fontSize: 11, color: Colors.textSecondary },
  chipTA: { color: Colors.white },
  iF: { flexDirection: 'row', justifyContent: 'flex-end', borderTopWidth: 1, borderTopColor: Colors.borderDefault, paddingTop: Spacing.xs, gap: 6 },
  tncRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.sm },
  checkbox: { width: 22, height: 22, borderRadius: 4, borderWidth: 1.5, borderColor: Colors.borderStrong, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  checkboxA: { backgroundColor: Colors.brandPrimary, borderColor: Colors.brandPrimary },
  checkmark: { fontSize: 12, color: Colors.white, fontWeight: '700' },
  tncInput: { flex: 1, borderWidth: 1, borderColor: Colors.borderDefault, borderRadius: Radius.sm, backgroundColor: Colors.cardBg, padding: Spacing.sm, fontSize: Typography.sm, color: Colors.textPrimary, minHeight: 44 },
  tncInputDisabled: { backgroundColor: Colors.pageBg, color: Colors.textTertiary },
  sum: { marginVertical: Spacing.base, padding: Spacing.base },
  sumTitle: { fontSize: Typography.base, fontWeight: Typography.weightSemibold, marginBottom: Spacing.sm },
  sR: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  sLbl: { fontSize: Typography.base, color: Colors.textSecondary },
  sVal: { fontSize: Typography.base, color: Colors.textPrimary },
  div: { height: 1, backgroundColor: Colors.borderDefault, marginVertical: Spacing.sm },
  gRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  gLbl: { fontSize: Typography.md, fontWeight: Typography.weightBold },
  gVal: { fontSize: Typography.xl, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  footer: { padding: Spacing.base, backgroundColor: Colors.cardBg, borderTopWidth: 1, borderTopColor: Colors.borderDefault },
});
