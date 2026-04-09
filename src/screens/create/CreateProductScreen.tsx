import React, { useState } from 'react';
import { View, ScrollView, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Colors, Spacing, Radius, Typography } from '../../constants';
import { AppText } from '../../components/common/Text';
import { Button } from '../../components/common/Button';
import { ErrorBanner } from '../../components/common/ErrorBanner';
import { useAuthStore } from '../../store/authStore';
import { createApi } from '../../services/api/createApi';
import { STATIC_UNITS, STATIC_GST_RATES } from '../../constants/staticData';
import type { RootStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'CreateProduct'>;

export default function CreateProductScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { company } = useAuthStore();
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [hsnCode, setHsnCode] = useState('');
  const [unit, setUnit] = useState('Pcs');
  const [defaultPrice, setDefaultPrice] = useState('');
  const [taxRate, setTaxRate] = useState(18);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!name.trim()) { setError('Product name is required'); return; }
    if (!defaultPrice) { setError('Price is required'); return; }
    setLoading(true); setError(null);
    try {
      const res = await createApi.createProduct({
        companyGuid: company?.guid, name: name.trim(), sku, hsnCode,
        unit, defaultPrice: parseFloat(defaultPrice), taxRate,
      });
      route.params.onSave({ id: res.data?.id ?? '', name: name.trim(), sku, hsnCode, unit, defaultPrice: parseFloat(defaultPrice), taxRate });
      navigation.goBack();
    } catch (e: any) { setError(e?.message ?? 'Failed to create product'); }
    finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}><AppText style={s.back}>←</AppText></TouchableOpacity>
          <AppText style={s.title}>New Product</AppText>
          <View style={{ width: 44 }} />
        </View>
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {error && <ErrorBanner message={error} onRetry={() => setError(null)} />}
          <F label="Product Name *" value={name} onChange={setName} placeholder="e.g. Black JBL Speaker" />
          <View style={s.row2}>
            <View style={s.f1}><F label="SKU / Code" value={sku} onChange={setSku} placeholder="Auto or manual" /></View>
            <View style={s.f1}><F label="HSN / SAC Code" value={hsnCode} onChange={setHsnCode} placeholder="85182100" /></View>
          </View>
          <AppText style={s.lbl}>Unit *</AppText>
          <View style={s.chipRow}>{STATIC_UNITS.map(u => (<TouchableOpacity key={u} onPress={() => setUnit(u)} style={[s.chip, unit === u && s.chipA]}><AppText style={[s.chipT, unit === u && s.chipTA]}>{u}</AppText></TouchableOpacity>))}</View>
          <F label="Default Unit Price *" value={defaultPrice} onChange={setDefaultPrice} placeholder="0.00" keyboardType="decimal-pad" />
          <AppText style={s.lbl}>Tax Rate (GST %)</AppText>
          <View style={s.chipRow}>{STATIC_GST_RATES.map(r => (<TouchableOpacity key={r} onPress={() => setTaxRate(r)} style={[s.chip, taxRate === r && s.chipA]}><AppText style={[s.chipT, taxRate === r && s.chipTA]}>{r}%</AppText></TouchableOpacity>))}</View>
          <View style={{ height: 100 }} />
        </ScrollView>
        <View style={s.footer}>
          <Button label={loading ? 'Saving...' : 'Save & Use'} onPress={handleSave} loading={loading} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function F({ label, value, onChange, placeholder, keyboardType }: any) {
  return (<View style={{ marginBottom: Spacing.sm }}><AppText style={s.lbl}>{label}</AppText><TextInput style={s.inp} value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={Colors.textTertiary} keyboardType={keyboardType ?? 'default'} allowFontScaling={false} /></View>);
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.pageBg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: 10, backgroundColor: Colors.cardBg, borderBottomWidth: 1, borderBottomColor: Colors.borderDefault },
  back: { fontSize: 22, color: Colors.textPrimary, marginRight: Spacing.sm },
  title: { flex: 1, fontSize: Typography.md, fontWeight: Typography.weightSemibold, textAlign: 'center' },
  content: { padding: Spacing.base },
  lbl: { fontSize: Typography.sm, fontWeight: Typography.weightMedium, color: Colors.textSecondary, marginBottom: 4 },
  inp: { borderWidth: 1, borderColor: Colors.borderDefault, borderRadius: Radius.sm, backgroundColor: Colors.cardBg, paddingHorizontal: Spacing.md, paddingVertical: 10, fontSize: Typography.base, color: Colors.textPrimary, marginBottom: Spacing.xs },
  row2: { flexDirection: 'row', gap: Spacing.sm },
  f1: { flex: 1 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.base },
  chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.borderDefault, backgroundColor: Colors.cardBg },
  chipA: { backgroundColor: Colors.brandPrimary, borderColor: Colors.brandPrimary },
  chipT: { fontSize: Typography.sm, color: Colors.textSecondary },
  chipTA: { color: Colors.white },
  footer: { padding: Spacing.base, backgroundColor: Colors.cardBg, borderTopWidth: 1, borderTopColor: Colors.borderDefault },
});
