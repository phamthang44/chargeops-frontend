import { Ionicons } from '@expo/vector-icons';
import { forwardRef } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { colors, fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';

export interface TextFieldProps extends TextInputProps {
  label?: string;
  /** Optional Ionicons name shown on the left. */
  leftIcon?: keyof typeof Ionicons.glyphMap;
  /** Inline error message; also turns the border red. */
  error?: string;
  /** Optional element rendered on the right (e.g. password show/hide). */
  rightAccessory?: React.ReactNode;
}

/** Labeled text input with optional icon and inline error state. Theme tokens only. */
export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, leftIcon, error, rightAccessory, style, ...inputProps },
  ref,
) {
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.field, error ? styles.fieldError : null]}>
        {leftIcon ? (
          <Ionicons name={leftIcon} size={18} color={colors.textMuted} style={styles.leftIcon} />
        ) : null}
        <TextInput
          ref={ref}
          style={[styles.input, style]}
          placeholderTextColor={colors.textMuted}
          {...inputProps}
        />
        {rightAccessory ? <View style={styles.rightAccessory}>{rightAccessory}</View> : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
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
    color: colors.textStrong,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
  },
  fieldError: {
    borderColor: colors.error,
  },
  leftIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: fontSizes.body,
    color: colors.textStrong,
    paddingVertical: spacing.md,
  },
  rightAccessory: {
    marginLeft: spacing.sm,
  },
  error: {
    fontSize: fontSizes.caption,
    color: colors.error,
    lineHeight: lineHeights.caption,
  },
});
