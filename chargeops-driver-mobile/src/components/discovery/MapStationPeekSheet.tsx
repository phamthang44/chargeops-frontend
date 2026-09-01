import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import {
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';
import type { Station } from '@/types';
import { formatRate } from '@/utils/format';
import { PortSlotIndicator } from './PortSlotIndicator';
import { PowerBadge } from './PowerBadge';

interface MapStationPeekSheetProps {
  station: Station | null;
  onOpenDetail: (stationId: string) => void;
  onDirections: (station: Station) => void;
  onQuickBook: (stationId: string) => void;
  onClose: () => void;
  bottomOffset?: number;
}

const SCREEN_W = Dimensions.get('window').width;

function etaMinutes(distanceKm?: number): number {
  if (!distanceKm) return 5;
  return Math.max(2, Math.round((distanceKm / 30) * 60));
}

/**
 * Modern Floating Peek Sheet for Map view (Matching Mockup 2).
 * Shows live telemetry, power rating, and instant 1-tap booking CTAs.
 */
export function MapStationPeekSheet({
  station,
  onOpenDetail,
  onDirections,
  onQuickBook,
  onClose,
  bottomOffset = 84,
}: MapStationPeekSheetProps) {
  const { t } = useTranslation();
  const { themeColors, isDark } = usePreferences();

  if (!station) return null;

  return (
    <View
      style={[
        styles.wrapper,
        {
          bottom: bottomOffset,
        },
      ]}
      pointerEvents="box-none"
    >
      <Pressable
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: isDark ? '#161B1A' : '#FFFFFF',
            borderColor: isDark ? '#2A312F' : '#E5E7EB',
            shadowColor: '#000000',
            shadowOpacity: isDark ? 0.45 : 0.14,
            transform: [{ scale: pressed ? 0.99 : 1 }],
          },
        ]}
        onPress={() => onOpenDetail(station.id)}
      >
        {/* Header Section: Image + Info + Close */}
        <View style={styles.topRow}>
          {station.imageUrl ? (
            <Image source={{ uri: station.imageUrl }} style={styles.thumb} resizeMode="cover" />
          ) : (
            <View
              style={[
                styles.thumbPlaceholder,
                { backgroundColor: isDark ? '#1F2625' : '#F3F4F6' },
              ]}
            >
              <Ionicons name="flash" size={24} color={themeColors.primary} />
            </View>
          )}

          <View style={styles.metaBlock}>
            {/* Title & Close */}
            <View style={styles.nameRow}>
              <Text
                style={[styles.stationName, { color: themeColors.textStrong }]}
                numberOfLines={1}
              >
                {station.name}
              </Text>
              <Pressable
                hitSlop={12}
                onPress={(e) => {
                  e.stopPropagation?.();
                  onClose();
                }}
                style={styles.closeBtn}
                accessibilityLabel="Close summary"
              >
                <Ionicons name="close" size={18} color={themeColors.textMuted} />
              </Pressable>
            </View>

            {/* Badges: Power & Rating */}
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
                  <Ionicons name="star" size={11} color={themeColors.warning} />
                  <Text style={[styles.ratingText, { color: themeColors.textStrong }]}>
                    {station.rating.toFixed(1)}
                  </Text>
                </View>
              )}
            </View>

            {/* Address */}
            <Text
              style={[styles.addressText, { color: themeColors.textMuted }]}
              numberOfLines={1}
            >
              {station.address}
            </Text>
          </View>
        </View>

        {/* Telemetry Row */}
        <View
          style={[
            styles.telemetryRow,
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

        {/* Actions Row */}
        <View style={[styles.actionRow, { borderTopColor: isDark ? '#1F2625' : '#F3F4F6' }]}>
          <Pressable
            style={[
              styles.btnSecondary,
              {
                backgroundColor: isDark ? '#1F2625' : '#F3F4F6',
              },
            ]}
            onPress={(e) => {
              e.stopPropagation?.();
              onDirections(station);
            }}
          >
            <Ionicons name="navigate-outline" size={16} color={themeColors.textBody} />
            <Text style={[styles.btnSecondaryText, { color: themeColors.textBody }]}>
              {t('stationList.card.directions', 'Chỉ đường')}
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.btnPrimary,
              {
                backgroundColor: themeColors.primary,
              },
            ]}
            onPress={() => onQuickBook(station.id)}
          >
            <Ionicons name="flash" size={16} color="#FFFFFF" />
            <Text style={styles.btnPrimaryText}>
              {t('stationList.card.bookNow', 'Đặt chỗ ngay')}
            </Text>
          </Pressable>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 40,
  },
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 8,
  },
  topRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  thumb: {
    width: 68,
    height: 68,
    borderRadius: radius.lg,
  },
  thumbPlaceholder: {
    width: 68,
    height: 68,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaBlock: {
    flex: 1,
    gap: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stationName: {
    flex: 1,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
    marginRight: 4,
  },
  closeBtn: {
    padding: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 6,
    height: 20,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: fontWeights.bold,
    lineHeight: 14,
    includeFontPadding: false,
  },
  addressText: {
    fontSize: fontSizes.caption,
    lineHeight: 16,
    includeFontPadding: false,
  },

  telemetryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  priceBlock: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 1,
  },
  priceValue: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
    lineHeight: 16,
    includeFontPadding: false,
  },
  distanceLabel: {
    fontSize: 10,
    fontWeight: fontWeights.medium,
    lineHeight: 12,
    includeFontPadding: false,
  },

  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
  },
  btnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    height: 38,
    borderRadius: radius.full,
  },
  btnSecondaryText: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
    lineHeight: 18,
    includeFontPadding: false,
  },
  btnPrimary: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    height: 38,
    borderRadius: radius.full,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  btnPrimaryText: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
    color: '#FFFFFF',
    lineHeight: 18,
    includeFontPadding: false,
  },
});
