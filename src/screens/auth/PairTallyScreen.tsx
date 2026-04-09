import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import { Colors, Spacing, Radius, Typography } from '../../constants';
import { AppText } from '../../components/common/Text';
import { Button } from '../../components/common/Button';
import { useAuthStore } from '../../store/authStore';
import apiClient from '../../services/api/client';
import type { RootStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function PairTallyScreen() {
  const navigation = useNavigation<Nav>();
  const { company, setPaired } = useAuthStore();
  const [pairKey, setPairKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [pairingCode, setPairingCode] = useState('');
  const [fetchingCode, setFetchingCode] = useState(true);

  useEffect(() => {
    const fetchCode = async () => {
      try {
        const res = await apiClient.get('/pairing/code', { params: { companyGuid: company?.guid } });
        // Pairing code is always 6 digits
        const raw = String(res.data?.code ?? '');
        setPairingCode(raw.length === 6 ? raw : '------');
      } catch { setPairingCode('------'); /* 6-digit code */ }
      finally { setFetchingCode(false); }
    };
    fetchCode();
  }, [company?.guid]);

  const handlePair = async () => {
    if (!pairKey.trim()) { Toast.show({ type: 'error', text1: 'Enter pairing key' }); return; }
    setLoading(true);
    try {
      await apiClient.post('/pairing/verify', { key: pairKey.trim(), companyGuid: company?.guid });
      await setPaired(true);
      navigation.navigate('PairingProgress');
    } catch (e: any) {
      Toast.show({ type: 'error', text1: e?.message ?? 'Pairing failed' });
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.content}>
        <View style={s.logoWrap}>
          <View style={s.logo}><AppText style={s.logoMark}>✦</AppText></View>
          <AppText style={s.appName}>TallyDekho</AppText>
        </View>

        <AppText style={s.heading}>Input Your Tally Pair Key</AppText>
        <AppText style={s.sub}>Open the TallyDekho Desktop app on your Windows machine and enter the code shown there.</AppText>

        {/* Show pairing code for desktop to verify */}
        <View style={s.codeCard}>
          <AppText style={s.codeLabel}>Your pairing code</AppText>
          {fetchingCode ? (
            <ActivityIndicator color={Colors.textPrimary} />
          ) : (
            // Display as XXX-XXX format for readability
          <AppText style={s.code}>
            {pairingCode.length === 6 ? `${pairingCode.slice(0,3)}-${pairingCode.slice(3)}` : pairingCode}
          </AppText>
          )}
          <AppText style={s.codeHint}>Enter this in the TallyDekho Desktop app</AppText>
        </View>

        <AppText style={s.orDivider}>— or enter the key from desktop —</AppText>

        <AppText style={s.inputLabel}>Pair Key</AppText>
        <TextInput
          style={s.input}
          value={pairKey}
          onChangeText={setPairKey}
          placeholder="Paste key from desktop app"
          placeholderTextColor={Colors.textTertiary}
          autoCapitalize="none"
          allowFontScaling={false}
        />

        <Button label={loading ? 'Pairing...' : 'Pair with Tally'} onPress={handlePair} loading={loading} style={s.btn} />
        <Button label="Skip for now" onPress={() => navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] })} variant="ghost" />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.pageBg },
  content: { flex: 1, padding: Spacing.xl, justifyContent: 'center' },
  logoWrap: { alignItems: 'center', marginBottom: Spacing.xl },
  logo: { width: 64, height: 64, borderRadius: 18, backgroundColor: Colors.brandPrimary, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  logoMark: { fontSize: 28, color: Colors.white },
  appName: { fontSize: Typography.xxl, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  heading: { fontSize: Typography.xl, fontWeight: Typography.weightBold, color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.sm },
  sub: { fontSize: Typography.base, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: Spacing.xl },
  codeCard: { backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.borderDefault, borderRadius: Radius.md, padding: Spacing.base, alignItems: 'center', marginBottom: Spacing.base },
  codeLabel: { fontSize: Typography.sm, color: Colors.textTertiary, marginBottom: Spacing.sm },
  code: { fontSize: 36, fontWeight: Typography.weightBold, color: Colors.textPrimary, letterSpacing: 6, marginBottom: Spacing.sm },
  codeHint: { fontSize: Typography.xs, color: Colors.textTertiary, textAlign: 'center' },
  orDivider: { fontSize: Typography.sm, color: Colors.textTertiary, textAlign: 'center', marginVertical: Spacing.base },
  inputLabel: { fontSize: Typography.sm, fontWeight: Typography.weightMedium, color: Colors.textSecondary, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: Colors.borderDefault, borderRadius: Radius.md, backgroundColor: Colors.cardBg, paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, fontSize: Typography.base, color: Colors.textPrimary, marginBottom: Spacing.base },
  btn: { marginBottom: Spacing.sm },
});
