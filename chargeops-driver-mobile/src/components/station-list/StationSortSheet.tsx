import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { usePreferences } from '@/context/PreferencesContext';
import { SORTS, type SortKey } from '@/hooks/useStationList';
import { fontSizes, radius, spacing } from '@/theme';

interface StationSortSheetProps {
  visible: boolean;
  onClose: () => void;
  currentSort: SortKey;
  onSelectSort: (sort: SortKey) => void;
}

export function StationSortSheet({
  visible,
  onClose,
  currentSort,
  onSelectSort,
}: StationSortSheetProps) {
  const { t } = useTranslation();
  const { themeColors, isDark } = usePreferences();

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={t('stationList.sortTitle')}
    >
      {SORTS.map(({ key, icon }) => {
        const active = currentSort === key;
        return (
          <Pressable
            key={key}
            style={[
              styles.sortRow,
              active && {
                backgroundColor: isDark ? '#113322' : themeColors.primarySoft,
              },
            ]}
            onPress={() => {
              onSelectSort(key);
              onClose();
            }}
          >
            <View
              style={[
                styles.sortIcon,
                {
                  backgroundColor: active
                    ? isDark
                      ? '#161B1A'
                      : themeColors.surface
                    : isDark
                      ? '#1F2625'
                      : themeColors.surfaceAlt,
                },
              ]}
            >
              <Ionicons
                name={icon}
                size={18}
                color={active ? themeColors.primary : themeColors.textMuted}
              />
            </View>
            <Text
              style={[
                styles.sortLabel,
                { color: active ? themeColors.textStrong : themeColors.textBody },
                active && styles.sortLabelActive,
              ]}
            >
              {t(`stationList.sort.${key}`)}
            </Text>
            {active && <Ionicons name="checkmark" size={18} color={themeColors.primary} />}
          </Pressable>
        );
      })}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  sortIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortLabel: { flex: 1, fontSize: fontSizes.body },
  sortLabelActive: { fontWeight: '600' },
});
