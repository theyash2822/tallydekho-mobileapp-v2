import React, { useCallback, useEffect, useState } from 'react';
import {
  View, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Linking,
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
import { eInvoiceApi, IRP_PROVIDERS } from '../../services/api/integrationApi';
import type { RootStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type IRPProvider = 'NIC' | 'Cygnet' | 'Clear' | 'EY' | 'IRIS' | 'Masterindia';

export default function EInvoiceIntegrationScreen() {
  const navigation = useNavigation<Nav>();
  const { company } = useAuthStore();

  const [selectedIRP, setSelectedIRP] = useState<IRPProvider>('NIC');
  const [gstin, setGstin] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'error' | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const fetchStatus = useCallback(async () => {
    if (!company?.guid) return;
    try {
      const [statusRes, pendingRes] = await Promise.all([
        eInvoiceApi.getStatus(company.guid),
        eInvoiceApi.getPendingIRN(company.guid),
      ]);
      setStatus(statusRes.data?.status ?? 'disconnected');
      if (statusRes.data?.gstin) setGstin(statusRes.data.gstin);
      if (statusRes.data?.username) setUsername(statusRes.data.username);
      if (statusRes.data?.irpProvider) setSelectedIRP(statusRes.data.irpProvider);
      setPendingCount(pendingRes.data?.count ?? 0);
    } catch { setStatus('disconnected'); }
  }, [company?.guid]);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const handleSave = async () => {
    if (!gstin.trim()) { setError('GSTIN is required'); return; }
    if (!username.trim()) { setError('Username is required'); return; }
    if (!password.trim()) { setError('Password is required'); return; }
    setLoading(true); setError(null);
    try {
      await eInvoiceApi.saveCredentials({
        companyGuid: company?.guid ?? '',
        gstin: gstin.trim().toUpperCase(),
        username: username.trim(),
        password: password.trim(),
        irpProvider: selectedIRP,
        clientId: clientId.trim() || undefined,
        clientSecret: clientSecret.trim() || undefined,
      });
      Toast.show({ type: 'success', text1: 'E-Invoice credentials saved!' });
      await fetchStatus();
    } catch (e: any) { setError(e?.message ?? 'Failed to save credentials'); }
    finally { setLoading(false); }
  };

  const handleTest = async () => {
    setTestLoading(true); setError(null);
    try {
      const res = await eInvoiceApi.getStatus(company?.guid ?? '');
      if (res.data?.status === 'connected') {
        Toast.show({ type: 'success', text1: 'Connected!', text2: `${selectedIRP} IRP is reachable` });
        setStatus('connected');
      } else {
        Toast.show({ type: 'error', text1: 'Connection failed', text2: 'Check your credentials' });
        setStatus('error');
      }
    } catch (e: any) {
      Toast.show({ type: 'error', text1: e?.message ?? 'Connection test failed' });
      setStatus('error');
    } finally { setTestLoading(false); }
  };

  const handleBulkGenerate = async () => {
    setBulkLoading(true); setError(null);
    try {
      const pending = await eInvoiceApi.getPendingIRN(company?.guid ?? '');
      const ids = (pending.data?.invoices ?? []).map((i: any) => i.id);
      if (ids.length === 0) { Toast.show({ type: 'info', text1: 'No pending invoices' }); return; }
      await eInvoiceApi.bulkGenerateIRN(company?.guid ?? '', ids);
      Toast.show({ type: 'success', text1: `${ids.length} IRNs generated!` });
      await fetchStatus();
    } catch (e: any) { setError(e?.message ?? 'Bulk IRN generation failed'); }
    finally { setBulkLoading(false); }
  };

  const selectedProvider = IRP_PROVIDERS.find(p => p.id === selectedIRP);

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <AppText style={s.back}>←</AppText>
          </TouchableOpacity>
          <AppText style={s.title}>E-Invoicing (IRN)</AppText>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Status card */}
          <Card style={s.statusCard}>
            <View style={s.statusRow}>
              <View style={s.statusLeft}>
                <AppText style={s.statusTitle}>Invoice Registration Portal</AppText>
                <AppText style={s.statusSub}>{selectedProvider?.name ?? 'NIC (IRP 1)'}</AppText>
              </View>
              <View style={[s.statusDot, { backgroundColor: status === 'connected' ? Colors.positiveText : status === 'error' ? Colors.negativeText : Colors.borderStrong }]} />
            </View>

            {pendingCount > 0 && (
              <TouchableOpacity style={s.pendingBanner} onPress={handleBulkGenerate}>
                <AppText style={s.pendingText}>⚠ {pendingCount} invoices pending IRN generation</AppText>
                <AppText style={s.pendingAction}>{bulkLoading ? 'Generating...' : 'Generate now →'}</AppText>
              </TouchableOpacity>
            )}

            {status === 'connected' && (
              <View style={s.connectedBadge}><AppText style={s.connectedText}>✓ Connected to {selectedIRP}</AppText></View>
            )}
          </Card>

          {error && <ErrorBanner message={error} onRetry={() => setError(null)} />}

          {/* IRP Provider selector */}
          <AppText style={s.sectionLabel}>Select IRP Provider</AppText>
          <View style={s.irpGrid}>
            {IRP_PROVIDERS.map(p => (
              <TouchableOpacity
                key={p.id}
                onPress={() => setSelectedIRP(p.id as IRPProvider)}
                style={[s.irpCard, selectedIRP === p.id && s.irpCardActive]}
              >
                <AppText style={[s.irpName, selectedIRP === p.id && s.irpNameActive]}>{p.name}</AppText>
                <TouchableOpacity onPress={() => Linking.openURL(p.url)}>
                  <AppText style={s.irpUrl}>{p.url.replace('https://', '')}</AppText>
                </TouchableOpacity>
                {p.recommended && (
                  <View style={s.recommendedBadge}><AppText style={s.recommendedText}>Recommended</AppText></View>
                )}
                {selectedIRP === p.id && <View style={s.irpCheck}><AppText style={s.irpCheckText}>✓</AppText></View>}
              </TouchableOpacity>
            ))}
          </View>

          {/* Credentials */}
          <AppText style={s.sectionLabel}>API Credentials</AppText>
          <AppText style={s.hint}>
            Login at {selectedProvider?.url} → API Registration → Get Client ID & Secret. Use your GST portal login credentials.
          </AppText>

          <F label="GSTIN *" value={gstin} onChange={(v: string) => setGstin(v.toUpperCase())} placeholder="27ABCDE1234F2Z5" autoCapitalize="characters" />
          <F label="Username *" value={username} onChange={setUsername} placeholder="GST portal username" />

          <View style={{ marginBottom: Spacing.sm }}>
            <AppText style={s.lbl}>Password *</AppText>
            <View style={s.passwordRow}>
              <TextInput style={[s.inp, { flex: 1, marginBottom: 0 }]} value={password} onChangeText={setPassword} placeholder="GST portal password" placeholderTextColor={Colors.textTertiary} secureTextEntry={!showPassword} allowFontScaling={false} />
              <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={s.eyeBtn}>
                <AppText style={s.eyeIcon}>{showPassword ? '👁' : '🙈'}</AppText>
              </TouchableOpacity>
            </View>
          </View>

          <F label="Client ID (optional)" value={clientId} onChange={setClientId} placeholder="From API registration" />
          <F label="Client Secret (optional)" value={clientSecret} onChange={setClientSecret} placeholder="From API registration" />

          <View style={s.btnRow}>
            <Button label={testLoading ? 'Testing...' : 'Test Connection'} onPress={handleTest} loading={testLoading} variant="secondary" style={s.testBtn} />
            <Button label={loading ? 'Saving...' : 'Save'} onPress={handleSave} loading={loading} style={s.saveBtn} />
          </View>

          {/* Features */}
          <AppText style={s.sectionLabel}>What you can do</AppText>
          {[
            '✓ Auto-generate IRN for eligible invoices (turnover >₹5Cr)',
            '✓ Generate QR code + digitally signed invoice',
            '✓ Cancel IRN within 24 hours',
            '✓ Bulk generate IRN for pending invoices',
            '✓ E-Way Bill auto-created with IRN (if applicable)',
            '✓ Get alerts for invoices missing IRN',
            '✓ GSTR-1 auto-populated with IRP data',
          ].map((f, i) => (
            <AppText key={i} style={s.featureItem}>{f}</AppText>
          ))}

          {/* Eligibility note */}
          <Card style={s.noteCard}>
            <AppText style={s.noteTitle}>📋 Eligibility Note</AppText>
            <AppText style={s.noteText}>
              E-Invoicing is mandatory for businesses with annual turnover:
              {'\n'}• ≥₹5 Crore (from Aug 2023)
              {'\n'}• All B2B, B2G, Export invoices
              {'\n'}• Excludes SEZ, banking, insurance sectors
            </AppText>
          </Card>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function F({ label, value, onChange, placeholder, autoCapitalize }: any) {
  return (
    <View style={{ marginBottom: Spacing.sm }}>
      <AppText style={s.lbl}>{label}</AppText>
      <TextInput style={s.inp} value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={Colors.textTertiary} autoCapitalize={autoCapitalize ?? 'none'} allowFontScaling={false} />
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.pageBg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: 10, backgroundColor: Colors.cardBg, borderBottomWidth: 1, borderBottomColor: Colors.borderDefault },
  back: { fontSize: 22, color: Colors.textPrimary, marginRight: Spacing.sm },
  title: { flex: 1, fontSize: Typography.md, fontWeight: Typography.weightSemibold, textAlign: 'center' },
  content: { padding: Spacing.base },
  statusCard: { padding: Spacing.base, marginBottom: Spacing.base },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
  statusLeft: { flex: 1 },
  statusTitle: { fontSize: Typography.base, fontWeight: Typography.weightSemibold, color: Colors.textPrimary },
  statusSub: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginLeft: Spacing.sm },
  pendingBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.warningBg, borderRadius: Radius.sm, padding: Spacing.sm, marginBottom: Spacing.sm },
  pendingText: { fontSize: Typography.sm, color: Colors.warningText, flex: 1 },
  pendingAction: { fontSize: Typography.sm, color: Colors.warningText, fontWeight: Typography.weightBold },
  connectedBadge: { backgroundColor: Colors.positiveBg, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: 4, alignSelf: 'flex-start' },
  connectedText: { fontSize: Typography.sm, color: Colors.positiveText, fontWeight: Typography.weightSemibold },
  sectionLabel: { fontSize: Typography.xs, fontWeight: Typography.weightSemibold, color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.xs, marginTop: Spacing.sm },
  irpGrid: { gap: Spacing.sm, marginBottom: Spacing.base },
  irpCard: { padding: Spacing.base, borderWidth: 1, borderColor: Colors.borderDefault, borderRadius: Radius.md, backgroundColor: Colors.cardBg, position: 'relative' },
  irpCardActive: { borderColor: Colors.brandPrimary, borderWidth: 2, backgroundColor: Colors.pageBg },
  irpName: { fontSize: Typography.base, fontWeight: Typography.weightSemibold, color: Colors.textPrimary, marginBottom: 2 },
  irpNameActive: { color: Colors.brandPrimary },
  irpUrl: { fontSize: Typography.xs, color: Colors.infoText, textDecorationLine: 'underline' },
  recommendedBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: Colors.pageBg, borderWidth: 1, borderColor: Colors.borderDefault, borderRadius: Radius.full, paddingHorizontal: 6, paddingVertical: 2 },
  recommendedText: { fontSize: 9, color: Colors.textTertiary, fontWeight: '600' },
  irpCheck: { position: 'absolute', bottom: 8, right: 8, width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.brandPrimary, alignItems: 'center', justifyContent: 'center' },
  irpCheckText: { fontSize: 12, color: Colors.white, fontWeight: '700' },
  hint: { fontSize: Typography.sm, color: Colors.textSecondary, lineHeight: 18, marginBottom: Spacing.base, backgroundColor: Colors.infoBg, padding: Spacing.sm, borderRadius: Radius.sm },
  lbl: { fontSize: Typography.sm, fontWeight: Typography.weightMedium, color: Colors.textSecondary, marginBottom: 4 },
  inp: { borderWidth: 1, borderColor: Colors.borderDefault, borderRadius: Radius.sm, backgroundColor: Colors.cardBg, paddingHorizontal: Spacing.md, paddingVertical: 10, fontSize: Typography.base, color: Colors.textPrimary, marginBottom: Spacing.xs },
  passwordRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  eyeBtn: { padding: 8 },
  eyeIcon: { fontSize: 18 },
  btnRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm, marginBottom: Spacing.base },
  testBtn: { flex: 1 },
  saveBtn: { flex: 1 },
  featureItem: { fontSize: Typography.base, color: Colors.textSecondary, paddingVertical: 3 },
  noteCard: { padding: Spacing.base, marginTop: Spacing.base, backgroundColor: Colors.infoBg },
  noteTitle: { fontSize: Typography.base, fontWeight: Typography.weightSemibold, color: Colors.textPrimary, marginBottom: Spacing.xs },
  noteText: { fontSize: Typography.sm, color: Colors.textSecondary, lineHeight: 20 },
});
