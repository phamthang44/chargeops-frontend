import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';

type IconName = keyof typeof Ionicons.glyphMap;

export interface SectionHeadingProps {
  icon: IconName;
  title: string;
  color: string;
  textColor: string;
}

export function SectionHeading({ icon, title, color, textColor }: SectionHeadingProps) {
  return (
    <View style={styles.sectionTitleRow}>
      <View style={[styles.sectionIcon, { backgroundColor: `${color}18` }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <Text style={[styles.sectionTitle, { color: textColor }]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  sectionIcon: {
    width: 30,
    height: 30,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: fontSizes.heading,
    fontWeight: fontWeights.bold,
  },
});
