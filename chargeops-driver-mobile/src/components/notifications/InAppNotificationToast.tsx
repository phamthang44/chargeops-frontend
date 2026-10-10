import { Ionicons } from '@expo/vector-icons';
import type { NavigationContainerRefWithCurrent } from '@react-navigation/native';
import { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Animated,
  Easing,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useNotifications } from '@/context/NotificationContext';
import { usePreferences } from '@/context/PreferencesContext';
import type { RootStackParamList } from '@/navigation/types';
import { resolveNotificationI18n, type AppNotification } from '@/services/notificationService';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';

interface InAppNotificationToastProps {
  navigationRef: NavigationContainerRefWithCurrent<RootStackParamList>;
}

const TYPE_CONFIG: Record<
  AppNotification['type'],
  { icon: keyof typeof Ionicons.glyphMap; color: string; badge: string }
> = {
  charging: { icon: 'flash',             color: '#10B981', badge: 'Sạc điện' },
  booking:  { icon: 'calendar',          color: '#3B82F6', badge: 'Đặt chỗ' },
  wallet:   { icon: 'wallet',            color: '#F59E0B', badge: 'Ví tiền' },
  promo:    { icon: 'gift',              color: '#8B5CF6', badge: 'Ưu đãi' },
  ticket:   { icon: 'chatbubbles',       color: '#8B5CF6', badge: 'Hỗ trợ' },
  finance:  { icon: 'card',             color: '#10B981', badge: 'Hoàn tiền' },
  system:   { icon: 'notifications',     color: '#64748B', badge: 'Thông báo' },
};

const AUTO_DISMISS_MS = 5000;
const SMOOTH_EASE = Easing.bezier(0.16, 1, 0.3, 1);

export function InAppNotificationToast({ navigationRef }: InAppNotificationToastProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { themeColors, isDark } = usePreferences();
  const { bannerNotification, dismissBannerNotification, markAsRead } = useNotifications();

  const translateY = useRef(new Animated.Value(-150)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const hideToast = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -150,
        duration: 260,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start(() => {
      dismissBannerNotification();
    });
  }, [dismissBannerNotification, opacity, translateY]);

  useEffect(() => {
    if (bannerNotification) {
      if (timerRef.current) clearTimeout(timerRef.current);

      translateY.setValue(-150);
      opacity.setValue(0);

      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 380,
          easing: SMOOTH_EASE,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 320,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();

      timerRef.current = setTimeout(() => {
        hideToast();
      }, AUTO_DISMISS_MS);
    } else {
      hideToast();
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [bannerNotification, hideToast, opacity, translateY]);

  // Swipe up to dismiss
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy < -6,
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy < -15) {
          hideToast();
        }
      },
    }),
  ).current;

  if (!bannerNotification) return null;

  const cfg = TYPE_CONFIG[bannerNotification.type] || TYPE_CONFIG.system;
  const title = resolveNotificationI18n(bannerNotification.title, t);
  const body = resolveNotificationI18n(bannerNotification.body, t);

  const handlePress = () => {
    const notif = bannerNotification;
    hideToast();

    // Mark as read immediately
    void markAsRead(notif.id);

    if (!navigationRef.isReady()) return;

    // Smart routing dispatch
    const targetType = notif.target?.type;
    const refId = notif.referenceId;

    if (targetType === 'OPEN_BOOKING' || notif.type === 'charging' || notif.type === 'booking') {
      const bookingId = notif.target?.bookingId ?? refId;
      if (bookingId) {
        if (notif.type === 'charging') {
          navigationRef.navigate('ChargingSession', { bookingId });
        } else {
          navigationRef.navigate('BookingDetail', { bookingId });
        }
      }
    } else if (targetType === 'OPEN_TICKET' || targetType === 'OPEN_CASE' || notif.type === 'ticket') {
      const ticketId = notif.target?.ticketId ?? refId;
      if (ticketId) {
        navigationRef.navigate('TicketDetail', { ticketId });
      } else {
        navigationRef.navigate('MyTickets');
      }
    } else if (targetType === 'OPEN_REFUND' || notif.type === 'finance') {
      const bookingId = notif.target?.bookingId ?? refId;
      if (bookingId) {
        navigationRef.navigate('BookingDetail', { bookingId });
      } else {
        navigationRef.navigate('Tabs', { screen: 'BookingHistory' });
      }
    } else if (notif.type === 'wallet') {
      navigationRef.navigate('Tabs', { screen: 'Profile' });
    }
  };

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.container,
        {
          top: Math.max(insets.top, 10),
          transform: [{ translateY }],
          opacity,
        },
      ]}
      pointerEvents="box-none"
    >
      <Pressable
        onPress={handlePress}
        style={[
          styles.toastCard,
          {
            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.96)' : 'rgba(255, 255, 255, 0.97)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
            shadowColor: '#000',
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Thông báo: ${title}`}
      >
        {/* Category Accent Icon */}
        <View style={[styles.iconWrapper, { backgroundColor: `${cfg.color}1E` }]}>
          <Ionicons name={cfg.icon} size={20} color={cfg.color} />
        </View>

        {/* Text Content */}
        <View style={styles.textWrapper}>
          <View style={styles.headerRow}>
            <View style={[styles.badgePill, { backgroundColor: `${cfg.color}24` }]}>
              <Text style={[styles.badgeText, { color: cfg.color }]}>
                {cfg.badge}
              </Text>
            </View>
            <Text style={[styles.brandText, { color: themeColors.textMuted }]}>
              {t('notifications.inAppToastBrand', 'ChargeOps · Realtime')}
            </Text>
          </View>
          <Text
            style={[styles.title, { color: themeColors.textStrong }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {title}
          </Text>
          <Text
            style={[styles.body, { color: themeColors.textMuted }]}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {body}
          </Text>
        </View>

        {/* Dismiss Button */}
        <Pressable
          onPress={hideToast}
          hitSlop={10}
          style={styles.closeBtn}
          accessibilityRole="button"
          accessibilityLabel="Đóng thông báo"
        >
          <Ionicons name="close" size={16} color={themeColors.textMuted} />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 99999,
    alignItems: 'center',
  },
  toastCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 10,
  },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    marginTop: 2,
  },
  textWrapper: {
    flex: 1,
    marginRight: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  badgePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
    marginRight: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: fontWeights.bold,
    textTransform: 'uppercase',
  },
  brandText: {
    fontSize: 11,
    fontWeight: fontWeights.medium,
  },
  title: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
    marginBottom: 2,
  },
  body: {
    fontSize: fontSizes.caption,
    lineHeight: 16,
  },
  closeBtn: {
    padding: 4,
    marginLeft: 4,
    marginTop: -2,
  },
});
