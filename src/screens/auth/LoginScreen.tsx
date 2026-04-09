import React, { useState } from 'react';
import {
  View, TextInput, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import { Colors, Spacing, Radius, Typography } from '../../constants';
import { AppText } from '../../components/common/Text';
import { Button } from '../../components/common/Button';
import { authApi } from '../../services/api/authApi';
import type { RootStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);

  const isValid = /^[6-9]\d{9}$/.test(mobile.trim());

  const handleSendOTP = async () => {
    if (!isValid) return;
    setLoading(true);
    try {
      await authApi.sendOTP(mobile.trim());
      navigation.navigate('OTP', { mobile: mobile.trim() });
    } catch (e: any) {
      Toast.show({ type: 'error', text1: e?.message ?? 'Failed to send OTP' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Logo */}
          <View style={styles.logoArea}>
            <View style={styles.logoMark}>
              <AppText style={styles.logoSymbol}>✦</AppText>
            </View>
            <AppText style={styles.appName}>Tallydekho</AppText>
          </View>

          <AppText style={styles.heading}>Enter your WhatsApp Number</AppText>
          <AppText style={styles.subtext}>We'll send you a verification code</AppText>

          {/* Phone input */}
          <View style={styles.phoneRow}>
            <View style={styles.countryCode}>
              <AppText style={styles.flag}>🇮🇳</AppText>
              <AppText style={styles.code}>+91</AppText>
            </View>
            <TextInput
              style={styles.input}
              placeholder="WhatsApp number"
              placeholderTextColor={Colors.textTertiary}
              keyboardType="phone-pad"
              maxLength={10}
              value={mobile}
              onChangeText={setMobile}
              returnKeyType="done"
              onSubmitEditing={handleSendOTP}
              allowFontScaling={false}
            />
          </View>

          <Button
            label="Send OTP"
            onPress={handleSendOTP}
            loading={loading}
            disabled={!isValid}
            style={styles.sendBtn}
          />

          <AppText style={styles.terms}>
            By continuing, you agree to our{' '}
            <AppText style={styles.link} onPress={() => navigation.navigate('Terms')}>
              Terms
            </AppText>{' '}
            &{' '}
            <AppText style={styles.link} onPress={() => navigation.navigate('PrivacyPolicy')}>
              Privacy Policy
            </AppText>
          </AppText>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.pageBg },
  flex: { flex: 1 },
  content: { flexGrow: 1, padding: Spacing.xl, justifyContent: 'center' },

  logoArea: { alignItems: 'center', marginBottom: Spacing.xxl },
  logoMark: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: Colors.brandPrimary,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  logoSymbol: { fontSize: 32, color: Colors.white },
  appName: {
    fontSize: Typography.xxl, fontWeight: Typography.weightBold,
    color: Colors.textPrimary, letterSpacing: -0.5,
  },

  heading: {
    fontSize: Typography.xl, fontWeight: Typography.weightBold,
    color: Colors.textPrimary, textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtext: {
    fontSize: Typography.base, color: Colors.textSecondary,
    textAlign: 'center', marginBottom: Spacing.xl,
  },

  phoneRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.borderDefault,
    borderRadius: Radius.md, backgroundColor: Colors.cardBg,
    marginBottom: Spacing.base, overflow: 'hidden',
  },
  countryCode: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    borderRightWidth: 1, borderRightColor: Colors.borderDefault,
    gap: 4,
  },
  flag: { fontSize: 18 },
  code: { fontSize: Typography.base, color: Colors.textPrimary, fontWeight: Typography.weightMedium },
  input: {
    flex: 1, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    fontSize: Typography.base, color: Colors.textPrimary,
  },

  sendBtn: { marginBottom: Spacing.xl },

  terms: {
    fontSize: Typography.sm, color: Colors.textTertiary,
    textAlign: 'center', lineHeight: 18,
  },
  link: { color: Colors.textPrimary, fontWeight: Typography.weightMedium },
});
