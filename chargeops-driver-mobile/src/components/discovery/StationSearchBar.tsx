import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';

interface StationSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  onSubmit?: () => void;
  onPressFilter?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
}

/**
 * Modern High-End Capsule Search Bar with smooth focus glow & theme responsiveness.
 * Removes default browser outline on Web and provides rich emerald focus states.
 */
export function StationSearchBar({
  value,
  onChangeText,
  placeholder,
  onClear,
  onSubmit,
  onPressFilter,
  containerStyle,
}: StationSearchBarProps) {
  const { t } = useTranslation();
  const { themeColors, isDark } = usePreferences();
  const [isFocused, setIsFocused] = useState(false);

  const handleClear = () => {
    onChangeText('');
    onClear?.();
  };

  // Determine dynamic colors based on theme & focus
  const barBg = isFocused
    ? isDark
      ? '#141E1A'
      : '#FFFFFF'
    : isDark
      ? '#16201D'
      : '#FFFFFF';

  const barBorder = isFocused
    ? isDark
      ? '#34D399'
      : themeColors.primary
    : isDark
      ? '#283732'
      : '#E2E8F0';

  const iconColor = isFocused
    ? isDark
      ? '#34D399'
      : themeColors.primary
    : isDark
      ? '#94A3B8'
      : '#64748B';

  return (
    <View style={[styles.wrapper, containerStyle]}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: barBg,
            borderColor: barBorder,
            shadowColor: isFocused ? themeColors.primary : '#0F172A',
            shadowOpacity: isFocused ? (isDark ? 0.35 : 0.16) : 0.04,
            shadowRadius: isFocused ? 8 : 6,
            shadowOffset: { width: 0, height: isFocused ? 3 : 2 },
            elevation: isFocused ? 4 : 2,
          },
        ]}
      >
        {/* Leading Search Icon */}
        <View style={styles.iconWrap}>
          <Ionicons name="search-outline" size={19} color={iconColor} />
        </View>

        {/* Input Field */}
        <TextInput
          style={[
            styles.input,
            {
              color: themeColors.textStrong,
              ...(Platform.OS === 'web'
                ? ({ outlineStyle: 'none', outlineWidth: 0 } as any)
                : {}),
            },
          ]}
          placeholder={placeholder}
          placeholderTextColor={isDark ? '#94A3B8' : '#64748B'}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onSubmitEditing={onSubmit}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
          underlineColorAndroid="transparent"
        />

        {/* Trailing Clear Button */}
        {value.length > 0 && (
          <Pressable
            hitSlop={8}
            onPress={handleClear}
            style={({ pressed }) => [
              styles.clearBtn,
              {
                backgroundColor: isDark ? '#24322D' : '#E5E7EB',
                transform: [{ scale: pressed ? 0.9 : 1 }],
              },
            ]}
            accessibilityLabel={t('stationList.clearSearch', 'Xóa tìm kiếm')}
          >
            <Ionicons name="close" size={13} color={isDark ? '#E2E8F0' : themeColors.textBody} />
          </Pressable>
        )}

        {/* Trailing Filter Button (matching design) */}
        {onPressFilter && (
          <Pressable
            hitSlop={8}
            onPress={onPressFilter}
            style={({ pressed }) => [
              styles.filterBtn,
              { transform: [{ scale: pressed ? 0.92 : 1 }] },
            ]}
            accessibilityLabel={t('stationList.filterBtn', 'Bộ lọc')}
          >
            <Ionicons
              name="options-outline"
              size={19}
              color={isDark ? '#6EE6A0' : '#334155'}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: radius.full,
    borderWidth: 1,
    paddingHorizontal: spacing.md + 2,
    gap: spacing.sm,
  },
  iconWrap: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontSize: fontSizes.body,
    fontWeight: fontWeights.medium,
    lineHeight: 20,
    paddingVertical: 0,
    paddingHorizontal: 0,
    height: 44,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  clearBtn: {
    width: 22,
    height: 22,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
