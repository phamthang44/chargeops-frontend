import React, { type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { usePreferences } from '@/context/PreferencesContext';
import { radius, spacing } from '@/theme';

const SHELL_PADDING = 6;
/** Concentric math: inner radius = outer radius − shell padding. */
const CORE_RADIUS = radius.xl - SHELL_PADDING;

export interface BezelCardProps {
  children: ReactNode;
  /** Accent hue driving the outer shell tint + hairline (Double-Bezel ring). */
  tone: string;
  /** Inner core background. Defaults to the theme surface. */
  coreColor?: string;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}

/**
 * Double-Bezel (Doppelrand) container: a machined outer tray holding a
 * distinct inner core — never a card sitting flat on the background.
 *
 * - Outer shell: tinted `tone` background, hairline ring, squircle `radius.xl`,
 *   soft ambient shadow.
 * - Inner core: own surface, concentric radius, top-edge inset highlight
 *   (RN has no inset shadows, so the highlight is emulated with the top border).
 */
export function BezelCard({
  children,
  tone,
  coreColor,
  style,
  contentStyle,
}: BezelCardProps) {
  const { themeColors, isDark } = usePreferences();

  return (
    <View
      style={[
        styles.shell,
        {
          backgroundColor: `${tone}08`,
          borderColor: `${tone}28`,
          shadowColor: isDark ? '#000000' : themeColors.textStrong,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.core,
          {
            backgroundColor: coreColor ?? themeColors.surface,
            borderTopColor: isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(17, 24, 22, 0.05)',
          },
          contentStyle,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: SHELL_PADDING,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
  core: {
    borderRadius: CORE_RADIUS,
    borderTopWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
});
