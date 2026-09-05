import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { usePreferences } from '@/context/PreferencesContext';
import { radius, spacing } from '@/theme';

interface StationNoticeBannerProps {
  isPaused: boolean;
  isMaintenance: boolean;
  reason?: string | null;
}

export function StationNoticeBanner({
  isPaused,
  isMaintenance,
  reason,
}: StationNoticeBannerProps) {
  const { t } = useTranslation();
  const { isDark } = usePreferences();

  if (!isPaused && !isMaintenance) return null;

  const title = isPaused
    ? t('stationDetail.pausedAlertTitle')
    : t('stationDetail.maintenanceAlertTitle');

  const defaultReason = isPaused
    ? t('stationDetail.pausedDefaultReason')
    : t('stationDetail.maintenanceDefaultReason');

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: isPaused
            ? isDark
              ? 'rgba(239, 68, 68, 0.12)'
              : '#FEE2E2'
            : isDark
              ? 'rgba(245, 158, 11, 0.12)'
              : '#FEF3C7',
          borderColor: isPaused
            ? isDark
              ? '#B91C1C'
              : '#FCA5A5'
            : isDark
              ? '#D97706'
              : '#FCD34D',
        },
      ]}
    >
      <View style={styles.header}>
        <Ionicons
          name={isPaused ? 'pause-circle' : 'construct'}
          size={18}
          color={isPaused ? (isDark ? '#F87171' : '#DC2626') : (isDark ? '#FBBF24' : '#D97706')}
        />
        <Text
          style={[
            styles.title,
            { color: isPaused ? (isDark ? '#F87171' : '#DC2626') : (isDark ? '#FBBF24' : '#D97706') },
          ]}
        >
          {title}
        </Text>
      </View>
      <Text style={[styles.desc, { color: isDark ? '#E2E8F0' : '#334155' }]}>
        {reason || defaultReason}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
  },
  desc: {
    marginTop: 4,
    fontSize: 12.5,
    lineHeight: 18,
  },
});
