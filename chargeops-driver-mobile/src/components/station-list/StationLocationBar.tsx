import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { usePreferences } from '@/context/PreferencesContext';
import { radius, spacing } from '@/theme';

interface StationLocationBarProps {
  selectedProvinceCode: string;
  selectedRegionName: string;
  onPress: () => void;
}

export function StationLocationBar({
  selectedProvinceCode,
  selectedRegionName,
  onPress,
}: StationLocationBarProps) {
  const { t } = useTranslation();
  const { isDark } = usePreferences();

  const displayName =
    selectedProvinceCode === 'all'
      ? t('stationList.allRegions', 'Toàn quốc')
      : selectedRegionName;

  return (
    <Pressable
      style={[
        styles.prominentLocationBar,
        {
          backgroundColor: isDark ? 'rgba(22, 27, 26, 0.92)' : 'rgba(255, 255, 255, 0.95)',
          borderColor: isDark ? '#2A312F' : 'rgba(209, 250, 229, 0.95)',
        },
      ]}
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={t('stationList.regionAccessibility', {
        region: displayName,
        defaultValue: `Khu vực trạm sạc: ${displayName}. Bấm để thay đổi khu vực.`,
      })}
    >
      <View style={styles.prominentLocationLeft}>
        <View
          style={[
            styles.locationBadgeIcon,
            { backgroundColor: isDark ? 'rgba(0, 176, 116, 0.16)' : '#E8F7F0' },
          ]}
        >
          <Ionicons name="location-sharp" size={17} color="#00B074" />
        </View>
        <View style={styles.prominentLocationTextCol}>
          <Text style={[styles.prominentLocationSub, { color: isDark ? '#94A3B8' : '#64748B' }]}>
            {t('stationList.regionSubtitle', 'KHU VỰC TRẠM SẠC')}
          </Text>
          <Text
            style={[styles.prominentLocationTitle, { color: isDark ? '#F1F5F9' : '#0F172A' }]}
            numberOfLines={1}
          >
            {displayName}
          </Text>
        </View>
      </View>
      <View
        style={[
          styles.changeRegionPill,
          { backgroundColor: isDark ? '#1F2625' : '#F1F5F9' },
        ]}
      >
        <Text style={[styles.changeRegionText, { color: isDark ? '#6EE7B7' : '#059669' }]}>
          {t('stationList.changeRegion', 'Đổi khu vực')}
        </Text>
        <Ionicons name="chevron-down" size={14} color={isDark ? '#6EE7B7' : '#059669'} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  prominentLocationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 48,
    borderRadius: radius.md + 4,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  prominentLocationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  locationBadgeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prominentLocationTextCol: {
    flex: 1,
    justifyContent: 'center',
  },
  prominentLocationSub: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  prominentLocationTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginTop: 1,
  },
  changeRegionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  changeRegionText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
