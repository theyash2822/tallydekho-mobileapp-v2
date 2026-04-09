import React from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Spacing, Typography } from '../../constants';
import { AppText } from '../../components/common/Text';
import type { RootStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const PRIVACY = `At TallyDekho, your privacy is important to us. This Privacy Policy explains how we collect, use, and protect your information.

1. INFORMATION WE COLLECT
• Phone number (for OTP authentication)
• Company name and GSTIN
• Financial data synced from Tally Prime
• Device information for security purposes

2. HOW WE USE YOUR INFORMATION
• To provide and improve TallyDekho services
• To authenticate your identity via WhatsApp OTP
• To sync your Tally data securely
• To send important notifications about your account

3. DATA STORAGE & SECURITY
• All data is encrypted in transit (TLS 1.3) and at rest (AES-256)
• Financial data is stored on secure servers in India
• We do not sell, rent, or share your personal data with third parties
• Only you and authorised team members can access your company data

4. TALLY DATA
• Data synced from Tally Prime is stored on our servers to enable mobile access
• You can request deletion of your data at any time
• Deleting your account permanently removes all associated data within 30 days

5. COOKIES & ANALYTICS
• We use minimal analytics to improve app performance
• No advertising cookies or third-party trackers are used

6. YOUR RIGHTS
• Access: Request a copy of your data
• Correction: Update incorrect information
• Deletion: Delete your account and all data
• Portability: Export your data in standard formats

7. CONTACT
Privacy concerns: privacy@tallydekho.com

Effective date: 23 January 2025`;

export default function PrivacyPolicyScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <AppText style={s.back}>←</AppText>
        </TouchableOpacity>
        <AppText style={s.title}>Privacy Policy</AppText>
        <View style={{ width: 44 }} />
      </View>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <AppText style={s.date}>Effective date: 23 January 2025</AppText>
        <AppText style={s.body}>{PRIVACY}</AppText>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.pageBg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: 10, backgroundColor: Colors.cardBg, borderBottomWidth: 1, borderBottomColor: Colors.borderDefault },
  back: { fontSize: 22, color: Colors.textPrimary, marginRight: Spacing.sm },
  title: { flex: 1, fontSize: Typography.md, fontWeight: Typography.weightSemibold, textAlign: 'center' },
  content: { padding: Spacing.xl },
  date: { fontSize: Typography.sm, color: Colors.textTertiary, marginBottom: Spacing.base, fontStyle: 'italic' },
  body: { fontSize: Typography.base, color: Colors.textSecondary, lineHeight: 24 },
});
