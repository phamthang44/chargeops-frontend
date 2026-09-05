import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { LiveDot } from '@/components/LiveDot';
import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';
import type { Station } from '@/types';

interface StationHeaderInfoProps {
  station: Station;
  statusMeta: {
    color: string;
    bg: string;
    borderColor: string;
    label: string;
  };
  distanceKm?: number;
  areaLabel?: string;
  onOpenDirections: () => void;
  onCallStation: () => void;
}

export function StationHeaderInfo({
  station,
  statusMeta,
  distanceKm,
  areaLabel,
  onOpenDirections,
  onCallStation,
}: StationHeaderInfoProps) {
  const { t } = useTranslation();
  const { themeColors, isDark } = usePreferences();

  return (
    <View style={styles.container}>
      {/* Code Badge & Status Pill */}
      <View style={styles.topRow}>
        {station.stationCode ? (
          <View
            style={[
              styles.stationCodeBadge,
              {
                backgroundColor: isDark ? 'rgba(51, 65, 85, 0.6)' : '#F1F5F9',
                borderColor: isDark ? '#475569' : '#CBD5E1',
              },
            ]}
          >
            <Text style={[styles.stationCodeText, { color: themeColors.textStrong }]}>
              #{station.stationCode}
            </Text>
          </View>
        ) : (
          <View />
        )}

        <View
          style={[
            styles.statusPill,
            { backgroundColor: statusMeta.bg, borderColor: statusMeta.borderColor },
          ]}
        >
          <LiveDot color={statusMeta.color} size={7} />
          <Text style={[styles.statusPillText, { color: statusMeta.color }]}>
            {statusMeta.label}
          </Text>
        </View>
      </View>

      {/* Station Name with bolder, high-contrast typography */}
      <Text style={[styles.name, { color: themeColors.textStrong }]}>{station.name}</Text>

      {/* Meta rating & distance chips */}
      <View style={styles.metaRow}>
        {station.rating !== undefined && (
          <View
            style={[
              styles.metaChip,
              {
                backgroundColor: isDark ? 'rgba(245, 158, 11, 0.14)' : '#FFFBEB',
                borderColor: isDark ? 'rgba(245, 158, 11, 0.35)' : '#FDE68A',
              },
            ]}
          >
            <Ionicons name="star" size={14} color="#D97706" />
            <Text style={[styles.metaChipTextBold, { color: isDark ? '#FCD34D' : '#B45309' }]}>
              {station.rating.toFixed(1)}
            </Text>
            {station.reviewCount !== undefined && station.reviewCount > 0 && (
              <Text style={[styles.metaChipTextMuted, { color: isDark ? '#FDE68A' : '#92400E' }]}>
                ({station.reviewCount})
              </Text>
            )}
          </View>
        )}

        {distanceKm !== undefined && (
          <View
            style={[
              styles.metaChip,
              {
                backgroundColor: isDark ? 'rgba(5, 150, 105, 0.14)' : '#ECFDF5',
                borderColor: isDark ? 'rgba(5, 150, 105, 0.35)' : '#A7F3D0',
              },
            ]}
          >
            <Ionicons name="navigate-outline" size={13} color="#059669" />
            <Text style={[styles.metaChipTextBold, { color: isDark ? '#6EE7B7' : '#047857' }]}>
              {distanceKm.toFixed(1)} km
            </Text>
          </View>
        )}
      </View>

      {/* Integrated Address & Direction Row */}
      <Pressable
        onPress={onOpenDirections}
        style={[
          styles.addressCard,
          {
            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : '#FFFFFF',
            borderColor: isDark ? 'rgba(51, 65, 85, 0.8)' : '#E2E8F0',
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={t('stationDetail.locationTitle')}
      >
        <View style={[styles.addressIconWrap, { backgroundColor: isDark ? 'rgba(5, 150, 105, 0.2)' : '#ECFDF5' }]}>
          <Ionicons name="location" size={18} color="#059669" />
        </View>
        <Text style={[styles.addressText, { color: themeColors.textStrong }]} numberOfLines={2}>
          {station.address || areaLabel || t('stationDetail.noDetailedAddress')}
        </Text>
        <View style={[styles.directionBtn, { backgroundColor: themeColors.primary }]}>
          <Ionicons name="navigate" size={13} color="#FFFFFF" />
          <Text style={styles.directionBtnText}>{t('stationDetail.getDirections')}</Text>
        </View>
      </Pressable>

      {/* Prominent High-Contrast Interactive Hotline Call Card */}
      {station.contactPhone ? (
        <Pressable
          accessibilityRole="button"
          onPress={onCallStation}
          style={({ pressed }) => [
            styles.callHotlineCard,
            {
              backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : '#FFFFFF',
              borderColor: isDark ? 'rgba(5, 150, 105, 0.4)' : '#A7F3D0',
            },
            pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
          ]}
        >
          <View style={[styles.callIconWrap, { backgroundColor: isDark ? 'rgba(5, 150, 105, 0.2)' : '#D1FAE5' }]}>
            <Ionicons name="call" size={18} color="#059669" />
          </View>
          <View style={styles.callContent}>
            <Text style={[styles.callSubLabel, { color: themeColors.textMuted }]}>
              {t('stationDetail.hotlineSupport', 'HOTLINE HỖ TRỢ TRẠM')}
            </Text>
            <Text style={[styles.callPhoneNum, { color: themeColors.textStrong }]}>
              {station.contactPhone}
            </Text>
          </View>
          <View style={[styles.callActionPill, { backgroundColor: '#059669' }]}>
            <Ionicons name="call" size={12} color="#FFFFFF" />
            <Text style={styles.callActionText}>{t('stationDetail.callNow', 'Gọi ngay')}</Text>
          </View>
        </Pressable>
      ) : null}

      {/* Description Section */}
      {station.description ? (
        <View
          style={[
            styles.descCard,
            {
              backgroundColor: isDark ? 'rgba(30, 41, 59, 0.5)' : '#F8FAFC',
              borderColor: isDark ? 'rgba(51, 65, 85, 0.8)' : '#E2E8F0',
            },
          ]}
        >
          <View style={styles.descHeader}>
            <Ionicons name="information-circle" size={17} color={themeColors.primary} />
            <Text style={[styles.descTitle, { color: themeColors.textStrong }]}>
              {t('stationDetail.descriptionTitle')}
            </Text>
          </View>
          <Text style={[styles.descText, { color: themeColors.textBody }]}>{station.description}</Text>
        </View>
      ) : null}
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  stationCodeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  stationCodeText: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
    letterSpacing: 0.5,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
  },
  name: {
    fontSize: 22,
    fontWeight: fontWeights.bold,
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 4.5,
    borderWidth: 1,
  },
  metaChipTextBold: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
  },
  metaChipTextMuted: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
  },
  metaChipText: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm + 3,
    borderRadius: radius.md,
    borderWidth: 1.5,
  },
  addressIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressText: {
    flex: 1,
    fontSize: 13.5,
    lineHeight: 19,
    fontWeight: fontWeights.semibold,
  },
  directionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 7,
    borderRadius: 8,
  },
  directionBtnText: {
    fontSize: 12,
    fontWeight: fontWeights.bold,
    color: '#FFFFFF',
  },
  callHotlineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    borderWidth: 1.5,
  },
  callIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callContent: {
    flex: 1,
    gap: 1,
  },
  callSubLabel: {
    fontSize: 10,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.5,
  },
  callPhoneNum: {
    fontSize: 15,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.3,
  },
  callActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  callActionText: {
    fontSize: 11.5,
    fontWeight: fontWeights.bold,
    color: '#FFFFFF',
  },
  descCard: {
    borderRadius: radius.md,
    borderWidth: 1.5,
    padding: spacing.md,
    gap: spacing.xs + 2,
  },
  descHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  descTitle: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.5,
  },
  descText: {
    fontSize: 13.5,
    lineHeight: 20,
    fontWeight: fontWeights.medium,
  },
});
