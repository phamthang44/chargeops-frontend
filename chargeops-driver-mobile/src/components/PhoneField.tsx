import { StyleSheet, Text, TextInput, View } from 'react-native';

import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';

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
  const { themeColors } = usePreferences();

  return (
    <View style={styles.wrap}>
      {label ? <Text style={[styles.label, { color: themeColors.textStrong }]}>{label}</Text> : null}
      <View
        style={[
          styles.row,
          {
            borderColor: error ? themeColors.error : themeColors.border,
            backgroundColor: themeColors.surface,
          },
        ]}
      >
        <View
          style={[
            styles.country,
            { borderRightColor: themeColors.border, backgroundColor: themeColors.surfaceAlt },
          ]}
        >
          <Text style={styles.flag}>🇻🇳</Text>
          <Text style={[styles.dialCode, { color: themeColors.textStrong }]}>+84</Text>
        </View>
        <TextInput
          style={[styles.input, { color: themeColors.textStrong }]}
          value={value}
          onChangeText={onChangeText}
          placeholder="987 654 321"
          placeholderTextColor={themeColors.textMuted}
          keyboardType="phone-pad"
          maxLength={11}
        />
      </View>
      {error ? <Text style={[styles.error, { color: themeColors.error }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  label: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semibold,
  },
  row: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  country: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRightWidth: 1,
  },
  flag: { fontSize: 18 },
  dialCode: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.medium,
  },
  input: {
    flex: 1,
    fontSize: fontSizes.body,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  error: {
    fontSize: fontSizes.caption,
    lineHeight: lineHeights.caption,
  },
});
