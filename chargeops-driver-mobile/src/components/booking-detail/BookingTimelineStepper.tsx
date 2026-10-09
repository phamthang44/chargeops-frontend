import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';
import type { Booking, BookingStatus } from '@/types';
import { formatTime } from '@/utils/format';
import { BezelCard } from './BezelCard';

/** Mass-carrying curve — never `linear` / `ease-in-out`. */
const EASE = Easing.bezier(0.32, 0.72, 0, 1);

interface BookingTimelineStepperProps {
  booking: Booking;
}

/** Node diameter drives the connector geometry — keep line offsets derived from it. */
const NODE_SIZE = 30;
/** Clear space between a node edge and its connecting line. */
const NODE_LINE_GAP = 4;

/**
 * Draws itself forward (scaleX from the left edge) shortly after mount so the
 * progress track feels choreographed instead of snapping in.
 */
function ConnectorLine({ color, delay }: { color: string; delay: number }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const run = Animated.timing(progress, {
      toValue: 1,
      duration: 460,
      delay,
      easing: EASE,
      useNativeDriver: true,
    });
    run.start();
    return () => run.stop();
  }, [progress, delay]);

  return (
    <Animated.View
      style={[
        styles.connectingLine,
        {
          backgroundColor: color,
          opacity: progress,
          transform: [{ scaleX: progress }],
        },
      ]}
    />
  );
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
  const { themeColors } = usePreferences();

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
    <BezelCard tone={themeColors.primary} contentStyle={styles.container}>
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
                      backgroundColor: step.state === 'completed' ? color : themeColors.surfaceAlt,
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

                {!isLast && <ConnectorLine color={lineColor} delay={160 + index * 90} />}
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
    </BezelCard>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    gap: spacing.md,
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
    height: NODE_SIZE,
    position: 'relative',
  },
  nodeCircle: {
    width: NODE_SIZE,
    height: NODE_SIZE,
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
    marginLeft: NODE_SIZE / 2 + NODE_LINE_GAP,
    marginRight: NODE_SIZE / 2 + NODE_LINE_GAP,
    height: 2,
    borderRadius: 1,
    top: NODE_SIZE / 2 - 1,
    zIndex: 1,
    transformOrigin: 'left',
  },
  labelBlock: {
    alignItems: 'center',
    marginTop: spacing.xs,
    width: '100%',
  },
  stepLabel: {
    fontSize: fontSizes.caption,
    textAlign: 'center',
  },
  stepTime: {
    fontSize: fontSizes.micro,
    marginTop: 2,
  },
});
