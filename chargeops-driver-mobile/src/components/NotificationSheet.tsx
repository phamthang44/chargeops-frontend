import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Animated,
  Easing,
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
  resolveNotificationI18n,
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

/** Mass-carrying curve — never `linear` / `ease-in-out` (skill Section 5). */
const EASE = Easing.bezier(0.32, 0.72, 0, 1);

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

/** i18n key for the CTA label shown per notification type. */
const TYPE_ACTION_KEY: Record<AppNotification['type'], string> = {
  charging: 'notifications.actions.viewSession',
  booking:  'notifications.actions.viewBooking',
  wallet:   'notifications.actions.viewWallet',
  promo:    'notifications.actions.viewPromo',
  ticket:   'notifications.actions.viewTicket',
  finance:  'notifications.actions.viewRefund',
  system:   'notifications.actions.viewDetail',
};

const TYPE_CONFIG: Record<
  AppNotification['type'],
  { icon: keyof typeof Ionicons.glyphMap; color: string }
> = {
  charging: { icon: 'flash',             color: '#10B981' },
  booking:  { icon: 'calendar',          color: '#3B82F6' },
  wallet:   { icon: 'wallet',            color: '#F59E0B' },
  promo:    { icon: 'gift',              color: '#8B5CF6' },
  ticket:   { icon: 'chatbubbles',       color: '#8B5CF6' },
  finance:  { icon: 'card',             color: '#10B981' },
  system:   { icon: 'information-circle', color: '#6B7280' },
};

/* ------------------------------------------------------------------ */
/*  Action-Driven Notification Item (Novu / Knock Pattern)             */
/* ------------------------------------------------------------------ */
interface NotificationItemProps {
  notification: AppNotification;
  themeColors: ReturnType<typeof usePreferences>['themeColors'];
  /** Position in the visible list — drives the staggered entrance delay. */
  index: number;
  onPress: () => void;
  onDelete: () => void;
}

function NotificationItem({ notification, themeColors, index, onPress, onDelete }: NotificationItemProps) {
  const { t } = useTranslation();
  const cfg = TYPE_CONFIG[notification.type];
  const actionLabel = t(TYPE_ACTION_KEY[notification.type], { defaultValue: 'View details' });
  const hasLink = !!notification.referenceId;
  const title = resolveNotificationI18n(notification.title, t);
  const body = resolveNotificationI18n(notification.body, t);

  /* Entrance — staggered fade-up (transform + opacity only, Section 6). */
  const reveal = useRef(new Animated.Value(0)).current;
  /* Press physics — interpolated scale/opacity, never an instant state swap (Section 5). */
  const press = useRef(new Animated.Value(0)).current;
  const useNative = Platform.OS !== 'web';

  /* Entrance runs once per mount — later index shifts (delete, tab filter) must not re-trigger it. */
  useEffect(() => {
    Animated.timing(reveal, {
      toValue: 1,
      duration: 480,
      delay: index * 50,
      easing: EASE,
      useNativeDriver: useNative,
    }).start();
    return () => reveal.stopAnimation();
  }, []);

  const handlePressIn = () => {
    Animated.timing(press, { toValue: 1, duration: 120, easing: EASE, useNativeDriver: useNative }).start();
  };
  const handlePressOut = () => {
    Animated.timing(press, { toValue: 0, duration: 180, easing: EASE, useNativeDriver: useNative }).start();
  };

  return (
    <Animated.View
      style={[
        styles.item,
        {
          backgroundColor: notification.read ? themeColors.surface : `${themeColors.primary}12`,
          borderColor: notification.read ? themeColors.border : `${themeColors.primary}40`,
        },
        {
          opacity: Animated.multiply(
            reveal,
            press.interpolate({ inputRange: [0, 1], outputRange: [1, 0.94] }),
          ),
          transform: [
            { translateY: reveal.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) },
            { scale: press.interpolate({ inputRange: [0, 1], outputRange: [1, 0.98] }) },
          ],
        },
      ]}
    >
      <Pressable
        style={styles.itemMain}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
      >
        {/* Category Icon Badge with soft tinted background */}
        <View style={[styles.iconWrap, { backgroundColor: `${cfg.color}1F` }]}>
          <Ionicons name={cfg.icon} size={20} color={cfg.color} />
        </View>

        {/* Content Body */}
        <View style={styles.body}>
          {/* Header Row: Dot + Title — full width, wraps freely; paddingRight reserves the ✕ hit zone */}
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
            >
              {title}
            </Text>
          </View>

          {/* Description — hiện toàn bộ nội dung, không cắt xén */}
          <Text style={[styles.desc, { color: themeColors.textBody }]}>{body}</Text>

          {/* Meta Row: Timestamp trái + Island CTA pill phải */}
          <View style={styles.metaRow}>
            <View style={styles.timeWrap}>
              <Ionicons name="time-outline" size={11} color={themeColors.textMuted} />
              <Text style={[styles.time, { color: themeColors.textMuted }]}>
                {formatRelativeTime(notification.createdAt)}
              </Text>
            </View>

            {hasLink && (
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
                      color: notification.read ? themeColors.primary : themeColors.surface,
                    },
                  ]}
                >
                  {actionLabel}
                </Text>
                <View
                  style={[
                    styles.chevronCircle,
                    {
                      backgroundColor: notification.read
                        ? `${themeColors.primary}1F`
                        : `${themeColors.surface}33`,
                    },
                  ]}
                >
                  <Ionicons
                    name="chevron-forward"
                    size={9}
                    color={notification.read ? themeColors.primary : themeColors.surface}
                  />
                </View>
              </View>
            )}
          </View>
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
    </Animated.View>
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
                {
                  backgroundColor: themeColors.surface,
                  borderColor: themeColors.border,
                },
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
              {t('notifications.tabs.all', { count: items.length, defaultValue: 'All ({{count}})' })}
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
                {
                  backgroundColor: themeColors.surface,
                  borderColor: themeColors.border,
                },
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
              {t('notifications.tabs.unread', { count: unreadCount, defaultValue: 'Unread ({{count}})' })}
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
              ? t('notifications.empty.allReadTitle', { defaultValue: 'All caught up!' })
              : t('stationList.notificationsEmpty', 'No notifications')}
          </Text>
          <Text style={[styles.emptySubText, { color: themeColors.textMuted }]}>
            {activeTab === 'unread'
              ? t('notifications.empty.allReadBody', { defaultValue: 'All alerts and session activity have been viewed.' })
              : t('notifications.empty.noNotifBody', { defaultValue: 'New notifications about sessions and transactions will appear here.' })}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
        >
          {filteredItems.map((n, idx) => (
            <NotificationItem
              key={n.id}
              notification={n}
              themeColors={themeColors}
              index={idx}
              onPress={() => handlePress(n)}
              onDelete={() => handleDelete(n.id)}
            />
          ))}

          {/* Optional Clear All footer */}
          {items.length > 0 && activeTab === 'all' && (
            <Pressable onPress={handleClearAll} style={styles.clearAllFooter}>
              <Ionicons name="trash-outline" size={13} color={themeColors.textMuted} />
              <Text style={[styles.clearAllFooterText, { color: themeColors.textMuted }]}>
                {t('notifications.clearAll', 'Clear all notifications')}
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
    /* Depth for light mode — invisible on dark surfaces, where the hairline border does the job. */
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  itemMain: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
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
    /* Reserve the top-right ✕ hit zone so the first title line never runs under it. */
    paddingRight: 24,
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
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: 2,
  },
  timeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  actionPillText: {
    fontSize: fontSizes.caption - 1,
    fontWeight: fontWeights.bold,
  },
  /* Island button-in-button: chevron lives in its own circular wrapper. */
  chevronCircle: {
    width: 16,
    height: 16,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
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
