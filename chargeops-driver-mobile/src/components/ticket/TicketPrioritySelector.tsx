import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { usePreferences } from '@/context/PreferencesContext';
import type { PriorityOption } from '@/hooks/useCreateTicket';
import { fontWeights, radius, spacing } from '@/theme';
import type { TicketPriority } from '@/types';

interface TicketPrioritySelectorProps {
  priorities: PriorityOption[];
  selectedPriority: TicketPriority;
  onSelectPriority: (priority: TicketPriority) => void;
}

export function TicketPrioritySelector({
  priorities,
  selectedPriority,
  onSelectPriority,
}: TicketPrioritySelectorProps) {
  const { t } = useTranslation();
  const { themeColors } = usePreferences();

  return (
    <Card style={[styles.card, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
      <Text style={[styles.sectionTitle, { color: themeColors.textStrong }]}>
        {t('ticket.create.priorityTitle', 'Mức độ ưu tiên')}
      </Text>
      <View style={styles.priorityRow}>
        {priorities.map((pri) => {
          const isSelected = selectedPriority === pri.key;
          return (
            <Pressable
              key={pri.key}
              style={[
                styles.priorityItem,
                {
                  backgroundColor: isSelected ? `${pri.color}18` : themeColors.surfaceAlt,
                  borderColor: isSelected ? pri.color : themeColors.border,
                },
              ]}
              onPress={() => onSelectPriority(pri.key)}
            >
              <View style={[styles.priorityDot, { backgroundColor: pri.color }]} />
              <Text
                style={[
                  styles.priorityLabel,
                  { color: isSelected ? pri.color : themeColors.textBody },
                ]}
              >
                {pri.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 15.5,
    fontWeight: fontWeights.bold,
    marginBottom: 4,
  },
  priorityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  priorityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  priorityDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  priorityLabel: {
    fontSize: 13.5,
    fontWeight: fontWeights.medium,
  },
});
