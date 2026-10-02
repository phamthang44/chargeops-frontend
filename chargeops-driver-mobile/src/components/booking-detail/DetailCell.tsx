import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { fontSizes, fontWeights, lineHeights, spacing } from '@/theme';

export interface DetailCellProps {
  label: string;
  value: string;
  subValue?: string;
  alignRight?: boolean;
  mutedColor: string;
  textColor: string;
}

export function DetailCell({
  label,
  value,
  subValue,
  alignRight,
  mutedColor,
  textColor,
}: DetailCellProps) {
  return (
    <View style={[styles.detailCell, alignRight && styles.detailCellRight]}>
      <Text style={[styles.detailLabel, { color: mutedColor }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: textColor }]} numberOfLines={2}>
        {value}
      </Text>
      {subValue ? <Text style={[styles.detailSub, { color: mutedColor }]}>{subValue}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  detailCell: { flex: 1, minWidth: 0, gap: spacing.xs },
  detailCellRight: { alignItems: 'flex-end' },
  detailLabel: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  detailValue: { fontSize: fontSizes.body, fontWeight: fontWeights.bold, lineHeight: lineHeights.body },
  detailSub: { fontSize: fontSizes.caption, lineHeight: lineHeights.caption },
});
