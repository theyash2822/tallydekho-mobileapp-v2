import React, { useState } from 'react';
import { View, TextInput, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import { Colors, Spacing, Radius, Typography } from '../../constants';
import { AppText } from '../../components/common/Text';
import { Button } from '../../components/common/Button';
import { authApi } from '../../services/api/authApi';
import { useAuthStore } from '../../store/authStore';
import type { RootStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function GetStartedScreen() {
  const navigation = useNavigation<Nav>();
  const { setAuth, user, token } = useAuthStore();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await authApi.updateProfile(name.trim());
      if (user && token) {
        await setAuth(token, { ...user, name: name.trim() }, false);
      }
      navigation.navigate('Terms');
    } catch (e: any) {
      Toast.show({ type: 'error', text1: e?.message ?? 'Failed to save name' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.content}>
          <View style={styles.logoArea}>
            <View style={styles.logoMark}>
              <AppText style={styles.logoSymbol}>✦</AppText>
            </View>
            <AppText style={styles.appName}>Tallydekho</AppText>
          </View>

          <AppText style={styles.heading}>Get Started</AppText>
          <AppText style={styles.subtext}>
            Log in to access your profile and get started easily.
          </AppText>

          <AppText style={styles.label}>Your Name</AppText>
          <TextInput
            style={styles.input}
            placeholder="Enter your full name"
            placeholderTextColor={Colors.textTertiary}
            value={name}
            onChangeText={setName}
            returnKeyType="done"
            onSubmitEditing={handleContinue}
            allowFontScaling={false}
          />

          <Button
            label="Continue"
            onPress={handleContinue}
            loading={loading}
            disabled={!name.trim()}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.pageBg },
  flex: { flex: 1 },
  content: { flex: 1, padding: Spacing.xl, justifyContent: 'center' },

  logoArea: { alignItems: 'center', marginBottom: Spacing.xl },
  logoMark: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: Colors.brandPrimary,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm,
  },
  logoSymbol: { fontSize: 32, color: Colors.white },
  appName: { fontSize: Typography.xxl, fontWeight: Typography.weightBold, color: Colors.textPrimary },

  heading: { fontSize: Typography.xl, fontWeight: Typography.weightBold, color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.xs },
  subtext: { fontSize: Typography.base, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xl, lineHeight: 22 },
  label: { fontSize: Typography.sm, fontWeight: Typography.weightMedium, color: Colors.textSecondary, marginBottom: Spacing.xs },
  input: {
    borderWidth: 1, borderColor: Colors.borderDefault,
    borderRadius: Radius.md, backgroundColor: Colors.cardBg,
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
    fontSize: Typography.base, color: Colors.textPrimary,
    marginBottom: Spacing.base,
  },
});
