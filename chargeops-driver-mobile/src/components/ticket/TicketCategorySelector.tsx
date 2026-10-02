import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { usePreferences } from '@/context/PreferencesContext';
import type { CategoryOption } from '@/hooks/useCreateTicket';
import { fontWeights, radius, spacing } from '@/theme';
import type { TicketCategory } from '@/types';

interface TicketCategorySelectorProps {
  categories: CategoryOption[];
  selectedCategory: TicketCategory;
  onSelectCategory: (category: TicketCategory) => void;
}

export function TicketCategorySelector({
  categories,
  selectedCategory,
  onSelectCategory,
}: TicketCategorySelectorProps) {
  const { t } = useTranslation();
  const { themeColors } = usePreferences();

  return (
    <Card style={[styles.card, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
      <Text style={[styles.sectionTitle, { color: themeColors.textStrong }]}>
        {t('ticket.create.categoryTitle', 'Loại sự cố *')}
      </Text>
      <View style={styles.categoryGrid}>
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.key;
          return (
            <Pressable
              key={cat.key}
              style={[
                styles.categoryItem,
                {
                  backgroundColor: isSelected ? `${cat.color}15` : themeColors.surfaceAlt,
                  borderColor: isSelected ? cat.color : themeColors.border,
                },
              ]}
              onPress={() => onSelectCategory(cat.key)}
            >
              <Ionicons name={cat.icon} size={22} color={isSelected ? cat.color : themeColors.textMuted} />
              <Text
                style={[
                  styles.categoryItemLabel,
                  { color: isSelected ? cat.color : themeColors.textBody },
                ]}
              >
                {cat.label}
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
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  categoryItemLabel: {
    fontSize: 13.5,
    fontWeight: fontWeights.bold,
  },
});
