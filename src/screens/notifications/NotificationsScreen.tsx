import React, { useCallback, useEffect, useState } from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Spacing, Radius, Typography } from '../../constants';
import { AppText } from '../../components/common/Text';
import { ErrorBanner } from '../../components/common/ErrorBanner';
import { useAuthStore } from '../../store/authStore';
import apiClient from '../../services/api/client';
import type { RootStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type NotifTab = 'All' | 'Alerts' | 'System';

interface Notification {
  id: string;
  title: string;
  body: string;
  type: 'alert' | 'system' | 'irn' | 'sync';
  read: boolean;
  createdAt: string;
}

const TYPE_ICON: Record<string, string> = { alert: '⚠️', system: '⚙️', irn: '📄', sync: '🔄' };

export default function NotificationsScreen() {
  const navigation = useNavigation<Nav>();
  const { company } = useAuthStore();
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<NotifTab>('All');
  const [unreadCount, setUnreadCount] = useState(0);

  const fetch = useCallback(async () => {
    if (!company?.guid) return;
    setLoading(true); setError(null);
    try {
      const res = await apiClient.get('/notifications', { params: { companyGuid: company.guid } });
      const data: Notification[] = res.data?.data ?? res.data ?? [];
      setNotifs(data);
      setUnreadCount(data.filter(n => !n.read).length);
    } catch (e: any) { setError(e?.message ?? 'Failed to load notifications'); }
    finally { setLoading(false); }
  }, [company?.guid]);

  useEffect(() => { fetch(); }, [fetch]);

  const markAllRead = async () => {
    try { await apiClient.post('/notifications/mark-all-read', { companyGuid: company?.guid }); fetch(); } catch { /* non-fatal */ }
  };

  const filtered = tab === 'All' ? notifs : notifs.filter(n => tab === 'Alerts' ? n.type === 'alert' || n.type === 'irn' : n.type === 'system' || n.type === 'sync');

  const renderItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity style={[s.item, !item.read && s.itemUnread]} activeOpacity={0.7}>
      <View style={s.iconWrap}>
        <AppText style={s.icon}>{TYPE_ICON[item.type] ?? '🔔'}</AppText>
      </View>
      <View style={s.itemContent}>
        <AppText style={[s.itemTitle, !item.read && s.itemTitleUnread]}>{item.title}</AppText>
        <AppText style={s.itemBody} numberOfLines={2}>{item.body}</AppText>
        <AppText style={s.itemTime}>{new Date(item.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</AppText>
      </View>
      {!item.read && <View style={s.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <AppText style={s.back}>←</AppText>
        </TouchableOpacity>
        <AppText style={s.title}>Notifications {unreadCount > 0 ? `(${unreadCount})` : ''}</AppText>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead}>
            <AppText style={s.markRead}>Mark all read</AppText>
          </TouchableOpacity>
        )}
      </View>

      <View style={s.tabs}>
        {(['All', 'Alerts', 'System'] as NotifTab[]).map(t => (
          <TouchableOpacity key={t} onPress={() => setTab(t)} style={[s.tab, tab === t && s.tabActive]}>
            <AppText style={[s.tabText, tab === t && s.tabTextActive]}>{t}</AppText>
          </TouchableOpacity>
        ))}
      </View>

      {error && <ErrorBanner message={error} onRetry={fetch} />}

      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        refreshing={loading}
        onRefresh={fetch}
        contentContainerStyle={s.list}
        ItemSeparatorComponent={() => <View style={s.sep} />}
        ListEmptyComponent={!loading ? <View style={s.empty}><AppText style={s.emptyText}>{error ? '' : 'No notifications'}</AppText></View> : null}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.pageBg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: 10, backgroundColor: Colors.cardBg, borderBottomWidth: 1, borderBottomColor: Colors.borderDefault },
  back: { fontSize: 22, color: Colors.textPrimary, marginRight: Spacing.sm },
  title: { flex: 1, fontSize: Typography.md, fontWeight: Typography.weightSemibold },
  markRead: { fontSize: Typography.sm, color: Colors.textSecondary },
  tabs: { flexDirection: 'row', backgroundColor: Colors.cardBg, borderBottomWidth: 1, borderBottomColor: Colors.borderDefault },
  tab: { flex: 1, paddingVertical: Spacing.sm, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.brandPrimary },
  tabText: { fontSize: Typography.sm, color: Colors.textSecondary },
  tabTextActive: { color: Colors.brandPrimary, fontWeight: Typography.weightSemibold },
  list: { paddingBottom: 80 },
  sep: { height: 1, backgroundColor: Colors.borderDefault },
  item: { flexDirection: 'row', alignItems: 'flex-start', padding: Spacing.base, backgroundColor: Colors.cardBg },
  itemUnread: { backgroundColor: Colors.pageBg },
  iconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.borderDefault, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  icon: { fontSize: 18 },
  itemContent: { flex: 1 },
  itemTitle: { fontSize: Typography.base, color: Colors.textSecondary, marginBottom: 2 },
  itemTitleUnread: { color: Colors.textPrimary, fontWeight: Typography.weightSemibold },
  itemBody: { fontSize: Typography.sm, color: Colors.textSecondary, lineHeight: 18, marginBottom: 4 },
  itemTime: { fontSize: Typography.xs, color: Colors.textTertiary },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.brandPrimary, marginTop: 4 },
  empty: { alignItems: 'center', paddingVertical: Spacing.xxl },
  emptyText: { fontSize: Typography.base, color: Colors.textTertiary },
});
