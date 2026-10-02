import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { usePreferences } from '@/context/PreferencesContext';
import { fontWeights, radius, spacing } from '@/theme';

interface TicketQuickChipsProps {
  quickChips: string[];
  onSelectChip: (chip: string) => void;
}

export function TicketQuickChips({ quickChips, onSelectChip }: TicketQuickChipsProps) {
  const { t } = useTranslation();
  const { themeColors } = usePreferences();

  return (
    <View style={styles.quickChipsSection}>
      <Text style={[styles.quickChipsTitle, { color: themeColors.textMuted }]}>
        {t('ticket.create.quickSuggestionsTitle', 'Gợi ý nhanh sự cố thường gặp')}:
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsScroll}
      >
        {quickChips.map((chip) => (
          <Pressable
            key={chip}
            style={[
              styles.chip,
              { backgroundColor: themeColors.surface, borderColor: themeColors.border },
            ]}
            onPress={() => onSelectChip(chip)}
          >
            <Text style={[styles.chipText, { color: themeColors.textBody }]}>{chip}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  quickChipsSection: {
    gap: 7,
  },
  quickChipsTitle: {
    fontSize: 13,
    fontWeight: fontWeights.medium,
    paddingHorizontal: spacing.xs,
  },
  chipsScroll: {
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  chip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
  },
});
