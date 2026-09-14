import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { EmptyState } from '@/components/illustrations/EmptyState';
import { usePreferences } from '@/context/PreferencesContext';
import {
  clearAllNotifications,
  deleteNotification,
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type AppNotification,
} from '@/services/notificationService';
import { fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';
import { formatRelativeTime } from '@/utils/format';

/* ------------------------------------------------------------------ */
/*  Enable LayoutAnimation on Android                                  */
/* ------------------------------------------------------------------ */
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface NotificationSheetProps {
  visible: boolean;
  onClose: () => void;
  onNavigate?: (notification: AppNotification) => void;
  onUnreadChange?: (count: number) => void;
}

type TabType = 'all' | 'unread';

/* ------------------------------------------------------------------ */
/*  Look-up tables & Action Labels                                     */
/* ------------------------------------------------------------------ */

const TYPE_CONFIG: Record<
  AppNotification['type'],
  { icon: keyof typeof Ionicons.glyphMap; color: string; actionLabel: string }
> = {
  charging: {
    icon: 'flash',
    color: '#10B981',
    actionLabel: 'Xem phiên sạc',
  },
  booking: {
    icon: 'calendar',
    color: '#3B82F6',
    actionLabel: 'Chi tiết đặt chỗ',
  },
  wallet: {
    icon: 'wallet',
    color: '#F59E0B',
    actionLabel: 'Ví & Nạp tiền',
  },
  promo: {
    icon: 'gift',
    color: '#8B5CF6',
    actionLabel: 'Xem ưu đãi',
  },
};

/* ------------------------------------------------------------------ */
/*  Action-Driven Notification Item (Novu / Knock Pattern)             */
/* ------------------------------------------------------------------ */

interface NotificationItemProps {
  notification: AppNotification;
  themeColors: ReturnType<typeof usePreferences>['themeColors'];
  onPress: () => void;
  onDelete: () => void;
}

function NotificationItem({ notification, themeColors, onPress, onDelete }: NotificationItemProps) {
  const cfg = TYPE_CONFIG[notification.type];
  const hasLink = !!notification.referenceId;

  return (
    <View
      style={[
        styles.item,
        {
          backgroundColor: notification.read ? themeColors.surface : `${themeColors.primary}0D`,
          borderColor: notification.read ? themeColors.border : `${themeColors.primary}33`,
        },
      ]}
    >
      <Pressable
        style={({ pressed }) => [styles.itemMain, pressed && styles.pressedRow]}
        onPress={onPress}
        accessibilityRole="button"
      >
        {/* Category Icon Badge with soft tinted background */}
        <View style={[styles.iconWrap, { backgroundColor: `${cfg.color}1F` }]}>
          <Ionicons name={cfg.icon} size={20} color={cfg.color} />
        </View>

        {/* Content Body */}
        <View style={styles.body}>
          {/* Header Row: Dot + Title + Timestamp */}
          <View style={styles.itemHeader}>
            {!notification.read && (
              <View style={[styles.unreadDot, { backgroundColor: themeColors.primary }]} />
            )}
            <Text
              style={[
                styles.title,
                {
                  color: notification.read ? themeColors.textStrong : themeColors.primaryDark,
                  fontWeight: notification.read ? fontWeights.semibold : fontWeights.bold,
                },
              ]}
              numberOfLines={1}
            >
              {notification.title}
            </Text>

            <Text style={[styles.time, { color: themeColors.textMuted }]}>
              {formatRelativeTime(notification.createdAt)}
            </Text>
          </View>

          {/* Description */}
          <Text style={[styles.desc, { color: themeColors.textBody }]} numberOfLines={2}>
            {notification.body}
          </Text>

          {/* Bottom Row: Action Pill CTA (Novu pattern) */}
          {hasLink && (
            <View style={styles.actionRow}>
              <View
                style={[
                  styles.actionPill,
                  {
                    backgroundColor: notification.read
                      ? `${themeColors.primary}12`
                      : themeColors.primary,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.actionPillText,
                    {
                      color: notification.read
                        ? themeColors.primary
                        : themeColors.surface,
                    },
                  ]}
                >
                  {cfg.actionLabel}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={12}
                  color={notification.read ? themeColors.primary : themeColors.surface}
                />
              </View>
            </View>
          )}
        </View>
      </Pressable>

      {/* Subtle dismiss button positioned at top-right, sibling to itemMain to avoid nesting */}
      <Pressable
        onPress={onDelete}
        hitSlop={8}
        style={({ pressed }) => [
          styles.dismissBtn,
          pressed && { backgroundColor: `${themeColors.textMuted}20` },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Xóa thông báo"
      >
        <Ionicons name="close" size={14} color={themeColors.textMuted} />
      </Pressable>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Notification Sheet                                            */
/* ------------------------------------------------------------------ */

export function NotificationSheet({
  visible,
  onClose,
  onNavigate,
  onUnreadChange,
}: NotificationSheetProps) {
  const { t } = useTranslation();
  const { themeColors } = usePreferences();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('all');

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const data = await getNotifications();
    setItems(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (visible) fetchItems();
  }, [visible, fetchItems]);

  const unreadCount = items.filter((i) => !i.read).length;

  useEffect(() => {
    if (!loading) onUnreadChange?.(unreadCount);
  }, [unreadCount, loading, onUnreadChange]);

  const filteredItems = useMemo(() => {
    if (activeTab === 'unread') {
      return items.filter((n) => !n.read);
    }
    return items;
  }, [items, activeTab]);

  /* ---- Optimistic Handlers ---- */

  const handleMarkAllRead = async () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const updated = await markAllNotificationsAsRead();
    setItems(updated);
  };

  const handleClearAll = async () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const updated = await clearAllNotifications();
    setItems(updated);
  };

  const handleDelete = async (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const updated = await deleteNotification(id);
    setItems(updated);
  };

  const handlePress = async (notification: AppNotification) => {
    // 1. Optimistically mark as read
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const updated = await markNotificationAsRead(notification.id);
    setItems(updated);

    // 2. Navigate if linked
    if (notification.referenceId && onNavigate) {
      onClose();
      onNavigate(notification);
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={t('stationList.notificationsTitle', 'Thông báo')}
      animation="fade"
    >
      {/* Top Controls: Segmented Tabs (All vs Unread) + Bulk Action */}
      <View style={styles.topControlBar}>
        {/* Novu / Knock Segmented Tabs Control */}
        <View style={[styles.segmentedWrap, { backgroundColor: themeColors.surfaceAlt }]}>
          <Pressable
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setActiveTab('all');
            }}
            style={[
              styles.segmentBtn,
              activeTab === 'all' && [
                styles.segmentBtnActive,
                { backgroundColor: themeColors.surface },
              ],
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                {
                  color: activeTab === 'all' ? themeColors.textStrong : themeColors.textMuted,
                  fontWeight: activeTab === 'all' ? fontWeights.bold : fontWeights.medium,
                },
              ]}
            >
              Tất cả ({items.length})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setActiveTab('unread');
            }}
            style={[
              styles.segmentBtn,
              activeTab === 'unread' && [
                styles.segmentBtnActive,
                { backgroundColor: themeColors.surface },
              ],
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                {
                  color: activeTab === 'unread' ? themeColors.primary : themeColors.textMuted,
                  fontWeight: activeTab === 'unread' ? fontWeights.bold : fontWeights.medium,
                },
              ]}
            >
              Chưa đọc ({unreadCount})
            </Text>
          </Pressable>
        </View>

        {/* Quick Read-All icon button */}
        {unreadCount > 0 && (
          <Pressable
            onPress={handleMarkAllRead}
            style={({ pressed }) => [
              styles.readAllBtn,
              {
                backgroundColor: pressed ? `${themeColors.primary}20` : `${themeColors.primary}0F`,
                borderColor: `${themeColors.primary}33`,
              },
            ]}
          >
            <Ionicons name="checkmark-done" size={14} color={themeColors.primary} />
            <Text style={[styles.readAllText, { color: themeColors.primary }]}>
              {t('notifications.markAllRead', 'Đã đọc hết')}
            </Text>
          </Pressable>
        )}
      </View>

      {/* Main Notification Feed List */}
      {loading ? (
        <ActivityIndicator color={themeColors.primary} style={{ marginVertical: spacing.xl }} />
      ) : filteredItems.length === 0 ? (
        <View style={styles.empty}>
          <EmptyState variant="notifications" />
          <Text style={[styles.emptyText, { color: themeColors.textStrong }]}>
            {activeTab === 'unread'
              ? 'Tuyệt vời! Bạn đã đọc hết mọi thông báo.'
              : t('stationList.notificationsEmpty', 'Không có thông báo nào')}
          </Text>
          <Text style={[styles.emptySubText, { color: themeColors.textMuted }]}>
            {activeTab === 'unread'
              ? 'Tất cả cảnh báo và hoạt động sạc đã được xem.'
              : 'Các thông báo mới về phiên sạc và giao dịch sẽ xuất hiện tại đây.'}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
        >
          {filteredItems.map((n) => (
            <NotificationItem
              key={n.id}
              notification={n}
              themeColors={themeColors}
              onPress={() => handlePress(n)}
              onDelete={() => handleDelete(n.id)}
            />
          ))}

          {/* Optional Clear All footer */}
          {items.length > 0 && activeTab === 'all' && (
            <Pressable onPress={handleClearAll} style={styles.clearAllFooter}>
              <Ionicons name="trash-outline" size={13} color={themeColors.textMuted} />
              <Text style={[styles.clearAllFooterText, { color: themeColors.textMuted }]}>
                {t('notifications.clearAll', 'Xóa tất cả thông báo')}
              </Text>
            </Pressable>
          )}
        </ScrollView>
      )}
    </BottomSheet>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  topControlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  segmentedWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.full,
    padding: 3,
  },
  segmentBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  segmentBtnActive: {
    elevation: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  segmentText: {
    fontSize: fontSizes.caption,
  },
  readAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  readAllText: {
    fontSize: fontSizes.caption - 1,
    fontWeight: fontWeights.bold,
  },

  scroll: {
    maxHeight: 460,
  },
  list: {
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },

  /* Card Item */
  item: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  itemMain: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  pressedRow: {
    opacity: 0.7,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  body: {
    flex: 1,
    gap: 4,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: radius.full,
  },
  title: {
    fontSize: fontSizes.body - 0.5,
    flex: 1,
  },
  time: {
    fontSize: fontSizes.caption - 1,
    fontWeight: fontWeights.medium,
  },
  dismissBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  desc: {
    fontSize: fontSizes.caption,
    lineHeight: lineHeights.caption,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  actionPillText: {
    fontSize: fontSizes.caption - 1,
    fontWeight: fontWeights.bold,
  },

  /* Empty state */
  empty: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xl,
  },
  emptyText: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  emptySubText: {
    fontSize: fontSizes.caption,
    textAlign: 'center',
    maxWidth: 240,
  },

  /* Footer */
  clearAllFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: spacing.md,
  },
  clearAllFooterText: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.medium,
  },
});
