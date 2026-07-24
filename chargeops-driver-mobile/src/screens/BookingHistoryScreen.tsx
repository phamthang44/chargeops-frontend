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

import { AppHeader, BookingCard, EmptyState, useTabBarInset } from '@/components';
import { usePreferences } from '@/context/PreferencesContext';
import type { RootStackParamList } from '@/navigation/types';
import {
  BOOKING_PAGE_SIZE,
  getBookingHistory,
  getBookingStats,
  type BookingStats,
  type HistoryStatusFilter,
} from '@/services/bookingService';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';
import type { Booking } from '@/types';
import { formatVnd } from '@/utils/format';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const FILTERS: HistoryStatusFilter[] = ['all', 'completed', 'cancelled'];
const SEARCH_DEBOUNCE_MS = 300;
const EN_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

interface MonthSection {
  key: string;
  month: number;
  year: number;
  data: Booking[];
}

const EMPTY_COUNTS: Record<HistoryStatusFilter, number> = { all: 0, completed: 0, cancelled: 0 };

/**
 * "Lịch sử" tab — past bookings with lifetime stats, search, status filters and month grouping.
 * Dynamic theme aware.
 */
export function BookingHistoryScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const { themeColors } = usePreferences();
  // Clears the absolutely-positioned floating tab bar.
  const tabInset = useTabBarInset();

  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<HistoryStatusFilter>('all');
  const [stats, setStats] = useState<BookingStats | null>(null);

  const [items, setItems] = useState<Booking[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState<Record<HistoryStatusFilter, number>>(EMPTY_COUNTS);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setQuery(input), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [input]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getBookingStats().then((data) => {
        if (active) setStats(data);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);

    getBookingHistory({ query, status: filter }, { limit: BOOKING_PAGE_SIZE })
      .then((page) => {
        if (!active) return;
        setItems(page.items);
        setCursor(page.nextCursor);
        setTotal(page.total);
        setCounts(page.counts);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setError(true);
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [query, filter]);

  const loadMore = async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await getBookingHistory(
        { query, status: filter },
        { cursor, limit: BOOKING_PAGE_SIZE },
      );
      setItems((prev) => [...prev, ...page.items]);
      setCursor(page.nextCursor);
      setTotal(page.total);
      setCounts(page.counts);
    } catch {
      // keep existing items
    } finally {
      setLoadingMore(false);
    }
  };

  const sections: MonthSection[] = useMemo(() => {
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
      {/* Lifetime stats strip with dynamic surfaceAlt theme background */}
      <View style={styles.stats}>
        <View style={[styles.statCard, { backgroundColor: themeColors.surfaceAlt, borderColor: themeColors.border }]}>
          <Text style={[styles.statValue, { color: themeColors.textStrong }]}>{stats?.sessions ?? '—'}</Text>
          <Text style={[styles.statLabel, { color: themeColors.textMuted }]}>{t('history.statSessions')}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: themeColors.surfaceAlt, borderColor: themeColors.border }]}>
          <Text style={[styles.statValue, { color: themeColors.textStrong }]}>{stats ? `${stats.hours}h` : '—'}</Text>
          <Text style={[styles.statLabel, { color: themeColors.textMuted }]}>{t('history.statHours')}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: themeColors.surfaceAlt, borderColor: themeColors.border }]}>
          <Text style={[styles.statValue, { color: themeColors.primaryDark }]} numberOfLines={1} adjustsFontSizeToFit>
            {stats ? formatVnd(stats.spent) : '—'}
          </Text>
          <Text style={[styles.statLabel, { color: themeColors.textMuted }]}>{t('history.statSpent')}</Text>
        </View>
      </View>

      {/* Status filter chips */}
      <View style={styles.chips}>
        {FILTERS.map((f) => {
          const active = filter === f;
          return (
            <Pressable
              key={f}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? themeColors.primary : themeColors.surfaceAlt,
                  borderColor: active ? themeColors.primary : themeColors.border,
                },
              ]}
              onPress={() => setFilter(f)}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: active ? '#FFFFFF' : themeColors.textBody },
                  active && styles.chipTextActive,
                ]}
              >
                {t(`history.filter.${f}`)}{' '}
                <Text
                  style={[
                    styles.chipCount,
                    { color: active ? '#FFFFFF' : themeColors.textMuted },
                  ]}
                >
                  {counts[f]}
                </Text>
              </Text>
            </Pressable>
          );
        })}
      </View>

      {searching && total > 0 && (
        <Text style={[styles.resultCount, { color: themeColors.textMuted }]}>
          {t('history.resultCount', { total })}
        </Text>
      )}
    </View>
  );

  const listFooter = () => {
    if (loading || items.length === 0) return null;
    if (cursor) {
      return (
        <View style={styles.footer}>
          <Pressable
            style={[
              styles.moreBtn,
              { backgroundColor: themeColors.surface, borderColor: themeColors.primary },
            ]}
            onPress={loadMore}
            disabled={loadingMore}
          >
            {loadingMore ? (
              <ActivityIndicator color={themeColors.primary} size="small" />
            ) : (
              <>
                <Text style={[styles.moreBtnText, { color: themeColors.primary }]}>
                  {t('history.showMore')}
                </Text>
                <Ionicons name="chevron-down" size={16} color={themeColors.primary} />
              </>
            )}
          </Pressable>
          <Text style={[styles.footerCount, { color: themeColors.textMuted }]}>
            {t('history.showingCount', { shown: items.length, total })}
          </Text>
        </View>
      );
    }
    return (
      <Text style={[styles.footerCount, { color: themeColors.textMuted }]}>
        {t('history.endOfList', { total })}
      </Text>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top']}>
      <AppHeader title={t('history.title')} />

      {/* Search bar */}
      <View style={styles.searchWrap}>
        <View
          style={[
            styles.searchBar,
            { backgroundColor: themeColors.surfaceAlt, borderColor: themeColors.border },
          ]}
        >
          <Ionicons name="search" size={18} color={themeColors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: themeColors.textStrong }]}
            placeholder={t('history.searchPlaceholder')}
            placeholderTextColor={themeColors.textMuted}
            value={input}
            onChangeText={setInput}
            returnKeyType="search"
          />
          {input.length > 0 && (
            <Pressable hitSlop={8} onPress={() => setInput('')}>
              <Ionicons name="close-circle" size={18} color={themeColors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(b) => b.id}
        contentContainerStyle={[styles.content, { paddingBottom: tabInset }]}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        initialNumToRender={BOOKING_PAGE_SIZE}
        ListHeaderComponent={listHeader}
        ListFooterComponent={listFooter}
        renderSectionHeader={({ section }) => (
          <Text style={[styles.sectionTitle, { color: themeColors.textMuted }]}>
            {t('history.monthGroup', {
              month: section.month + 1,
              monthName: EN_MONTHS[section.month],
              year: section.year,
            })}
          </Text>
        )}
        renderItem={({ item: b }) => (
          <BookingCard
            booking={b}
            onPress={() => navigation.navigate('BookingDetail', { bookingId: b.id })}
          />
        )}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={themeColors.primary} style={styles.loader} />
          ) : error ? (
            <View style={styles.empty}>
              <EmptyState variant="bookings" />
              <Text style={[styles.emptyText, { color: themeColors.textMuted }]}>
                {t('history.error')}
              </Text>
            </View>
          ) : (
            <View style={styles.empty}>
              <EmptyState variant="bookings" />
              <Text style={[styles.emptyText, { color: themeColors.textMuted }]}>
                {searching ? t('history.noResults', { query }) : t('history.empty')}
              </Text>
              {searching && (
                <Pressable
                  style={[
                    styles.clearBtn,
                    { backgroundColor: themeColors.surfaceAlt, borderColor: themeColors.border },
                  ]}
                  onPress={() => setInput('')}
                >
                  <Text style={[styles.clearBtnText, { color: themeColors.textBody }]}>
                    {t('history.clearSearch')}
                  </Text>
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
  container: { flex: 1 },
  searchWrap: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  searchInput: { flex: 1, fontSize: fontSizes.body, padding: 0 },
  resultCount: { fontSize: fontSizes.caption, marginTop: spacing.xs },

  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  header: { gap: spacing.md, marginBottom: spacing.xs },

  stats: { flexDirection: 'row', gap: spacing.sm },
  statCard: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
  },
  statValue: { fontSize: fontSizes.heading, fontWeight: fontWeights.bold },
  statLabel: { fontSize: fontSizes.caption },

  chips: { flexDirection: 'row', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  chipText: { fontSize: fontSizes.body, fontWeight: fontWeights.medium },
  chipTextActive: { fontWeight: fontWeights.semibold },
  chipCount: { fontWeight: fontWeights.semibold },

  sectionTitle: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: spacing.xs,
  },

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
  },
  moreBtnText: { fontSize: fontSizes.body, fontWeight: fontWeights.semibold },
  footerCount: { fontSize: fontSizes.caption, textAlign: 'center', paddingVertical: spacing.sm },

  loader: { marginTop: spacing.xxl },
  empty: { alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingVertical: spacing.xxl },
  emptyText: { fontSize: fontSizes.body, textAlign: 'center' },
  clearBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  clearBtnText: { fontSize: fontSizes.body, fontWeight: fontWeights.semibold },
});
