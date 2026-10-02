import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { usePreferences } from '@/context/PreferencesContext';
import { fontWeights, radius, spacing } from '@/theme';

export function TicketPlatformScopeBanner() {
  const { t } = useTranslation();
  const { themeColors, isDark } = usePreferences();

  return (
    <View
      style={[
        styles.platformCard,
        {
          backgroundColor: isDark ? '#1A182E' : '#F5F3FF',
          borderColor: isDark ? '#4C1D95' : '#DDD6FE',
        },
      ]}
    >
      <View style={styles.contextHeader}>
        <Ionicons name="shield-checkmark" size={19} color="#7C3AED" />
        <Text style={styles.contextTitle}>
          {t('ticket.create.platformScopeBadge', 'Hàng chờ Nền tảng & Thanh toán')}
        </Text>
      </View>
      <Text style={[styles.platformHelpText, { color: themeColors.textBody }]}>
        {t(
          'ticket.create.platformScopeHelp',
          'Sự cố này được chuyển thẳng tới Quản trị viên ChargeOps để tra soát giao dịch/tài khoản. Không yêu cầu trạm sạc.',
        )}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  platformCard: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 5,
  },
  contextHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  contextTitle: {
    fontSize: 13.5,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.3,
    color: '#7C3AED',
  },
  platformHelpText: {
    fontSize: 13,
    lineHeight: 19,
  },
});
