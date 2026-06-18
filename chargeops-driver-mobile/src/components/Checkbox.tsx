import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontSizes, lineHeights, radius, spacing } from '@/theme';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Label text, or rich content (e.g. inline links). */
  children: ReactNode;
}

/** Square checkbox + tappable label row. Used for terms agreement. */
export function Checkbox({ checked, onChange, children }: CheckboxProps) {
  return (
    <Pressable style={styles.row} onPress={() => onChange(!checked)} hitSlop={6}>
      <View style={[styles.box, checked && styles.boxChecked]}>
        {checked ? <Ionicons name="checkmark" size={14} color={colors.textInverse} /> : null}
      </View>
      <Text style={styles.label}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  boxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  label: {
    flex: 1,
    fontSize: fontSizes.caption,
    color: colors.textBody,
    lineHeight: lineHeights.body,
  },
});
