import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
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
  /**
   * Callback fired when the user taps a notification to navigate.
   *
   * BACKEND INTEGRATION: The `type` + `referenceId` pair lets the caller
   * resolve the target screen.  No navigation logic lives inside this sheet
   * — the parent screen owns routing.
   */
  onNavigate?: (notification: AppNotification) => void;
  /**
   * Fired with the unread count whenever it changes, so the caller's bell badge
   * stays in sync with reads/deletes made inside the sheet.
   */
  onUnreadChange?: (count: number) => void;
}

/* ------------------------------------------------------------------ */
/*  Look-up tables                                                     */
/* ------------------------------------------------------------------ */

const TYPE_ICON: Record<AppNotification['type'], keyof typeof Ionicons.glyphMap> = {
  charging: 'flash',
  booking: 'calendar',
  wallet: 'wallet',
  promo: 'gift',
};

const TYPE_COLOR: Record<AppNotification['type'], string> = {
  charging: '#10B981',
  booking: '#3B82F6',
  wallet: '#F59E0B',
  promo: '#8B5CF6',
};

/* ------------------------------------------------------------------ */
/*  Swipeable notification item                                        */
/* ------------------------------------------------------------------ */

interface NotificationItemProps {
  notification: AppNotification;
  themeColors: ReturnType<typeof usePreferences>['themeColors'];
  onPress: () => void;
  onDelete: () => void;
}

/**
 * A single notification row.
 *
 * Delete is an always-visible button on the row, not a swipe gesture. A hidden
 * gesture is the wrong trade here: the driver deletes a notification rarely and
 * in a hurry, so the action has to be visible and hittable on the first try,
 * with no hint text to teach it. An unread row is tinted and carries a dot; the
 * whole card is the tap target for opening what the notification refers to.
 */
function NotificationItem({ notification, themeColors, onPress, onDelete }: NotificationItemProps) {
  const { t } = useTranslation();
  const icon = TYPE_ICON[notification.type];
  const color = TYPE_COLOR[notification.type];
  const hasLink = !!notification.referenceId;

  return (
    <View
      style={[
        styles.item,
        {
          backgroundColor: notification.read ? themeColors.surface : themeColors.surfaceAlt,
          borderColor: notification.read ? themeColors.border : themeColors.primarySoft,
        },
      ]}
    >
      <Pressable style={styles.itemMain} onPress={onPress} accessibilityRole="button">
        <View style={[styles.iconWrap, { backgroundColor: `${color}1A` }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>

        <View style={styles.body}>
          <View style={styles.itemHeader}>
            {!notification.read && (
              <View style={[styles.unreadDot, { backgroundColor: themeColors.primary }]} />
            )}
            <Text style={[styles.title, { color: themeColors.textStrong }]} numberOfLines={1}>
              {notification.title}
            </Text>
          </View>
          <Text style={[styles.desc, { color: themeColors.textBody }]}>{notification.body}</Text>
          <View style={styles.itemFooter}>
            <Text style={[styles.time, { color: themeColors.textMuted }]}>
              {formatRelativeTime(notification.createdAt)}
            </Text>
            {hasLink && (
              <View style={styles.navHint}>
                <Text style={[styles.navHintText, { color: themeColors.primary }]}>
                  {t('notifications.viewDetail')}
                </Text>
                <Ionicons name="chevron-forward" size={14} color={themeColors.primary} />
              </View>
            )}
          </View>
        </View>
      </Pressable>

      {/* Delete — its own tap target, outside the card's press area */}
      <Pressable
        style={[styles.rowDelete, { backgroundColor: `${themeColors.error}14` }]}
        onPress={onDelete}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={t('notifications.delete')}
      >
        <Ionicons name="trash-outline" size={17} color={themeColors.error} />
      </Pressable>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Main sheet                                                         */
/* ------------------------------------------------------------------ */

/**
 * Reusable notification sheet with:
 * - a per-row delete button (no hidden gesture)
 * - tap-to-navigate via the `onNavigate` callback
 * - "Clear all" + "Mark all read" bulk actions
 *
 * Dynamic theme aware (Light / Dark).
 */
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

  // Keep the caller's bell badge in sync with whatever happened in here.
  useEffect(() => {
    if (!loading) onUnreadChange?.(unreadCount);
  }, [unreadCount, loading, onUnreadChange]);

  /* ---- Handlers ---- */

  const handleMarkAllRead = async () => {
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
    // 1. Mark as read
    const updated = await markNotificationAsRead(notification.id);
    setItems(updated);

    // 2. Navigate if the notification has a deep-link target
    if (notification.referenceId && onNavigate) {
      onClose(); // dismiss the sheet first
      onNavigate(notification);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title={t('stationList.notificationsTitle')} animation="fade">
      {/* Unread summary + bulk actions. Both actions are full-height pills:
          they are destructive-ish and infrequent, so they need real tap targets. */}
      {items.length > 0 && (
        <View style={styles.topRow}>
          {unreadCount > 0 && (
            <View style={[styles.badge, { backgroundColor: themeColors.primarySoft }]}>
              <Text style={[styles.badgeText, { color: themeColors.primaryDark }]}>
                {t('notifications.unreadCount', { total: unreadCount })}
              </Text>
            </View>
          )}
          <View style={styles.flex1} />
          {unreadCount > 0 && (
            <Pressable
              onPress={handleMarkAllRead}
              style={[styles.bulkBtn, { borderColor: themeColors.primary }]}
            >
              <Ionicons name="checkmark-done" size={16} color={themeColors.primary} />
              <Text style={[styles.bulkText, { color: themeColors.primary }]}>
                {t('notifications.markAllRead')}
              </Text>
            </Pressable>
          )}
          <Pressable
            onPress={handleClearAll}
            style={[styles.bulkBtn, { borderColor: themeColors.error }]}
          >
            <Ionicons name="trash-outline" size={16} color={themeColors.error} />
            <Text style={[styles.bulkText, { color: themeColors.error }]}>
              {t('notifications.clearAll')}
            </Text>
          </Pressable>
        </View>
      )}

      {loading ? (
        <ActivityIndicator color={themeColors.primary} style={{ marginVertical: spacing.xl }} />
      ) : items.length === 0 ? (
        <View style={styles.empty}>
          <EmptyState variant="notifications" />
          <Text style={[styles.emptyText, { color: themeColors.textMuted }]}>
            {t('stationList.notificationsEmpty')}
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
          {items.map((n) => (
            <NotificationItem
              key={n.id}
              notification={n}
              themeColors={themeColors}
              onPress={() => handlePress(n)}
              onDelete={() => handleDelete(n.id)}
            />
          ))}
        </ScrollView>
      )}
    </BottomSheet>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  badgeText: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
  },
  flex1: { flex: 1 },
  // Bulk actions: 36pt pills rather than bare text, so they are hittable.
  bulkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 36,
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
  },
  bulkText: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
  },

  scroll: {
    maxHeight: 420,
  },
  list: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },

  /* Card */
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  itemMain: { flex: 1, flexDirection: 'row', gap: spacing.md },
  // Delete: 40pt circle, tinted with the error color so it reads as destructive
  // without shouting at the driver on every row.
  rowDelete: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: 3,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
    flex: 1,
  },
  // Leads the title so "unread" is the first thing scanned down the list.
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
  },
  desc: {
    fontSize: fontSizes.caption,
    lineHeight: lineHeights.caption,
  },
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  time: {
    fontSize: fontSizes.caption,
  },
  navHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  navHintText: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
  },

  empty: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xl,
  },
  emptyText: {
    fontSize: fontSizes.body,
    textAlign: 'center',
  },
});
