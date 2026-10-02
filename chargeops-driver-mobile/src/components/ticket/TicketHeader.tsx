import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { AppBackButton } from '@/components/AppBackButton';
import { usePreferences } from '@/context/PreferencesContext';
import { fontWeights, spacing } from '@/theme';

interface TicketHeaderProps {
  onBack: () => void;
}

export function TicketHeader({ onBack }: TicketHeaderProps) {
  const { t } = useTranslation();
  const { themeColors } = usePreferences();

  return (
    <View style={[styles.header, { borderBottomColor: themeColors.border, backgroundColor: themeColors.surface }]}>
      <AppBackButton onPress={onBack} />
      <View style={styles.headerTitleBlock}>
        <Text style={[styles.headerTitle, { color: themeColors.textStrong }]} numberOfLines={1}>
          {t('ticket.create.title', 'Báo sự cố & Hỗ trợ')}
        </Text>
        <Text style={[styles.headerSubtitle, { color: themeColors.primary }]}>
          {t('ticket.create.subtitle', 'TRỰC TUYẾN 24/7')}
        </Text>
      </View>
      <View style={styles.headerRightAction} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  headerTitleBlock: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  headerTitle: {
    fontSize: 18.5,
    fontWeight: fontWeights.bold,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 11.5,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.8,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  headerRightAction: {
    width: 40,
    height: 40,
  },
});
