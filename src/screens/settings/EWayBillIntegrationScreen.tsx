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
import { ewayBillApi, EWAY_TRANS_MODES } from '../../services/api/integrationApi';
import type { RootStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function EWayBillIntegrationScreen() {
  const navigation = useNavigation<Nav>();
  const { company } = useAuthStore();

  const [gstin, setGstin] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'error' | null>(null);
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const fetchStatus = useCallback(async () => {
    if (!company?.guid) return;
    try {
      const res = await ewayBillApi.getStatus(company.guid);
      setStatus(res.data?.status ?? 'disconnected');
      if (res.data?.gstin) setGstin(res.data.gstin);
      if (res.data?.username) setUsername(res.data.username);
    } catch { setStatus('disconnected'); }
  }, [company?.guid]);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const handleSave = async () => {
    if (!gstin.trim()) { setError('GSTIN is required'); return; }
    if (!username.trim()) { setError('Username is required'); return; }
    if (!password.trim()) { setError('Password is required'); return; }
    setLoading(true); setError(null);
    try {
      await ewayBillApi.saveCredentials({
        companyGuid: company?.guid ?? '',
        gstin: gstin.trim().toUpperCase(),
        username: username.trim(),
        password: password.trim(),
        clientId: clientId.trim() || undefined,
        clientSecret: clientSecret.trim() || undefined,
      });
      Toast.show({ type: 'success', text1: 'E-Way Bill credentials saved!' });
      await fetchStatus();
    } catch (e: any) { setError(e?.message ?? 'Failed to save credentials'); }
    finally { setLoading(false); }
  };

  const handleTest = async () => {
    setTestLoading(true); setError(null);
    try {
      const res = await ewayBillApi.getStatus(company?.guid ?? '');
      if (res.data?.status === 'connected') {
        Toast.show({ type: 'success', text1: 'Connected!', text2: 'E-Way Bill portal is reachable' });
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

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <AppText style={s.back}>←</AppText>
          </TouchableOpacity>
          <AppText style={s.title}>E-Way Bill Integration</AppText>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Portal info */}
          <Card style={s.portalCard}>
            <View style={s.portalRow}>
              <View style={s.portalIcon}><AppText style={s.portalIconText}>🚚</AppText></View>
              <View style={s.portalInfo}>
                <AppText style={s.portalName}>E-Way Bill Portal (NIC)</AppText>
                <TouchableOpacity onPress={() => Linking.openURL('https://ewaybillgst.gov.in')}>
                  <AppText style={s.portalUrl}>ewaybillgst.gov.in</AppText>
                </TouchableOpacity>
              </View>
              <View style={[s.statusDot, { backgroundColor: status === 'connected' ? Colors.positiveText : status === 'error' ? Colors.negativeText : Colors.borderStrong }]} />
            </View>
            <AppText style={s.portalDesc}>
              Generate, cancel and extend E-Way Bills directly from TallyDekho. Required for goods movement value ₹50,000+.
            </AppText>
            {status === 'connected' && (
              <View style={s.connectedBadge}>
                <AppText style={s.connectedText}>✓ Connected</AppText>
              </View>
            )}
          </Card>

          {error && <ErrorBanner message={error} onRetry={() => setError(null)} />}

          {/* Credentials */}
          <AppText style={s.sectionLabel}>API Credentials</AppText>
          <AppText style={s.hint}>
            Register at ewaybillgst.gov.in → APIs → For GST User → Get Client ID & Secret
          </AppText>

          <F label="GSTIN *" value={gstin} onChange={(v: string) => setGstin(v.toUpperCase())} placeholder="27ABCDE1234F2Z5" autoCapitalize="characters" />
          <F label="Username *" value={username} onChange={setUsername} placeholder="Your GST portal username" />

          <View style={{ marginBottom: Spacing.sm }}>
            <AppText style={s.lbl}>Password *</AppText>
            <View style={s.passwordRow}>
              <TextInput
                style={[s.inp, { flex: 1, marginBottom: 0 }]}
                value={password} onChangeText={setPassword}
                placeholder="Your GST portal password"
                placeholderTextColor={Colors.textTertiary}
                secureTextEntry={!showPassword}
                allowFontScaling={false}
              />
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
            '✓ Generate E-Way Bills from Sales Invoices',
            '✓ Cancel E-Way Bills with reason',
            '✓ Extend validity with new vehicle details',
            '✓ Bulk generate for multiple invoices',
            '✓ View all E-Way Bills with status',
            '✓ Get alerts for expiring E-Way Bills',
          ].map((f, i) => (
            <AppText key={i} style={s.featureItem}>{f}</AppText>
          ))}

          {/* Transport modes reference */}
          <AppText style={s.sectionLabel}>Transport Modes</AppText>
          <Card style={s.modesCard}>
            {EWAY_TRANS_MODES.map(m => (
              <View key={m.id} style={s.modeRow}>
                <AppText style={s.modeId}>{m.id}</AppText>
                <AppText style={s.modeLabel}>{m.label}</AppText>
              </View>
            ))}
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
  portalCard: { padding: Spacing.base, marginBottom: Spacing.base },
  portalRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  portalIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.pageBg, borderWidth: 1, borderColor: Colors.borderDefault, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  portalIconText: { fontSize: 22 },
  portalInfo: { flex: 1 },
  portalName: { fontSize: Typography.base, fontWeight: Typography.weightSemibold, color: Colors.textPrimary },
  portalUrl: { fontSize: Typography.sm, color: Colors.infoText, textDecorationLine: 'underline' },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  portalDesc: { fontSize: Typography.sm, color: Colors.textSecondary, lineHeight: 18, marginBottom: Spacing.sm },
  connectedBadge: { backgroundColor: Colors.positiveBg, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: 4, alignSelf: 'flex-start' },
  connectedText: { fontSize: Typography.sm, color: Colors.positiveText, fontWeight: Typography.weightSemibold },
  sectionLabel: { fontSize: Typography.xs, fontWeight: Typography.weightSemibold, color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.xs, marginTop: Spacing.sm },
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
  modesCard: { padding: Spacing.base },
  modeRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.borderDefault },
  modeId: { width: 30, fontSize: Typography.sm, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  modeLabel: { fontSize: Typography.base, color: Colors.textSecondary },
});
