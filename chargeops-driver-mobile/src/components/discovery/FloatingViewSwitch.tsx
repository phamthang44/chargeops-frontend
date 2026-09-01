import { Ionicons } from '@expo/vector-icons';
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
  const { themeColors, isDark } = usePreferences();

  const isList = currentView === 'list';
  const label = isList ? 'Bản đồ' : 'Danh sách';
  const iconName = isList ? 'map' : 'list';

  return (
    <View style={[styles.wrapper, { bottom: bottomOffset }]} pointerEvents="box-none">
      <Pressable
        onPress={onToggle}
        style={({ pressed }) => [
          styles.pill,
          {
            backgroundColor: isDark ? '#161B1A' : '#FFFFFF',
            borderColor: isDark ? '#2A312F' : '#E5E7EB',
            shadowColor: isDark ? '#000000' : themeColors.textStrong,
            shadowOpacity: isDark ? 0.35 : 0.12,
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
