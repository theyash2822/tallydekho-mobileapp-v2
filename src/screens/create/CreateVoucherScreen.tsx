import React, { useEffect, useState } from 'react';
import {
  View, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, Switch, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { Colors, Spacing, Radius, Typography } from '../../constants';
import { AppText } from '../../components/common/Text';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { ErrorBanner } from '../../components/common/ErrorBanner';
import { useAuthStore } from '../../store/authStore';
import { createApi } from '../../services/api/createApi';
import { salesApi } from '../../services/api/salesApi';
import { STATIC_VOUCHER_TYPES, STATIC_MODE_OF_PAYMENT } from '../../constants/staticData';
import type { RootStackParamList, VoucherType } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'CreateVoucher'>;

export default function CreateVoucherScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { company } = useAuthStore();

  const [isOptional, setIsOptional] = useState(false);
  const [voucherNo, setVoucherNo] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [voucherType, setVoucherType] = useState<VoucherType>(route.params?.type ?? 'Payment');

  // Payment / Receipt fields
  const [partyName, setPartyName] = useState('');
  const [partySuggestions, setPartySuggestions] = useState<{ id: string; name: string }[]>([]);
  const [selectInvoice, setSelectInvoice] = useState('');
  const [amount, setAmount] = useState('');
  const [modeOfPayment, setModeOfPayment] = useState('Cash');
  const [bankName, setBankName] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [narration, setNarration] = useState('');

  // Journal fields
  const [debitLedger, setDebitLedger] = useState('');
  const [creditLedger, setCreditLedger] = useState('');

  // Contra fields
  const [fromLedger, setFromLedger] = useState('');
  const [toLedger, setToLedger] = useState('');
  const [contraMode, setContraMode] = useState('Online Transfer');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!company?.guid) return;
    createApi.getNextVoucherNumber(company.guid, voucherType.toLowerCase())
      .then(r => setVoucherNo(r.data?.number ?? ''))
      .catch(() => {});
  }, [company?.guid, voucherType]);

  const searchParties = async (q: string) => {
    setPartyName(q);
    if (!q.trim() || !company?.guid) { setPartySuggestions([]); return; }
    try {
      const res = await salesApi.getParties(company.guid, q);
      setPartySuggestions(res.data?.data ?? res.data ?? []);
    } catch { setPartySuggestions([]); }
  };

  const handleSubmit = async () => {
    setLoading(true); setError(null);
    try {
      const payload: Record<string, any> = {
        companyGuid: company?.guid,
        voucherType, isOptional, voucherNo, date, narration,
      };
      if (voucherType === 'Payment' || voucherType === 'Receipt') {
        if (!partyName.trim() || !amount) { setError('Party name and amount are required'); setLoading(false); return; }
        Object.assign(payload, { partyName, selectInvoice, amount: parseFloat(amount), modeOfPayment, bankName, referenceNo });
      } else if (voucherType === 'Journal') {
        if (!debitLedger || !creditLedger || !amount) { setError('Debit ledger, credit ledger and amount are required'); setLoading(false); return; }
        Object.assign(payload, { debitLedger, creditLedger, amount: parseFloat(amount) });
      } else if (voucherType === 'Contra') {
        if (!fromLedger || !toLedger || !amount) { setError('From/To ledger and amount are required'); setLoading(false); return; }
        Object.assign(payload, { fromLedger, toLedger, amount: parseFloat(amount), mode: contraMode, referenceNo });
      }
      await createApi.createVoucher(payload);
      Toast.show({ type: 'success', text1: `${voucherType} voucher created!`, text2: voucherNo });
      navigation.goBack();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to create voucher');
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
          <AppText style={s.headerTitle}>Create Voucher</AppText>
          <View style={s.optRow}>
            <AppText style={s.optLabel}>Optional</AppText>
            <Switch value={isOptional} onValueChange={setIsOptional}
              trackColor={{ true: Colors.brandPrimary, false: Colors.borderDefault }} thumbColor={Colors.white} />
          </View>
        </View>

        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {error && <ErrorBanner message={error} onRetry={() => setError(null)} />}

          {/* Voucher No + Date */}
          <View style={s.row2}>
            <View style={s.flex1}>
              <F label="Voucher No." value={voucherNo} onChange={setVoucherNo} placeholder="Auto" />
            </View>
            <View style={s.flex1}>
              <F label="Date" value={date} onChange={setDate} placeholder="YYYY-MM-DD" />
            </View>
          </View>

          {/* Voucher Type Selector */}
          <AppText style={s.fieldLabel}>Voucher Type</AppText>
          <View style={s.typeRow}>
            {STATIC_VOUCHER_TYPES.map(t => (
              <TouchableOpacity
                key={t}
                onPress={() => setVoucherType(t as VoucherType)}
                style={[s.typeChip, voucherType === t && s.typeChipActive]}
              >
                <AppText style={[s.typeText, voucherType === t && s.typeTextActive]}>{t}</AppText>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Dynamic Section ── */}
          {(voucherType === 'Payment' || voucherType === 'Receipt') && (
            <PaymentReceiptFields
              partyName={partyName}
              onPartyChange={searchParties}
              partySuggestions={partySuggestions}
              onSelectParty={(p: {id: string; name: string}) => { setPartyName(p.name); setPartySuggestions([]); }}
              selectInvoice={selectInvoice}
              onInvoiceChange={setSelectInvoice}
              amount={amount}
              onAmountChange={setAmount}
              modeOfPayment={modeOfPayment}
              onModeChange={setModeOfPayment}
              bankName={bankName}
              onBankChange={setBankName}
              referenceNo={referenceNo}
              onRefChange={setReferenceNo}
              narration={narration}
              onNarrationChange={setNarration}
            />
          )}

          {voucherType === 'Journal' && (
            <JournalFields
              debitLedger={debitLedger} onDebitChange={setDebitLedger}
              creditLedger={creditLedger} onCreditChange={setCreditLedger}
              amount={amount} onAmountChange={setAmount}
              narration={narration} onNarrationChange={setNarration}
            />
          )}

          {voucherType === 'Contra' && (
            <ContraFields
              fromLedger={fromLedger} onFromChange={setFromLedger}
              toLedger={toLedger} onToChange={setToLedger}
              amount={amount} onAmountChange={setAmount}
              mode={contraMode} onModeChange={setContraMode}
              referenceNo={referenceNo} onRefChange={setReferenceNo}
              narration={narration} onNarrationChange={setNarration}
            />
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Sticky Footer */}
        <View style={s.footer}>
          <Button label={loading ? 'Submitting...' : 'Submit Voucher'} onPress={handleSubmit} loading={loading} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Payment / Receipt Fields ──────────────────────────────────────
function PaymentReceiptFields({
  partyName, onPartyChange, partySuggestions, onSelectParty,
  selectInvoice, onInvoiceChange, amount, onAmountChange,
  modeOfPayment, onModeChange, bankName, onBankChange,
  referenceNo, onRefChange, narration, onNarrationChange,
}: any) {
  return (
    <>
      <AppText style={s.fieldLabel}>Party Name</AppText>
      <TextInput style={s.input} value={partyName} onChangeText={onPartyChange}
        placeholder="Search party..." placeholderTextColor={Colors.textTertiary} allowFontScaling={false} />
      {partySuggestions.length > 0 && (
        <View style={s.suggestions}>
          {partySuggestions.map((p: any) => (
            <TouchableOpacity key={p.id} style={s.suggItem} onPress={() => onSelectParty(p)}>
              <AppText style={s.suggText}>{p.name}</AppText>
            </TouchableOpacity>
          ))}
        </View>
      )}
      <F label="Select Invoice (optional)" value={selectInvoice} onChange={onInvoiceChange} placeholder="Link invoice" />
      <F label="Amount *" value={amount} onChange={onAmountChange} placeholder="0.00" keyboardType="decimal-pad" />

      <AppText style={s.fieldLabel}>Mode of Payment</AppText>
      <View style={s.modeRow}>
        {STATIC_MODE_OF_PAYMENT.map(m => (
          <TouchableOpacity key={m} onPress={() => onModeChange(m)}
            style={[s.modeChip, modeOfPayment === m && s.modeChipActive]}>
            <AppText style={[s.modeText, modeOfPayment === m && s.modeTextActive]}>{m}</AppText>
          </TouchableOpacity>
        ))}
      </View>

      {modeOfPayment !== 'Cash' && (
        <F label="Bank Name" value={bankName} onChange={onBankChange} placeholder="e.g. HDFC Bank" />
      )}
      {modeOfPayment !== 'Cash' && (
        <F label="Reference No. *" value={referenceNo} onChange={onRefChange} placeholder="Cheque/UTR/Ref number" />
      )}
      <F label="Narration" value={narration} onChange={onNarrationChange} placeholder="Optional notes" multiline />
    </>
  );
}

// ── Journal Fields ───────────────────────────────────────────────
function JournalFields({ debitLedger, onDebitChange, creditLedger, onCreditChange, amount, onAmountChange, narration, onNarrationChange }: any) {
  return (
    <>
      <F label="Debit Ledger *" value={debitLedger} onChange={onDebitChange} placeholder="Search debit ledger..." />
      <F label="Credit Ledger *" value={creditLedger} onChange={onCreditChange} placeholder="Search credit ledger..." />
      <F label="Amount *" value={amount} onChange={onAmountChange} placeholder="0.00" keyboardType="decimal-pad" />
      <F label="Narration" value={narration} onChange={onNarrationChange} placeholder="Optional" multiline />
    </>
  );
}

// ── Contra Fields ────────────────────────────────────────────────
const CONTRA_MODES = ['Cheque', 'Online Transfer', 'Cash'];
function ContraFields({ fromLedger, onFromChange, toLedger, onToChange, amount, onAmountChange, mode, onModeChange, referenceNo, onRefChange, narration, onNarrationChange }: any) {
  return (
    <>
      <F label="From Ledger *" value={fromLedger} onChange={onFromChange} placeholder="e.g. ICICI Bank" />
      <F label="To Ledger *" value={toLedger} onChange={onToChange} placeholder="e.g. HDFC Bank" />
      <F label="Amount *" value={amount} onChange={onAmountChange} placeholder="0.00" keyboardType="decimal-pad" />
      <AppText style={s.fieldLabel}>Mode</AppText>
      <View style={s.modeRow}>
        {CONTRA_MODES.map(m => (
          <TouchableOpacity key={m} onPress={() => onModeChange(m)}
            style={[s.modeChip, mode === m && s.modeChipActive]}>
            <AppText style={[s.modeText, mode === m && s.modeTextActive]}>{m}</AppText>
          </TouchableOpacity>
        ))}
      </View>
      <F label="Reference No." value={referenceNo} onChange={onRefChange} placeholder="Optional" />
      <F label="Narration" value={narration} onChange={onNarrationChange} placeholder="e.g. Transfer from ICICI to HDFC" multiline />
    </>
  );
}

// ── Shared Field component ────────────────────────────────────────
function F({ label, value, onChange, placeholder, keyboardType, multiline }: any) {
  return (
    <View style={{ marginBottom: Spacing.sm }}>
      <AppText style={s.fieldLabel}>{label}</AppText>
      <TextInput
        style={[s.input, multiline && { height: 72, textAlignVertical: 'top' }]}
        value={value} onChangeText={onChange} placeholder={placeholder}
        placeholderTextColor={Colors.textTertiary}
        keyboardType={keyboardType ?? 'default'} multiline={multiline}
        allowFontScaling={false}
      />
    </View>
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
  row2: { flexDirection: 'row', gap: Spacing.sm },
  flex1: { flex: 1 },
  fieldLabel: { fontSize: Typography.sm, fontWeight: Typography.weightMedium, color: Colors.textSecondary, marginBottom: 4 },
  input: {
    borderWidth: 1, borderColor: Colors.borderDefault, borderRadius: Radius.sm,
    backgroundColor: Colors.cardBg, paddingHorizontal: Spacing.md, paddingVertical: 10,
    fontSize: Typography.base, color: Colors.textPrimary, marginBottom: Spacing.xs,
  },
  typeRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.base, flexWrap: 'wrap' },
  typeChip: {
    paddingHorizontal: Spacing.base, paddingVertical: 8, borderRadius: Radius.sm,
    borderWidth: 1, borderColor: Colors.borderDefault, backgroundColor: Colors.cardBg,
  },
  typeChipActive: { backgroundColor: Colors.brandPrimary, borderColor: Colors.brandPrimary },
  typeText: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.weightMedium },
  typeTextActive: { color: Colors.white, fontWeight: Typography.weightSemibold },
  modeRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.base, flexWrap: 'wrap' },
  modeChip: {
    paddingHorizontal: Spacing.sm, paddingVertical: 6, borderRadius: Radius.full,
    borderWidth: 1, borderColor: Colors.borderDefault, backgroundColor: Colors.cardBg,
  },
  modeChipActive: { backgroundColor: Colors.brandPrimary, borderColor: Colors.brandPrimary },
  modeText: { fontSize: Typography.xs, color: Colors.textSecondary },
  modeTextActive: { color: Colors.white },
  suggestions: {
    backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.borderDefault,
    borderRadius: Radius.sm, marginBottom: Spacing.sm,
  },
  suggItem: { padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderDefault },
  suggText: { fontSize: Typography.base, color: Colors.textPrimary },
  footer: {
    padding: Spacing.base, backgroundColor: Colors.cardBg,
    borderTopWidth: 1, borderTopColor: Colors.borderDefault,
  },
});
