import React from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Spacing, Typography } from '../../constants';
import { AppText } from '../../components/common/Text';
import { Button } from '../../components/common/Button';
import type { RootStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const TERMS = `Welcome to TallyDekho! By using our app, you agree to the following terms and conditions.

1. ACCEPTANCE OF TERMS
By accessing and using TallyDekho, you accept and agree to be bound by these Terms of Service.

2. USE OF SERVICE
TallyDekho provides financial data synchronisation and management tools. You agree to use the service only for lawful purposes.

3. DATA & PRIVACY
Your financial data is encrypted and stored securely. We do not sell or share your data with third parties. See our Privacy Policy for details.

4. TALLY INTEGRATION
TallyDekho integrates with Tally Prime via a desktop companion app. You are responsible for ensuring your Tally installation is licensed.

5. ACCOUNT SECURITY
You are responsible for maintaining the confidentiality of your account credentials and OTP codes.

6. LIMITATIONS
TallyDekho is provided "as is". We are not liable for any financial decisions made based on data shown in the app.

7. CHANGES
We may update these terms at any time. Continued use of the app constitutes acceptance of updated terms.

8. CONTACT
For any queries, contact us at support@tallydekho.com

Effective date: 23 January 2025`;

export default function TermsScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <AppText style={s.back}>←</AppText>
        </TouchableOpacity>
        <AppText style={s.title}>Terms and Conditions</AppText>
        <View style={{ width: 44 }} />
      </View>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <AppText style={s.date}>Effective date: 23 January 2025</AppText>
        <AppText style={s.body}>{TERMS}</AppText>
        <View style={{ height: 24 }} />
      </ScrollView>
      <View style={s.footer}>
        <Button label="I Agree" onPress={() => navigation.navigate('SyncTally')} />
      </View>
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
  footer: { padding: Spacing.base, backgroundColor: Colors.cardBg, borderTopWidth: 1, borderTopColor: Colors.borderDefault },
});
