import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader, BookingCard, EmptyState, LiveDot } from '@/components';
import type { RootStackParamList } from '@/navigation/types';
import { getBookingHistory } from '@/services/bookingService';
import { colors, fontSizes, fontWeights, radius, spacing } from '@/theme';
import type { Booking, BookingStatus } from '@/types';
import { formatCountdown, formatTime } from '@/utils/format';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Tab = 'charging' | 'upcoming';

const CHARGING_STATUSES: BookingStatus[] = ['CHECKED_IN'];
const UPCOMING_STATUSES: BookingStatus[] = ['PENDING', 'CONFIRMED'];

/** Footer action button shown on each card, keyed by booking status. */
type ActionTone = 'primary' | 'info' | 'warning';
const ACTION: Partial<
  Record<BookingStatus, { labelKey: string; icon: keyof typeof Ionicons.glyphMap; tone: ActionTone }>
> = {
  PENDING: { labelKey: 'bookings.actionPay', icon: 'card-outline', tone: 'warning' },
  CONFIRMED: { labelKey: 'bookings.actionCheckIn', icon: 'qr-code-outline', tone: 'primary' },
  CHECKED_IN: { labelKey: 'bookings.actionCharging', icon: 'flash', tone: 'info' },
};
const TONE_BG: Record<ActionTone, string> = {
  primary: colors.primary,
  info: colors.info,
  warning: colors.warning,
};

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/**
 * "Đặt chỗ" tab — active & upcoming bookings, split into:
 *   - Đang sạc  = CHECKED_IN (a charging session in progress)
 *   - Sắp tới   = PENDING / CONFIRMED (awaiting payment or check-in)
 * The soonest confirmed booking is surfaced as a live countdown hero; charging
 * cards carry a live elapsed-time banner + session progress bar. Ended bookings
 * (completed/cancelled/no-show) live on the Lịch sử tab.
 */
export function BookingsScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('upcoming');
  const [now, setNow] = useState(Date.now());

  // Tick once a second so countdowns / elapsed timers stay live.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Refetch on focus so newly created / checked-in / cancelled bookings show up.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      getBookingHistory().then((data) => {
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

  // Hero = the soonest CONFIRMED (ready-to-check-in) booking; the rest list below.
  const hero = useMemo(
    () => (tab === 'upcoming' ? upcoming.find((b) => b.status === 'CONFIRMED') : undefined),
    [tab, upcoming],
  );
  const list = tab === 'charging' ? charging : upcoming.filter((b) => b.id !== hero?.id);

  /** Navigate to the screen that fulfils the card's status action. */
  const onAction = (b: Booking) => {
    if (b.status === 'CONFIRMED') navigation.navigate('QRCheckIn', { bookingId: b.id });
    else if (b.status === 'CHECKED_IN') navigation.navigate('ChargingSession', { bookingId: b.id });
    else navigation.navigate('BookingDetail', { bookingId: b.id }); // PENDING -> pay
  };

  const renderAction = (b: Booking) => {
    const cfg = ACTION[b.status];
    if (!cfg) return undefined;
    return (
      <Pressable
        style={[styles.actionBtn, { backgroundColor: TONE_BG[cfg.tone] }]}
        onPress={() => onAction(b)}
      >
        <Text style={styles.actionText}>{t(cfg.labelKey)}</Text>
        <Ionicons name={cfg.icon} size={15} color={colors.textInverse} />
      </Pressable>
    );
  };

  /** Live banner for a charging (CHECKED_IN) card: pulse + elapsed time + progress. */
  const renderChargingBanner = (b: Booking) => {
    const start = new Date(b.startAt).getTime();
    const end = new Date(b.endAt).getTime();
    const elapsed = Math.max(0, now - new Date(b.checkedInAt ?? b.startAt).getTime());
    const progress = clamp01((now - start) / (end - start || 1));
    return (
      <View style={styles.chargeBanner}>
        <View style={styles.chargeRow}>
          <View style={styles.liveTag}>
            <LiveDot color={colors.info} />
            <Text style={styles.liveText}>{t('bookings.liveCharging')}</Text>
          </View>
          <Text style={styles.elapsed}>{formatCountdown(elapsed)}</Text>
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${Math.round(progress * 100)}%` }]} />
        </View>
      </View>
    );
  };

  const renderHero = (b: Booking) => {
    const msLeft = new Date(b.startAt).getTime() - now;
    const due = msLeft <= 0;
    return (
      <Pressable
        style={styles.hero}
        onPress={() => navigation.navigate('BookingDetail', { bookingId: b.id })}
      >
        <View style={styles.heroTopRow}>
          <Text style={styles.heroEyebrow}>{t('bookings.nextSession')}</Text>
          <Ionicons name="flash" size={16} color={colors.textInverse} />
        </View>
        <Text style={styles.heroStation} numberOfLines={1}>
          {b.stationName}
        </Text>
        <Text style={styles.heroTime}>
          {formatTime(b.startAt)} • {b.connectorName}
        </Text>

        <Text style={styles.heroCountdown}>{due ? t('bookings.readyNow') : formatCountdown(msLeft)}</Text>
        <Text style={styles.heroCaption}>
          {due ? t('bookings.readyToCheckIn') : t('bookings.untilCheckIn')}
        </Text>

        <Pressable
          style={styles.heroBtn}
          onPress={() => navigation.navigate('QRCheckIn', { bookingId: b.id })}
        >
          <Ionicons name="qr-code-outline" size={16} color={colors.primaryDark} />
          <Text style={styles.heroBtnText}>{t('bookings.checkInNow')}</Text>
        </Pressable>
      </Pressable>
    );
  };

  const isEmpty = !hero && list.length === 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader title={t('bookings.title')} />

      {/* Segmented tabs */}
      <View style={styles.segment}>
        <Pressable
          style={[styles.segmentBtn, tab === 'upcoming' && styles.segmentBtnActive]}
          onPress={() => setTab('upcoming')}
        >
          <Text style={[styles.segmentText, tab === 'upcoming' && styles.segmentTextActive]}>
            {t('bookings.tabUpcomingCount', { count: upcoming.length })}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.segmentBtn, tab === 'charging' && styles.segmentBtnActive]}
          onPress={() => setTab('charging')}
        >
          <Text style={[styles.segmentText, tab === 'charging' && styles.segmentTextActive]}>
            {t('bookings.tabChargingCount', { count: charging.length })}
          </Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : isEmpty ? (
        <View style={styles.empty}>
          <EmptyState variant="bookings" />
          <Text style={styles.emptyText}>
            {tab === 'charging' ? t('bookings.emptyCharging') : t('bookings.emptyUpcoming')}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {hero && renderHero(hero)}
          {list.map((b) => (
            <BookingCard
              key={b.id}
              booking={b}
              onPress={() => navigation.navigate('BookingDetail', { bookingId: b.id })}
              action={renderAction(b)}
              banner={b.status === 'CHECKED_IN' ? renderChargingBanner(b) : undefined}
              accentColor={b.status === 'CHECKED_IN' ? colors.info : undefined}
            />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // Segmented control
  segment: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.xs,
    gap: spacing.xs,
  },
  segmentBtn: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: radius.sm },
  segmentBtnActive: { backgroundColor: colors.surface, shadowColor: colors.textStrong, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2, elevation: 1 },
  segmentText: { fontSize: fontSizes.body, fontWeight: fontWeights.medium, color: colors.textMuted },
  segmentTextActive: { color: colors.primary, fontWeight: fontWeights.bold },

  loader: { marginTop: spacing.xl },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
  emptyText: { fontSize: fontSizes.body, color: colors.textMuted, textAlign: 'center' },

  content: { padding: spacing.lg, paddingTop: 0, gap: spacing.md },

  // Live countdown hero (next confirmed session)
  hero: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.xs,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroEyebrow: { fontSize: fontSizes.caption, fontWeight: fontWeights.bold, color: colors.textInverse, letterSpacing: 1, opacity: 0.85 },
  heroStation: { fontSize: fontSizes.heading, fontWeight: fontWeights.bold, color: colors.textInverse },
  heroTime: { fontSize: fontSizes.body, color: colors.textInverse, opacity: 0.85 },
  heroCountdown: { fontSize: fontSizes.display, fontWeight: fontWeights.bold, color: colors.textInverse, marginTop: spacing.sm, fontVariant: ['tabular-nums'] },
  heroCaption: { fontSize: fontSizes.caption, color: colors.textInverse, opacity: 0.85, marginBottom: spacing.sm },
  heroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    paddingVertical: spacing.md,
  },
  heroBtnText: { fontSize: fontSizes.body, fontWeight: fontWeights.bold, color: colors.primaryDark },

  // Charging banner (inside BookingCard)
  chargeBanner: { gap: spacing.sm },
  chargeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  liveTag: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  liveText: { fontSize: fontSizes.caption, fontWeight: fontWeights.bold, color: colors.info, letterSpacing: 1 },
  elapsed: { fontSize: fontSizes.body, fontWeight: fontWeights.semibold, color: colors.textBody, fontVariant: ['tabular-nums'] },
  track: { height: 4, borderRadius: radius.full, backgroundColor: colors.surfaceAlt, overflow: 'hidden' },
  fill: { height: 4, borderRadius: radius.full, backgroundColor: colors.info },

  // Card status action
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  actionText: { fontSize: fontSizes.body, fontWeight: fontWeights.semibold, color: colors.textInverse },
});
