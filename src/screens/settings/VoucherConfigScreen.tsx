import React, { useState } from 'react';
import {
  View, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Spacing, Radius, Typography } from '../../constants';
import { AppText } from '../../components/common/Text';
import { Card } from '../../components/common/Card';
import type { RootStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface VoucherTemplate {
  id: 'standard' | 'detailed' | 'compact';
  name: string;
  description: string;
  features: string[];
}

const TEMPLATES: VoucherTemplate[] = [
  {
    id: 'standard',
    name: 'Standard',
    description: 'Best for most businesses',
    features: [
      'Logo + Company Name + GSTIN',
      'Party details & item table',
      'Tax breakup (CGST/SGST/IGST)',
      'Bank details + T&C + Signature',
    ],
  },
  {
    id: 'detailed',
    name: 'Detailed',
    description: 'Full information, ideal for B2B',
    features: [
      'All Standard features',
      'HSN codes per line item',
      'Full billing & shipping address',
      'Narration field + PO reference',
    ],
  },
  {
    id: 'compact',
    name: 'Compact',
    description: 'Minimal, great for thermal printers',
    features: [
      'Minimal header, no logo',
      'Single-line party info',
      'Combined tax row',
      'No footer bank details',
    ],
  },
];

const VOUCHER_TYPES = [
  'Sales Invoice',
  'Purchase Invoice',
  'Sales Order',
  'Purchase Order',
  'Quotation',
  'Credit Note',
  'Debit Note',
  'Delivery Note',
  'Payment Voucher',
  'Receipt Voucher',
  'Journal Voucher',
  'Contra Voucher',
];

export default function VoucherConfigScreen() {
  const navigation = useNavigation<Nav>();
  const [expanded, setExpanded] = useState<string | null>('Sales Invoice');
  const [selections, setSelections] = useState<Record<string, string>>(
    Object.fromEntries(VOUCHER_TYPES.map(t => [t, 'standard']))
  );

  const setTemplate = (voucher: string, templateId: string) => {
    setSelections(prev => ({ ...prev, [voucher]: templateId }));
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <AppText style={s.back}>←</AppText>
        </TouchableOpacity>
        <AppText style={s.title}>Voucher Configuration</AppText>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Template legend */}
        <AppText style={s.sectionLabel}>Templates</AppText>
        <View style={s.templatesRow}>
          {TEMPLATES.map(t => (
            <Card key={t.id} style={s.templateCard}>
              <AppText style={s.templateName}>{t.name}</AppText>
              <AppText style={s.templateDesc}>{t.description}</AppText>
              <View style={s.templateFeatures}>
                {t.features.map((f, i) => (
                  <View key={i} style={s.featureRow}>
                    <AppText style={s.featureDot}>•</AppText>
                    <AppText style={s.featureText}>{f}</AppText>
                  </View>
                ))}
              </View>
            </Card>
          ))}
        </View>

        {/* Per-voucher type selection */}
        <AppText style={s.sectionLabel}>Voucher Types</AppText>
        {VOUCHER_TYPES.map(voucher => {
          const isOpen = expanded === voucher;
          const selected = TEMPLATES.find(t => t.id === selections[voucher]);
          return (
            <View key={voucher} style={s.voucherSection}>
              <TouchableOpacity
                style={s.voucherHeader}
                onPress={() => setExpanded(isOpen ? null : voucher)}
                activeOpacity={0.7}
              >
                <View style={s.voucherHeaderLeft}>
                  <AppText style={s.voucherName}>{voucher}</AppText>
                  <View style={[s.selectedBadge]}>
                    <AppText style={s.selectedBadgeText}>{selected?.name ?? 'Standard'}</AppText>
                  </View>
                </View>
                <AppText style={s.chevron}>{isOpen ? '▲' : '▼'}</AppText>
              </TouchableOpacity>

              {isOpen && (
                <View style={s.templateSelector}>
                  {TEMPLATES.map(t => {
                    const isActive = selections[voucher] === t.id;
                    return (
                      <TouchableOpacity
                        key={t.id}
                        onPress={() => setTemplate(voucher, t.id)}
                        style={[s.templateOption, isActive && s.templateOptionActive]}
                        activeOpacity={0.7}
                      >
                        {/* Thumbnail preview */}
                        <View style={[s.thumbnail, isActive && s.thumbnailActive]}>
                          <View style={s.thumbLine} />
                          <View style={[s.thumbLine, { width: '60%' }]} />
                          <View style={s.thumbGrid}>
                            <View style={s.thumbCell} />
                            <View style={s.thumbCell} />
                            <View style={s.thumbCell} />
                          </View>
                          {t.id !== 'compact' && <View style={[s.thumbLine, { width: '80%', marginTop: 4 }]} />}
                          {isActive && (
                            <View style={s.thumbCheck}>
                              <AppText style={s.thumbCheckText}>✓</AppText>
                            </View>
                          )}
                        </View>
                        <AppText style={[s.optionName, isActive && s.optionNameActive]}>{t.name}</AppText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}

        <View style={{ height: 60 }} />
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
  sectionLabel: { fontSize: Typography.sm, fontWeight: Typography.weightSemibold, color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.sm, marginTop: Spacing.sm },

  // Template legend cards
  templatesRow: { gap: Spacing.sm, marginBottom: Spacing.base },
  templateCard: { padding: Spacing.base },
  templateName: { fontSize: Typography.base, fontWeight: Typography.weightBold, color: Colors.textPrimary, marginBottom: 2 },
  templateDesc: { fontSize: Typography.sm, color: Colors.textSecondary, marginBottom: Spacing.sm },
  templateFeatures: { gap: 4 },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  featureDot: { fontSize: 14, color: Colors.textTertiary, lineHeight: 18 },
  featureText: { fontSize: Typography.sm, color: Colors.textSecondary, flex: 1, lineHeight: 18 },

  // Voucher type accordion
  voucherSection: { marginBottom: Spacing.xs, borderWidth: 1, borderColor: Colors.borderDefault, borderRadius: Radius.md, backgroundColor: Colors.cardBg, overflow: 'hidden' },
  voucherHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md },
  voucherHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  voucherName: { fontSize: Typography.base, fontWeight: Typography.weightMedium, color: Colors.textPrimary },
  selectedBadge: { backgroundColor: Colors.pageBg, borderWidth: 1, borderColor: Colors.borderDefault, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  selectedBadgeText: { fontSize: 10, color: Colors.textSecondary, fontWeight: '600' },
  chevron: { fontSize: Typography.sm, color: Colors.textTertiary },

  // Template selector inside expanded
  templateSelector: { flexDirection: 'row', gap: Spacing.sm, padding: Spacing.base, borderTopWidth: 1, borderTopColor: Colors.borderDefault, backgroundColor: Colors.pageBg },
  templateOption: { flex: 1, alignItems: 'center' },
  templateOptionActive: {},

  // Thumbnail
  thumbnail: {
    width: '100%', aspectRatio: 0.75,
    backgroundColor: Colors.cardBg, borderWidth: 1.5, borderColor: Colors.borderDefault,
    borderRadius: Radius.sm, padding: 6, position: 'relative',
  },
  thumbnailActive: { borderColor: Colors.brandPrimary, borderWidth: 2 },
  thumbLine: { height: 4, backgroundColor: Colors.borderStrong, borderRadius: 2, marginBottom: 4, width: '100%' },
  thumbGrid: { flexDirection: 'row', gap: 2, marginTop: 4 },
  thumbCell: { flex: 1, height: 20, backgroundColor: Colors.pageBg, borderWidth: 1, borderColor: Colors.borderDefault, borderRadius: 2 },
  thumbCheck: { position: 'absolute', top: 4, right: 4, width: 18, height: 18, borderRadius: 9, backgroundColor: Colors.brandPrimary, alignItems: 'center', justifyContent: 'center' },
  thumbCheckText: { fontSize: 10, color: Colors.white, fontWeight: '700' },

  optionName: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 6, fontWeight: Typography.weightMedium },
  optionNameActive: { color: Colors.brandPrimary, fontWeight: Typography.weightSemibold },
});
