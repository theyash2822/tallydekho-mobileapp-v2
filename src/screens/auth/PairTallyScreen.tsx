import React, { useState } from 'react';
import {
  View, StyleSheet, TextInput, KeyboardAvoidingView, Platform,
  TouchableOpacity, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/Feather';
import { Colors, Spacing, Radius, Typography } from '../../constants';
import { AppText } from '../../components/common/Text';
import { Button } from '../../components/common/Button';
import { useAuthStore } from '../../store/authStore';
import apiClient from '../../services/api/client';
import type { RootStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function PairTallyScreen() {
  const navigation = useNavigation<Nav>();
  const { setPaired } = useAuthStore();

  // The 6-digit code shown on Desktop app — user types it here
  const [pairingCode, setPairingCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePair = async () => {
    const code = pairingCode.trim().replace(/\D/g, '');
    if (code.length !== 6) {
      Toast.show({ type: 'error', text1: 'Enter the 6-digit code from the Desktop app' });
      return;
    }
    setLoading(true);
    try {
      // Backend: POST /app/pairing { pairingCode }
      await apiClient.post('/pairing', { pairingCode: code });
      await setPaired(true);
      Toast.show({ type: 'success', text1: 'Paired successfully!' });
      navigation.navigate('PairingProgress');
    } catch (e: any) {
      Toast.show({ type: 'error', text1: e?.message ?? 'Pairing failed. Check the code and try again.' });
    } finally {
      setLoading(false);
    }
  };

  // OTP-style 6 boxes
  const digits = pairingCode.padEnd(6, ' ').slice(0, 6).split('');

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">

          {/* Header */}
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Icon name="arrow-left" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>

          {/* Logo */}
          <View style={s.logoArea}>
            <View style={s.logoMark}>
              <AppText style={s.logoSymbol}>✦</AppText>
            </View>
            <AppText style={s.appName}>TallyDekho</AppText>
          </View>

          <AppText style={s.heading}>Input Your Tally Pair Key</AppText>
          <AppText style={s.sub}>
            Open TallyDekho Desktop app on your Windows machine. A 6-digit code will be shown — enter it below.
          </AppText>

          {/* How it works */}
          <View style={s.stepsCard}>
            {[
              { num: '1', text: 'Open TallyDekho Desktop on Windows' },
              { num: '2', text: 'Find the 6-digit pairing code on screen' },
              { num: '3', text: 'Enter it below and tap Pair' },
            ].map(step => (
              <View key={step.num} style={s.step}>
                <View style={s.stepNum}>
                  <AppText style={s.stepNumText}>{step.num}</AppText>
                </View>
                <AppText style={s.stepText}>{step.text}</AppText>
              </View>
            ))}
          </View>

          {/* 6-digit code input */}
          <AppText style={s.inputLabel}>Enter 6-digit code from Desktop app</AppText>

          {/* Single hidden TextInput + visual boxes */}
          <View style={s.codeWrap}>
            <TextInput
              style={s.hiddenInput}
              value={pairingCode}
              onChangeText={v => setPairingCode(v.replace(/\D/g, '').slice(0, 6))}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
              allowFontScaling={false}
            />
            <View style={s.codeBoxes}>
              {digits.map((d, i) => (
                <View key={i} style={[s.codeBox, pairingCode.length > i && s.codeBoxFilled]}>
                  <AppText style={s.codeDigit}>{d.trim()}</AppText>
                </View>
              ))}
            </View>
          </View>

          <View style={s.btnGroup}>
            <Button
              label={loading ? 'Pairing...' : 'Pair with Tally'}
              onPress={handlePair}
              loading={loading}
              disabled={pairingCode.trim().length < 6}
            />
            <Button
              label="Skip for now"
              onPress={() => navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] })}
              variant="ghost"
            />
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.pageBg },
  content: { flexGrow: 1, padding: Spacing.xl },
  backBtn: { marginBottom: Spacing.lg },

  logoArea: { alignItems: 'center', marginBottom: Spacing.xl },
  logoMark: { width: 64, height: 64, borderRadius: 18, backgroundColor: Colors.brandPrimary, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  logoSymbol: { fontSize: 28, color: Colors.white },
  appName: { fontSize: Typography.xxl, fontWeight: Typography.weightBold, color: Colors.textPrimary },

  heading: { fontSize: Typography.xl, fontWeight: Typography.weightBold, color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.sm },
  sub: { fontSize: Typography.base, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: Spacing.xl },

  stepsCard: { backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.borderDefault, borderRadius: Radius.md, padding: Spacing.base, marginBottom: Spacing.xl, gap: Spacing.sm },
  step: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  stepNum: { width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.brandPrimary, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { fontSize: Typography.sm, color: Colors.white, fontWeight: Typography.weightBold },
  stepText: { flex: 1, fontSize: Typography.sm, color: Colors.textSecondary },

  inputLabel: { fontSize: Typography.sm, fontWeight: Typography.weightMedium, color: Colors.textSecondary, marginBottom: Spacing.sm },

  codeWrap: { position: 'relative', marginBottom: Spacing.xl },
  hiddenInput: {
    position: 'absolute', opacity: 0, width: '100%', height: 60, zIndex: 10,
  },
  codeBoxes: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.sm },
  codeBox: {
    width: 48, height: 60, borderWidth: 1.5,
    borderColor: Colors.borderDefault, borderRadius: Radius.sm,
    backgroundColor: Colors.cardBg, alignItems: 'center', justifyContent: 'center',
  },
  codeBoxFilled: { borderColor: Colors.brandPrimary },
  codeDigit: { fontSize: Typography.xl, fontWeight: Typography.weightBold, color: Colors.textPrimary },

  btnGroup: { gap: Spacing.sm },
});
