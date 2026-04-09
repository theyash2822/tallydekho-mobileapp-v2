import React, { useState } from 'react';
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
import {
  STATIC_UNITS, STATIC_GST_RATES, STATIC_LOGISTICS_TYPES, STATIC_PAYMENT_TERMS,
} from '../../constants/staticData';
import type { RootStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface LineItem {
  id: string;
  productName: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  discount: string;
  taxRate: number;
  warehouseId: string;
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
  unitPrice: '', discount: '0', taxRate: 18, warehouseId: '',
});

const newLogistics = (): LogisticsEntry => ({
  id: Date.now().toString(),
  type: 'Courier', amount: '', trackingNo: '', remarks: '',
});

function calcLine(item: LineItem) {
  const qty = parseFloat(item.quantity) || 0;
  const price = parseFloat(item.unitPrice) || 0;
  const disc = parseFloat(item.discount) || 0;
  const base = qty * price;
  const afterDisc = base - disc;
  const tax = afterDisc * item.taxRate / 100;
  return { base, disc, afterDisc, tax, subtotal: afterDisc + tax };
}

export default function CreatePurchaseOrderScreen() {
  const navigation = useNavigation<Nav>();
  const { company } = useAuthStore();

  const [isOptional, setIsOptional] = useState(false);
  const [poNo, setPoNo] = useState('PO-TD-00001');
  const [poDate, setPoDate] = useState(new Date().toISOString().slice(0, 10));
  const [vendorName, setVendorName] = useState('');
  const [paymentTerm, setPaymentTerm] = useState<string>(STATIC_PAYMENT_TERMS[0]);
  const [dueDate, setDueDate] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [narration, setNarration] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [logistics, setLogistics] = useState<LogisticsEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const calcs = lineItems.map(calcLine);
  const subtotal = calcs.reduce((s, c) => s + c.afterDisc, 0);
  const totalDiscount = calcs.reduce((s, c) => s + c.disc, 0);
  const totalTax = calcs.reduce((s, c) => s + c.tax, 0);
  const logisticsTotal = logistics.reduce((s, l) => s + (parseFloat(l.amount) || 0), 0);
  const grandTotal = subtotal + totalTax + logisticsTotal;

  const updateItem = (id: string, key: keyof LineItem, value: string | number) =>
    setLineItems(prev => prev.map(i => i.id === id ? { ...i, [key]: value } : i));

  const updateLogistics = (id: string, key: keyof LogisticsEntry, value: string) =>
    setLogistics(prev => prev.map(l => l.id === id ? { ...l, [key]: value } : l));

  const handleSubmit = async () => {
    if (!vendorName.trim()) { setError('Vendor name is required'); return; }
    setLoading(true); setError(null);
    try {
      await createApi.createPurchaseOrder({
        companyGuid: company?.guid,
        isOptional, poNo, poDate, vendorName,
        paymentTerm, dueDate, expectedDeliveryDate,
        warehouseId, narration,
        items: lineItems.map((item, i) => ({ ...item, ...calcs[i] })),
        logistics,
        grandTotal,
      });
      setSubmitted(true);
      Toast.show({ type: 'success', text1: 'Purchase order created!', text2: poNo });
    } catch (e: any) {
      setError(e?.message ?? 'Failed to create purchase order');
    } finally {
      setLoading(false);
    }
  };

  const handleConvertToInvoice = () => {
    navigation.navigate('CreatePurchaseInvoice', { prefillData: { voucherNumber: poNo } });
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <AppText style={s.back}>←</AppText>
          </TouchableOpacity>
          <AppText style={s.headerTitle}>Create Purchase Order</AppText>
          <View style={s.optRow}>
            <AppText style={s.optLabel}>Optional</AppText>
            <Switch
              value={isOptional}
              onValueChange={setIsOptional}
              trackColor={{ true: Colors.brandPrimary, false: Colors.borderDefault }}
              thumbColor={Colors.white}
            />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={s.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {error && <ErrorBanner message={error} onRetry={() => setError(null)} />}

          {submitted && (
            <Card style={s.successCard}>
              <AppText style={s.successTitle}>✓ Purchase Order Created!</AppText>
              <AppText style={s.successSub}>{poNo}</AppText>
              <TouchableOpacity onPress={handleConvertToInvoice} style={s.convertBtn}>
                <AppText style={s.convertBtnText}>Convert to Purchase Invoice →</AppText>
              </TouchableOpacity>
            </Card>
          )}

          <View style={s.row2}>
            <View style={s.flex1}>
              <F label="PO Number" value={poNo} onChange={setPoNo} placeholder="PO-TD-00001" />
            </View>
            <View style={s.flex1}>
              <F label="PO Date" value={poDate} onChange={setPoDate} placeholder="YYYY-MM-DD" />
            </View>
          </View>

          <F label="Vendor Name *" value={vendorName} onChange={setVendorName} placeholder="Search vendor..." />

          {/* Payment Terms */}
          <View style={{ marginBottom: Spacing.sm }}>
            <AppText style={s.fieldLabel}>Payment Terms</AppText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              {STATIC_PAYMENT_TERMS.map(pt => (
                <TouchableOpacity
                  key={pt}
                  onPress={() => setPaymentTerm(pt)}
                  style={[s.chip, paymentTerm === pt && s.chipActive]}
                >
                  <AppText style={[s.chipText, paymentTerm === pt && s.chipTextActive]}>{pt}</AppText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={s.row2}>
            <View style={s.flex1}>
              <F label="Due Date" value={dueDate} onChange={setDueDate} placeholder="YYYY-MM-DD" />
            </View>
            <View style={s.flex1}>
              <F label="Expected Delivery" value={expectedDeliveryDate} onChange={setExpectedDeliveryDate} placeholder="YYYY-MM-DD" />
            </View>
          </View>

          <F label="Warehouse" value={warehouseId} onChange={setWarehouseId} placeholder="Select warehouse..." />
          <F label="Narration" value={narration} onChange={setNarration} placeholder="Order notes..." multiline />

          {/* Products */}
          <View style={s.sH}>
            <AppText style={s.sHText}>Products</AppText>
          </View>

          {lineItems.map((item, idx) => (
            <Card key={item.id} style={s.itemCard}>
              <View style={s.itemHead}>
                <AppText style={s.itemTitle}>Item {idx + 1}</AppText>
                <TouchableOpacity onPress={() => setLineItems(p => p.filter(i => i.id !== item.id))}>
                  <AppText style={s.removeText}>✕</AppText>
                </TouchableOpacity>
              </View>

              <TextInput
                style={s.input}
                value={item.productName}
                onChangeText={v => updateItem(item.id, 'productName', v)}
                placeholder="Product name"
                placeholderTextColor={Colors.textTertiary}
                allowFontScaling={false}
              />

              <View style={s.row2}>
                <View style={{ width: 70 }}>
                  <AppText style={s.fieldLabel}>Qty</AppText>
                  <TextInput
                    style={[s.input, s.smallInput]}
                    value={item.quantity}
                    onChangeText={v => updateItem(item.id, 'quantity', v)}
                    keyboardType="decimal-pad"
                    allowFontScaling={false}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText style={s.fieldLabel}>Unit</AppText>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 4 }}>
                    {STATIC_UNITS.slice(0, 5).map(u => (
                      <TouchableOpacity
                        key={u}
                        onPress={() => updateItem(item.id, 'unit', u)}
                        style={[s.chip, item.unit === u && s.chipActive]}
                      >
                        <AppText style={[s.chipText, item.unit === u && s.chipTextActive]}>{u}</AppText>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                <View style={{ width: 80 }}>
                  <AppText style={s.fieldLabel}>Price</AppText>
                  <TextInput
                    style={[s.input, s.smallInput]}
                    value={item.unitPrice}
                    onChangeText={v => updateItem(item.id, 'unitPrice', v)}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor={Colors.textTertiary}
                    allowFontScaling={false}
                  />
                </View>
              </View>

              <View style={{ flex: 1 }}>
                <AppText style={s.fieldLabel}>Tax %</AppText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 4 }}>
                  {STATIC_GST_RATES.map(r => (
                    <TouchableOpacity
                      key={r}
                      onPress={() => updateItem(item.id, 'taxRate', r)}
                      style={[s.chip, item.taxRate === r && s.chipActive]}
                    >
                      <AppText style={[s.chipText, item.taxRate === r && s.chipTextActive]}>{r}%</AppText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={s.itemFoot}>
                <AppText style={s.subtotalLabel}>Subtotal</AppText>
                <AppText style={s.subtotalValue}>₹{(calcs[idx]?.subtotal ?? 0).toFixed(2)}</AppText>
              </View>
            </Card>
          ))}

          <TouchableOpacity
            onPress={() => setLineItems(p => [...p, newLineItem()])}
            style={s.addRow}
          >
            <AppText style={s.addRowText}>+ Add Product</AppText>
          </TouchableOpacity>

          {/* Logistics */}
          <View style={s.sH}>
            <AppText style={s.sHText}>Logistics</AppText>
          </View>

          {logistics.map((l, idx) => (
            <Card key={l.id} style={s.itemCard}>
              <View style={s.itemHead}>
                <AppText style={s.itemTitle}>Logistics {idx + 1}</AppText>
                <TouchableOpacity onPress={() => setLogistics(p => p.filter(x => x.id !== l.id))}>
                  <AppText style={s.removeText}>✕</AppText>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: Spacing.xs }}>
                {STATIC_LOGISTICS_TYPES.map(lt => (
                  <TouchableOpacity
                    key={lt}
                    onPress={() => updateLogistics(l.id, 'type', lt)}
                    style={[s.chip, l.type === lt && s.chipActive]}
                  >
                    <AppText style={[s.chipText, l.type === lt && s.chipTextActive]}>{lt}</AppText>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View style={s.row2}>
                <View style={s.flex1}>
                  <TextInput
                    style={[s.input, s.smallInput]}
                    value={l.amount}
                    onChangeText={v => updateLogistics(l.id, 'amount', v)}
                    keyboardType="decimal-pad"
                    placeholder="Amount"
                    placeholderTextColor={Colors.textTertiary}
                    allowFontScaling={false}
                  />
                </View>
                <View style={s.flex1}>
                  <TextInput
                    style={[s.input, s.smallInput]}
                    value={l.trackingNo}
                    onChangeText={v => updateLogistics(l.id, 'trackingNo', v)}
                    placeholder="Tracking No."
                    placeholderTextColor={Colors.textTertiary}
                    allowFontScaling={false}
                  />
                </View>
              </View>
            </Card>
          ))}

          <TouchableOpacity
            onPress={() => setLogistics(p => [...p, newLogistics()])}
            style={s.addRow}
          >
            <AppText style={s.addRowText}>+ Add Logistics</AppText>
          </TouchableOpacity>

          {/* Summary */}
          <Card style={s.summaryCard}>
            <SR label="Subtotal" value={subtotal} />
            <SR label="Discounts" value={totalDiscount} />
            <SR label="Taxes" value={totalTax} />
            <SR label="Logistics" value={logisticsTotal} />
            <View style={s.divider} />
            <View style={s.grandRow}>
              <AppText style={s.grandLabel}>Grand Total</AppText>
              <AppText style={s.grandValue}>₹{grandTotal.toFixed(2)}</AppText>
            </View>
          </Card>

          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={s.footer}>
          {!submitted ? (
            <Button label={loading ? 'Submitting...' : 'Submit Purchase Order'} onPress={handleSubmit} loading={loading} />
          ) : (
            <Button label="Convert to Purchase Invoice" onPress={handleConvertToInvoice} />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function F({ label, value, onChange, placeholder, multiline }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; multiline?: boolean;
}) {
  return (
    <View style={{ marginBottom: Spacing.sm }}>
      <AppText style={s.fieldLabel}>{label}</AppText>
      <TextInput
        style={[s.input, multiline && { height: 72, textAlignVertical: 'top' }]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={Colors.textTertiary}
        multiline={multiline}
        allowFontScaling={false}
      />
    </View>
  );
}

function SR({ label, value }: { label: string; value: number }) {
  return (
    <View style={s.sRow}>
      <AppText style={s.sLabel}>{label}</AppText>
      <AppText style={s.sValue}>₹{value.toFixed(2)}</AppText>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.pageBg },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.base, paddingVertical: 10,
    backgroundColor: Colors.cardBg,
    borderBottomWidth: 1, borderBottomColor: Colors.borderDefault,
  },
  back: { fontSize: 22, color: Colors.textPrimary, marginRight: Spacing.sm },
  headerTitle: { flex: 1, fontSize: Typography.md, fontWeight: Typography.weightSemibold },
  optRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  optLabel: { fontSize: Typography.xs, color: Colors.textSecondary },
  content: { padding: Spacing.base },
  row2: { flexDirection: 'row', gap: Spacing.sm },
  flex1: { flex: 1 },
  fieldLabel: {
    fontSize: Typography.sm, fontWeight: Typography.weightMedium,
    color: Colors.textSecondary, marginBottom: 4,
  },
  input: {
    borderWidth: 1, borderColor: Colors.borderDefault,
    borderRadius: Radius.sm, backgroundColor: Colors.cardBg,
    paddingHorizontal: Spacing.md, paddingVertical: 10,
    fontSize: Typography.base, color: Colors.textPrimary, marginBottom: Spacing.xs,
  },
  smallInput: { paddingVertical: 6, paddingHorizontal: 8, fontSize: Typography.sm },
  chip: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: Radius.full, borderWidth: 1,
    borderColor: Colors.borderDefault, backgroundColor: Colors.pageBg,
  },
  chipActive: { backgroundColor: Colors.brandPrimary, borderColor: Colors.brandPrimary },
  chipText: { fontSize: 12, color: Colors.textSecondary },
  chipTextActive: { color: Colors.white },
  sH: {
    marginTop: Spacing.sm, marginBottom: Spacing.sm,
    paddingBottom: Spacing.xs, borderBottomWidth: 1, borderBottomColor: Colors.borderDefault,
  },
  sHText: {
    fontSize: Typography.sm, fontWeight: Typography.weightSemibold,
    color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8,
  },
  addRow: {
    paddingVertical: Spacing.md, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.borderDefault,
    borderRadius: Radius.sm, borderStyle: 'dashed', marginBottom: Spacing.base,
  },
  addRowText: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.weightMedium },
  itemCard: { marginBottom: Spacing.sm, padding: Spacing.sm },
  itemHead: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: Spacing.xs,
  },
  itemTitle: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: Colors.textSecondary },
  removeText: { fontSize: 16, color: Colors.negativeText, padding: 4 },
  itemFoot: {
    flexDirection: 'row', justifyContent: 'flex-end',
    borderTopWidth: 1, borderTopColor: Colors.borderDefault,
    paddingTop: Spacing.xs, gap: 6,
  },
  subtotalLabel: { fontSize: Typography.sm, color: Colors.textSecondary },
  subtotalValue: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: Colors.textPrimary },
  summaryCard: { marginVertical: Spacing.base, padding: Spacing.base },
  sRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  sLabel: { fontSize: Typography.base, color: Colors.textSecondary },
  sValue: { fontSize: Typography.base, color: Colors.textPrimary },
  divider: { height: 1, backgroundColor: Colors.borderDefault, marginVertical: Spacing.sm },
  grandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  grandLabel: { fontSize: Typography.md, fontWeight: Typography.weightBold },
  grandValue: { fontSize: Typography.xl, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  footer: {
    padding: Spacing.base, backgroundColor: Colors.cardBg,
    borderTopWidth: 1, borderTopColor: Colors.borderDefault,
  },
  successCard: {
    padding: Spacing.base, marginBottom: Spacing.base,
    backgroundColor: Colors.cardBg, alignItems: 'center', gap: 6,
  },
  successTitle: { fontSize: Typography.md, fontWeight: Typography.weightBold, color: Colors.positiveText },
  successSub: { fontSize: Typography.sm, color: Colors.textSecondary },
  convertBtn: {
    marginTop: 8, paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm,
    backgroundColor: Colors.brandPrimary, borderRadius: Radius.sm,
  },
  convertBtnText: { color: Colors.white, fontWeight: Typography.weightSemibold, fontSize: Typography.base },
});
