import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { usePreferences } from '@/context/PreferencesContext';
import { spacing } from '@/theme';

interface BookingSuccessFooterProps {
  onViewDetail: () => void;
  onGoHome: () => void;
}

export function BookingSuccessFooter({
  onViewDetail,
  onGoHome,
}: BookingSuccessFooterProps) {
  const { t } = useTranslation();
  const { themeColors } = usePreferences();

  return (
    <View style={[styles.footer, { backgroundColor: themeColors.surface, borderTopColor: themeColors.border }]}>
      <AppButton label={t('bookingSuccess.viewDetail')} onPress={onViewDetail} />
      <AppButton label={t('bookingSuccess.goHome')} variant="secondary" onPress={onGoHome} />
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    gap: spacing.sm,
  },
});
