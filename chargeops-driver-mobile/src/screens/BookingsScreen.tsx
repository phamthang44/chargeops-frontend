import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader, BookingCard, EmptyState, LiveDot, useTabBarInset } from '@/components';
import { usePreferences } from '@/context/PreferencesContext';
import type { RootStackParamList } from '@/navigation/types';
import { getActiveBookings } from '@/services/bookingService';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';
import type { Booking, BookingStatus } from '@/types';
import { formatCountdown, formatTime, formatVnd } from '@/utils/format';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Tab = 'charging' | 'upcoming';

const CHARGING_STATUSES: BookingStatus[] = ['CHECKED_IN'];
const UPCOMING_STATUSES: BookingStatus[] = ['PENDING', 'CONFIRMED'];

type ActionTone = 'primary' | 'info' | 'warning';
const ACTION: Partial<
  Record<BookingStatus, { labelKey: string; icon: keyof typeof Ionicons.glyphMap; tone: ActionTone }>
> = {
  PENDING: { labelKey: 'bookings.actionPay', icon: 'card-outline', tone: 'warning' },
  CONFIRMED: { labelKey: 'bookings.actionCheckIn', icon: 'qr-code-outline', tone: 'primary' },
  CHECKED_IN: { labelKey: 'bookings.actionCharging', icon: 'flash', tone: 'info' },
};

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const HERO_MUTED = 'rgba(255, 255, 255, 0.75)';
const HERO_CHIP_BG = 'rgba(255, 255, 255, 0.15)';

/**
 * "Đặt chỗ" tab — active & upcoming bookings. Dynamic theme & futuristic live charging design.
 */
export function BookingsScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const { themeColors, isDark } = usePreferences();
  // Clears the absolutely-positioned floating tab bar.
  const tabInset = useTabBarInset();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('upcoming');
  const [now, setNow] = useState(Date.now());

  const TONE_BG: Record<ActionTone, string> = {
    primary: themeColors.primary,
    info: themeColors.info,
    warning: themeColors.warning,
  };

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getActiveBookings().then((data) => {
        if (active) {
          setBookings(data);
          setLoading(false);
        }
      });
      return () => {
        active = false;
      };
    }, []),
  );

  const charging = useMemo(
    () =>
      bookings
        .filter((b) => CHARGING_STATUSES.includes(b.status))
        .sort((a, b) => (a.startAt < b.startAt ? -1 : 1)),
    [bookings],
  );
  const upcoming = useMemo(
    () =>
      bookings
        .filter((b) => UPCOMING_STATUSES.includes(b.status))
        .sort((a, b) => (a.startAt < b.startAt ? -1 : 1)),
    [bookings],
  );

  const hero = useMemo(
    () => (tab === 'upcoming' ? upcoming.find((b) => b.status === 'CONFIRMED') : undefined),
    [tab, upcoming],
  );

  const chargingHero = useMemo(
    () => (tab === 'charging' ? charging[0] : undefined),
    [tab, charging],
  );

  const list = tab === 'charging'
    ? charging.filter((b) => b.id !== chargingHero?.id)
    : upcoming.filter((b) => b.id !== hero?.id);

  const onAction = (b: Booking) => {
    if (b.status === 'CONFIRMED') navigation.navigate('QRCheckIn', { bookingId: b.id });
    else if (b.status === 'CHECKED_IN') navigation.navigate('ChargingSession', { bookingId: b.id });
    else navigation.navigate('BookingDetail', { bookingId: b.id });
  };

  const renderAction = (b: Booking) => {
    const cfg = ACTION[b.status];
    if (!cfg) return undefined;
    return (
      <Pressable
        style={[styles.actionBtn, { backgroundColor: TONE_BG[cfg.tone] }]}
        onPress={() => onAction(b)}
      >
        <Text style={[styles.actionText, { color: '#FFFFFF' }]}>{t(cfg.labelKey)}</Text>
        <Ionicons name={cfg.icon} size={15} color="#FFFFFF" />
      </Pressable>
    );
  };

  /** Redesigned card charging banner */
  const renderChargingBanner = (b: Booking) => {
    const start = new Date(b.startAt).getTime();
    const end = new Date(b.endAt).getTime();
    const elapsed = Math.max(0, now - new Date(b.checkedInAt ?? b.startAt).getTime());
    const progress = clamp01((now - start) / (end - start || 1));
    const percent = Math.round(20 + progress * 60);

    return (
      <View style={[styles.chargeBanner, { backgroundColor: themeColors.surfaceAlt, borderColor: themeColors.border }]}>
        <View style={styles.chargeRow}>
          <View style={styles.liveTag}>
            <LiveDot color={themeColors.info} />
            <Text style={[styles.liveText, { color: themeColors.info }]}>
              {t('bookings.liveCharging')} · {percent}%
            </Text>
          </View>
          <Text style={[styles.elapsed, { color: themeColors.textStrong }]}>{formatCountdown(elapsed)}</Text>
        </View>
        <View style={[styles.track, { backgroundColor: themeColors.surface }]}>
          <View style={[styles.fill, { width: `${percent}%`, backgroundColor: themeColors.info }]} />
        </View>
      </View>
    );
  };

  /** Redesigned Futuristic Live Charging Dashboard Hero Card */
  const renderChargingHero = (b: Booking) => {
    const start = new Date(b.startAt).getTime();
    const end = new Date(b.endAt).getTime();
    const elapsed = Math.max(0, now - new Date(b.checkedInAt ?? b.startAt).getTime());
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
        onPress={() => navigation.navigate('ChargingSession', { bookingId: b.id })}
      >
        {/* Top Tag & Power Badge */}
        <View style={styles.heroTopRow}>
          <View style={styles.liveTagHero}>
            <LiveDot color="#10B981" />
            <Text style={styles.liveTagText}>ĐANG SẠC TRỰC TIẾP</Text>
          </View>
          <View style={styles.powerBadge}>
            <Ionicons name="flash" size={12} color="#10B981" />
            <Text style={styles.powerBadgeText}>{b.powerKw}kW Fast DC</Text>
          </View>
        </View>

        {/* Station Name & Connector */}
        <Text style={styles.chargingStationName} numberOfLines={1}>
          {b.stationName}
        </Text>
        <Text style={styles.chargingSub}>
          {b.chargePointName} · {b.connectorName} ({b.connectorType})
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
          onPress={() => navigation.navigate('ChargingSession', { bookingId: b.id })}
        >
          <Ionicons name="options-outline" size={18} color="#FFFFFF" />
          <Text style={[styles.heroBtnText, { color: '#FFFFFF' }]}>Điều khiển phiên sạc</Text>
        </Pressable>
      </Pressable>
    );
  };

  const renderHero = (b: Booking) => {
    const msLeft = new Date(b.startAt).getTime() - now;
    const due = msLeft <= 0;
    const heroBg = isDark ? '#113E30' : '#111827';
    const heroBorder = isDark ? '#10B981' : 'transparent';

    return (
      <Pressable
        style={[styles.hero, { backgroundColor: heroBg, borderColor: heroBorder, borderWidth: isDark ? 1.5 : 0 }]}
        onPress={() => navigation.navigate('BookingDetail', { bookingId: b.id })}
      >
        <View style={styles.heroTopRow}>
          <Text style={[styles.heroEyebrow, { color: isDark ? '#6EE6A0' : themeColors.primaryLight }]}>
            {t('bookings.nextSession')}
          </Text>
          <View style={[styles.heroChip, { backgroundColor: HERO_CHIP_BG }]}>
            <Ionicons name="flash" size={11} color={isDark ? '#6EE6A0' : themeColors.primaryLight} />
            <Text style={[styles.heroChipText, { color: '#FFFFFF' }]}>
              {b.connectorType} · {b.powerKw}kW
            </Text>
          </View>
        </View>

        <Text style={[styles.heroStation, { color: '#FFFFFF' }]} numberOfLines={1}>
          {b.stationName}
        </Text>
        <View style={styles.heroMetaRow}>
          <Ionicons name="location-outline" size={13} color={HERO_MUTED} />
          <Text style={[styles.heroMeta, { color: HERO_MUTED }]} numberOfLines={1}>
            {b.chargePointName} · {b.connectorName} · {formatTime(b.startAt)}
          </Text>
        </View>

        <Text style={[styles.heroCountdown, { color: '#FFFFFF' }]}>
          {due ? t('bookings.readyNow') : formatCountdown(msLeft)}
        </Text>
        <Text style={[styles.heroCaption, { color: HERO_MUTED }]}>
          {due ? t('bookings.readyToCheckIn') : t('bookings.untilCheckIn')}
        </Text>

        <Pressable
          style={[styles.heroBtn, { backgroundColor: themeColors.primary }]}
          onPress={() => navigation.navigate('QRCheckIn', { bookingId: b.id })}
        >
          <Ionicons name="qr-code-outline" size={16} color="#FFFFFF" />
          <Text style={[styles.heroBtnText, { color: '#FFFFFF' }]}>{t('bookings.checkInNow')}</Text>
        </Pressable>
      </Pressable>
    );
  };

  const isEmpty = !hero && !chargingHero && list.length === 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top']}>
      <AppHeader title={t('bookings.title')} />

      {/* Segmented tabs */}
      <View style={[styles.segment, { backgroundColor: themeColors.surfaceAlt, borderColor: themeColors.border }]}>
        <Pressable
          style={[
            styles.segmentBtn,
            tab === 'upcoming' && [styles.segmentBtnActive, { backgroundColor: themeColors.surface }],
          ]}
          onPress={() => setTab('upcoming')}
        >
          <Text
            style={[
              styles.segmentText,
              { color: tab === 'upcoming' ? themeColors.primary : themeColors.textMuted },
              tab === 'upcoming' && styles.segmentTextActive,
            ]}
          >
            {t('bookings.tabUpcomingCount', { count: upcoming.length })}
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.segmentBtn,
            tab === 'charging' && [styles.segmentBtnActive, { backgroundColor: themeColors.surface }],
          ]}
          onPress={() => setTab('charging')}
        >
          <Text
            style={[
              styles.segmentText,
              { color: tab === 'charging' ? themeColors.primary : themeColors.textMuted },
              tab === 'charging' && styles.segmentTextActive,
            ]}
          >
            {t('bookings.tabChargingCount', { count: charging.length })}
          </Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color={themeColors.primary} style={styles.loader} />
      ) : isEmpty ? (
        <View style={[styles.empty, { paddingBottom: tabInset }]}>
          <EmptyState variant="bookings" />
          <Text style={[styles.emptyText, { color: themeColors.textMuted }]}>
            {tab === 'charging' ? t('bookings.emptyCharging') : t('bookings.emptyUpcoming')}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: tabInset }]}
          showsVerticalScrollIndicator={false}
        >
          {tab === 'charging' && chargingHero && renderChargingHero(chargingHero)}
          {tab === 'upcoming' && hero && renderHero(hero)}
          {list.map((b) => (
            <BookingCard
              key={b.id}
              booking={b}
              onPress={() => navigation.navigate('BookingDetail', { bookingId: b.id })}
              action={renderAction(b)}
              banner={b.status === 'CHECKED_IN' ? renderChargingBanner(b) : undefined}
              accentColor={b.status === 'CHECKED_IN' ? themeColors.info : undefined}
            />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  segment: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: radius.md,
    padding: spacing.xs,
    gap: spacing.xs,
    borderWidth: 1,
  },
  segmentBtn: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: radius.sm },
  segmentBtnActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  segmentText: { fontSize: fontSizes.body, fontWeight: fontWeights.medium },
  segmentTextActive: { fontWeight: fontWeights.bold },

  loader: { marginTop: spacing.xl },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
  emptyText: { fontSize: fontSizes.body, textAlign: 'center' },

  content: { padding: spacing.lg, paddingTop: 0, gap: spacing.md },

  // Live Charging Hero Card
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

  // Next-session hero
  hero: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 4,
  },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroEyebrow: { fontSize: fontSizes.caption, fontWeight: fontWeights.bold, letterSpacing: 1 },
  heroChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  heroChipText: { fontSize: fontSizes.caption, fontWeight: fontWeights.semibold },
  heroStation: { fontSize: fontSizes.heading, fontWeight: fontWeights.bold, marginTop: 2 },
  heroMetaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  heroMeta: { flex: 1, fontSize: fontSizes.caption },
  heroCountdown: { fontSize: fontSizes.display, fontWeight: fontWeights.bold, marginTop: spacing.sm, fontVariant: ['tabular-nums'] },
  heroCaption: { fontSize: fontSizes.caption, marginBottom: spacing.sm },
  heroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radius.full,
    paddingVertical: spacing.md,
  },
  heroBtnText: { fontSize: fontSizes.body, fontWeight: fontWeights.bold },

  // Charging banner (in item cards)
  chargeBanner: { padding: spacing.sm, borderRadius: radius.md, borderWidth: 1, gap: spacing.xs },
  chargeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  liveTag: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  liveText: { fontSize: fontSizes.caption, fontWeight: fontWeights.bold, letterSpacing: 0.5 },
  elapsed: { fontSize: fontSizes.caption, fontWeight: fontWeights.bold, fontVariant: ['tabular-nums'] },
  track: { height: 4, borderRadius: radius.full, overflow: 'hidden' },
  fill: { height: 4, borderRadius: radius.full },

  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  actionText: { fontSize: fontSizes.caption, fontWeight: fontWeights.semibold },
});
