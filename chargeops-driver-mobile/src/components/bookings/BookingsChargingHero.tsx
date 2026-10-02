import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { LiveDot } from '@/components/LiveDot';
import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';
import type { Booking } from '@/types';
import { formatCountdown, formatVnd } from '@/utils/format';

interface BookingsChargingHeroProps {
  booking: Booking;
  now: number;
  onPress: () => void;
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

export function BookingsChargingHero({
  booking,
  now,
  onPress,
}: BookingsChargingHeroProps) {
  const { themeColors, isDark } = usePreferences();

  const start = new Date(booking.startAt).getTime();
  const end = new Date(booking.endAt).getTime();
  const elapsed = Math.max(0, now - new Date(booking.checkedInAt ?? booking.startAt).getTime());
  const totalDuration = Math.max(1, end - start);
  const progress = clamp01((now - start) / totalDuration);
  const percent = Math.min(99, Math.round(20 + progress * 68));
  const kwhDelivered = (10 + progress * 32.5).toFixed(1);
  const estSpent = Math.round(parseFloat(kwhDelivered) * 3000);
  const remainingMs = Math.max(0, end - now);

  return (
    <Pressable
      style={[
        styles.chargingHeroCard,
        {
          backgroundColor: isDark ? '#0D261E' : '#0B1F17',
          borderColor: '#10B981',
        },
      ]}
      onPress={onPress}
    >
      {/* Top Tag & Power Badge */}
      <View style={styles.heroTopRow}>
        <View style={styles.liveTagHero}>
          <LiveDot color="#10B981" />
          <Text style={styles.liveTagText}>ĐANG SẠC TRỰC TIẾP</Text>
        </View>
        <View style={styles.powerBadge}>
          <Ionicons name="flash" size={12} color="#10B981" />
          <Text style={styles.powerBadgeText}>{booking.powerKw}kW Fast DC</Text>
        </View>
      </View>

      {/* Station Name & Connector */}
      <Text style={styles.chargingStationName} numberOfLines={1}>
        {booking.stationName}
      </Text>
      <Text style={styles.chargingSub}>
        {booking.chargePointName} · {booking.connectorName} ({booking.connectorType})
      </Text>

      {/* Big Live Percentage Counter */}
      <View style={styles.gaugeBlock}>
        <View style={styles.gaugeCenter}>
          <Ionicons name="flash-sharp" size={32} color="#10B981" />
          <Text style={styles.gaugePercent}>{percent}%</Text>
        </View>
        <View style={styles.gaugeStatsRight}>
          <Text style={styles.gaugeMetricVal}>{kwhDelivered} kWh</Text>
          <Text style={styles.gaugeMetricLabel}>Đã nạp</Text>
        </View>
      </View>

      {/* Glowing Progress Bar */}
      <View style={styles.chargingTrackBg}>
        <View style={[styles.chargingTrackFill, { width: `${percent}%` }]} />
      </View>

      {/* Live Metrics Strip */}
      <View style={styles.metricsRow}>
        <View style={styles.metricCell}>
          <Text style={styles.metricCellLabel}>Thời gian sạc</Text>
          <Text style={styles.metricCellVal}>{formatCountdown(elapsed)}</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricCell}>
          <Text style={styles.metricCellLabel}>Còn lại</Text>
          <Text style={styles.metricCellVal}>~{Math.max(1, Math.round(remainingMs / 60_000))} phút</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricCell}>
          <Text style={styles.metricCellLabel}>Tạm tính</Text>
          <Text style={styles.metricCellVal}>{formatVnd(estSpent)}</Text>
        </View>
      </View>

      {/* Open Session CTA */}
      <Pressable
        style={[styles.heroBtn, { backgroundColor: themeColors.primary, marginTop: spacing.xs }]}
        onPress={onPress}
      >
        <Ionicons name="options-outline" size={18} color="#FFFFFF" />
        <Text style={[styles.heroBtnText, { color: '#FFFFFF' }]}>Điều khiển phiên sạc</Text>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chargingHeroCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1.5,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  liveTagHero: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  liveTagText: { fontSize: fontSizes.caption, fontWeight: fontWeights.bold, color: '#10B981', letterSpacing: 1 },
  powerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  powerBadgeText: { fontSize: fontSizes.caption, fontWeight: fontWeights.bold, color: '#34D399' },
  chargingStationName: { fontSize: fontSizes.title, fontWeight: fontWeights.bold, color: '#FFFFFF', marginTop: 2 },
  chargingSub: { fontSize: fontSizes.caption, color: 'rgba(255, 255, 255, 0.7)' },
  gaugeBlock: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: spacing.xs },
  gaugeCenter: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  gaugePercent: { fontSize: 44, fontWeight: fontWeights.bold, color: '#FFFFFF', fontVariant: ['tabular-nums'] },
  gaugeStatsRight: { alignItems: 'flex-end' },
  gaugeMetricVal: { fontSize: fontSizes.heading, fontWeight: fontWeights.bold, color: '#34D399' },
  gaugeMetricLabel: { fontSize: fontSizes.caption, color: 'rgba(255, 255, 255, 0.7)' },
  chargingTrackBg: { height: 8, borderRadius: radius.full, backgroundColor: 'rgba(255, 255, 255, 0.15)', overflow: 'hidden' },
  chargingTrackFill: { height: 8, borderRadius: radius.full, backgroundColor: '#10B981' },
  metricsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xs },
  metricCell: { flex: 1, alignItems: 'center' },
  metricCellLabel: { fontSize: fontSizes.caption, color: 'rgba(255, 255, 255, 0.6)' },
  metricCellVal: { fontSize: fontSizes.body, fontWeight: fontWeights.bold, color: '#FFFFFF', marginTop: 2, fontVariant: ['tabular-nums'] },
  metricDivider: { width: 1, height: 24, backgroundColor: 'rgba(255, 255, 255, 0.15)' },
  heroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radius.full,
    paddingVertical: spacing.md,
  },
  heroBtnText: { fontSize: fontSizes.body, fontWeight: fontWeights.bold },
});
