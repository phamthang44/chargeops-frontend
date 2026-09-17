import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { usePreferences } from '@/context/PreferencesContext';
import type { BookingStats } from '@/services/bookingService';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';
import { formatVnd } from '@/utils/format';

interface LifetimeStatsCardProps {
  stats: BookingStats | null;
  loading?: boolean;
}

/**
 * Modular Lifetime Stats Card.
 * Displays driver's lifetime metrics (spent, sessions, hours) above the history list.
 * Ready for future GET /api/v1/bookings/stats endpoint.
 */
export function LifetimeStatsCard({ stats, loading = false }: LifetimeStatsCardProps) {
  const { t } = useTranslation();
  const { themeColors, isDark } = usePreferences();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: themeColors.surface,
          borderColor: themeColors.border,
          shadowColor: isDark ? '#000000' : themeColors.textStrong,
        },
      ]}
    >
      {/* Top row: Lifetime spent */}
      <View style={styles.topRow}>
        <View style={styles.spentCopy}>
          <Text style={[styles.eyebrow, { color: themeColors.textMuted }]}>
            {t('history.statSpent', 'Tổng chi tiêu')}
          </Text>
          {loading && !stats ? (
            <ActivityIndicator size="small" color={themeColors.primary} style={styles.loader} />
          ) : (
            <Text
              style={[styles.spentValue, { color: themeColors.textStrong }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {stats ? formatVnd(stats.spent) : '0 ₫'}
            </Text>
          )}
        </View>
        <View style={[styles.spentIconBox, { backgroundColor: themeColors.primarySoft }]}>
          <Ionicons name="wallet-outline" size={22} color={themeColors.primaryDark} />
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: themeColors.border }]} />

      {/* Bottom row: Sessions count & Charging hours */}
      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <View style={[styles.metricIconWrap, { backgroundColor: `${themeColors.primary}18` }]}>
            <Ionicons name="flash" size={15} color={themeColors.primary} />
          </View>
          <View style={styles.metricTextGroup}>
            <Text style={[styles.metricValue, { color: themeColors.textStrong }]}>
              {stats?.sessions ?? (loading ? '—' : 0)}
            </Text>
            <Text style={[styles.metricLabel, { color: themeColors.textMuted }]}>
              {t('history.statSessions', 'Lượt sạc')}
            </Text>
          </View>
        </View>

        <View style={[styles.verticalDivider, { backgroundColor: themeColors.border }]} />

        <View style={styles.metricItem}>
          <View style={[styles.metricIconWrap, { backgroundColor: `${themeColors.info}18` }]}>
            <Ionicons name="time" size={15} color={themeColors.info} />
          </View>
          <View style={styles.metricTextGroup}>
            <Text style={[styles.metricValue, { color: themeColors.textStrong }]}>
              {stats ? `${stats.hours}h` : loading ? '—' : '0h'}
            </Text>
            <Text style={[styles.metricLabel, { color: themeColors.textMuted }]}>
              {t('history.statHours', 'Giờ sạc')}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
  },
  spentCopy: {
    flex: 1,
    marginRight: spacing.md,
  },
  eyebrow: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.medium,
    letterSpacing: 0.5,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  spentValue: {
    fontSize: 24,
    fontWeight: fontWeights.bold,
    letterSpacing: -0.5,
  },
  spentIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loader: {
    alignSelf: 'flex-start',
    marginVertical: 4,
  },
  divider: {
    height: 1,
    marginVertical: spacing.xs,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
  },
  metricItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  metricIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricTextGroup: {
    flex: 1,
  },
  metricValue: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
  },
  metricLabel: {
    fontSize: fontSizes.caption,
    marginTop: 1,
  },
  verticalDivider: {
    width: 1,
    height: 28,
    marginHorizontal: spacing.sm,
  },
});
