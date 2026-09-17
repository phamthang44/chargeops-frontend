import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';
import type { Booking, BookingStatus } from '@/types';
import { formatTime } from '@/utils/format';

interface BookingTimelineStepperProps {
  booking: Booking;
}

interface StepItem {
  id: string;
  titleKey: string;
  defaultTitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  timestamp?: string | null;
  state: 'completed' | 'current' | 'upcoming' | 'cancelled';
}

export function BookingTimelineStepper({ booking }: BookingTimelineStepperProps) {
  const { t } = useTranslation();
  const { themeColors, isDark } = usePreferences();

  const isCancelled = booking.status === 'CANCELLED';
  const isExpired = booking.status === 'EXPIRED';

  const steps: StepItem[] = [
    {
      id: 'created',
      titleKey: 'bookingDetail.stepCreated',
      defaultTitle: 'Đặt chỗ',
      icon: 'receipt-outline',
      timestamp: booking.createdAt ? formatTime(booking.createdAt) : null,
      state: 'completed',
    },
    {
      id: 'paid',
      titleKey: 'bookingDetail.stepPaid',
      defaultTitle: 'Thanh toán',
      icon: 'wallet-outline',
      timestamp: booking.paymentConfirmedAt ? formatTime(booking.paymentConfirmedAt) : null,
      state: booking.status === 'PENDING'
        ? 'current'
        : isCancelled && !booking.paymentConfirmedAt
        ? 'cancelled'
        : isExpired
        ? 'cancelled'
        : 'completed',
    },
    {
      id: 'checked_in',
      titleKey: 'bookingDetail.stepCheckIn',
      defaultTitle: 'Check-in',
      icon: 'qr-code-outline',
      timestamp: booking.checkedInAt ? formatTime(booking.checkedInAt) : null,
      state: booking.status === 'CONFIRMED'
        ? 'current'
        : booking.checkedInAt || ['CHECKED_IN', 'CHARGING', 'COMPLETED'].includes(booking.status)
        ? 'completed'
        : isCancelled || isExpired
        ? 'cancelled'
        : 'upcoming',
    },
    {
      id: 'charging',
      titleKey: 'bookingDetail.stepCharging',
      defaultTitle: 'Đang sạc',
      icon: 'flash-outline',
      timestamp: booking.chargingStartedAt ? formatTime(booking.chargingStartedAt) : null,
      state: booking.status === 'CHARGING'
        ? 'current'
        : booking.status === 'COMPLETED'
        ? 'completed'
        : isCancelled || isExpired
        ? 'cancelled'
        : 'upcoming',
    },
    {
      id: 'completed',
      titleKey: 'bookingDetail.stepCompleted',
      defaultTitle: 'Hoàn tất',
      icon: 'checkmark-done-circle-outline',
      timestamp: booking.completedAt ? formatTime(booking.completedAt) : null,
      state: booking.status === 'COMPLETED'
        ? 'completed'
        : isCancelled || isExpired
        ? 'cancelled'
        : 'upcoming',
    },
  ];

  const getStepColor = (state: StepItem['state']) => {
    switch (state) {
      case 'completed':
        return themeColors.success;
      case 'current':
        return booking.status === 'PENDING' ? themeColors.warning : themeColors.primary;
      case 'cancelled':
        return themeColors.error;
      default:
        return themeColors.textMuted;
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: themeColors.surface,
          borderColor: themeColors.border,
          shadowColor: isDark ? '#000000' : themeColors.textStrong,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={[styles.headerIconWrap, { backgroundColor: `${themeColors.primary}16` }]}>
          <Ionicons name="git-network-outline" size={16} color={themeColors.primary} />
        </View>
        <Text style={[styles.headerTitle, { color: themeColors.textStrong }]}>
          {t('bookingDetail.timelineTitle', 'Tiến trình đơn đặt')}
        </Text>
      </View>

      <View style={styles.stepperTrack}>
        {steps.map((step, index) => {
          const color = getStepColor(step.state);
          const isLast = index === steps.length - 1;
          const nextStep = !isLast ? steps[index + 1] : null;
          const lineColor =
            step.state === 'completed' && nextStep?.state === 'completed'
              ? themeColors.success
              : step.state === 'completed' && nextStep?.state === 'current'
              ? (booking.status === 'PENDING' ? themeColors.warning : themeColors.primary)
              : themeColors.border;

          return (
            <View key={step.id} style={styles.stepColumn}>
              <View style={styles.nodeRow}>
                <View
                  style={[
                    styles.nodeCircle,
                    {
                      backgroundColor:
                        step.state === 'completed'
                          ? color
                          : isDark
                          ? '#1E293B'
                          : '#FFFFFF',
                      borderColor: color,
                    },
                  ]}
                >
                  <Ionicons
                    name={step.icon}
                    size={14}
                    color={step.state === 'completed' ? '#FFFFFF' : color}
                  />
                </View>

                {!isLast && (
                  <View
                    style={[
                      styles.connectingLine,
                      {
                        backgroundColor: lineColor,
                      },
                    ]}
                  />
                )}
              </View>

              <View style={styles.labelBlock}>
                <Text
                  style={[
                    styles.stepLabel,
                    {
                      color:
                        step.state === 'current' || step.state === 'completed'
                          ? themeColors.textStrong
                          : themeColors.textMuted,
                      fontWeight:
                        step.state === 'current' ? fontWeights.bold : fontWeights.medium,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {t(step.titleKey, step.defaultTitle)}
                </Text>
                {step.timestamp ? (
                  <Text style={[styles.stepTime, { color: themeColors.textMuted }]}>
                    {step.timestamp}
                  </Text>
                ) : null}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.md,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerIconWrap: {
    width: 26,
    height: 26,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
  },
  stepperTrack: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  stepColumn: {
    flex: 1,
    alignItems: 'center',
  },
  nodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 30,
    position: 'relative',
  },
  nodeCircle: {
    width: 30,
    height: 30,
    borderRadius: radius.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  connectingLine: {
    position: 'absolute',
    left: '50%',
    right: '-50%',
    marginLeft: 19,
    marginRight: 19,
    height: 2,
    borderRadius: 1,
    top: 14,
    zIndex: 1,
  },
  labelBlock: {
    alignItems: 'center',
    marginTop: spacing.xs,
    width: '100%',
  },
  stepLabel: {
    fontSize: fontSizes.caption - 1,
    textAlign: 'center',
  },
  stepTime: {
    fontSize: fontSizes.caption - 3,
    marginTop: 2,
  },
});
