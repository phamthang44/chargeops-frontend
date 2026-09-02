import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { StationThumb } from '@/components/StationThumb';
import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';
import type { Station } from '@/types';
import { formatRate } from '@/utils/format';
import { PortSlotIndicator } from './PortSlotIndicator';
import { PowerBadge } from './PowerBadge';

interface StationCardV2Props {
  station: Station;
  onOpen: () => void;
  onDirections: () => void;
  onQuickBook?: () => void;
}

function etaMinutes(distanceKm?: number): number {
  return Math.max(1, Math.round((distanceKm ?? 0) * 3));
}

/**
 * StationCard V2 — High-end EV charging station card with rich visual hierarchy,
 * power rating badges, live port slot indicator, and dual quick action buttons.
 */
export function StationCardV2({
  station,
  onOpen,
  onDirections,
  onQuickBook,
}: StationCardV2Props) {
  const { t } = useTranslation();
  const { themeColors, isDark } = usePreferences();

  const operatingState = station.operatingState || (station.isOpen ? 'OPEN' : 'CLOSED_BY_SCHEDULE');
  const isNoSchedule = operatingState === 'SCHEDULE_NOT_CONFIGURED';
  const isClosedBySchedule = operatingState === 'CLOSED_BY_SCHEDULE';
  const full = station.availableConnectors === 0;

  // Future bookings are allowed when CLOSED_BY_SCHEDULE as long as connectors exist.
  // Only locked out if no schedule configured or full.
  const canBook = !isNoSchedule && !full;

  let actionLabel = 'Đặt chỗ ngay';
  let actionIcon: keyof typeof Ionicons.glyphMap = 'flash';

  if (isNoSchedule) {
    actionLabel = 'Chưa có lịch';
    actionIcon = 'calendar-outline';
  } else if (full) {
    actionLabel = t('stationList.full', 'Hết chỗ');
    actionIcon = 'close-circle-outline';
  } else if (isClosedBySchedule) {
    actionLabel = 'Đặt lịch';
    actionIcon = 'calendar';
  }

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: pressed
            ? isDark
              ? '#1B2220'
              : '#F3F4F6'
            : isDark
              ? '#161B1A'
              : '#FFFFFF',
          borderColor: isDark ? '#2A312F' : '#E5E7EB',
          shadowColor: '#000000',
        },
      ]}
      onPress={onOpen}
    >
      {/* Top Media & Header Section */}
      <View style={styles.topSection}>
        {station.imageUrl ? (
          <Image source={{ uri: station.imageUrl }} style={styles.imageThumb} />
        ) : (
          <StationThumb size={72} radius={radius.md} />
        )}

        <View style={styles.topBody}>
          {/* Badge Row (Power + Rating + Closed status) */}
          <View style={styles.badgeRow}>
            <PowerBadge
              powerKw={station.maxPowerKw}
              hasFastCharging={station.hasFastCharging}
              size="sm"
            />
            {station.rating !== undefined && (
              <View
                style={[
                  styles.ratingPill,
                  {
                    backgroundColor: isDark ? '#1F2625' : '#F9FAFB',
                    borderColor: isDark ? '#2A312F' : '#E5E7EB',
                  },
                ]}
              >
                <Ionicons name="star" size={12} color={themeColors.warning} />
                <Text style={[styles.ratingText, { color: themeColors.textStrong }]}>
                  {station.rating.toFixed(1)}
                </Text>
                {station.reviewCount !== undefined && (
                  <Text style={[styles.reviewCountText, { color: themeColors.textMuted }]}>
                    ({station.reviewCount})
                  </Text>
                )}
              </View>
            )}
            {isClosedBySchedule && (
              <View
                style={[
                  styles.closedPill,
                  {
                    backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7',
                    borderColor: isDark ? '#B45309' : '#FCD34D',
                  },
                ]}
              >
                <Ionicons name="time-outline" size={10} color={themeColors.warning} />
                <Text style={[styles.closedText, { color: themeColors.warning }]}>
                  Đóng cửa theo lịch
                </Text>
              </View>
            )}
            {isNoSchedule && (
              <View
                style={[
                  styles.closedPill,
                  {
                    backgroundColor: isDark ? 'rgba(100, 116, 139, 0.15)' : '#F1F5F9',
                    borderColor: isDark ? '#475569' : '#CBD5E1',
                  },
                ]}
              >
                <Ionicons name="settings-outline" size={10} color={themeColors.textMuted} />
                <Text style={[styles.closedText, { color: themeColors.textMuted }]}>
                  Chưa cấu hình giờ hoạt động
                </Text>
              </View>
            )}
          </View>

          {/* Station Name */}
          <Text style={[styles.stationName, { color: themeColors.textStrong }]} numberOfLines={1}>
            {station.name}
          </Text>

          {/* Address & Distance */}
          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={13} color={themeColors.textMuted} />
            <Text style={[styles.address, { color: themeColors.textMuted }]} numberOfLines={1}>
              {station.address}
            </Text>
          </View>
        </View>
      </View>

      {/* Middle Telemetry Row: Slot Indicators & Pricing */}
      <View
        style={[
          styles.middleRow,
          {
            backgroundColor: isDark ? '#111514' : '#F9FAFB',
            borderColor: isDark ? '#1F2625' : '#F3F4F6',
          },
        ]}
      >
        <PortSlotIndicator
          available={station.availableConnectors}
          total={station.totalConnectors}
        />

        <View style={styles.priceBlock}>
          {station.minRatePerKwh !== undefined && (
            <Text style={[styles.priceValue, { color: themeColors.textStrong }]}>
              {formatRate(station.minRatePerKwh)}
            </Text>
          )}
          {station.distanceKm !== undefined && (
            <Text style={[styles.distanceLabel, { color: themeColors.textMuted }]}>
              {station.distanceKm} km · {etaMinutes(station.distanceKm)}p
            </Text>
          )}
        </View>
      </View>

      {/* Footer Dual Actions */}
      <View style={[styles.actionRow, { borderTopColor: isDark ? '#1F2625' : '#F3F4F6' }]}>
        <Pressable
          style={({ pressed }) => [
            styles.subActionBtn,
            {
              backgroundColor: pressed
                ? isDark
                  ? '#1F2625'
                  : '#E5E7EB'
                : isDark
                  ? '#161B1A'
                  : '#FFFFFF',
              borderColor: isDark ? '#2A312F' : '#E5E7EB',
            },
          ]}
          onPress={onDirections}
          hitSlop={4}
        >
          <Ionicons name="navigate-outline" size={15} color={themeColors.textBody} />
          <Text style={[styles.subActionText, { color: themeColors.textBody }]}>
            {t('stationList.directions')}
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.primaryActionBtn,
            {
              backgroundColor: !canBook
                ? isDark
                  ? '#2A312F'
                  : '#E5E7EB'
                : isClosedBySchedule
                  ? isDark
                    ? '#0F766E'
                    : '#0D9488'
                  : themeColors.primary,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
          onPress={canBook ? (onQuickBook || onOpen) : onOpen}
          hitSlop={4}
        >
          <Ionicons
            name={actionIcon}
            size={15}
            color={!canBook ? themeColors.textMuted : '#FFFFFF'}
          />
          <Text
            style={[
              styles.primaryActionText,
              { color: !canBook ? themeColors.textMuted : '#FFFFFF' },
            ]}
          >
            {actionLabel}
          </Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md + 2,
    gap: spacing.sm + 2,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  topSection: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  imageThumb: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    backgroundColor: '#E5E7EB',
  },
  topBody: {
    flex: 1,
    gap: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    height: 22,
    borderWidth: 1,
  },
  closedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  closedText: {
    fontSize: 10.5,
    fontWeight: fontWeights.bold,
    lineHeight: 14,
    includeFontPadding: false,
  },
  ratingText: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
    lineHeight: 14,
    includeFontPadding: false,
  },
  reviewCountText: {
    fontSize: 10,
    lineHeight: 14,
    includeFontPadding: false,
  },
  stationName: {
    fontSize: fontSizes.heading - 1,
    fontWeight: fontWeights.bold,
    lineHeight: 22,
    includeFontPadding: false,
    marginTop: 2,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  address: {
    flex: 1,
    fontSize: fontSizes.caption,
    lineHeight: 16,
    includeFontPadding: false,
  },
  middleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  priceBlock: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 1,
  },
  priceValue: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
    lineHeight: 18,
    includeFontPadding: false,
  },
  distanceLabel: {
    fontSize: 11,
    fontWeight: fontWeights.medium,
    lineHeight: 14,
    includeFontPadding: false,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderTopWidth: 1,
    paddingTop: spacing.sm,
  },
  subActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    height: 40,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  subActionText: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
    lineHeight: 18,
    includeFontPadding: false,
  },
  primaryActionBtn: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    height: 40,
    borderRadius: radius.md,
  },
  primaryActionText: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
    lineHeight: 18,
    includeFontPadding: false,
  },
});
