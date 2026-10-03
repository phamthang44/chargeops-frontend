import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';

import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';
import { withAlpha } from '@/utils/ticketValidation';

interface TicketFieldErrorProps {
  /** Inline validation message. Empty/undefined hides the row (with an exit animation). */
  message?: string;
}

/**
 * Inline field error: fades + slides in under the input, sits on a tinted error
 * pill so it never gets lost against the card background. Announced to
 * screen readers when it appears.
 */
export function TicketFieldError({ message }: TicketFieldErrorProps) {
  const { themeColors } = usePreferences();
  const progress = useRef(new Animated.Value(0)).current;
  const [rendered, setRendered] = useState(Boolean(message));

  useEffect(() => {
    if (message) {
      setRendered(true);
      Animated.timing(progress, { toValue: 1, duration: 220, useNativeDriver: true }).start();
      return;
    }
    Animated.timing(progress, { toValue: 0, duration: 150, useNativeDriver: true }).start(
      ({ finished }) => {
        if (finished) setRendered(false);
      },
    );
  }, [message, progress]);

  if (!rendered) return null;

  const errorColor = themeColors.error;

  return (
    <Animated.View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[
        styles.row,
        {
          backgroundColor: withAlpha(errorColor, 0.08),
          borderColor: withAlpha(errorColor, 0.35),
        },
        {
          opacity: progress,
          transform: [
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [-4, 0] }) },
          ],
        },
      ]}
    >
      <Ionicons name="alert-circle" size={14} color={errorColor} style={styles.icon} />
      <Text style={[styles.text, { color: errorColor }]} numberOfLines={3}>
        {message}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    marginTop: 2,
  },
  icon: {
    marginTop: 1,
  },
  text: {
    flex: 1,
    fontSize: fontSizes.caption,
    lineHeight: lineHeights.caption,
    fontWeight: fontWeights.semibold,
  },
});
