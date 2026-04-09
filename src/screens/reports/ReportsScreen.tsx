import React from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Spacing, Radius, Typography } from '../../constants';
import { AppText } from '../../components/common/Text';
import { Card } from '../../components/common/Card';
import type { RootStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface ReportCard {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  route: keyof RootStackParamList;
  badge?: string;
  badgeColor?: string;
}

const REPORT_CARDS: ReportCard[] = [
  {
    id: 'financial',
    title: 'Financial',
    subtitle: 'P&L, Balance Sheet, Trial Balance',
    icon: '📈',
    route: 'Financial',
  },
  {
    id: 'compliance',
    title: 'Compliance',
    subtitle: 'GST, E-way Bills, E-Invoicing, Other Taxes',
    icon: '✅',
    route: 'Compliance',
    badge: 'Pending',
    badgeColor: Colors.warningText,
  },
  {
    id: 'audit',
    title: 'Audit Trail',
    subtitle: 'Unreconciled vouchers, entry log',
    icon: '🔍',
    route: 'AuditTrail',
  },
  {
    id: 'ai',
    title: 'AI Insights',
    subtitle: 'Sales forecast vs actual, trends',
    icon: '🤖',
    route: 'AIInsights',
  },
];

export default function ReportsScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <AppText variant="h3" style={styles.headerTitle}>Reports</AppText>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AppText style={styles.sectionLabel}>Overview</AppText>

        {REPORT_CARDS.map(card => (
          <Card key={card.id} onPress={() => navigation.navigate(card.route as any)} style={styles.card}>
            <View style={styles.cardLeft}>
              <View style={styles.iconWrap}>
                <AppText style={styles.cardIcon}>{card.icon}</AppText>
              </View>
              <View style={styles.cardText}>
                <View style={styles.titleRow}>
                  <AppText style={styles.cardTitle}>{card.title}</AppText>
                  {card.badge && (
                    <View style={[styles.badge, { borderColor: card.badgeColor }]}>
                      <AppText style={[styles.badgeText, { color: card.badgeColor }]}>{card.badge}</AppText>
                    </View>
                  )}
                </View>
                <AppText style={styles.cardSubtitle}>{card.subtitle}</AppText>
              </View>
            </View>
            <AppText style={styles.chevron}>›</AppText>
          </Card>
        ))}

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.pageBg },
  header: {
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm,
    backgroundColor: Colors.cardBg, borderBottomWidth: 1, borderBottomColor: Colors.borderDefault,
  },
  headerTitle: { fontSize: Typography.lg, fontWeight: Typography.weightSemibold },
  content: { padding: Spacing.base },
  sectionLabel: { fontSize: Typography.sm, fontWeight: Typography.weightMedium, color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.sm },
  card: { marginBottom: Spacing.sm, flexDirection: 'row', alignItems: 'center', padding: Spacing.base },
  cardLeft: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  iconWrap: {
    width: 44, height: 44, borderRadius: Radius.md,
    backgroundColor: Colors.pageBg, alignItems: 'center', justifyContent: 'center',
    marginRight: Spacing.md,
  },
  cardIcon: { fontSize: 22 },
  cardText: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  cardTitle: { fontSize: Typography.base, fontWeight: Typography.weightSemibold, color: Colors.textPrimary },
  cardSubtitle: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  badge: {
    borderWidth: 1, borderRadius: Radius.full,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  badgeText: { fontSize: 10, fontWeight: '600' },
  chevron: { fontSize: 22, color: Colors.textTertiary },
});
