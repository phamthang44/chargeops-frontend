import { Ionicons } from '@expo/vector-icons';
import React, { useRef } from 'react';
import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

// `danger` = a consequential, hard-to-undo action (e.g. ending a charging
// session before it's full). Solid error fill so it can never be mistaken for
// the routine emerald primary.
type Variant = 'primary' | 'secondary' | 'danger';
type IconName = keyof typeof Ionicons.glyphMap;

interface AppButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  /** Trailing icon, nested in its own circle (Button-in-Button pattern). */
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
}

/** Dynamic theme-aware button using design system tokens. */
export function AppButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  icon,
  style,
}: AppButtonProps) {
  const { themeColors } = usePreferences();
  const isPrimary = variant === 'primary';
  const isDanger = variant === 'danger';
  const isSolid = isPrimary || isDanger; // filled + white label
  const isDisabled = disabled || loading;

  const solidBg = isDanger ? themeColors.error : themeColors.primary;
  const labelColor = isSolid ? '#FFFFFF' : themeColors.textStrong;
  const iconBg = isSolid ? 'rgba(255, 255, 255, 0.24)' : `${themeColors.textStrong}0F`;

  // Spring press physics — scale + kinetic icon shift, transform/opacity only.
  const scale = useRef(new Animated.Value(1)).current;
  const iconShift = useRef(new Animated.Value(0)).current;

  const spring = (value: Animated.Value, to: number) =>
    Animated.spring(value, {
      toValue: to,
      speed: 50,
      bounciness: 9,
      useNativeDriver: true,
    }).start();

  const handlePressIn = () => {
    if (isDisabled) return;
    spring(scale, 0.975);
    spring(iconShift, 1);
  };

  const handlePressOut = () => {
    spring(scale, 1);
    spring(iconShift, 0);
  };

  return (
    <Animated.View
      style={[
        isSolid
          ? {
              backgroundColor: solidBg,
              // A soft glow in the button's own color lifts it off the footer.
              shadowColor: solidBg,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.28,
              shadowRadius: 10,
              elevation: 3,
            }
          : {
              backgroundColor: themeColors.surfaceAlt,
              borderWidth: 1,
              borderColor: themeColors.border,
            },
        isDisabled && styles.disabled,
        { transform: [{ scale }] },
        style,
      ]}
    >
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.base}
      >
        {loading ? (
          <ActivityIndicator color={isSolid ? '#FFFFFF' : themeColors.primary} />
        ) : (
          <View style={styles.contentRow}>
            <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
            {icon ? (
              <Animated.View
                style={[
                  styles.iconCircle,
                  { backgroundColor: iconBg },
                  {
                    transform: [
                      { translateX: iconShift.interpolate({ inputRange: [0, 1], outputRange: [0, 3] }) },
                      { translateY: iconShift.interpolate({ inputRange: [0, 1], outputRange: [0, -2] }) },
                      { scale: iconShift.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) },
                    ],
                  },
                ]}
              >
                <Ionicons name={icon} size={16} color={labelColor} />
              </Animated.View>
            ) : null}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.md
  },
  base: {
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  iconCircle: {
    width: 30,
    height: 30,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semibold,
  },
  disabled: {
    opacity: 0.5,
  },
});
