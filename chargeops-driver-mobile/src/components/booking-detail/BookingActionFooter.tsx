import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '@/components/AppButton';
import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';
import type { Booking } from '@/types';
import { formatTime } from '@/utils/format';

export interface BookingActionFooterProps {
  booking: Booking;
  isConfirmed: boolean;
  isPending: boolean;
  isCharging: boolean;
  isCompleted: boolean;
  isCancelled: boolean;
  isExpired: boolean;
  canCheckIn: boolean;
  checkInReason: string;
  canCancel: boolean;
  canReportIssue: boolean;
  onCheckIn: () => void;
  onOpenCancel: () => void;
  onPayNow: () => void;
  onViewChargingSession: () => void;
  onReportIssue: () => void;
}

export function BookingActionFooter({
  booking,
  isConfirmed,
  isPending,
  isCharging,
  isCompleted,
  isCancelled,
  isExpired,
  canCheckIn,
  checkInReason,
  canCancel,
  canReportIssue,
  onCheckIn,
  onOpenCancel,
  onPayNow,
  onViewChargingSession,
  onReportIssue,
}: BookingActionFooterProps) {
  const { t } = useTranslation();
  const { themeColors } = usePreferences();

  if (isConfirmed) {
    return (
      <View style={[styles.footer, { backgroundColor: themeColors.surface, borderTopColor: themeColors.border }]}>
        <AppButton
          label={
            canCheckIn
              ? t('bookingDetail.cta')
              : checkInReason === 'TOO_EARLY'
              ? t('bookingDetail.checkInOpensIn', { time: formatTime(booking.checkInOpensAt ?? booking.startAt) })
              : checkInReason === 'WINDOW_CLOSED'
              ? t('bookingDetail.checkInClosed')
              : t('bookingDetail.cta')
          }
          disabled={!canCheckIn}
          icon={canCheckIn ? 'qr-code-outline' : undefined}
          onPress={onCheckIn}
        />
        <AppButton
          label={t('bookingDetail.cancel')}
          variant="secondary"
          disabled={!canCancel}
          onPress={onOpenCancel}
        />
      </View>
    );
  }

  if (isPending) {
    const isSimulator = booking.checkout?.method
      ? booking.checkout.method === 'SIMULATOR'
      : booking.paymentMethod === 'SIMULATOR';

    return (
      <View style={[styles.footer, { backgroundColor: themeColors.surface, borderTopColor: themeColors.border }]}>
        <AppButton
          label={
            isSimulator
              ? t('payment.simulatorCta', 'Xác nhận đã thanh toán')
              : t('payment.iHaveTransferred', 'Tôi đã chuyển khoản')
          }
          onPress={onPayNow}
        />
        <AppButton
          label={t('bookingDetail.cancel', 'Hủy đặt chỗ')}
          variant="secondary"
          disabled={!canCancel}
          onPress={onOpenCancel}
        />
      </View>
    );
  }

  if (isCharging) {
    return (
      <View style={[styles.footer, { backgroundColor: themeColors.surface, borderTopColor: themeColors.border }]}>
        <AppButton
          label={t('chargingSession.title', 'Xem phiên sạc trực tiếp')}
          onPress={onViewChargingSession}
        />
      </View>
    );
  }

  if ((isCompleted || isCancelled || isExpired) && canReportIssue) {
    return (
      <View style={[styles.footer, { backgroundColor: themeColors.surface, borderTopColor: themeColors.border }]}>
        <Pressable
          style={[
            styles.reportIssueBtn,
            {
              backgroundColor: `${themeColors.warning}14`,
              borderColor: `${themeColors.warning}40`,
            },
          ]}
          onPress={onReportIssue}
        >
          <Ionicons name="alert-circle-outline" size={20} color={themeColors.warning} />
          <Text style={[styles.reportIssueBtnText, { color: themeColors.warning }]}>
            {t('bookingDetail.reportIssueShort', 'Báo cáo sự cố')}
          </Text>
        </Pressable>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderTopWidth: 1,
    gap: spacing.sm,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 12,
  },
  reportIssueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
  },
  reportIssueBtnText: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
  },
});
