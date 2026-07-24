import { Ionicons } from '@expo/vector-icons';
import { forwardRef } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';

export interface TextFieldProps extends TextInputProps {
  label?: string;
  /** Optional Ionicons name shown on the left. */
  leftIcon?: keyof typeof Ionicons.glyphMap;
  /** Inline error message; also turns the border red. */
  error?: string;
  /** Optional element rendered on the right (e.g. password show/hide). */
  rightAccessory?: React.ReactNode;
}

/** Labeled text input with optional icon and inline error state. Dynamic theme aware. */
export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, leftIcon, error, rightAccessory, style, ...inputProps },
  ref,
) {
  const { themeColors } = usePreferences();

  return (
    <View style={styles.wrap}>
      {label ? <Text style={[styles.label, { color: themeColors.textStrong }]}>{label}</Text> : null}
      <View
        style={[
          styles.field,
          {
            borderColor: error ? themeColors.error : themeColors.border,
            backgroundColor: themeColors.surface,
          },
        ]}
      >
        {leftIcon ? (
          <Ionicons name={leftIcon} size={18} color={themeColors.textMuted} style={styles.leftIcon} />
        ) : null}
        <TextInput
          ref={ref}
          style={[styles.input, { color: themeColors.textStrong }, style]}
          placeholderTextColor={themeColors.textMuted}
          {...inputProps}
        />
        {rightAccessory ? <View style={styles.rightAccessory}>{rightAccessory}</View> : null}
      </View>
      {error ? <Text style={[styles.error, { color: themeColors.error }]}>{error}</Text> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  label: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semibold,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
  },
  leftIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: fontSizes.body,
    paddingVertical: spacing.md,
  },
  rightAccessory: {
    marginLeft: spacing.sm,
  },
  error: {
    fontSize: fontSizes.caption,
    lineHeight: lineHeights.caption,
  },
});
