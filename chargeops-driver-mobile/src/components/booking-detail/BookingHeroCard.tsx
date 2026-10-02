import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBadge, type BadgeVariant } from '@/components';
import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';
import type { Booking } from '@/types';
import {
  formatCountdown,
  formatDate,
  formatMmSs,
  formatTime,
  formatTimeRange,
  formatVnd,
} from '@/utils/format';
import { statusLabelKey, type StatusTone } from '@/hooks/useBookingDetail';

type IconName = keyof typeof Ionicons.glyphMap;

const STATUS_VARIANT: Record<StatusTone, BadgeVariant> = {
  success: 'success',
  error: 'error',
  info: 'info',
  warning: 'warning',
  neutral: 'neutral',
};

const STATUS_ICON: Record<StatusTone, IconName> = {
  success: 'checkmark-circle-outline',
  error: 'close-circle-outline',
  info: 'flash-outline',
  warning: 'time-outline',
  neutral: 'remove-circle-outline',
};

export interface BookingHeroCardProps {
  booking: Booking;
  tone: StatusTone;
  accent: string;
  statusNote: string;
  copiedField: string | null;
  onCopy: (text: string, field: string) => void;
  isConfirmed: boolean;
  windowStarted: boolean;
  msToCheckInClose: number;
  isWithinGrace: boolean;
  graceRemainingMs: number;
  isCharging: boolean;
}

export function BookingHeroCard({
  booking,
  tone,
  accent,
  statusNote,
  copiedField,
  onCopy,
  isConfirmed,
  windowStarted,
  msToCheckInClose,
  isWithinGrace,
  graceRemainingMs,
  isCharging,
}: BookingHeroCardProps) {
  const { t } = useTranslation();
  const { themeColors } = usePreferences();

  return (
    <View
      style={[
        styles.heroCard,
        {
          backgroundColor: themeColors.surface,
          borderColor: `${accent}40`,
          shadowColor: themeColors.textStrong,
        },
      ]}
    >
      {/* Top Row: Booking Code & Status Badge */}
      <View style={styles.heroTopRow}>
        <View style={styles.codeBlock}>
          <View style={styles.codeLabelRow}>
            <Text style={[styles.codeLabel, { color: themeColors.textMuted }]}>{t('bookingDetail.code')}</Text>
            {copiedField === 'bookingCode' && (
              <Text style={[styles.copiedBadge, { color: themeColors.success }]}>
                {t('common.copied', 'Đã chép')}
              </Text>
            )}
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            style={[
              styles.codePill,
              {
                backgroundColor: themeColors.surfaceAlt,
                borderColor: copiedField === 'bookingCode' ? `${themeColors.success}60` : themeColors.border,
              },
            ]}
            onPress={() => onCopy(booking.code, 'bookingCode')}
          >
            <Text
              style={[styles.code, { color: themeColors.textStrong }]}
              numberOfLines={1}
              ellipsizeMode="middle"
            >
              {booking.code}
            </Text>
            <Ionicons
              name={copiedField === 'bookingCode' ? 'checkmark-circle' : 'copy-outline'}
              size={13}
              color={copiedField === 'bookingCode' ? themeColors.success : themeColors.textMuted}
            />
          </TouchableOpacity>
        </View>
        <StatusBadge
          variant={STATUS_VARIANT[tone]}
          label={t(statusLabelKey(booking))}
          dot
          style={styles.statusBadge}
        />
      </View>

      {/* Status Summary */}
      <View style={styles.statusSummary}>
        <View style={[styles.statusIcon, { backgroundColor: `${accent}1A` }]}>
          <Ionicons name={STATUS_ICON[tone]} size={24} color={accent} />
        </View>
        <View style={styles.statusCopy}>
          <Text style={[styles.statusTitle, { color: themeColors.textStrong }]}>
            {t(statusLabelKey(booking))}
          </Text>
          <Text style={[styles.statusNote, { color: themeColors.textBody }]}>{statusNote}</Text>
        </View>
      </View>

      {/* Countdown Panel (Confirmed) */}
      {isConfirmed && (
        <View style={[styles.countdownPanel, { backgroundColor: `${accent}12`, borderColor: `${accent}2E` }]}>
          <View style={styles.countdownLabelRow}>
            <Ionicons name="timer-outline" size={17} color={accent} />
            <Text style={[styles.countdownLabel, { color: accent }]}>
              {windowStarted
                ? t('bookingDetail.checkInWindowActive')
                : t('bookingDetail.countdownTitle')}
            </Text>
          </View>
          <Text style={[styles.countdown, { color: accent }]}>{formatCountdown(msToCheckInClose)}</Text>
          <Text style={[styles.countdownSub, { color: themeColors.textBody }]}>{statusNote}</Text>
        </View>
      )}

      {/* Grace Cancellation Guarantee Card (Confirmed) */}
      {isConfirmed && (
        <View
          style={[
            styles.graceCard,
            {
              backgroundColor: isWithinGrace ? `${themeColors.primary}10` : themeColors.surfaceAlt,
              borderColor: isWithinGrace ? `${themeColors.primary}33` : themeColors.border,
            },
          ]}
        >
          <View style={styles.graceCardHeader}>
            <View
              style={[
                styles.graceCardIconWrap,
                { backgroundColor: isWithinGrace ? `${themeColors.primary}20` : `${themeColors.textMuted}1A` },
              ]}
            >
              <Ionicons
                name={isWithinGrace ? 'shield-checkmark-outline' : 'shield-outline'}
                size={16}
                color={isWithinGrace ? themeColors.primary : themeColors.textMuted}
              />
            </View>
            <View style={styles.graceCardCopy}>
              <Text style={[styles.graceCardTitle, { color: themeColors.textStrong }]}>
                {t('bookingDetail.graceCardTitle')}
              </Text>
              <Text
                style={[
                  styles.graceCardDesc,
                  { color: isWithinGrace ? themeColors.primaryDark : themeColors.textMuted },
                ]}
              >
                {isWithinGrace
                  ? t('bookingDetail.graceCardRemaining', { time: formatMmSs(graceRemainingMs) })
                  : t('bookingDetail.graceCardExpired')}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Live Charging Card */}
      {isCharging && (
        <View
          style={[
            styles.chargingCard,
            { backgroundColor: `${themeColors.success}12`, borderColor: `${themeColors.success}33` },
          ]}
        >
          <View style={styles.chargingHeader}>
            <View style={[styles.chargingIconWrap, { backgroundColor: `${themeColors.success}25` }]}>
              <Ionicons name="flash" size={18} color={themeColors.success} />
            </View>
            <View style={styles.chargingCopy}>
              <Text style={[styles.chargingTitle, { color: themeColors.textStrong }]}>
                {t('bookingDetail.chargingLiveTitle')}
              </Text>
              <Text style={[styles.chargingNote, { color: themeColors.textBody }]}>
                {t('bookingDetail.chargingLiveNote')}
              </Text>
            </View>
          </View>
          {Boolean(booking.chargingStartedAt) && (
            <View style={[styles.chargingMetaRow, { borderTopColor: `${themeColors.success}20` }]}>
              <Text style={[styles.chargingMetaLabel, { color: themeColors.textMuted }]}>
                {t('bookingDetail.chargingStartedAtLabel', { time: formatTime(booking.chargingStartedAt!) })}
              </Text>
              <Text style={[styles.chargingMetaLabel, { color: themeColors.textMuted }]}>
                {t('bookingDetail.chargingExpectedEndLabel', { time: formatTime(booking.endAt) })}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Hero Metrics Row */}
      <View style={[styles.heroMetrics, { borderTopColor: themeColors.border }]}>
        <View style={styles.metricItem}>
          <Text style={[styles.metricLabel, { color: themeColors.textMuted }]}>{t('bookingDetail.date')}</Text>
          <Text style={[styles.metricValue, { color: themeColors.textStrong }]}>{formatDate(booking.startAt)}</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={[styles.metricLabel, { color: themeColors.textMuted }]}>{t('bookingDetail.timeRange')}</Text>
          <Text style={[styles.metricValue, { color: themeColors.textStrong }]}>
            {formatTimeRange(booking.startAt, booking.endAt)}
          </Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={[styles.metricLabel, { color: themeColors.textMuted }]}>{t('bookingDetail.total')}</Text>
          <Text style={[styles.metricValue, { color: accent }]}>{formatVnd(booking.totalPrice)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.lg,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 3,
  },
  heroTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md },
  codeBlock: { flex: 1, minWidth: 0 },
  codeLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  codeLabel: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  copiedBadge: { fontSize: fontSizes.caption, fontWeight: fontWeights.semibold },
  codePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radius.sm,
    borderWidth: 1,
    marginTop: 4,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  code: { fontSize: 15, lineHeight: 18, fontWeight: fontWeights.bold, letterSpacing: 0.6 },
  statusBadge: { flexShrink: 1, paddingHorizontal: spacing.sm },
  statusSummary: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusCopy: { flex: 1, minWidth: 0 },
  statusTitle: { fontSize: fontSizes.heading, fontWeight: fontWeights.bold },
  statusNote: { marginTop: spacing.xs, fontSize: fontSizes.caption, lineHeight: lineHeights.body },
  countdownPanel: {
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  countdownLabelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  countdownLabel: { fontSize: fontSizes.body, fontWeight: fontWeights.semibold },
  countdown: { fontSize: 34, lineHeight: 40, fontWeight: fontWeights.bold, letterSpacing: 1.2 },
  countdownSub: {
    marginTop: spacing.xs,
    fontSize: fontSizes.caption,
    lineHeight: lineHeights.body,
    textAlign: 'center',
  },
  graceCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  graceCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  graceCardIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  graceCardCopy: { flex: 1, minWidth: 0 },
  graceCardTitle: { fontSize: fontSizes.body, fontWeight: fontWeights.bold },
  graceCardDesc: { fontSize: fontSizes.caption, fontWeight: fontWeights.medium, marginTop: 2 },
  chargingCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  chargingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  chargingIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chargingCopy: { flex: 1, minWidth: 0 },
  chargingTitle: { fontSize: fontSizes.body, fontWeight: fontWeights.bold },
  chargingNote: { fontSize: fontSizes.caption, marginTop: 2 },
  chargingMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: spacing.xs,
    gap: spacing.sm,
  },
  chargingMetaLabel: { fontSize: fontSizes.caption },
  heroMetrics: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  metricItem: { flex: 1, minWidth: 0 },
  metricLabel: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricValue: { marginTop: spacing.xs, fontSize: fontSizes.body, fontWeight: fontWeights.bold },
});
