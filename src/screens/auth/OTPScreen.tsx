import React, { useState, useRef, useEffect } from 'react';
import {
  View, TextInput, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { Colors, Spacing, Radius, Typography } from '../../constants';
import { AppText } from '../../components/common/Text';
import { Button } from '../../components/common/Button';
import { authApi } from '../../services/api/authApi';
import { useAuthStore } from '../../store/authStore';
import type { RootStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'OTP'>;

const OTP_LENGTH = 4;

export default function OTPScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { mobile } = route.params;
  const { setAuth } = useAuthStore();

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const inputs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = setTimeout(() => setResendTimer(t => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendTimer]);

  const handleChange = (val: string, idx: number) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    if (val && idx < OTP_LENGTH - 1) inputs.current[idx + 1]?.focus();
  };

  const handleKeyPress = (e: any, idx: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== OTP_LENGTH) return;
    setLoading(true);
    try {
      const res = await authApi.verifyOTP(mobile, code);
      const { token, user, isNewUser } = res.data;
      await setAuth(token, user, isNewUser);
      if (isNewUser) {
        navigation.reset({ index: 0, routes: [{ name: 'GetStarted' }] });
      } else {
        navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
      }
    } catch (e: any) {
      Toast.show({ type: 'error', text1: e?.message ?? 'Invalid OTP' });
      setOtp(Array(OTP_LENGTH).fill(''));
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await authApi.sendOTP(mobile);
      setResendTimer(30);
      Toast.show({ type: 'success', text1: 'OTP resent' });
    } catch (e: any) {
      Toast.show({ type: 'error', text1: e?.message ?? 'Failed to resend' });
    }
  };

  const isComplete = otp.every(d => d !== '');

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.content}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <AppText style={styles.backText}>← Back</AppText>
          </TouchableOpacity>

          <View style={styles.logoArea}>
            <View style={styles.logoMark}>
              <AppText style={styles.logoSymbol}>✦</AppText>
            </View>
            <AppText style={styles.appName}>Tallydekho</AppText>
          </View>

          <AppText style={styles.heading}>We've sent code to your WhatsApp</AppText>
          <AppText style={styles.subtext}>+91 {mobile}</AppText>

          {/* OTP Boxes */}
          <View style={styles.otpRow}>
            {otp.map((digit, idx) => (
              <TextInput
                key={idx}
                ref={el => { inputs.current[idx] = el; }}
                style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
                value={digit}
                onChangeText={val => handleChange(val, idx)}
                onKeyPress={e => handleKeyPress(e, idx)}
                keyboardType="number-pad"
                maxLength={1}
                autoFocus={idx === 0}
                allowFontScaling={false}
                textAlign="center"
              />
            ))}
          </View>

          <Button
            label="Verify"
            onPress={handleVerify}
            loading={loading}
            disabled={!isComplete}
            style={styles.verifyBtn}
          />

          <View style={styles.resendRow}>
            {resendTimer > 0 ? (
              <AppText style={styles.timerText}>Resend in {resendTimer}s</AppText>
            ) : (
              <TouchableOpacity onPress={handleResend}>
                <AppText style={styles.resendText}>Resend OTP</AppText>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.pageBg },
  flex: { flex: 1 },
  content: { flex: 1, padding: Spacing.xl, justifyContent: 'center' },
  backBtn: { position: 'absolute', top: Spacing.base, left: Spacing.base },
  backText: { fontSize: Typography.base, color: Colors.textSecondary },

  logoArea: { alignItems: 'center', marginBottom: Spacing.xl },
  logoMark: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: Colors.brandPrimary,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm,
  },
  logoSymbol: { fontSize: 32, color: Colors.white },
  appName: { fontSize: Typography.xxl, fontWeight: Typography.weightBold, color: Colors.textPrimary },

  heading: { fontSize: Typography.xl, fontWeight: Typography.weightBold, color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.xs },
  subtext: { fontSize: Typography.base, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xl },

  otpRow: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.sm, marginBottom: Spacing.xl },
  otpBox: {
    width: 48, height: 56, borderWidth: 1.5,
    borderColor: Colors.borderDefault, borderRadius: Radius.sm,
    backgroundColor: Colors.cardBg, fontSize: Typography.xl,
    fontWeight: Typography.weightBold, color: Colors.textPrimary,
  },
  otpBoxFilled: { borderColor: Colors.brandPrimary },

  verifyBtn: { marginBottom: Spacing.base },
  resendRow: { alignItems: 'center' },
  timerText: { fontSize: Typography.sm, color: Colors.textTertiary },
  resendText: { fontSize: Typography.sm, color: Colors.textPrimary, fontWeight: Typography.weightSemibold },
});
