import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { usePreferences } from '@/context/PreferencesContext';
import { radius, spacing } from '@/theme';

export interface BookingConfirmationErrorBannerProps {
  error: string;
  errorCode: string | null;
  onViewPendingDetail: () => void;
  onChangeTime: () => void;
}

export function BookingConfirmationErrorBanner({
  error,
  errorCode,
  onViewPendingDetail,
  onChangeTime,
}: BookingConfirmationErrorBannerProps) {
  const { t } = useTranslation();
  const { isDark } = usePreferences();

  const isPendingLimit =
    errorCode === 'BKG_PENDING_LIMIT_EXCEEDED' ||
    errorCode === 'PENDING_LIMIT_EXCEEDED' ||
    errorCode === 'DRIVER_ACTIVE_BOOKING_LIMIT_EXCEEDED';

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: isDark ? 'rgba(239, 68, 68, 0.16)' : '#FEF2F2',
          borderColor: isDark ? 'rgba(248, 113, 113, 0.4)' : '#FECACA',
        },
      ]}
    >
      <Ionicons
        name="alert-circle"
        size={22}
        color={isDark ? '#F87171' : '#DC2626'}
        style={styles.icon}
      />
      <View style={styles.copy}>
        <Text style={[styles.errorText, { color: isDark ? '#FECACA' : '#991B1B' }]}>
          {error}
        </Text>
        {isPendingLimit ? (
          <Pressable
            onPress={onViewPendingDetail}
            style={[
              styles.actionBtn,
              { backgroundColor: isDark ? 'rgba(248, 113, 113, 0.22)' : 'rgba(220, 38, 38, 0.08)' },
            ]}
            hitSlop={8}
          >
            <Text style={[styles.actionBtnText, { color: isDark ? '#FCA5A5' : '#DC2626' }]}>
              {t('bookingConfirmation.viewPendingBookingDetail', 'Xem chi tiết đơn đang chờ')} →
            </Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={onChangeTime}
            style={[
              styles.actionBtn,
              { backgroundColor: isDark ? 'rgba(248, 113, 113, 0.2)' : 'rgba(220, 38, 38, 0.08)' },
            ]}
            hitSlop={8}
          >
            <Text style={[styles.actionBtnText, { color: isDark ? '#FCA5A5' : '#DC2626' }]}>
              {t('bookingConfirmation.changeTime', 'Đổi giờ sạc')} →
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  icon: { marginTop: 1 },
  copy: { flex: 1, gap: 6 },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
  },
  actionBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.sm,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
