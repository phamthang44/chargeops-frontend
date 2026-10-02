import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';

interface TicketPreLinkedBannerProps {
  bookingId: string;
  stationName?: string | null;
}

export function TicketPreLinkedBanner({ bookingId, stationName }: TicketPreLinkedBannerProps) {
  const { t } = useTranslation();
  const { themeColors, isDark } = usePreferences();

  return (
    <View
      style={[
        styles.contextCard,
        {
          backgroundColor: isDark ? '#112233' : '#EFF6FF',
          borderColor: isDark ? '#1D4ED8' : '#BFDBFE',
        },
      ]}
    >
      <View style={styles.contextHeader}>
        <Ionicons name="link-outline" size={19} color="#3B82F6" />
        <Text style={styles.contextTitle}>
          {t('ticket.create.bookingContext', 'BÁO CÁO THEO ĐƠN ĐẶT CHỖ')}
        </Text>
      </View>
      <Text style={[styles.contextText, { color: themeColors.textStrong }]}>
        {stationName
          ? `${t('ticket.create.stationLabel', 'Trạm:')} ${stationName}`
          : t('ticket.create.bookingContext', 'Sự cố gắn liền với đơn sạc hiện tại')}
      </Text>
      <Text style={[styles.contextSub, { color: themeColors.textMuted }]}>
        {t('ticket.create.bookingCodeLabel', 'Mã đơn:')} #{String(bookingId).slice(0, 10).toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  contextCard: {
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
    color: '#3B82F6',
  },
  contextText: {
    fontSize: 15,
    fontWeight: fontWeights.bold,
  },
  contextSub: {
    fontSize: 13,
    fontFamily: 'monospace',
  },
});
