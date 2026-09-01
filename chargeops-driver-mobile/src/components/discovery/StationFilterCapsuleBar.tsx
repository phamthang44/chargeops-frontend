import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';
import type { ConnectorType } from '@/types';
import type { DiscoveryFilterState } from './StationFilterDrawer';

interface StationFilterCapsuleBarProps {
  filters: DiscoveryFilterState;
  onUpdateFilters: (updater: (prev: DiscoveryFilterState) => DiscoveryFilterState) => void;
  onOpenDrawer: () => void;
  onClearAll: () => void;
}

const CONNECTOR_TYPES: ConnectorType[] = ['CCS2', 'TYPE2', 'CHADEMO', 'GBT'];

/**
 * Horizontal scrolling Quick Filter Capsule Bar with dedicated Filter Drawer trigger button.
 */
export function StationFilterCapsuleBar({
  filters,
  onUpdateFilters,
  onOpenDrawer,
  onClearAll,
}: StationFilterCapsuleBarProps) {
  const { t } = useTranslation();
  const { themeColors, isDark } = usePreferences();

  const activeCount =
    filters.connectorTypes.length +
    (filters.currentType ? 1 : 0) +
    (filters.minPowerKw ? 1 : 0) +
    (filters.availableOnly ? 1 : 0) +
    (filters.openOnly ? 1 : 0) +
    (filters.maxDistanceKm ? 1 : 0);

  const hasActiveFilters = activeCount > 0;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipRow}
      style={styles.chipScroll}
    >
      {/* ⚙️ Filter Drawer Trigger Button */}
      <Pressable
        style={[
          styles.drawerTrigger,
          {
            backgroundColor: hasActiveFilters
              ? isDark
                ? '#113322'
                : '#ECFDF5'
              : isDark
                ? '#161B1A'
                : themeColors.surfaceAlt,
            borderColor: hasActiveFilters
              ? themeColors.primary
              : isDark
                ? '#2A312F'
                : themeColors.border,
          },
        ]}
        onPress={onOpenDrawer}
      >
        <Ionicons
          name="options-outline"
          size={15}
          color={hasActiveFilters ? themeColors.primary : themeColors.textStrong}
        />
        <Text
          style={[
            styles.drawerTriggerText,
            {
              color: hasActiveFilters
                ? isDark
                  ? '#6EE6A0'
                  : themeColors.primaryDark
                : themeColors.textStrong,
            },
          ]}
        >
          {t('stationList.filterBtn', 'Bộ lọc')}
        </Text>
        {activeCount > 0 && (
          <View
            style={[
              styles.countBadge,
              { backgroundColor: themeColors.primary },
            ]}
          >
            <Text style={styles.countBadgeText}>{activeCount}</Text>
          </View>
        )}
      </Pressable>

      {/* Clear all chip when active */}
      {hasActiveFilters && (
        <Pressable
          style={[
            styles.clearChip,
            {
              backgroundColor: isDark ? '#1F2625' : themeColors.textStrong,
              borderColor: isDark ? '#2A312F' : themeColors.textStrong,
            },
          ]}
          onPress={onClearAll}
          hitSlop={4}
        >
          <Ionicons name="close" size={13} color="#FFFFFF" />
          <Text style={[styles.clearChipText, { color: '#FFFFFF' }]}>
            {t('stationList.clearFilters', 'Xóa lọc')}
          </Text>
        </Pressable>
      )}

      {/* Quick DC Supercharge chip */}
      <Pressable
        style={[
          styles.chip,
          {
            backgroundColor:
              filters.currentType === 'DC' || (filters.minPowerKw ?? 0) >= 50
                ? isDark
                  ? '#113322'
                  : themeColors.primarySoft
                : isDark
                  ? '#161B1A'
                  : themeColors.surfaceAlt,
            borderColor:
              filters.currentType === 'DC' || (filters.minPowerKw ?? 0) >= 50
                ? themeColors.primary
                : isDark
                  ? '#2A312F'
                  : themeColors.border,
          },
        ]}
        onPress={() =>
          onUpdateFilters((prev) => ({
            ...prev,
            currentType: prev.currentType === 'DC' ? null : 'DC',
            minPowerKw: prev.currentType === 'DC' ? undefined : 50,
          }))
        }
      >
        <Ionicons
          name="flash"
          size={13}
          color={
            filters.currentType === 'DC'
              ? isDark
                ? '#34D399'
                : themeColors.primaryDark
              : themeColors.textMuted
          }
        />
        <Text
          style={[
            styles.chipText,
            {
              color:
                filters.currentType === 'DC'
                  ? isDark
                    ? '#6EE6A0'
                    : themeColors.primaryDark
                  : themeColors.textBody,
            },
            filters.currentType === 'DC' && styles.chipTextActive,
          ]}
        >
          Sạc nhanh DC
        </Text>
      </Pressable>

      {/* Quick Available Only chip */}
      <Pressable
        style={[
          styles.chip,
          {
            backgroundColor: filters.availableOnly
              ? isDark
                ? '#113322'
                : themeColors.primarySoft
              : isDark
                ? '#161B1A'
                : themeColors.surfaceAlt,
            borderColor: filters.availableOnly
              ? themeColors.primary
              : isDark
                ? '#2A312F'
                : themeColors.border,
          },
        ]}
        onPress={() =>
          onUpdateFilters((prev) => ({
            ...prev,
            availableOnly: !prev.availableOnly,
          }))
        }
      >
        <Ionicons
          name="checkmark-circle"
          size={13}
          color={
            filters.availableOnly
              ? isDark
                ? '#34D399'
                : themeColors.primaryDark
              : themeColors.textMuted
          }
        />
        <Text
          style={[
            styles.chipText,
            {
              color: filters.availableOnly
                ? isDark
                  ? '#6EE6A0'
                  : themeColors.primaryDark
                : themeColors.textBody,
            },
            filters.availableOnly && styles.chipTextActive,
          ]}
        >
          {t('stationList.filters.available', 'Còn chỗ')}
        </Text>
      </Pressable>

      {/* Quick Open Only chip */}
      <Pressable
        style={[
          styles.chip,
          {
            backgroundColor: filters.openOnly
              ? isDark
                ? '#113322'
                : themeColors.primarySoft
              : isDark
                ? '#161B1A'
                : themeColors.surfaceAlt,
            borderColor: filters.openOnly
              ? themeColors.primary
              : isDark
                ? '#2A312F'
                : themeColors.border,
          },
        ]}
        onPress={() =>
          onUpdateFilters((prev) => ({
            ...prev,
            openOnly: !prev.openOnly,
          }))
        }
      >
        <Ionicons
          name="time"
          size={13}
          color={
            filters.openOnly
              ? isDark
                ? '#34D399'
                : themeColors.primaryDark
              : themeColors.textMuted
          }
        />
        <Text
          style={[
            styles.chipText,
            {
              color: filters.openOnly
                ? isDark
                  ? '#6EE6A0'
                  : themeColors.primaryDark
                : themeColors.textBody,
            },
            filters.openOnly && styles.chipTextActive,
          ]}
        >
          {t('stationList.filters.open', 'Đang mở')}
        </Text>
      </Pressable>

      {/* Quick AC chip */}
      <Pressable
        style={[
          styles.chip,
          {
            backgroundColor: filters.currentType === 'AC'
              ? isDark
                ? '#113322'
                : themeColors.primarySoft
              : isDark
                ? '#161B1A'
                : themeColors.surfaceAlt,
            borderColor: filters.currentType === 'AC'
              ? themeColors.primary
              : isDark
                ? '#2A312F'
                : themeColors.border,
          },
        ]}
        onPress={() =>
          onUpdateFilters((prev) => ({
            ...prev,
            currentType: prev.currentType === 'AC' ? null : 'AC',
            minPowerKw: undefined,
          }))
        }
      >
        <Ionicons
          name="battery-charging"
          size={13}
          color={
            filters.currentType === 'AC'
              ? isDark
                ? '#34D399'
                : themeColors.primaryDark
              : themeColors.textMuted
          }
        />
        <Text
          style={[
            styles.chipText,
            {
              color: filters.currentType === 'AC'
                ? isDark
                  ? '#6EE6A0'
                  : themeColors.primaryDark
                : themeColors.textBody,
            },
            filters.currentType === 'AC' && styles.chipTextActive,
          ]}
        >
          {t('stationList.filters.ac', 'Sạc AC')}
        </Text>
      </Pressable>

      {/* Vertical Divider */}
      <View
        style={[
          styles.chipDivider,
          { backgroundColor: isDark ? '#2A312F' : themeColors.border },
        ]}
      />

      {/* Connector type chips */}
      {CONNECTOR_TYPES.map((type) => {
        const active = filters.connectorTypes.includes(type);
        return (
          <Pressable
            key={type}
            style={[
              styles.chip,
              {
                backgroundColor: active
                  ? isDark
                    ? '#113322'
                    : themeColors.primarySoft
                  : isDark
                    ? '#161B1A'
                    : themeColors.surfaceAlt,
                borderColor: active
                  ? themeColors.primary
                  : isDark
                    ? '#2A312F'
                    : themeColors.border,
              },
            ]}
            onPress={() =>
              onUpdateFilters((prev) => ({
                ...prev,
                connectorTypes: prev.connectorTypes.includes(type)
                  ? prev.connectorTypes.filter((x) => x !== type)
                  : [...prev.connectorTypes, type],
              }))
            }
          >
            <Text
              style={[
                styles.chipText,
                {
                  color: active
                    ? isDark
                      ? '#6EE6A0'
                      : themeColors.primaryDark
                    : themeColors.textBody,
                },
                active && styles.chipTextActive,
              ]}
            >
              {t(`stationList.connectorTypes.${type}`, type)}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chipScroll: { flexGrow: 0 },
  chipRow: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    paddingBottom: spacing.md,
    alignItems: 'center',
  },
  drawerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    height: 36,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  drawerTriggerText: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
    lineHeight: 16,
    includeFontPadding: false,
  },
  countBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: radius.full,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: fontWeights.bold,
    lineHeight: 12,
    includeFontPadding: false,
    textAlign: 'center',
    color: '#FFFFFF',
  },

  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    height: 36,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  chipDivider: {
    width: 1,
    height: 18,
    marginHorizontal: spacing.xs,
  },
  chipText: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.medium,
    lineHeight: 16,
    includeFontPadding: false,
  },
  chipTextActive: {
    fontWeight: fontWeights.bold,
  },

  clearChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    height: 36,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  clearChipText: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
    lineHeight: 16,
    includeFontPadding: false,
  },
});
