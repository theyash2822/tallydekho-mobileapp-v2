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
import { STATIC_UNITS, STATIC_DISPATCH_METHODS } from '../../constants/staticData';
import type { RootStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface DispatchItem {
  id: string;
  productName: string;
  quantity: string;
  unit: string;
  remarks: string;
}

const newDispatchItem = (): DispatchItem => ({
  id: Date.now().toString(),
  productName: '',
  quantity: '1',
  unit: 'Pcs',
  remarks: '',
});

export default function CreateDeliveryNoteScreen() {
  const navigation = useNavigation<Nav>();
  const { company } = useAuthStore();

  const [noteNo, setNoteNo] = useState('DN-000125');
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().slice(0, 10));
  const [customerName, setCustomerName] = useState('');
  const [linkedDocument, setLinkedDocument] = useState('');
  const [dispatchMethod, setDispatchMethod] = useState<string>('Courier');
  const [trackingNo, setTrackingNo] = useState('');
  const [showVehicleInfo, setShowVehicleInfo] = useState(false);
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [narration, setNarration] = useState('');
  const [dispatchItems, setDispatchItems] = useState<DispatchItem[]>([]);
  const [dispatchStatus, setDispatchStatus] = useState<'Partial' | 'Complete'>('Complete');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalItems = dispatchItems.length;
  const totalQty = dispatchItems.reduce((s, i) => s + (parseFloat(i.quantity) || 0), 0);

  const updateItem = (id: string, key: keyof DispatchItem, value: string) =>
    setDispatchItems(prev => prev.map(i => i.id === id ? { ...i, [key]: value } : i));

  const handleSubmit = async () => {
    if (!customerName.trim()) { setError('Customer name is required'); return; }
    if (dispatchItems.length === 0) { setError('Add at least one dispatch item'); return; }
    setLoading(true); setError(null);
    try {
      await createApi.createDeliveryNote({
        companyGuid: company?.guid,
        noteNo, deliveryDate, customerName, linkedDocument,
        dispatchMethod, trackingNo,
        vehicleInfo: showVehicleInfo ? { driverName, driverPhone, vehicleNo } : null,
        narration,
        items: dispatchItems,
        dispatchStatus,
        totalItems,
        totalQty,
      });
      Toast.show({ type: 'success', text1: 'Delivery note created!', text2: noteNo });
      navigation.goBack();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to create delivery note');
    } finally {
      setLoading(false);
    }
  };

  const handleSharePDF = async () => {
    await Share.share({ message: `Delivery Note ${noteNo} — ${totalItems} items, Qty: ${totalQty}` });
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <AppText style={s.back}>←</AppText>
          </TouchableOpacity>
          <AppText style={s.headerTitle}>Create Delivery Note</AppText>
        </View>

        <ScrollView
          contentContainerStyle={s.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {error && <ErrorBanner message={error} onRetry={() => setError(null)} />}

          <View style={s.row2}>
            <View style={s.flex1}>
              <F label="Delivery Note No." value={noteNo} onChange={setNoteNo} placeholder="DN-000125" />
            </View>
            <View style={s.flex1}>
              <F label="Delivery Date" value={deliveryDate} onChange={setDeliveryDate} placeholder="YYYY-MM-DD" />
            </View>
          </View>

          <F label="Customer Name *" value={customerName} onChange={setCustomerName} placeholder="Search customer..." />
          <F label="Linked Document (optional)" value={linkedDocument} onChange={setLinkedDocument} placeholder="Invoice / Sales Order #" />

          {/* Dispatch Method Chips */}
          <View style={{ marginBottom: Spacing.sm }}>
            <AppText style={s.fieldLabel}>Dispatch Method</AppText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              {STATIC_DISPATCH_METHODS.map(m => (
                <TouchableOpacity
                  key={m}
                  onPress={() => setDispatchMethod(m)}
                  style={[s.chip, dispatchMethod === m && s.chipActive]}
                >
                  <AppText style={[s.chipText, dispatchMethod === m && s.chipTextActive]}>{m}</AppText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <F label="Tracking No." value={trackingNo} onChange={setTrackingNo} placeholder="AWB / Tracking number" />

          {/* Vehicle Info Toggle */}
          <View style={s.toggleRow}>
            <AppText style={s.fieldLabel}>Vehicle Info</AppText>
            <Switch
              value={showVehicleInfo}
              onValueChange={setShowVehicleInfo}
              trackColor={{ true: Colors.brandPrimary, false: Colors.borderDefault }}
              thumbColor={Colors.white}
            />
          </View>

          {showVehicleInfo && (
            <Card style={s.vehicleCard}>
              <F label="Driver Name" value={driverName} onChange={setDriverName} placeholder="Driver name" />
              <F label="Driver Phone" value={driverPhone} onChange={setDriverPhone} placeholder="+91 XXXXX XXXXX" />
              <F label="Vehicle No." value={vehicleNo} onChange={setVehicleNo} placeholder="MH-01-AB-1234" />
            </Card>
          )}

          <F label="Narration" value={narration} onChange={setNarration} placeholder="Delivery instructions..." multiline />

          {/* Dispatch Items */}
          <View style={s.sH}>
            <AppText style={s.sHText}>Dispatch Items</AppText>
          </View>

          {dispatchItems.map((item, idx) => (
            <Card key={item.id} style={s.itemCard}>
              <View style={s.itemHead}>
                <AppText style={s.itemTitle}>Item {idx + 1}</AppText>
                <TouchableOpacity onPress={() => setDispatchItems(p => p.filter(i => i.id !== item.id))}>
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
              </View>

              <TextInput
                style={[s.input, { textAlignVertical: 'top', height: 50 }]}
                value={item.remarks}
                onChangeText={v => updateItem(item.id, 'remarks', v)}
                placeholder="Remarks (optional)"
                placeholderTextColor={Colors.textTertiary}
                multiline
                allowFontScaling={false}
              />
            </Card>
          ))}

          <TouchableOpacity
            onPress={() => setDispatchItems(p => [...p, newDispatchItem()])}
            style={s.addRow}
          >
            <AppText style={s.addRowText}>+ Add Dispatch Item</AppText>
          </TouchableOpacity>

          {/* Summary */}
          <Card style={s.summaryCard}>
            <View style={s.sRow}>
              <AppText style={s.sLabel}>Total Items</AppText>
              <AppText style={s.sValue}>{totalItems}</AppText>
            </View>
            <View style={s.sRow}>
              <AppText style={s.sLabel}>Total Quantity</AppText>
              <AppText style={s.sValue}>{totalQty.toFixed(2)}</AppText>
            </View>
            <View style={s.divider} />
            <View style={s.statusRow}>
              <AppText style={s.sLabel}>Dispatch Status</AppText>
              <View style={s.statusChips}>
                {(['Partial', 'Complete'] as const).map(st => (
                  <TouchableOpacity
                    key={st}
                    onPress={() => setDispatchStatus(st)}
                    style={[
                      s.statusChip,
                      dispatchStatus === st && (st === 'Complete' ? s.statusComplete : s.statusPartial),
                    ]}
                  >
                    <AppText
                      style={[
                        s.statusChipText,
                        dispatchStatus === st && s.statusChipTextActive,
                      ]}
                    >
                      {st}
                    </AppText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Card>

          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={s.footer}>
          <Button
            label={loading ? 'Submitting...' : 'Submit Delivery Note'}
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
  toggleRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: Spacing.sm,
  },
  vehicleCard: { padding: Spacing.sm, marginBottom: Spacing.sm },
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
  summaryCard: { marginVertical: Spacing.base, padding: Spacing.base },
  sRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  sLabel: { fontSize: Typography.base, color: Colors.textSecondary },
  sValue: { fontSize: Typography.base, color: Colors.textPrimary },
  divider: { height: 1, backgroundColor: Colors.borderDefault, marginVertical: Spacing.sm },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusChips: { flexDirection: 'row', gap: 8 },
  statusChip: {
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.borderDefault,
  },
  statusComplete: { backgroundColor: Colors.positiveText, borderColor: Colors.positiveText },
  statusPartial: { backgroundColor: Colors.warningText, borderColor: Colors.warningText },
  statusChipText: { fontSize: Typography.sm, color: Colors.textSecondary },
  statusChipTextActive: { color: Colors.white, fontWeight: Typography.weightSemibold },
  footer: {
    padding: Spacing.base, backgroundColor: Colors.cardBg,
    borderTopWidth: 1, borderTopColor: Colors.borderDefault, gap: Spacing.sm,
  },
  pdfBtn: {
    alignItems: 'center', paddingVertical: Spacing.sm,
    borderWidth: 1, borderColor: Colors.borderDefault, borderRadius: Radius.sm,
  },
  pdfBtnText: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.weightMedium },
});
