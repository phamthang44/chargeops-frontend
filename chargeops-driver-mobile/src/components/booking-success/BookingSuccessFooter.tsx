import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { usePreferences } from '@/context/PreferencesContext';
import { spacing } from '@/theme';

interface BookingSuccessFooterProps {
  onViewDetail: () => void;
  onGoHome: () => void;
  isTabletOrSplit?: boolean;
}

export function BookingSuccessFooter({
  onViewDetail,
  onGoHome,
  isTabletOrSplit = false,
}: BookingSuccessFooterProps) {
  const { t } = useTranslation();
  const { themeColors } = usePreferences();

  return (
    <View
      style={[
        styles.footerWrapper,
        {
          backgroundColor: themeColors.surface,
          borderTopColor: themeColors.border,
        },
      ]}
    >
      <View style={[styles.footerContent, isTabletOrSplit && styles.footerContentSplit]}>
        <AppButton
          label={t('bookingSuccess.viewDetail')}
          onPress={onViewDetail}
          style={isTabletOrSplit ? styles.btnSplit : undefined}
        />
        <AppButton
          label={t('bookingSuccess.goHome')}
          variant="secondary"
          onPress={onGoHome}
          style={isTabletOrSplit ? styles.btnSplit : undefined}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footerWrapper: {
    width: '100%',
    borderTopWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 12,
  },
  footerContent: {
    width: '100%',
    maxWidth: 1120,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  footerContentSplit: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: spacing.md,
  },
  btnSplit: {
    minWidth: 180,
    maxWidth: 280,
  },
});
