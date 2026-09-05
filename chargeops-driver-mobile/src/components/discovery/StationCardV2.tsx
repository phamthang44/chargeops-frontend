import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { StationThumb } from '@/components/StationThumb';
import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';
import type { Station } from '@/types';
import { formatRate } from '@/utils/format';
import { getStationThumbUrl } from '@/utils/imagekit';
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
  const isPaused = operatingState === 'PAUSED_BY_OWNER';
  const isMaintenance = operatingState === 'MAINTENANCE';
  const isNoSchedule = operatingState === 'SCHEDULE_NOT_CONFIGURED';
  const isClosedBySchedule = operatingState === 'CLOSED_BY_SCHEDULE';
  const isUnavailable = operatingState === 'UNAVAILABLE_BY_PLATFORM';
  const full = station.availableConnectors === 0;

  // Booking allowed if open and not full, or if closed by schedule (for advance booking)
  const canBook = operatingState === 'OPEN' ? !full : isClosedBySchedule && !full;

  let actionLabel = t('stationList.card.bookNow', 'Đặt chỗ ngay');
  let actionIcon: keyof typeof Ionicons.glyphMap = 'flash';

  if (isPaused) {
    actionLabel = t('stationList.card.paused', 'Tạm ngưng');
    actionIcon = 'pause-circle-outline';
  } else if (isMaintenance) {
    actionLabel = t('stationList.card.maintenance', 'Bảo trì');
    actionIcon = 'construct-outline';
  } else if (isNoSchedule) {
    actionLabel = t('stationList.card.noSchedule', 'Chưa có lịch');
    actionIcon = 'calendar-outline';
  } else if (isUnavailable) {
    actionLabel = t('stationList.card.unavailable', 'Tạm ẩn');
    actionIcon = 'alert-circle-outline';
  } else if (full) {
    actionLabel = t('stationList.full', 'Hết chỗ');
    actionIcon = 'close-circle-outline';
  } else if (isClosedBySchedule) {
    actionLabel = t('stationList.card.scheduleBooking', 'Đặt lịch');
    actionIcon = 'calendar';
  }

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: pressed
            ? isDark
              ? '#1C2723'
              : '#F3F4F6'
            : isDark
              ? '#141D1A'
              : '#FFFFFF',
          borderColor: isDark ? '#263832' : '#E5E7EB',
          shadowColor: '#000000',
        },
      ]}
      onPress={onOpen}
    >
      {/* Top Media & Header Section */}
      <View style={styles.topSection}>
        {station.imageUrl ? (
          <Image source={{ uri: getStationThumbUrl(station.imageUrl, 160) }} style={styles.imageThumb} />
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
            {isPaused && (
              <View
                style={[
                  styles.closedPill,
                  {
                    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.18)' : '#FEE2E2',
                    borderColor: isDark ? '#B91C1C' : '#FCA5A5',
                  },
                ]}
              >
                <Ionicons name="pause-circle-outline" size={10} color={isDark ? '#F87171' : '#DC2626'} />
                <Text style={[styles.closedText, { color: isDark ? '#F87171' : '#DC2626' }]}>
                  {t('stationList.card.pausedDesc', 'Tạm ngừng đón khách')}
                </Text>
              </View>
            )}
            {isMaintenance && (
              <View
                style={[
                  styles.closedPill,
                  {
                    backgroundColor: isDark ? 'rgba(245, 158, 11, 0.18)' : '#FEF3C7',
                    borderColor: isDark ? '#D97706' : '#FCD34D',
                  },
                ]}
              >
                <Ionicons name="construct-outline" size={10} color={isDark ? '#FBBF24' : '#D97706'} />
                <Text style={[styles.closedText, { color: isDark ? '#FBBF24' : '#D97706' }]}>
                  {t('stationList.card.maintenanceDesc', 'Đang bảo trì')}
                </Text>
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
                  {t('stationList.card.closedByScheduleDesc', 'Đóng cửa theo lịch')}
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
                  {t('stationList.card.noScheduleDesc', 'Chưa cấu hình giờ hoạt động')}
                </Text>
              </View>
            )}
            {isUnavailable && (
              <View
                style={[
                  styles.closedPill,
                  {
                    backgroundColor: isDark ? 'rgba(100, 116, 139, 0.15)' : '#F1F5F9',
                    borderColor: isDark ? '#475569' : '#CBD5E1',
                  },
                ]}
              >
                <Ionicons name="alert-circle-outline" size={10} color={themeColors.textMuted} />
                <Text style={[styles.closedText, { color: themeColors.textMuted }]}>
                  {t('stationList.card.unavailableDesc', 'Không khả dụng')}
                </Text>
              </View>
            )}
          </View>

          {/* Station Name */}
          <Text style={[styles.stationName, { color: isDark ? '#F8FAFC' : themeColors.textStrong }]} numberOfLines={1}>
            {station.name}
          </Text>

          {/* Address & Distance */}
          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={13} color={isDark ? '#94A3B8' : themeColors.textMuted} />
            <Text style={[styles.address, { color: isDark ? '#94A3B8' : themeColors.textMuted }]} numberOfLines={1}>
              {station.provinceName && !station.address.includes(station.provinceName)
                ? `${station.address}, ${station.provinceName}`
                : station.address}
            </Text>
          </View>

          {/* Operational Status Reason Chip */}
          {(isPaused || isMaintenance) && !!station.operationalStatusReason && (
            <View style={{ marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '500',
                  color: isPaused ? (isDark ? '#F87171' : '#DC2626') : (isDark ? '#FBBF24' : '#D97706'),
                }}
                numberOfLines={1}
              >
                {isPaused ? '⏸️ ' : '🛠️ '}{t('stationList.card.reason', 'Lý do: ')}{station.operationalStatusReason}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Middle Telemetry Row: Slot Indicators & Pricing */}
      <View
        style={[
          styles.middleRow,
          {
            backgroundColor: isDark ? '#0C1311' : '#F9FAFB',
            borderColor: isDark ? '#1C2723' : '#F3F4F6',
          },
        ]}
      >
        <PortSlotIndicator
          available={station.availableConnectors}
          total={station.totalConnectors}
        />

        <View style={styles.priceBlock}>
          {station.minRatePerKwh !== undefined && (
            <Text style={[styles.priceValue, { color: isDark ? '#F8FAFC' : themeColors.textStrong }]}>
              {formatRate(station.minRatePerKwh)}
            </Text>
          )}
          {station.distanceKm !== undefined && (
            <Text style={[styles.distanceLabel, { color: isDark ? '#94A3B8' : themeColors.textMuted }]}>
              {t('stationList.card.distanceEta', {
                distance: station.distanceKm,
                minutes: etaMinutes(station.distanceKm),
                defaultValue: `${station.distanceKm} km · ${etaMinutes(station.distanceKm)}p`,
              })}
            </Text>
          )}
        </View>
      </View>

      {/* Footer Dual Actions */}
      <View style={[styles.actionRow, { borderTopColor: isDark ? '#1C2723' : '#F3F4F6' }]}>
        <Pressable
          style={({ pressed }) => [
            styles.subActionBtn,
            {
              backgroundColor: pressed
                ? isDark
                  ? '#263430'
                  : '#E5E7EB'
                : isDark
                  ? '#1C2723'
                  : '#FFFFFF',
              borderColor: isDark ? '#2D3F37' : '#E5E7EB',
            },
          ]}
          onPress={onDirections}
          hitSlop={4}
        >
          <Ionicons name="navigate-outline" size={15} color={isDark ? '#E2E8F0' : themeColors.textBody} />
          <Text style={[styles.subActionText, { color: isDark ? '#E2E8F0' : themeColors.textBody }]}>
            {t('stationList.directions')}
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.primaryActionBtn,
            {
              backgroundColor: !canBook
                ? isDark
                  ? '#23302C'
                  : '#E5E7EB'
                : isClosedBySchedule
                  ? isDark
                    ? '#0F766E'
                    : '#0D9488'
                  : themeColors.primary,
              opacity: pressed ? 0.9 : 1,
              shadowColor: '#10B981',
              shadowOpacity: isDark ? 0.35 : 0.15,
              shadowRadius: 6,
              elevation: 2,
            },
          ]}
          onPress={canBook ? (onQuickBook || onOpen) : onOpen}
          hitSlop={4}
        >
          <Ionicons
            name={actionIcon}
            size={15}
            color={!canBook ? (isDark ? '#64748B' : themeColors.textMuted) : '#FFFFFF'}
          />
          <Text
            style={[
              styles.primaryActionText,
              { color: !canBook ? (isDark ? '#64748B' : themeColors.textMuted) : '#FFFFFF' },
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
