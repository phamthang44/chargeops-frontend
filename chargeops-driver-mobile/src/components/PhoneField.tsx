import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';

interface PhoneFieldProps {
  label?: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
}

/**
 * Vietnamese phone input: a fixed +84 country selector + the local number.
 * `value` holds the local part (without the +84 prefix).
 */
export function PhoneField({ label, value, onChangeText, error }: PhoneFieldProps) {
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.row, error ? styles.rowError : null]}>
        <View style={styles.country}>
          <Text style={styles.flag}>🇻🇳</Text>
          <Text style={styles.dialCode}>+84</Text>
          <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
        </View>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder="987 654 321"
          placeholderTextColor={colors.textMuted}
          keyboardType="phone-pad"
          maxLength={11}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  label: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semibold,
    color: colors.textStrong,
  },
  row: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  rowError: {
    borderColor: colors.error,
  },
  country: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  flag: { fontSize: 18 },
  dialCode: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.medium,
    color: colors.textStrong,
  },
  input: {
    flex: 1,
    fontSize: fontSizes.body,
    color: colors.textStrong,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  error: {
    fontSize: fontSizes.caption,
    color: colors.error,
    lineHeight: lineHeights.caption,
  },
});
