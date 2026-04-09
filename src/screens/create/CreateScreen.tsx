import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Spacing, Radius, Typography } from '../../constants';
import { AppText } from '../../components/common/Text';
import type { RootStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface QuickActionItem {
  label: string;
  route: keyof RootStackParamList;
}

interface QuickActionGroup {
  id: string;
  title: string;
  icon: string;
  items: QuickActionItem[];
}

const QUICK_ACTIONS: QuickActionGroup[] = [
  {
    id: 'sales',
    title: 'Sales',
    icon: '↗',
    items: [
      { label: 'Create Invoice',       route: 'CreateSalesInvoice' },
      { label: 'Create Quotation',      route: 'CreateQuotation' },
      { label: 'Create Sales Orders',   route: 'CreateSalesOrder' },
      { label: 'Create Delivery Note',  route: 'CreateDeliveryNote' },
      { label: 'Credit Note',           route: 'CreateCreditNote' },
    ],
  },
  {
    id: 'purchase',
    title: 'Purchase',
    icon: '🛒',
    items: [
      { label: 'Purchase Invoice', route: 'CreatePurchaseInvoice' },
      { label: 'Purchase Order',   route: 'CreatePurchaseOrder' },
      { label: 'Debit Note',       route: 'CreateDebitNote' },
    ],
  },
  {
    id: 'voucher',
    title: 'Voucher',
    icon: '▣',
    items: [
      { label: 'Payment',  route: 'CreateVoucher' },
      { label: 'Receipt',  route: 'CreateVoucher' },
      { label: 'Journal',  route: 'CreateVoucher' },
      { label: 'Contra',   route: 'CreateVoucher' },
    ],
  },
  {
    id: 'inventory',
    title: 'Inventory',
    icon: '◈',
    items: [
      { label: 'Stock Adjustment', route: 'StockAdjust' },
      { label: 'Stock Transfer',   route: 'StockTransfer' },
      { label: 'Add Item',         route: 'StockAddItem' },
      { label: 'Add Warehouse',    route: 'StockAddItem' },
    ],
  },
  {
    id: 'ledgers',
    title: 'Ledgers',
    icon: '☰',
    items: [
      { label: 'Sundry Creditors', route: 'Ledger' as any },
      { label: 'Sundry Debtors',   route: 'Ledger' as any },
      { label: 'Duties & Taxes',   route: 'Ledger' as any },
      { label: 'Custom Groups',    route: 'Ledger' as any },
    ],
  },
];

export default function CreateScreen() {
  const navigation = useNavigation<Nav>();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggle = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const handleItem = (item: QuickActionItem) => {
    navigation.navigate(item.route as any);
  };

  return (
    <View style={styles.container}>
      {/* Drag handle */}
      <View style={styles.handle} />
      <View style={styles.headerRow}>
        <AppText variant="h3" style={styles.title}>Quick Actions</AppText>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <AppText style={styles.closeIcon}>✕</AppText>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Spacing.xxl }}>
        {QUICK_ACTIONS.map((group) => {
          const isOpen = expandedId === group.id;
          return (
            <View key={group.id} style={styles.group}>
              <TouchableOpacity
                onPress={() => toggle(group.id)}
                activeOpacity={0.7}
                style={[styles.groupHeader, isOpen && styles.groupHeaderActive]}
              >
                <View style={[styles.iconWrap, isOpen && styles.iconWrapActive]}>
                  <AppText style={[styles.groupIcon, isOpen && styles.groupIconActive]}>
                    {group.icon}
                  </AppText>
                </View>
                <AppText style={[styles.groupTitle, isOpen && styles.groupTitleActive]}>
                  {group.title}
                </AppText>
                <AppText style={[styles.chevron, isOpen && styles.chevronOpen]}>›</AppText>
              </TouchableOpacity>

              {isOpen && (
                <View style={styles.itemsContainer}>
                  {group.items.map((item) => (
                    <TouchableOpacity
                      key={item.label}
                      onPress={() => handleItem(item)}
                      activeOpacity={0.6}
                      style={styles.item}
                    >
                      <AppText style={styles.itemLabel}>{item.label}</AppText>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Close FAB */}
      <TouchableOpacity style={styles.closeFab} onPress={() => navigation.goBack()}>
        <AppText style={styles.closeFabText}>✕</AppText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.pageBg,
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.base,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.borderStrong,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.base,
  },
  title: {
    fontSize: Typography.lg,
    fontWeight: Typography.weightSemibold,
    color: Colors.textPrimary,
  },
  closeIcon: {
    fontSize: 18,
    color: Colors.textSecondary,
  },
  group: {
    marginBottom: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    backgroundColor: Colors.cardBg,
    overflow: 'hidden',
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    backgroundColor: Colors.cardBg,
  },
  groupHeaderActive: {
    backgroundColor: Colors.activeBg,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.pageBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  iconWrapActive: {
    backgroundColor: Colors.cardBg,
  },
  groupIcon: {
    fontSize: 18,
    color: Colors.textSecondary,
  },
  groupIconActive: {
    color: Colors.brandPrimary,
  },
  groupTitle: {
    flex: 1,
    fontSize: Typography.base,
    fontWeight: Typography.weightMedium,
    color: Colors.textPrimary,
  },
  groupTitleActive: {
    fontWeight: Typography.weightSemibold,
  },
  chevron: {
    fontSize: 22,
    color: Colors.textTertiary,
    transform: [{ rotate: '0deg' }],
  },
  chevronOpen: {
    transform: [{ rotate: '90deg' }],
  },
  itemsContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderDefault,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.base,
  },
  item: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderDefault,
  },
  itemLabel: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
  },
  closeFab: {
    position: 'absolute',
    bottom: Spacing.xl,
    alignSelf: 'center',
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.brandPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  closeFabText: {
    fontSize: 20,
    color: Colors.white,
    fontWeight: Typography.weightBold,
  },
});
