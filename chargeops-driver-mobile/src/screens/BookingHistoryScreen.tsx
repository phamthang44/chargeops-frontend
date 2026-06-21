import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StatusBadge, type BadgeVariant } from '@/components';
import type { RootStackParamList } from '@/navigation/types';
import { getBookingHistory } from '@/services/bookingService';
import { colors, fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';
import type { Booking, BookingStatus } from '@/types';
import { formatDate, formatTimeRange, formatVnd } from '@/utils/format';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Tab = 'upcoming' | 'completed';

const UPCOMING_STATUSES: BookingStatus[] = ['PENDING', 'CONFIRMED', 'CHECKED_IN'];

const STATUS_VARIANT: Record<BookingStatus, BadgeVariant> = {
  PENDING: 'warning',
  CONFIRMED: 'success',
  CHECKED_IN: 'info',
  COMPLETED: 'neutral',
  CANCELLED: 'error',
  NO_SHOW: 'error',
};

/** "Lịch sử" tab — bookings split into upcoming vs completed segments. */
export function BookingHistoryScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('upcoming');

  // Refetch on focus so newly created / cancelled bookings show up.
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

  const upcoming = useMemo(
    () =>
      bookings
        .filter((b) => UPCOMING_STATUSES.includes(b.status))
        .sort((a, b) => (a.startAt < b.startAt ? -1 : 1)),
    [bookings],
  );
  const completed = useMemo(
    () =>
      bookings
        .filter((b) => !UPCOMING_STATUSES.includes(b.status))
        .sort((a, b) => (a.startAt < b.startAt ? 1 : -1)),
    [bookings],
  );

  const list = tab === 'upcoming' ? upcoming : completed;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logo}>
          <Ionicons name="flash" size={20} color={colors.textInverse} />
        </View>
        <View style={styles.headerTitleBlock}>
          <Text style={styles.headerTitle}>{t('history.title')}</Text>
          <Text style={styles.headerRole}>{t('history.role')}</Text>
        </View>
      </View>

      {/* Segmented tabs */}
      <View style={styles.segment}>
        <Pressable
          style={[styles.segmentBtn, tab === 'upcoming' && styles.segmentBtnActive]}
          onPress={() => setTab('upcoming')}
        >
          <Text style={[styles.segmentText, tab === 'upcoming' && styles.segmentTextActive]}>
            {t('history.tabUpcomingCount', { count: upcoming.length })}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.segmentBtn, tab === 'completed' && styles.segmentBtnActive]}
          onPress={() => setTab('completed')}
        >
          <Text style={[styles.segmentText, tab === 'completed' && styles.segmentTextActive]}>
            {t('history.tabCompleted')}
          </Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : list.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="calendar-outline" size={40} color={colors.textMuted} />
          <Text style={styles.emptyText}>
            {tab === 'upcoming' ? t('history.emptyUpcoming') : t('history.emptyCompleted')}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {list.map((b) => {
            const canCheckIn = b.status === 'CONFIRMED';
            return (
              <Pressable
                key={b.id}
                style={styles.card}
                onPress={() => navigation.navigate('BookingDetail', { bookingId: b.id })}
              >
                <View style={styles.cardTop}>
                  <Text style={styles.stationName} numberOfLines={1}>
                    {b.stationName}
                  </Text>
                  <StatusBadge
                    variant={STATUS_VARIANT[b.status]}
                    label={t(`bookingStatus.${b.status}`)}
                  />
                </View>
                <Text style={styles.code}>{t('history.code', { code: b.code })}</Text>

                <View style={styles.divider} />

                <View style={styles.metaRow}>
                  <Ionicons name="calendar-outline" size={15} color={colors.primary} />
                  <Text style={styles.metaText}>
                    {formatDate(b.startAt)} • {formatTimeRange(b.startAt, b.endAt)}
                  </Text>
                </View>
                <View style={styles.metaRow}>
                  <Ionicons name="location-outline" size={15} color={colors.primary} />
                  <Text style={styles.metaText} numberOfLines={1}>
                    {b.stationAddress}
                  </Text>
                </View>
                <View style={styles.metaRow}>
                  <Ionicons name="flash-outline" size={15} color={colors.primary} />
                  <Text style={styles.metaText}>
                    {b.chargerName} • {b.connectorType} ({b.powerKw}kW)
                  </Text>
                </View>

                <View style={styles.dashDivider} />

                <View style={styles.cardFooter}>
                  <View>
                    <Text style={styles.totalLabel}>{t('history.total')}</Text>
                    <Text style={styles.total}>{formatVnd(b.totalPrice)}</Text>
                  </View>
                  {canCheckIn && (
                    <Pressable
                      style={styles.checkInBtn}
                      onPress={() => navigation.navigate('QRCheckIn', { bookingId: b.id })}
                    >
                      <Text style={styles.checkInText}>{t('history.checkIn')}</Text>
                      <Ionicons name="chevron-forward" size={15} color={colors.textInverse} />
                    </Pressable>
                  )}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.textStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleBlock: { gap: 2 },
  headerTitle: { fontSize: fontSizes.heading, fontWeight: fontWeights.bold, color: colors.textStrong },
  headerRole: { fontSize: fontSizes.caption, fontWeight: fontWeights.bold, color: colors.primary, letterSpacing: 1 },

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

  // Card
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
    shadowColor: colors.textStrong,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  stationName: { flex: 1, fontSize: fontSizes.heading, fontWeight: fontWeights.bold, color: colors.textStrong },
  code: { fontSize: fontSizes.caption, color: colors.textMuted },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.xs },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  metaText: { flex: 1, fontSize: fontSizes.body, color: colors.textBody, lineHeight: lineHeights.body },
  dashDivider: { height: 1, borderTopWidth: 1, borderStyle: 'dashed', borderColor: colors.border, marginVertical: spacing.xs },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  totalLabel: { fontSize: fontSizes.caption, color: colors.textMuted, letterSpacing: 0.5 },
  total: { fontSize: fontSizes.heading, fontWeight: fontWeights.bold, color: colors.textStrong },
  checkInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  checkInText: { fontSize: fontSizes.body, fontWeight: fontWeights.semibold, color: colors.textInverse },
});
