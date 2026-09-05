import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AppHeader, EmptyState, HeaderActionBtn, useTabBarInset } from '@/components';
import { HistoryBookingCard } from '@/components/HistoryBookingCard';
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
const EN_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

interface MonthSection {
  key: string;
  month: number;
  year: number;
  data: Booking[];
}

const EMPTY_COUNTS: Record<HistoryStatusFilter, number> = {
  all: 0,
  completed: 0,
  cancelled: 0,
};

/** Past bookings with lifetime stats, search, status filters and month grouping. */
export function BookingHistoryScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const { themeColors } = usePreferences();
  const tabInset = useTabBarInset();

  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [filter, setFilter] = useState<HistoryStatusFilter>('all');
  const [stats, setStats] = useState<BookingStats | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [items, setItems] = useState<Booking[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState<Record<HistoryStatusFilter, number>>(EMPTY_COUNTS);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setQuery(input.trim()), SEARCH_DEBOUNCE_MS);
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
  }, [query, filter, reloadKey]);

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
      // Keep the loaded history visible if a later page fails.
    } finally {
      setLoadingMore(false);
    }
  };

  const sections: MonthSection[] = useMemo(() => {
    const map = new Map<string, MonthSection>();
    for (const booking of items) {
      const date = new Date(booking.startAt);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      let section = map.get(key);
      if (!section) {
        section = {
          key,
          month: date.getMonth(),
          year: date.getFullYear(),
          data: [],
        };
        map.set(key, section);
      }
      section.data.push(booking);
    }
    return Array.from(map.values());
  }, [items]);

  const searching = query.length > 0;
  const hasActiveCriteria = input.trim().length > 0 || filter !== 'all';

  const clearSearch = () => {
    setInput('');
    setQuery('');
    Keyboard.dismiss();
  };

  const resetCriteria = () => {
    setInput('');
    setQuery('');
    setFilter('all');
    Keyboard.dismiss();
  };

  const listHeader = (
    <View style={styles.header}>
      <View
        style={[
          styles.summaryCard,
          {
            backgroundColor: themeColors.surface,
            borderColor: themeColors.border,
            shadowColor: themeColors.textStrong,
          },
        ]}
      >
        <View style={styles.summaryTop}>
          <View style={styles.summaryCopy}>
            <Text style={[styles.summaryEyebrow, { color: themeColors.textMuted }]}>
              {t('history.statSpent')}
            </Text>
            <Text
              style={[styles.summaryValue, { color: themeColors.textStrong }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {stats ? formatVnd(stats.spent) : '—'}
            </Text>
          </View>
          <View style={[styles.summaryIcon, { backgroundColor: themeColors.primarySoft }]}>
            <Ionicons name="wallet-outline" size={22} color={themeColors.primaryDark} />
          </View>
        </View>

        <View style={[styles.summaryDivider, { backgroundColor: themeColors.border }]} />

        <View style={styles.summaryMetrics}>
          <View style={styles.summaryMetric}>
            <Ionicons name="flash-outline" size={17} color={themeColors.primary} />
            <View>
              <Text style={[styles.metricValue, { color: themeColors.textStrong }]}>
                {stats?.sessions ?? '—'}
              </Text>
              <Text style={[styles.metricLabel, { color: themeColors.textMuted }]}>
                {t('history.statSessions')}
              </Text>
            </View>
          </View>
          <View style={[styles.metricDivider, { backgroundColor: themeColors.border }]} />
          <View style={styles.summaryMetric}>
            <Ionicons name="time-outline" size={17} color={themeColors.info} />
            <View>
              <Text style={[styles.metricValue, { color: themeColors.textStrong }]}>
                {stats ? `${stats.hours}h` : '—'}
              </Text>
              <Text style={[styles.metricLabel, { color: themeColors.textMuted }]}>
                {t('history.statHours')}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View
        style={[
          styles.searchBar,
          {
            backgroundColor: themeColors.surface,
            borderColor: searchFocused ? themeColors.primary : themeColors.border,
            shadowColor: themeColors.primary,
          },
          searchFocused && styles.searchBarFocused,
        ]}
      >
        <View
          style={[
            styles.searchIcon,
            { backgroundColor: searchFocused ? themeColors.primarySoft : themeColors.surfaceAlt },
          ]}
        >
          <Ionicons
            name="search"
            size={17}
            color={searchFocused ? themeColors.primaryDark : themeColors.textMuted}
          />
        </View>
        <TextInput
          style={[
            styles.searchInput,
            { color: themeColors.textStrong },
            Platform.OS === 'web' && styles.searchInputWeb,
          ]}
          placeholder={t('history.searchPlaceholder')}
          placeholderTextColor={themeColors.textMuted}
          value={input}
          onChangeText={setInput}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          onSubmitEditing={() => {
            setQuery(input.trim());
            Keyboard.dismiss();
          }}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          underlineColorAndroid="transparent"
        />
        {input.length > 0 && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('history.clearSearch')}
            hitSlop={8}
            onPress={clearSearch}
            style={({ pressed }) => [styles.clearIcon, pressed && styles.pressed]}
          >
            <Ionicons name="close" size={17} color={themeColors.textMuted} />
          </Pressable>
        )}
      </View>

      <View
        style={[
          styles.segmentedControl,
          { backgroundColor: themeColors.surfaceAlt, borderColor: themeColors.border },
        ]}
      >
        {FILTERS.map((item) => {
          const active = filter === item;
          return (
            <Pressable
              key={item}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => setFilter(item)}
              style={({ pressed }) => [
                styles.segment,
                active && {
                  backgroundColor: themeColors.primarySoft,
                  borderColor: themeColors.primary,
                },
                pressed && styles.pressed,
              ]}
            >
              <Text
                style={[
                  styles.segmentLabel,
                  { color: active ? themeColors.primaryDark : themeColors.textBody },
                  active && styles.segmentLabelActive,
                ]}
                numberOfLines={1}
              >
                {t(`history.filter.${item}`)}
              </Text>
              <View
                style={[
                  styles.segmentCount,
                  {
                    backgroundColor: active ? themeColors.primary : themeColors.surface,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.segmentCountText,
                    { color: active ? themeColors.textInverse : themeColors.textMuted },
                  ]}
                >
                  {counts[item]}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {hasActiveCriteria && !loading && (
        <View style={styles.criteriaRow}>
          <Text style={[styles.resultCount, { color: themeColors.textMuted }]}>
            {t('history.resultCount', { total })}
          </Text>
          <Pressable onPress={resetCriteria} hitSlop={8}>
            <Text style={[styles.resetText, { color: themeColors.primaryDark }]}>
              {t('history.resetFilters')}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );

  const listFooter = () => {
    if (loading || items.length === 0) return null;
    if (cursor) {
      return (
        <View style={styles.footer}>
          <Pressable
            style={({ pressed }) => [
              styles.moreBtn,
              { backgroundColor: themeColors.surface, borderColor: themeColors.border },
              pressed && styles.pressed,
            ]}
            onPress={loadMore}
            disabled={loadingMore}
          >
            {loadingMore ? (
              <ActivityIndicator color={themeColors.primary} size="small" />
            ) : (
              <>
                <Text style={[styles.moreBtnText, { color: themeColors.textStrong }]}>
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
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <AppHeader
        title={t('history.title')}
        icon="time-outline"
        slogan={[t('history.slogan1', 'Minh bạch chi phí'), t('history.slogan2', 'Tiết kiệm tối đa')]}
        trailing={
          <HeaderActionBtn
            icon="refresh-outline"
            onPress={() => setReloadKey((current) => current + 1)}
            accessibilityLabel={t('common.retry', 'Làm mới')}
          />
        }
      />

      <SectionList
        sections={sections}
        keyExtractor={(booking) => booking.id}
        contentContainerStyle={[styles.content, { paddingBottom: tabInset }]}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        initialNumToRender={BOOKING_PAGE_SIZE}
        ListHeaderComponent={listHeader}
        ListFooterComponent={listFooter}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <View style={styles.sectionLabelRow}>
              <Text style={[styles.sectionTitle, { color: themeColors.textStrong }]}>
                {t('history.monthGroup', {
                  month: section.month + 1,
                  monthName: EN_MONTHS[section.month],
                  year: section.year,
                })}
              </Text>
              <View style={[styles.sectionCount, { backgroundColor: themeColors.surfaceAlt }]}>
                <Text style={[styles.sectionCountText, { color: themeColors.textMuted }]}>
                  {t('history.sectionCount', { count: section.data.length })}
                </Text>
              </View>
            </View>
            <View style={[styles.sectionLine, { backgroundColor: themeColors.border }]} />
          </View>
        )}
        renderItem={({ item: booking }) => (
          <View style={styles.cardWrap}>
            <HistoryBookingCard
              booking={booking}
              onPress={() => navigation.navigate('BookingDetail', { bookingId: booking.id })}
            />
          </View>
        )}
        ListEmptyComponent={
          loading ? (
            <HistorySkeleton />
          ) : error ? (
            <View style={styles.empty}>
              <EmptyState variant="bookings" />
              <Text style={[styles.emptyText, { color: themeColors.textMuted }]}>
                {t('history.error')}
              </Text>
              <Pressable
                style={({ pressed }) => [
                  styles.retryBtn,
                  { backgroundColor: themeColors.primary },
                  pressed && styles.pressed,
                ]}
                onPress={() => setReloadKey((current) => current + 1)}
              >
                <Ionicons name="refresh" size={16} color={themeColors.textInverse} />
                <Text style={[styles.retryText, { color: themeColors.textInverse }]}>
                  {t('history.retry')}
                </Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.empty}>
              <EmptyState variant="bookings" />
              <Text style={[styles.emptyText, { color: themeColors.textMuted }]}>
                {searching ? t('history.noResults', { query }) : t('history.empty')}
              </Text>
              {hasActiveCriteria && (
                <Pressable
                  style={({ pressed }) => [
                    styles.retryBtn,
                    { backgroundColor: themeColors.surfaceAlt, borderColor: themeColors.border },
                    pressed && styles.pressed,
                  ]}
                  onPress={resetCriteria}
                >
                  <Text style={[styles.clearBtnText, { color: themeColors.textBody }]}>
                    {t('history.resetFilters')}
                  </Text>
                </Pressable>
              )}
            </View>
          )
        }
      />
    </View>
  );
}

function HistorySkeleton() {
  const { themeColors } = usePreferences();

  return (
    <View style={styles.skeletonList}>
      {Array.from({ length: 3 }, (_, index) => (
        <View
          key={index}
          style={[
            styles.skeletonCard,
            { backgroundColor: themeColors.surface, borderColor: themeColors.border },
          ]}
        >
          <View style={styles.skeletonTop}>
            <View style={[styles.skeletonSquare, { backgroundColor: themeColors.surfaceAlt }]} />
            <View style={styles.skeletonCopy}>
              <View style={[styles.skeletonLineWide, { backgroundColor: themeColors.surfaceAlt }]} />
              <View style={[styles.skeletonLineShort, { backgroundColor: themeColors.surfaceAlt }]} />
            </View>
          </View>
          <View style={[styles.skeletonPanel, { backgroundColor: themeColors.surfaceAlt }]} />
          <View style={[styles.skeletonLineWide, { backgroundColor: themeColors.surfaceAlt }]} />
          <View style={[styles.skeletonLineMedium, { backgroundColor: themeColors.surfaceAlt }]} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: { gap: spacing.md, paddingBottom: spacing.md },

  summaryCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },
  summaryTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryCopy: { flex: 1, minWidth: 0 },
  summaryEyebrow: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  summaryValue: { fontSize: fontSizes.display, fontWeight: fontWeights.bold, marginTop: 2 },
  summaryIcon: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.md,
  },
  summaryDivider: { height: 1, marginVertical: spacing.md },
  summaryMetrics: { flexDirection: 'row', alignItems: 'center' },
  summaryMetric: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  metricDivider: { width: 1, height: 32, marginHorizontal: spacing.md },
  metricValue: { fontSize: fontSizes.heading, fontWeight: fontWeights.bold },
  metricLabel: { fontSize: fontSizes.caption, marginTop: 1 },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    height: 52,
  },
  searchBarFocused: {
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 9,
    elevation: 2,
  },
  searchIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: { flex: 1, fontSize: fontSizes.body, padding: 0 },
  searchInputWeb: { outlineWidth: 0, outlineColor: 'transparent' },
  clearIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },

  segmentedControl: {
    flexDirection: 'row',
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.xs,
  },
  segment: {
    flex: 1,
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingHorizontal: spacing.xs,
  },
  segmentLabel: { fontSize: fontSizes.caption, fontWeight: fontWeights.medium },
  segmentLabelActive: { fontWeight: fontWeights.semibold },
  segmentCount: {
    minWidth: 23,
    height: 22,
    borderRadius: radius.full,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentCountText: { fontSize: 10, fontWeight: fontWeights.bold },
  criteriaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  resultCount: { fontSize: fontSizes.caption },
  resetText: { fontSize: fontSizes.caption, fontWeight: fontWeights.semibold },

  sectionHeader: { paddingTop: spacing.sm, paddingBottom: spacing.md },
  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sectionTitle: { fontSize: fontSizes.body, fontWeight: fontWeights.bold },
  sectionCount: { borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  sectionCountText: { fontSize: 10, fontWeight: fontWeights.semibold },
  sectionLine: { height: 1, marginTop: spacing.sm },
  cardWrap: { paddingBottom: spacing.md },

  footer: { alignItems: 'center', gap: spacing.sm, paddingTop: spacing.sm },
  moreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: 46,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  moreBtnText: { fontSize: fontSizes.body, fontWeight: fontWeights.semibold },
  footerCount: { fontSize: fontSizes.caption, textAlign: 'center', paddingVertical: spacing.md },

  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xxl,
  },
  emptyText: { fontSize: fontSizes.body, textAlign: 'center' },
  retryBtn: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  retryText: { fontSize: fontSizes.body, fontWeight: fontWeights.semibold },
  clearBtnText: { fontSize: fontSizes.body, fontWeight: fontWeights.semibold },
  pressed: { opacity: 0.78 },

  skeletonList: { gap: spacing.md, paddingTop: spacing.sm },
  skeletonCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  skeletonTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  skeletonSquare: { width: 36, height: 36, borderRadius: radius.md },
  skeletonCopy: { flex: 1, gap: spacing.xs },
  skeletonLineWide: { width: '72%', height: 12, borderRadius: radius.full },
  skeletonLineMedium: { width: '52%', height: 10, borderRadius: radius.full },
  skeletonLineShort: { width: '34%', height: 9, borderRadius: radius.full },
  skeletonPanel: { height: 58, borderRadius: radius.md },
});
