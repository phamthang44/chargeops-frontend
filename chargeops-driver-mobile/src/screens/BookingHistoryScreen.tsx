import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader, BookingCard, EmptyState } from '@/components';
import type { RootStackParamList } from '@/navigation/types';
import {
  BOOKING_PAGE_SIZE,
  getBookingHistory,
  getBookingStats,
  type BookingStats,
  type HistoryStatusFilter,
} from '@/services/bookingService';
import { colors, fontSizes, fontWeights, radius, spacing } from '@/theme';
import type { Booking } from '@/types';
import { formatVnd } from '@/utils/format';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const FILTERS: HistoryStatusFilter[] = ['all', 'completed', 'cancelled'];

/** How long the search box stays quiet before it asks the service for results. */
const SEARCH_DEBOUNCE_MS = 300;

// English month names (vi formats numerically via i18n). Index 0 = January.
const EN_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

interface MonthSection {
  key: string;
  month: number; // 0-11
  year: number;
  data: Booking[];
}

const EMPTY_COUNTS: Record<HistoryStatusFilter, number> = { all: 0, completed: 0, cancelled: 0 };

/**
 * "Lịch sử" tab — past bookings with lifetime stats, search, status filters and
 * month grouping.
 *
 * History is unbounded (a regular driver passes a hundred rows inside a year),
 * so the screen never holds the full list: it asks the service for one page at a
 * time and lets the service do the searching and filtering. Changing the query
 * or the status chip starts a new page 1 rather than re-filtering what is
 * already on screen — otherwise the cursor would point into the wrong set.
 */
export function BookingHistoryScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();

  // Raw input vs. the debounced term actually sent to the service.
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<HistoryStatusFilter>('all');

  const [items, setItems] = useState<Booking[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState(EMPTY_COUNTS);
  const [stats, setStats] = useState<BookingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  // Bumped on focus so returning from a booking detail refetches page 1.
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const id = setTimeout(() => setQuery(input), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [input]);

  useFocusEffect(
    useCallback(() => {
      setReloadKey((k) => k + 1);
    }, []),
  );

  // Page 1 — refetched whenever the query, the status filter, or focus changes.
  useEffect(() => {
    let active = true;
    setLoading(true);
    getBookingHistory({ query, status: filter }).then((page) => {
      if (!active) return;
      setItems(page.items);
      setCursor(page.nextCursor);
      setTotal(page.total);
      setCounts(page.counts);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [query, filter, reloadKey]);

  // Lifetime stats are an aggregate over every completed session, so they come
  // from their own call — they can't be summed from the rows currently loaded.
  useEffect(() => {
    let active = true;
    getBookingStats().then((s) => {
      if (active) setStats(s);
    });
    return () => {
      active = false;
    };
  }, [reloadKey]);

  /** Fetch the next page from the last row's cursor and append it. */
  const loadMore = useCallback(() => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    getBookingHistory({ query, status: filter }, { cursor }).then((page) => {
      setItems((prev) => [...prev, ...page.items]);
      setCursor(page.nextCursor);
      setTotal(page.total);
      setLoadingMore(false);
    });
  }, [cursor, loadingMore, query, filter]);

  // Bucket the loaded rows (already newest-first) into month sections.
  const sections = useMemo<MonthSection[]>(() => {
    const map = new Map<string, MonthSection>();
    for (const b of items) {
      const d = new Date(b.startAt);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      let s = map.get(key);
      if (!s) {
        s = { key, month: d.getMonth(), year: d.getFullYear(), data: [] };
        map.set(key, s);
      }
      s.data.push(b);
    }
    return Array.from(map.values());
  }, [items]);

  const searching = query.trim().length > 0;

  const listHeader = (
    <View style={styles.header}>
      {/* Lifetime stats */}
      <View style={styles.stats}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats?.sessions ?? '—'}</Text>
          <Text style={styles.statLabel}>{t('history.statSessions')}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats ? `${stats.hours}h` : '—'}</Text>
          <Text style={styles.statLabel}>{t('history.statHours')}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
            {stats ? formatVnd(stats.spent) : '—'}
          </Text>
          <Text style={styles.statLabel}>{t('history.statSpent')}</Text>
        </View>
      </View>

      {/* Status filter chips — counts come from the service, scoped to the query */}
      <View style={styles.chips}>
        {FILTERS.map((f) => (
          <Pressable
            key={f}
            style={[styles.chip, filter === f && styles.chipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>
              {t(`history.filter.${f}`)}{' '}
              <Text style={[styles.chipCount, filter === f && styles.chipCountActive]}>
                {counts[f]}
              </Text>
            </Text>
          </Pressable>
        ))}
      </View>

      {searching && total > 0 && (
        <Text style={styles.resultCount}>{t('history.resultCount', { total })}</Text>
      )}
    </View>
  );

  const listFooter = () => {
    if (loading || items.length === 0) return null;
    if (cursor) {
      return (
        <View style={styles.footer}>
          <Pressable style={styles.moreBtn} onPress={loadMore} disabled={loadingMore}>
            {loadingMore ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : (
              <>
                <Text style={styles.moreBtnText}>{t('history.showMore')}</Text>
                <Ionicons name="chevron-down" size={16} color={colors.primary} />
              </>
            )}
          </Pressable>
          <Text style={styles.footerCount}>
            {t('history.showingCount', { shown: items.length, total })}
          </Text>
        </View>
      );
    }
    return (
      <Text style={styles.footerCount}>{t('history.endOfList', { total })}</Text>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader title={t('history.title')} />

      {/* Search stays pinned above the list — a long history is scrolled, and the
          box has to stay reachable. Filtering itself happens in the service. */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('history.searchPlaceholder')}
            placeholderTextColor={colors.textMuted}
            value={input}
            onChangeText={setInput}
            returnKeyType="search"
          />
          {input.length > 0 && (
            <Pressable hitSlop={8} onPress={() => setInput('')}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(b) => b.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        initialNumToRender={BOOKING_PAGE_SIZE}
        ListHeaderComponent={listHeader}
        ListFooterComponent={listFooter}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionTitle}>
            {t('history.monthGroup', {
              month: section.month + 1,
              monthName: EN_MONTHS[section.month],
              year: section.year,
            })}
          </Text>
        )}
        renderItem={({ item }) => (
          <BookingCard
            booking={item}
            onPress={() => navigation.navigate('BookingDetail', { bookingId: item.id })}
          />
        )}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : (
            <View style={styles.empty}>
              <EmptyState variant="bookings" />
              <Text style={styles.emptyText}>
                {searching
                  ? t('history.noResults', { query: query.trim() })
                  : filter === 'all'
                    ? t('history.empty')
                    : t('history.emptyFiltered')}
              </Text>
              {searching && (
                <Pressable style={styles.clearBtn} onPress={() => setInput('')}>
                  <Text style={styles.clearBtnText}>{t('history.clearSearch')}</Text>
                </Pressable>
              )}
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  loader: { marginTop: spacing.xl },
  content: { padding: spacing.lg, paddingTop: 0, gap: spacing.md },
  header: { gap: spacing.md },

  // Search bar (mirrors the station-list search)
  searchWrap: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  searchInput: { flex: 1, fontSize: fontSizes.body, color: colors.textStrong, padding: 0 },
  resultCount: { fontSize: fontSizes.caption, color: colors.textMuted },

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
  chipCount: { color: colors.textMuted, fontWeight: fontWeights.semibold },
  chipCountActive: { color: colors.textInverse },

  // Month sections
  sectionTitle: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
    color: colors.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: spacing.xs,
  },

  // Paging footer
  footer: { alignItems: 'center', gap: spacing.sm, paddingTop: spacing.sm },
  moreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: 44,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  moreBtnText: { fontSize: fontSizes.body, fontWeight: fontWeights.semibold, color: colors.primary },
  footerCount: { fontSize: fontSizes.caption, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.sm },

  empty: { alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingVertical: spacing.xxl },
  emptyText: { fontSize: fontSizes.body, color: colors.textMuted, textAlign: 'center' },
  clearBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  clearBtnText: { fontSize: fontSizes.body, fontWeight: fontWeights.semibold, color: colors.textBody },
});
