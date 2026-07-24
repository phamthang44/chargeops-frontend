import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { usePreferences } from '@/context/PreferencesContext';
import { radius, spacing } from '@/theme';

interface CardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** Rounded surface container with subtle border/shadow. Theme tokens only. */
export function Card({ children, style }: CardProps) {
  const { themeColors } = usePreferences();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: themeColors.surface,
          borderColor: themeColors.border,
          shadowColor: themeColors.textStrong,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    // subtle elevation
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
});
