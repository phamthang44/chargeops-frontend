import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';

interface FloatingViewSwitchProps {
  currentView: 'list' | 'map';
  onToggle: () => void;
  bottomOffset?: number;
}

/**
 * Floating frosted pill switch at bottom right to quickly toggle between List and Map.
 */
export function FloatingViewSwitch({
  currentView,
  onToggle,
  bottomOffset = 88,
}: FloatingViewSwitchProps) {
  const { t } = useTranslation();
  const { themeColors, isDark } = usePreferences();

  const isList = currentView === 'list';
  const label = isList ? t('stationList.viewMap', 'Bản đồ') : t('stationList.viewList', 'Danh sách');
  const iconName = isList ? 'map' : 'list';

  return (
    <View style={[styles.wrapper, { bottom: bottomOffset }]}>
      <Pressable
        onPress={onToggle}
        style={({ pressed }) => [
          styles.pill,
          {
            backgroundColor: isDark ? '#1C2724' : '#FFFFFF',
            borderColor: isDark ? '#2D4039' : '#E5E7EB',
            shadowColor: isDark ? '#000000' : themeColors.textStrong,
            shadowOpacity: isDark ? 0.45 : 0.12,
            transform: [{ scale: pressed ? 0.96 : 1 }],
          },
        ]}
      >
        <Ionicons name={iconName} size={17} color={themeColors.primary} />
        <Text style={[styles.text, { color: isDark ? '#FFFFFF' : themeColors.textStrong }]}>
          {label}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    right: spacing.lg,
    zIndex: 50,
    pointerEvents: 'box-none',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: spacing.md + 2,
    height: 40,
    borderRadius: radius.full,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 6,
  },
  text: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
    lineHeight: 16,
    includeFontPadding: false,
  },
});
