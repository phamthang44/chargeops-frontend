import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { usePreferences } from '@/context/PreferencesContext';
import { spacing } from '@/theme';

interface TicketSubmitFooterProps {
  submitting: boolean;
  onSubmit: () => void;
}

export function TicketSubmitFooter({ submitting, onSubmit }: TicketSubmitFooterProps) {
  const { t } = useTranslation();
  const { themeColors } = usePreferences();

  return (
    <View style={[styles.footer, { backgroundColor: themeColors.surface, borderTopColor: themeColors.border }]}>
      <AppButton
        label={
          submitting
            ? t('ticket.create.submitting', 'Đang gửi phiếu...')
            : t('ticket.create.submitBtn', 'Gửi phiếu hỗ trợ sự cố')
        }
        disabled={submitting}
        onPress={onSubmit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    padding: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
