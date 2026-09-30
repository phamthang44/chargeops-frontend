import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBackButton } from '@/components/AppBackButton';
import { AppButton } from '@/components/AppButton';
import { GlassButton } from '@/components/GlassButton';
import { TicketCard } from '@/components/ticket/TicketCard';
import { usePreferences } from '@/context/PreferencesContext';
import type { RootStackParamList } from '@/navigation/types';
import { getTickets } from '@/services/ticketService';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';
import type { Ticket, TicketStatus } from '@/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'MyTickets'>;

export function MyTicketsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const { themeColors } = usePreferences();

  const filterTabs = useMemo<{ key: TicketStatus | 'ALL'; label: string }[]>(() => [
    { key: 'ALL', label: t('ticket.filter.all', 'Tất cả') },
    { key: 'OPEN', label: t('ticket.status.OPEN', 'Mới mở') },
    { key: 'IN_PROGRESS', label: t('ticket.status.IN_PROGRESS', 'Đang xử lý') },
    { key: 'RESOLVED', label: t('ticket.status.RESOLVED', 'Đã giải quyết') },
    { key: 'CLOSED', label: t('ticket.status.CLOSED', 'Đã đóng') },
  ], [t]);

  const [activeTab, setActiveTab] = useState<TicketStatus | 'ALL'>('ALL');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTickets = useCallback(async () => {
    try {
      const res = await getTickets({
        status: activeTab === 'ALL' ? undefined : activeTab,
        page: 1,
        size: 50,
      });
      setTickets(res.items);
    } catch {
      // Error handling
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  useEffect(() => {
    setLoading(true);
    fetchTickets();
  }, [fetchTickets]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTickets();
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: themeColors.surfaceAlt }]} edges={['top', 'bottom']}>
      {/* Universal Sub-Screen Clean Navigation Header */}
      <View style={[styles.header, { borderBottomColor: themeColors.border, backgroundColor: themeColors.surface }]}>
        <AppBackButton onPress={() => navigation.goBack()} />

        <View style={styles.headerTitleBlock}>
          <Text style={[styles.headerTitle, { color: themeColors.textStrong }]} numberOfLines={1}>
            {t('ticket.list.title', 'Phiếu hỗ trợ của tôi')}
          </Text>
          <Text style={[styles.headerSubtitle, { color: themeColors.textMuted }]}>
            {tickets.length > 0
              ? t('ticket.list.countRecorded', { count: tickets.length })
              : t('ticket.list.emptySubtitleHeader', 'Trung tâm sự cố & khiếu nại')}
          </Text>
        </View>

        <GlassButton
          size={40}
          glassEffectStyle="regular"
          fallbackColor={themeColors.surfaceAlt}
          accessibilityLabel={t('ticket.list.newTicket', 'Tạo phiếu mới')}
          onPress={() => navigation.navigate('CreateTicket', {})}
        >
          <Ionicons name="add" size={24} color={themeColors.primary} />
        </GlassButton>
      </View>

      {/* Filter Tabs Horizontal Scroll */}
      <View style={[styles.tabsWrapper, { backgroundColor: themeColors.surface, borderBottomColor: themeColors.border }]}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={filterTabs}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.tabsContent}
          renderItem={({ item }) => {
            const isActive = activeTab === item.key;
            return (
              <Pressable
                style={[
                  styles.tabItem,
                  isActive && [styles.activeTabItem, { borderColor: themeColors.primary }],
                ]}
                onPress={() => setActiveTab(item.key)}
              >
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: isActive ? themeColors.primary : themeColors.textMuted,
                      fontWeight: isActive ? fontWeights.bold : fontWeights.medium,
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      {/* Content */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.primary} />
          <Text style={[styles.loadingText, { color: themeColors.textMuted }]}>
            {t('ticket.list.loading', 'Đang tải danh sách phiếu hỗ trợ...')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(item) => item.ticketId}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={themeColors.primary}
              colors={[themeColors.primary]}
            />
          }
          renderItem={({ item }) => (
            <TicketCard
              ticket={item}
              onPress={() => navigation.navigate('TicketDetail', { ticketId: item.ticketId })}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconCircle, { backgroundColor: themeColors.surface }]}>
                <Ionicons name="shield-checkmark-outline" size={48} color={themeColors.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: themeColors.textStrong }]}>
                {t('ticket.list.emptyTitle', 'Không có sự cố nào')}
              </Text>
              <Text style={[styles.emptySubtitle, { color: themeColors.textMuted }]}>
                {activeTab === 'ALL'
                  ? t('ticket.list.emptyAllDesc', 'Bạn chưa tạo phiếu hỗ trợ nào. Mọi phiên sạc đều diễn ra suôn sẻ!')
                  : t('ticket.list.emptyFilteredDesc', 'Không có phiếu nào ở trạng thái này.')}
              </Text>
              <View style={{ marginTop: spacing.md, width: '70%' }}>
                <AppButton
                  label={t('ticket.list.emptyCreateBtn', 'Gửi yêu cầu hỗ trợ')}
                  variant="secondary"
                  onPress={() => navigation.navigate('CreateTicket', {})}
                />
              </View>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  headerTitleBlock: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  headerTitle: {
    fontSize: fontSizes.heading,
    fontWeight: fontWeights.bold,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: fontSizes.caption - 1,
    marginTop: 2,
  },
  tabsWrapper: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tabsContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  tabItem: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeTabItem: {
    borderWidth: 1,
  },
  tabLabel: {
    fontSize: fontSizes.caption,
  },
  listContent: {
    padding: spacing.md,
    gap: spacing.xs,
    paddingBottom: spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: fontSizes.caption,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: spacing.sm,
  },
  emptyIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  emptyTitle: {
    fontSize: fontSizes.heading - 2,
    fontWeight: fontWeights.bold,
  },
  emptySubtitle: {
    fontSize: fontSizes.caption,
    textAlign: 'center',
    maxWidth: 280,
  },
});
