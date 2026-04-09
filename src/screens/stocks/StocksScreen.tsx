import React, { useCallback, useEffect, useState } from 'react';
import {
  View, FlatList, TouchableOpacity, StyleSheet,
  TextInput, ScrollView, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Spacing, Radius, Typography } from '../../constants';
import { AppText } from '../../components/common/Text';
import { Card } from '../../components/common/Card';
import { ErrorBanner } from '../../components/common/ErrorBanner';
import { useAuthStore } from '../../store/authStore';
import { stocksApi } from '../../services/api/stocksApi';
import type { StockItem, RootStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type StocksTab = 'Total' | 'LowStock' | 'Warehouses';

export default function StocksScreen() {
  const navigation = useNavigation<Nav>();
  const { company } = useAuthStore();

  const [activeTab, setActiveTab] = useState<StocksTab>('Total');
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [totalValue, setTotalValue] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [warehouseCount, setWarehouseCount] = useState(0);

  const fetchStocks = useCallback(async () => {
    if (!company?.guid) return;
    setLoading(true); setError(null);
    try {
      const res = await stocksApi.getTotalStock(company.guid, undefined, search);
      const data = res.data?.data ?? res.data ?? [];
      setItems(data);
      setTotalValue(data.reduce((sum: number, i: StockItem) => sum + (i.totalValue ?? 0), 0));
    } catch (e: any) { setError(e?.message ?? 'Failed to load stocks'); }
    finally { setLoading(false); }
  }, [company?.guid, search]);

  const fetchLowStock = useCallback(async () => {
    if (!company?.guid) return;
    setLoading(true); setError(null);
    try {
      const res = await stocksApi.getLowStock(company.guid);
      const data = res.data?.data ?? res.data ?? [];
      setItems(data);
      setLowStockCount(data.length);
    } catch (e: any) { setError(e?.message ?? 'Failed to load low stock'); }
    finally { setLoading(false); }
  }, [company?.guid]);

  useEffect(() => {
    if (activeTab === 'Total') fetchStocks();
    else if (activeTab === 'LowStock') fetchLowStock();
  }, [activeTab, fetchStocks, fetchLowStock]);

  const formatAmount = (val: number) =>
    val >= 1_00_000 ? `₹${(val / 1_00_000).toFixed(1)}L` : `₹${val.toLocaleString('en-IN')}`;

  // Swipeable stock item row
  const renderItem = ({ item }: { item: StockItem }) => (
    <SwipeableStockItem
      item={item}
      onPress={() => navigation.navigate('StockItemDetail', { itemId: item.id })}
      onTransfer={() => navigation.navigate('StockTransfer', { itemId: item.id })}
      onEdit={() => navigation.navigate('StockAdjust', { itemId: item.id })}
    />
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <AppText variant="h3" style={styles.headerTitle}>Stocks</AppText>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => navigation.navigate('StockBulkTransfer')} style={styles.iconBtn}>
            <AppText style={styles.icon}>⇄</AppText>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('StockAddItem')} style={styles.addBtn}>
            <AppText style={styles.addBtnText}>+ Item</AppText>
          </TouchableOpacity>
        </View>
      </View>

      {/* KPI Row */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.kpiRow}>
        <Card style={styles.kpiCard}>
          <AppText style={styles.kpiLabel}>Total Value</AppText>
          <AppText style={styles.kpiValue}>{formatAmount(totalValue)}</AppText>
        </Card>
        <Card onPress={() => setActiveTab('LowStock')} style={[styles.kpiCard, activeTab === 'LowStock' ? styles.kpiCardActive : null] as any}>
          <AppText style={styles.kpiLabel}>Low Stock</AppText>
          <AppText style={[styles.kpiValue, { color: Colors.warningText }]}>{lowStockCount}</AppText>
        </Card>
        <Card onPress={() => setActiveTab('Warehouses')} style={[styles.kpiCard, activeTab === 'Warehouses' ? styles.kpiCardActive : null] as any}>
          <AppText style={styles.kpiLabel}>Warehouses</AppText>
          <AppText style={styles.kpiValue}>{warehouseCount}</AppText>
        </Card>
      </ScrollView>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {([['Total', 'Total Stock'], ['LowStock', 'Low Stock'], ['Warehouses', 'Warehouses']] as [StocksTab, string][]).map(([key, label]) => (
          <TouchableOpacity
            key={key}
            onPress={() => setActiveTab(key)}
            style={[styles.tab, activeTab === key && styles.tabActive]}
          >
            <AppText style={[styles.tabText, activeTab === key && styles.tabTextActive]}>{label}</AppText>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <AppText style={styles.searchIcon}>🔍</AppText>
        <TextInput
          style={styles.searchInput}
          placeholder="Search items..."
          placeholderTextColor={Colors.textTertiary}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={fetchStocks}
          returnKeyType="search"
          allowFontScaling={false}
        />
      </View>

      {error && <ErrorBanner message={error} onRetry={activeTab === 'Total' ? fetchStocks : fetchLowStock} />}

      {/* List */}
      <FlatList
        data={items}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        refreshing={loading}
        onRefresh={activeTab === 'Total' ? fetchStocks : fetchLowStock}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <AppText style={styles.emptyText}>{error ? '' : 'No items found'}</AppText>
            </View>
          ) : null
        }
      />

      {/* Movement Analytics FAB */}
      <TouchableOpacity
        style={styles.analyticsFab}
        onPress={() => navigation.navigate('StockItemDetail', { itemId: '' })}
      >
        <AppText style={styles.fabText}>📊</AppText>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// ── Swipeable Stock Item ──────────────────────────────────────────
interface SwipeableProps {
  item: StockItem;
  onPress: () => void;
  onTransfer: () => void;
  onEdit: () => void;
}

function SwipeableStockItem({ item, onPress, onTransfer, onEdit }: SwipeableProps) {
  const [offset] = useState(new Animated.Value(0));
  const [swiped, setSwiped] = useState<null | 'left' | 'right'>(null);

  const swipe = (dir: 'left' | 'right') => {
    const toVal = dir === 'left' ? -80 : 80;
    Animated.spring(offset, { toValue: toVal, useNativeDriver: true }).start();
    setSwiped(dir);
  };

  const reset = () => {
    Animated.spring(offset, { toValue: 0, useNativeDriver: true }).start();
    setSwiped(null);
  };

  return (
    <View style={sw.wrapper}>
      {/* Left action: Edit (swipe right reveals) */}
      <TouchableOpacity style={[sw.action, sw.editAction]} onPress={() => { reset(); onEdit(); }}>
        <AppText style={sw.actionText}>✏{'\n'}Edit</AppText>
      </TouchableOpacity>

      {/* Right action: Transfer (swipe left reveals) */}
      <TouchableOpacity style={[sw.action, sw.transferAction]} onPress={() => { reset(); onTransfer(); }}>
        <AppText style={sw.actionText}>⇄{'\n'}Transfer</AppText>
      </TouchableOpacity>

      <Animated.View style={[sw.row, { transform: [{ translateX: offset }] }]}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={swiped ? reset : onPress}
          onLongPress={() => swipe(swiped === 'left' ? 'right' : 'left')}
          style={sw.content}
        >
          <View style={sw.info}>
            <AppText style={sw.name} numberOfLines={1}>{item.name}</AppText>
            <AppText style={sw.meta}>{item.warehouseName} • {item.unit}</AppText>
          </View>
          <View style={sw.right}>
            <AppText style={sw.stock}>{item.currentStock} {item.unit}</AppText>
            <AppText style={sw.value}>{`₹${(item.totalValue ?? 0).toLocaleString('en-IN')}`}</AppText>
            {item.isLowStock && (
              <View style={sw.lowBadge}>
                <AppText style={sw.lowText}>Low</AppText>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.pageBg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm,
    backgroundColor: Colors.cardBg, borderBottomWidth: 1, borderBottomColor: Colors.borderDefault,
  },
  headerTitle: { fontSize: Typography.lg, fontWeight: Typography.weightSemibold },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  iconBtn: { padding: 6 },
  icon: { fontSize: 20, color: Colors.textSecondary },
  addBtn: { backgroundColor: Colors.brandPrimary, borderRadius: Radius.sm, paddingHorizontal: Spacing.md, paddingVertical: 6 },
  addBtnText: { fontSize: Typography.sm, color: Colors.white, fontWeight: Typography.weightSemibold },
  kpiRow: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, gap: Spacing.sm },
  kpiCard: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, minWidth: 110 },
  kpiCardActive: { borderColor: Colors.brandPrimary, borderWidth: 1.5 },
  kpiLabel: { fontSize: Typography.xs, color: Colors.textSecondary },
  kpiValue: { fontSize: Typography.md, fontWeight: Typography.weightSemibold, color: Colors.textPrimary },
  tabRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.borderDefault },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.brandPrimary },
  tabText: { fontSize: Typography.sm, color: Colors.textSecondary },
  tabTextActive: { color: Colors.brandPrimary, fontWeight: Typography.weightSemibold },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    margin: Spacing.base, paddingHorizontal: Spacing.md, paddingVertical: 8,
    borderWidth: 1, borderColor: Colors.borderDefault, borderRadius: Radius.md,
    backgroundColor: Colors.cardBg,
  },
  searchIcon: { fontSize: 14, marginRight: 6 },
  searchInput: { flex: 1, fontSize: Typography.base, color: Colors.textPrimary },
  list: { paddingBottom: 80 },
  separator: { height: 1, backgroundColor: Colors.borderDefault },
  empty: { alignItems: 'center', paddingVertical: Spacing.xxl },
  emptyText: { fontSize: Typography.base, color: Colors.textTertiary },
  analyticsFab: {
    position: 'absolute', bottom: 80, right: Spacing.base,
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.borderDefault,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 4, elevation: 3,
  },
  fabText: { fontSize: 22 },
});

const sw = StyleSheet.create({
  wrapper: { position: 'relative', overflow: 'hidden' },
  action: {
    position: 'absolute', top: 0, bottom: 0,
    width: 80, alignItems: 'center', justifyContent: 'center',
  },
  editAction: { left: 0, backgroundColor: Colors.brandPrimary },
  transferAction: { right: 0, backgroundColor: Colors.infoText },
  actionText: { color: Colors.white, fontSize: 11, textAlign: 'center', fontWeight: '600' },
  row: { backgroundColor: Colors.cardBg },
  content: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md },
  info: { flex: 1 },
  name: { fontSize: Typography.base, fontWeight: Typography.weightMedium, color: Colors.textPrimary },
  meta: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  right: { alignItems: 'flex-end' },
  stock: { fontSize: Typography.base, fontWeight: Typography.weightSemibold, color: Colors.textPrimary },
  value: { fontSize: Typography.sm, color: Colors.textSecondary },
  lowBadge: { backgroundColor: Colors.warningBg, borderRadius: Radius.xs, paddingHorizontal: 6, paddingVertical: 2, marginTop: 2 },
  lowText: { fontSize: Typography.xs, color: Colors.warningText, fontWeight: '600' },
});
