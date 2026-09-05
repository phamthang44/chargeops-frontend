import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';
import type { AmenityCode } from '@/types';

const AMENITY_ICON: Partial<Record<AmenityCode, React.ComponentProps<typeof Ionicons>['name']>> = {
  RESTROOM: 'water-outline',
  restroom: 'water-outline',
  CAFE: 'cafe-outline',
  food: 'cafe-outline',
  WIFI: 'wifi-outline',
  wifi: 'wifi-outline',
  PARKING: 'car-outline',
  parking: 'car-outline',
  CONVENIENCE_STORE: 'basket-outline',
  SHOPPING: 'cart-outline',
  security: 'shield-checkmark-outline',
};

interface StationAmenitiesListProps {
  amenities?: AmenityCode[];
}

export function StationAmenitiesList({ amenities }: StationAmenitiesListProps) {
  const { t } = useTranslation();
  const { themeColors } = usePreferences();

  if (!amenities || amenities.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.amenityRow}
      style={styles.amenityScroll}
    >
      {amenities.map((a) => (
        <View
          key={a}
          style={[
            styles.amenity,
            { backgroundColor: themeColors.surfaceAlt, borderColor: themeColors.border },
          ]}
        >
          <View style={styles.amenityIcon}>
            <Ionicons name={AMENITY_ICON[a] ?? 'ellipse-outline'} size={20} color={themeColors.primary} />
          </View>
          <Text style={[styles.amenityLabel, { color: themeColors.textStrong }]}>
            {t(`stationDetail.amenities.${a}`)}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  amenityScroll: {
    marginHorizontal: -spacing.lg,
  },
  amenityRow: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  amenity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderWidth: 1.5,
  },
  amenityIcon: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amenityLabel: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
  },
});
