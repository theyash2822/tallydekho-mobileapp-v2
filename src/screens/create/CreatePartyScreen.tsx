import React, { useState } from 'react';
import { View, ScrollView, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Switch } from 'react-native';
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
import type { RootStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'CreateParty'>;

export default function CreatePartyScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { company } = useAuthStore();
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [sameShipping, setSameShipping] = useState(true);
  const [shippingAddress, setShippingAddress] = useState('');
  const [gstin, setGstin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!name.trim()) { setError('Name is required'); return; }
    if (!mobile.trim()) { setError('Contact number is required'); return; }
    if (!billingAddress.trim()) { setError('Billing address is required'); return; }
    setLoading(true); setError(null);
    try {
      const res = await createApi.createParty({
        companyGuid: company?.guid,
        name: name.trim(), contactNumber: mobile.trim(), email: email.trim(),
        billingAddress: billingAddress.trim(),
        shippingAddress: sameShipping ? billingAddress.trim() : shippingAddress.trim(),
        gstin: gstin.trim(),
      });
      route.params.onSave({ id: res.data?.id ?? '', name: name.trim(), contactNumber: mobile.trim(), email: email.trim(), billingAddress: billingAddress.trim(), shippingAddress: sameShipping ? billingAddress.trim() : shippingAddress.trim(), gstin: gstin.trim(), type: 'both' });
      navigation.goBack();
    } catch (e: any) { setError(e?.message ?? 'Failed to create party'); }
    finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}><AppText style={s.back}>←</AppText></TouchableOpacity>
          <AppText style={s.title}>New Party</AppText>
          <View style={{ width: 44 }} />
        </View>
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {error && <ErrorBanner message={error} onRetry={() => setError(null)} />}
          <F label="Name *" value={name} onChange={setName} placeholder="Party name" />
          <F label="Contact Number *" value={mobile} onChange={setMobile} placeholder="+91 XXXXX XXXXX" keyboardType="phone-pad" />
          <F label="Email" value={email} onChange={setEmail} placeholder="email@example.com" keyboardType="email-address" />
          <F label="Billing Address *" value={billingAddress} onChange={setBillingAddress} placeholder="Full billing address" multiline />
          <View style={s.toggleRow}><AppText style={s.lbl}>Shipping same as Billing</AppText><Switch value={sameShipping} onValueChange={setSameShipping} trackColor={{ true: Colors.brandPrimary, false: Colors.borderDefault }} thumbColor={Colors.white} /></View>
          {!sameShipping && <F label="Shipping Address" value={shippingAddress} onChange={setShippingAddress} placeholder="Full shipping address" multiline />}
          <F label="GSTIN (optional)" value={gstin} onChange={setGstin} placeholder="27ABCDE1234F2Z5" />
          <View style={{ height: 100 }} />
        </ScrollView>
        <View style={s.footer}>
          <Button label={loading ? 'Saving...' : 'Save & Use'} onPress={handleSave} loading={loading} />
        </View>
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
  title: { flex: 1, fontSize: Typography.md, fontWeight: Typography.weightSemibold, textAlign: 'center' },
  content: { padding: Spacing.base },
  lbl: { fontSize: Typography.sm, fontWeight: Typography.weightMedium, color: Colors.textSecondary, marginBottom: 4 },
  inp: { borderWidth: 1, borderColor: Colors.borderDefault, borderRadius: Radius.sm, backgroundColor: Colors.cardBg, paddingHorizontal: Spacing.md, paddingVertical: 10, fontSize: Typography.base, color: Colors.textPrimary, marginBottom: Spacing.xs },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.base },
  footer: { padding: Spacing.base, backgroundColor: Colors.cardBg, borderTopWidth: 1, borderTopColor: Colors.borderDefault },
});
