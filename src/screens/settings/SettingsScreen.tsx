import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Spacing, Radius, Typography } from '../../constants';
import { AppText } from '../../components/common/Text';
import { Card } from '../../components/common/Card';
import { useAuthStore } from '../../store/authStore';
import type { RootStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface SettingsSection { id: string; title: string; icon: string; items: SettingsItem[]; }
interface SettingsItem { id: string; label: string; subtitle?: string; type: 'nav' | 'toggle' | 'info'; value?: string | boolean; }

export default function SettingsScreen() {
  const navigation = useNavigation<Nav>();
  const { user, company, logout } = useAuthStore();
  const [biometric, setBiometric] = useState(false);
  const [notifications, setNotifications] = useState(true);

  const SECTIONS: SettingsSection[] = [
    {
      id: 'account', title: 'Account & Organization', icon: '👤',
      items: [
        { id: 'profile', label: 'Profile', subtitle: user?.name ?? 'Set up your profile', type: 'nav' },
        { id: 'company', label: 'Company Information', subtitle: company?.name ?? 'Not configured', type: 'nav' },
        { id: 'license', label: 'License & Credits', subtitle: 'Free Plan', type: 'nav' },
      ],
    },
    {
      id: 'preferences', title: 'Preferences', icon: '⚙️',
      items: [
        { id: 'language', label: 'Language & Region', subtitle: 'English, India, UTC+05:30', type: 'nav' },
        { id: 'currency', label: 'Currency & Number Format', subtitle: 'INR, DD/MM/YYYY', type: 'nav' },
        { id: 'voucher', label: 'Voucher Configuration', subtitle: 'Sales Invoice, Purchase...', type: 'nav' },
      ],
    },
    {
      id: 'security', title: 'Security', icon: '🔒',
      items: [
        { id: 'biometric', label: 'Biometric / Face ID', type: 'toggle', value: biometric },
        { id: 'passkey', label: 'PassKey (4-digit)', subtitle: 'App lock on background', type: 'nav' },
      ],
    },
    {
      id: 'notifications', title: 'Notifications', icon: '🔔',
      items: [
        { id: 'notifs', label: 'Push Notifications', type: 'toggle', value: notifications },
        { id: 'channels', label: 'Channels & Quiet Hours', type: 'nav' },
      ],
    },
    {
      id: 'integrations', title: 'Integrations', icon: '🔌',
      items: [
        { id: 'tally', label: 'Tally Prime', subtitle: 'Desktop sync', type: 'nav' },
        { id: 'ewaybill', label: 'E-Way Bill', subtitle: 'ewaybillgst.gov.in · NIC GST API', type: 'nav' },
        { id: 'einvoice', label: 'E-Invoicing (IRN)', subtitle: 'einvoice1.gst.gov.in · IRP 1-6', type: 'nav' },
        { id: 'bankfeeds', label: 'Bank Feeds', subtitle: 'Coming soon', type: 'info' },
      ],
    },
  ];

  const handleNav = (id: string) => {
    if (id === 'ewaybill') (navigation as any).navigate('EWayBillIntegration');
    if (id === 'einvoice') (navigation as any).navigate('EInvoiceIntegration');
    if (id === 'tally') navigation.navigate('SyncTally');
  };

  const handleToggle = (id: string, value: boolean) => {
    if (id === 'biometric') setBiometric(value);
    if (id === 'notifs') setNotifications(value);
  };

  const handleLogout = async () => {
    await logout();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <AppText style={s.back}>←</AppText>
        </TouchableOpacity>
        <AppText style={s.title}>Settings</AppText>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* User card */}
        <Card style={s.userCard}>
          <View style={s.userAvatar}>
            <AppText style={s.userInitial}>{(user?.name ?? 'U').charAt(0).toUpperCase()}</AppText>
          </View>
          <View style={s.userInfo}>
            <AppText style={s.userName}>{user?.name ?? 'User'}</AppText>
            <AppText style={s.userMobile}>+91 {user?.mobile}</AppText>
          </View>
        </Card>

        {SECTIONS.map(section => (
          <View key={section.id} style={s.section}>
            <View style={s.sectionHeader}>
              <AppText style={s.sectionIcon}>{section.icon}</AppText>
              <AppText style={s.sectionTitle}>{section.title}</AppText>
            </View>
            <Card style={s.sectionCard}>
              {section.items.map((item, idx) => (
                <View key={item.id}>
                  {idx > 0 && <View style={s.sep} />}
                  <TouchableOpacity
                    style={s.item}
                    activeOpacity={item.type === 'nav' ? 0.7 : 1}
                    disabled={item.type !== 'nav'}
                    onPress={() => item.type === 'nav' ? handleNav(item.id) : null}
                  >
                    <View style={s.itemLeft}>
                      <AppText style={s.itemLabel}>{item.label}</AppText>
                      {item.subtitle && <AppText style={s.itemSub}>{item.subtitle}</AppText>}
                    </View>
                    {item.type === 'toggle' && (
                      <Switch
                        value={item.value as boolean}
                        onValueChange={v => handleToggle(item.id, v)}
                        trackColor={{ true: Colors.brandPrimary, false: Colors.borderDefault }}
                        thumbColor={Colors.white}
                      />
                    )}
                    {item.type === 'nav' && <AppText style={s.chevron}>›</AppText>}
                    {item.type === 'info' && <AppText style={s.infoBadge}>Soon</AppText>}
                  </TouchableOpacity>
                </View>
              ))}
            </Card>
          </View>
        ))}

        {/* Made in India + Logout */}
        <View style={s.footer}>
          <AppText style={s.footerText}>Made in India 🇮🇳 with Love</AppText>
          <TouchableOpacity onPress={handleLogout} style={s.logoutBtn}>
            <AppText style={s.logoutText}>Log Out</AppText>
          </TouchableOpacity>
        </View>

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
  content: { padding: Spacing.base },
  userCard: { flexDirection: 'row', alignItems: 'center', padding: Spacing.base, marginBottom: Spacing.base },
  userAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.brandPrimary, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  userInitial: { fontSize: Typography.xl, color: Colors.white, fontWeight: Typography.weightBold },
  userInfo: { flex: 1 },
  userName: { fontSize: Typography.base, fontWeight: Typography.weightSemibold, color: Colors.textPrimary },
  userMobile: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  section: { marginBottom: Spacing.base },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.xs, paddingHorizontal: 4 },
  sectionIcon: { fontSize: 14 },
  sectionTitle: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8 },
  sectionCard: { padding: 0, overflow: 'hidden' },
  sep: { height: 1, backgroundColor: Colors.borderDefault, marginLeft: Spacing.base },
  item: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md },
  itemLeft: { flex: 1 },
  itemLabel: { fontSize: Typography.base, color: Colors.textPrimary },
  itemSub: { fontSize: Typography.sm, color: Colors.textTertiary, marginTop: 2 },
  chevron: { fontSize: 22, color: Colors.textTertiary },
  infoBadge: { fontSize: 10, color: Colors.warningText, backgroundColor: Colors.warningBg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.full },
  footer: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.base },
  footerText: { fontSize: Typography.sm, color: Colors.textTertiary },
  logoutBtn: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm, borderWidth: 1, borderColor: Colors.negativeText, borderRadius: Radius.sm },
  logoutText: { fontSize: Typography.base, color: Colors.negativeText, fontWeight: Typography.weightSemibold },
});
