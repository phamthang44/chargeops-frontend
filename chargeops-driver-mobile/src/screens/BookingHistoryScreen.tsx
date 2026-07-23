import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader, BookingCard, EmptyState } from '@/components';
import type { RootStackParamList } from '@/navigation/types';
import { getBookingHistory } from '@/services/bookingService';
import { colors, fontSizes, fontWeights, radius, spacing } from '@/theme';
import type { Booking, BookingStatus } from '@/types';
import { formatVnd } from '@/utils/format';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Filter = 'all' | 'completed' | 'cancelled';

// Ended bookings only — active/upcoming ones live on the Đặt chỗ tab. A no-show
// is a CANCELLED booking with a reason (BR-BOK-05), so it needs no state of its
// own here; EXPIRED covers holds that lapsed before payment (BR-BOK-02).
const ENDED_STATUSES: BookingStatus[] = ['COMPLETED', 'CANCELLED', 'EXPIRED'];
const FILTERS: Filter[] = ['all', 'completed', 'cancelled'];
const FILTER_MATCH: Record<Filter, BookingStatus[]> = {
  all: ENDED_STATUSES,
  completed: ['COMPLETED'],
  cancelled: ['CANCELLED', 'EXPIRED'],
};

// English month names (vi formats numerically via i18n). Index 0 = January.
const EN_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

interface MonthGroup {
  key: string;
  month: number; // 0-11
  year: number;
  items: Booking[];
}

/** "Lịch sử" tab — past bookings with lifetime stats, status filters, and month grouping. */
export function BookingHistoryScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');

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

  // Lifetime stats are computed from COMPLETED sessions only.
  const stats = useMemo(() => {
    const done = bookings.filter((b) => b.status === 'COMPLETED');
    return {
      sessions: done.length,
      hours: Math.round(done.reduce((sum, b) => sum + b.durationMin, 0) / 60),
      spent: done.reduce((sum, b) => sum + b.totalPrice, 0),
    };
  }, [bookings]);

  const filtered = useMemo(
    () =>
      bookings
        .filter((b) => FILTER_MATCH[filter].includes(b.status))
        .sort((a, b) => (a.startAt < b.startAt ? 1 : -1)),
    [bookings, filter],
  );

  // Group the (already newest-first) list into month sections, preserving order.
  const groups = useMemo<MonthGroup[]>(() => {
    const map = new Map<string, MonthGroup>();
    for (const b of filtered) {
      const d = new Date(b.startAt);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      let g = map.get(key);
      if (!g) {
        g = { key, month: d.getMonth(), year: d.getFullYear(), items: [] };
        map.set(key, g);
      }
      g.items.push(b);
    }
    return Array.from(map.values());
  }, [filtered]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader title={t('history.title')} />

      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Lifetime stats */}
          <View style={styles.stats}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.sessions}</Text>
              <Text style={styles.statLabel}>{t('history.statSessions')}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.hours}h</Text>
              <Text style={styles.statLabel}>{t('history.statHours')}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
                {formatVnd(stats.spent)}
              </Text>
              <Text style={styles.statLabel}>{t('history.statSpent')}</Text>
            </View>
          </View>

          {/* Status filter chips */}
          <View style={styles.chips}>
            {FILTERS.map((f) => (
              <Pressable
                key={f}
                style={[styles.chip, filter === f && styles.chipActive]}
                onPress={() => setFilter(f)}
              >
                <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>
                  {t(`history.filter.${f}`)}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Grouped list */}
          {groups.length === 0 ? (
            <View style={styles.empty}>
              <EmptyState variant="bookings" />
              <Text style={styles.emptyText}>
                {filter === 'all' ? t('history.empty') : t('history.emptyFiltered')}
              </Text>
            </View>
          ) : (
            groups.map((g) => (
              <View key={g.key} style={styles.group}>
                <Text style={styles.groupTitle}>
                  {t('history.monthGroup', {
                    month: g.month + 1,
                    monthName: EN_MONTHS[g.month],
                    year: g.year,
                  })}
                </Text>
                {g.items.map((b) => (
                  <BookingCard
                    key={b.id}
                    booking={b}
                    onPress={() => navigation.navigate('BookingDetail', { bookingId: b.id })}
                  />
                ))}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  loader: { marginTop: spacing.xl },
  content: { padding: spacing.lg, paddingTop: 0, gap: spacing.md },

  // Lifetime stats strip
  stats: { flexDirection: 'row', gap: spacing.sm },
  statCard: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    gap: spacing.xs,
  },
  statValue: { fontSize: fontSizes.heading, fontWeight: fontWeights.bold, color: colors.textStrong },
  statLabel: { fontSize: fontSizes.caption, color: colors.textMuted },

  // Filter chips
  chips: { flexDirection: 'row', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: fontSizes.body, fontWeight: fontWeights.medium, color: colors.textBody },
  chipTextActive: { color: colors.textInverse, fontWeight: fontWeights.semibold },

  // Month sections
  group: { gap: spacing.md },
  groupTitle: { fontSize: fontSizes.caption, fontWeight: fontWeights.bold, color: colors.textMuted, letterSpacing: 0.5, textTransform: 'uppercase', marginTop: spacing.xs },

  empty: { alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingVertical: spacing.xxl },
  emptyText: { fontSize: fontSizes.body, color: colors.textMuted, textAlign: 'center' },
});
