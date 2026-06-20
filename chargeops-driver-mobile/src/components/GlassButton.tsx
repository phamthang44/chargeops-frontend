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
  style?: StyleProp<ViewStyle>;
}

/**
 * Circular icon button that uses the native iOS 26 Liquid Glass effect when
 * available, and falls back to a translucent dark circle elsewhere (older iOS,
 * Android). Designed to float over imagery (e.g. the station detail hero).
 */
export function GlassButton({ onPress, children, size = 44, accessibilityLabel, style }: GlassButtonProps) {
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
        <GlassView style={[styles.center, shape]} glassEffectStyle="clear" isInteractive>
          {children}
        </GlassView>
      ) : (
        <View style={[styles.center, styles.fallback, shape]}>{children}</View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  fallback: { backgroundColor: colors.overlay },
});
