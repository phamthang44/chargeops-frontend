import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '@/theme';

// Evaluated once: true only on iOS 26+ where the native Liquid Glass effect exists.
const LIQUID_GLASS = isLiquidGlassAvailable();

interface GlassButtonProps {
  onPress?: () => void;
  children: ReactNode;
  size?: number;
  accessibilityLabel?: string;
  glassEffectStyle?: 'clear' | 'regular';
  /** Solid background used when Liquid Glass is unavailable. Default suits over-image use. */
  fallbackColor?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Circular icon button that uses the native iOS 26 Liquid Glass effect when
 * available, and falls back to a solid translucent circle otherwise.
 * Defaults suit floating over imagery (dark fallback); pass `fallbackColor`
 * (e.g. a light tint) and a darker icon to use it on a light header.
 */
export function GlassButton({
  onPress,
  children,
  size = 44,
  accessibilityLabel,
  glassEffectStyle = 'clear',
  fallbackColor = colors.overlay,
  style,
}: GlassButtonProps) {
  const shape = { width: size, height: size, borderRadius: size / 2 };

  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={style}
    >
      {LIQUID_GLASS ? (
        <GlassView style={[styles.center, shape]} glassEffectStyle={glassEffectStyle} isInteractive>
          {children}
        </GlassView>
      ) : (
        <View style={[styles.center, shape, { backgroundColor: fallbackColor }]}>{children}</View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
