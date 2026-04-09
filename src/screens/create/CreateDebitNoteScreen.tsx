import React, { useState } from 'react';
import {
  View, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, Switch, KeyboardAvoidingView, Platform, Share,
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
import { STATIC_UNITS, STATIC_GST_RATES } from '../../constants/staticData';
import type { RootStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface ReturnItem {
  id: string;
  productName: string;
  quantity: string;
  unit: string;
  warehouseId: string;
  unitPrice: string;
  discount: string;
  taxRate: number;
}

const newReturnItem = (): ReturnItem => ({
  id: Date.now().toString(),
  productName: '',
  quantity: '1',
  unit: 'Pcs',
  warehouseId: '',
  unitPrice: '',
  discount: '0',
  taxRate: 18,
});

export default function CreateDebitNoteScreen() {
  const navigation = useNavigation<Nav>();
  const { company } = useAuthStore();

  const [isOptional, setIsOptional] = useState(false);
  const [noteNo, setNoteNo] = useState('DN-00001');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [vendorName, setVendorName] = useState('');
  const [refInvoice, setRefInvoice] = useState('');
  const [narration, setNarration] = useState('');
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totals = returnItems.map(item => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    const disc = parseFloat(item.discount) || 0;
    const base = qty * price;
    const afterDisc = base - disc;
    const tax = afterDisc * item.taxRate / 100;
    return { afterDisc, tax, subtotal: afterDisc + tax };
  });

  const subtotal = totals.reduce((s, t) => s + t.afterDisc, 0);
  const totalDiscount = returnItems.reduce((s, i) => s + (parseFloat(i.discount) || 0), 0);
  const totalTax = totals.reduce((s, t) => s + t.tax, 0);
  const debitTotal = subtotal + totalTax;

  const updateItem = (id: string, key: keyof ReturnItem, value: string | number) =>
    setReturnItems(prev => prev.map(i => i.id === id ? { ...i, [key]: value } : i));

  const handleSubmit = async () => {
    if (!vendorName.trim()) { setError('Vendor name is required'); return; }
    setLoading(true); setError(null);
    try {
      await createApi.createDebitNote({
        companyGuid: company?.guid,
        isOptional, noteNo, date, vendorName, refInvoice, narration,
        items: returnItems.map((item, i) => ({ ...item, ...totals[i] })),
        debitTotal,
      });
      Toast.show({ type: 'success', text1: 'Debit note created!', text2: noteNo });
      navigation.goBack();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to create debit note');
    } finally {
      setLoading(false);
    }
  };

  const handleSharePDF = async () => {
    await Share.share({ message: `Debit Note ${noteNo} — ₹${debitTotal.toFixed(2)}` });
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <AppText style={s.back}>←</AppText>
          </TouchableOpacity>
          <AppText style={s.headerTitle}>Create Debit Note</AppText>
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

          <View style={s.row2}>
            <View style={s.flex1}>
              <F label="Debit Note No." value={noteNo} onChange={setNoteNo} placeholder="DN-00001" />
            </View>
            <View style={s.flex1}>
              <F label="Date" value={date} onChange={setDate} placeholder="YYYY-MM-DD" />
            </View>
          </View>

          <F label="Vendor Name *" value={vendorName} onChange={setVendorName} placeholder="Search vendor..." />
          <F label="Reference Invoice" value={refInvoice} onChange={setRefInvoice} placeholder="Link to invoice..." />
          <F label="Narration" value={narration} onChange={setNarration} placeholder="Internal notes..." multiline />

          {/* Return Items */}
          <View style={s.sH}>
            <AppText style={s.sHText}>Return Items</AppText>
          </View>

          {returnItems.map((item, idx) => (
            <Card key={item.id} style={s.itemCard}>
              <View style={s.itemHead}>
                <AppText style={s.itemTitle}>Item {idx + 1}</AppText>
                <TouchableOpacity onPress={() => setReturnItems(p => p.filter(i => i.id !== item.id))}>
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

              <View style={s.row2}>
                <View style={{ flex: 1 }}>
                  <AppText style={s.fieldLabel}>Discount (₹)</AppText>
                  <TextInput
                    style={[s.input, s.smallInput]}
                    value={item.discount}
                    onChangeText={v => updateItem(item.id, 'discount', v)}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={Colors.textTertiary}
                    allowFontScaling={false}
                  />
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
              </View>

              <View style={s.itemFoot}>
                <AppText style={s.subtotalLabel}>Subtotal</AppText>
                <AppText style={s.subtotalValue}>₹{(totals[idx]?.subtotal ?? 0).toFixed(2)}</AppText>
              </View>
            </Card>
          ))}

          <TouchableOpacity
            onPress={() => setReturnItems(p => [...p, newReturnItem()])}
            style={s.addRow}
          >
            <AppText style={s.addRowText}>+ Add Return Item</AppText>
          </TouchableOpacity>

          {/* Summary */}
          <Card style={s.summaryCard}>
            <SR label="Subtotal" value={subtotal} />
            <SR label="Discounts" value={totalDiscount} />
            <SR label="Taxes" value={totalTax} />
            <View style={s.divider} />
            <View style={s.grandRow}>
              <AppText style={s.grandLabel}>Debit Total</AppText>
              <AppText style={s.grandValue}>₹{debitTotal.toFixed(2)}</AppText>
            </View>
          </Card>

          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={s.footer}>
          <Button
            label={loading ? 'Submitting...' : 'Submit Debit Note'}
            onPress={handleSubmit}
            loading={loading}
          />
          <TouchableOpacity onPress={handleSharePDF} style={s.pdfBtn}>
            <AppText style={s.pdfBtnText}>↗ Share PDF</AppText>
          </TouchableOpacity>
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
  chip: {
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: Radius.full, borderWidth: 1,
    borderColor: Colors.borderDefault, backgroundColor: Colors.pageBg,
  },
  chipActive: { backgroundColor: Colors.brandPrimary, borderColor: Colors.brandPrimary },
  chipText: { fontSize: 11, color: Colors.textSecondary },
  chipTextActive: { color: Colors.white },
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
    gap: Spacing.sm,
  },
  pdfBtn: {
    alignItems: 'center', paddingVertical: Spacing.sm,
    borderWidth: 1, borderColor: Colors.borderDefault, borderRadius: Radius.sm,
  },
  pdfBtnText: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.weightMedium },
});
