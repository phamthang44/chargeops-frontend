import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader, BottomSheet, EmptyState, StationThumb } from '@/components';
import type { RootStackParamList } from '@/navigation/types';
import { getNearbyStations, type StationFilter } from '@/services/stationService';
import { colors, fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';
import type { ConnectorType, Station } from '@/types';
import { formatRate } from '@/utils/format';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type SortKey = 'nearest' | 'cheapest' | 'rating' | 'available';

/** Connector types a driver can filter by (FR02). */
const CONNECTOR_TYPES: ConnectorType[] = ['CCS2', 'CHADEMO', 'TYPE2', 'GBT'];

const SORTS: { key: SortKey; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'nearest', icon: 'navigate-outline' },
  { key: 'cheapest', icon: 'pricetag-outline' },
  { key: 'rating', icon: 'star-outline' },
  { key: 'available', icon: 'flash-outline' },
];

/** One toggleable FR02 filter chip. */
function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

/** Rough city-driving ETA from distance (~3 min per km). */
function etaMinutes(distanceKm?: number): number {
  return Math.max(1, Math.round((distanceKm ?? 0) * 3));
}

/** One station row in the discovery list (kept module-level for FlatList perf). */
function StationCard({
  station,
  onOpen,
  onDirections,
}: {
  station: Station;
  onOpen: () => void;
  onDirections: () => void;
}) {
  const { t } = useTranslation();
  const full = station.availableConnectors === 0;
  const statusColor = full ? colors.error : colors.primary;
  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.cardPressed]} onPress={onOpen}>
      <View style={styles.cardTop}>
        <StationThumb size={64} />
        <View style={styles.cardBody}>
          <View style={styles.nameRow}>
            <Text style={styles.stationName} numberOfLines={1}>
              {station.name}
            </Text>
            {station.rating !== undefined && (
              <View style={styles.ratingPill}>
                <Ionicons name="star" size={12} color={colors.warning} />
                <Text style={styles.ratingText}>{station.rating.toFixed(1)}</Text>
              </View>
            )}
          </View>

          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={13} color={colors.textMuted} />
            <Text style={styles.address} numberOfLines={1}>
              {station.address}
            </Text>
          </View>

          <View style={styles.metaRow}>
            {station.hasFastCharging && (
              <View style={styles.fastBadge}>
                <Ionicons name="flash" size={11} color={colors.primaryDark} />
                <Text style={styles.fastBadgeText}>{t('stationList.fastCharge')}</Text>
              </View>
            )}
            {station.minRatePerKwh !== undefined && (
              <Text style={styles.price}>{formatRate(station.minRatePerKwh)}</Text>
            )}
            {station.distanceKm !== undefined && (
              <Text style={styles.meta}>
                · {station.distanceKm} km · {t('stationList.eta', { minutes: etaMinutes(station.distanceKm) })}
              </Text>
            )}
          </View>
        </View>
      </View>

      <View style={styles.cardFooter}>
        {/* Availability: neutral pill + a colored dot, so status reads without
            another block of green filling the card. */}
        <View style={styles.availPill}>
          <View style={[styles.availDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.availText, { color: full ? colors.error : colors.primaryDark }]}>
            {full
              ? t('stationList.full')
              : t('stationList.ports', {
                  available: station.availableConnectors,
                  total: station.totalConnectors,
                })}
          </Text>
        </View>
        <Pressable style={styles.directionsBtn} hitSlop={6} onPress={onDirections}>
          <Ionicons name="navigate" size={15} color={colors.primary} />
          <Text style={styles.directionsText}>{t('stationList.directions')}</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

/** Greyed-out placeholder card shown while the list loads. */
function SkeletonCard() {
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={[styles.thumb, styles.skel]} />
        <View style={styles.cardBody}>
          <View style={[styles.skel, styles.skelLine, { width: '70%' }]} />
          <View style={[styles.skel, styles.skelLine, { width: '90%' }]} />
          <View style={[styles.skel, styles.skelLine, { width: '50%' }]} />
          <View style={[styles.skel, styles.skelBadge]} />
        </View>
      </View>
    </View>
  );
}

/**
 * "Tìm trạm" tab — home / discovery list.
 * Floating Liquid Glass filter bar over the list, pull-to-refresh, skeleton
 * loading, sort & notifications sheets, and rich station cards.
 */
export function StationListScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState('');
  // FR02 filters. Independent toggles rather than one exclusive chip: a driver
  // looking for "a free CCS2 port right now" needs to combine them.
  const [availableOnly, setAvailableOnly] = useState(false);
  const [openOnly, setOpenOnly] = useState(false);
  const [currentType, setCurrentType] = useState<'AC' | 'DC' | null>(null);
  const [types, setTypes] = useState<ConnectorType[]>([]);
  const [sort, setSort] = useState<SortKey>('nearest');
  const [sortOpen, setSortOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  // Cursor pagination state. The service owns filtering + ordering, so the
  // cursor stays valid across pages; the client just accumulates what it fetches.
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  // Search + all filters + the sort travel to the data layer (they will be query
  // parameters on the real endpoint), so a page is fully resolved server-side.
  const filter: StationFilter = useMemo(
    () => ({
      query,
      connectorTypes: types.length ? types : undefined,
      currentType: currentType ?? undefined,
      availableOnly: availableOnly || undefined,
      openOnly: openOnly || undefined,
      sort,
    }),
    [query, types, currentType, availableOnly, openOnly, sort],
  );

  // Load / reload the FIRST page (on any filter change). Resets the cursor.
  const load = useCallback(async (criteria: StationFilter) => {
    try {
      const page = await getNearbyStations(criteria, {});
      setStations(page.items);
      setCursor(page.nextCursor);
      setHasMore(page.nextCursor !== null);
      setTotal(page.total);
      setError(false);
    } catch {
      setError(true);
    }
  }, []);

  // Only the first load shows skeletons; later refetches swap the results in
  // place so typing doesn't make the list flash.
  useEffect(() => {
    let active = true;
    load(filter).finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [load, filter]);

  // Fetch the NEXT page from the last cursor and append it.
  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await getNearbyStations(filter, { cursor });
      setStations((prev) => [...prev, ...page.items]);
      setCursor(page.nextCursor);
      setHasMore(page.nextCursor !== null);
      setTotal(page.total);
    } catch {
      // Keep what we have; the button stays for a retry.
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, filter, cursor]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load(filter).finally(() => setRefreshing(false));
  }, [load, filter]);

  const retry = useCallback(() => {
    setLoading(true);
    load(filter).finally(() => setLoading(false));
  }, [load, filter]);

  function toggleType(type: ConnectorType) {
    setTypes((prev) => (prev.includes(type) ? prev.filter((x) => x !== type) : [...prev, type]));
  }

  const hasActiveFilters = availableOnly || openOnly || currentType !== null || types.length > 0;
  function clearFilters() {
    setAvailableOnly(false);
    setOpenOnly(false);
    setCurrentType(null);
    setTypes([]);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top app bar — brand wordmark + driver role + notifications */}
      <AppHeader
        title="Charge"
        accent="Ops"
        trailing={
          <Pressable style={styles.iconBtn} hitSlop={8} onPress={() => setNotifOpen(true)}>
            <Ionicons name="notifications-outline" size={22} color={colors.textBody} />
          </Pressable>
        }
      />

      {/* Search bar */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('stationList.searchPlaceholder')}
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable hitSlop={8} onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Filter chips (a Clear pill leads the row once any filter is on) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
        style={styles.chipScroll}
      >
        {hasActiveFilters && (
          <Pressable style={styles.clearChip} onPress={clearFilters} hitSlop={4}>
            <Ionicons name="close" size={14} color={colors.textInverse} />
            <Text style={styles.clearChipText}>{t('stationList.clearFilters')}</Text>
          </Pressable>
        )}
        <FilterChip
          label={t('stationList.filters.available')}
          active={availableOnly}
          onPress={() => setAvailableOnly((v) => !v)}
        />
        <FilterChip
          label={t('stationList.filters.open')}
          active={openOnly}
          onPress={() => setOpenOnly((v) => !v)}
        />
        <FilterChip
          label={t('stationList.filters.dc')}
          active={currentType === 'DC'}
          onPress={() => setCurrentType((v) => (v === 'DC' ? null : 'DC'))}
        />
        <FilterChip
          label={t('stationList.filters.ac')}
          active={currentType === 'AC'}
          onPress={() => setCurrentType((v) => (v === 'AC' ? null : 'AC'))}
        />
        <View style={styles.chipDivider} />
        {CONNECTOR_TYPES.map((type) => (
          <FilterChip
            key={type}
            label={t(`stationList.connectorTypes.${type}`)}
            active={types.includes(type)}
            onPress={() => toggleType(type)}
          />
        ))}
      </ScrollView>

      {/* Virtualized so nationwide coverage (100s of stations) stays smooth */}
      <FlatList
        style={styles.list}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        data={loading || error ? [] : stations}
        keyExtractor={(s) => s.id}
        renderItem={({ item }) => (
          <StationCard
            station={item}
            onOpen={() => navigation.navigate('StationDetail', { stationId: item.id })}
            onDirections={() => navigation.navigate('Tabs', { screen: 'Map' })}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
        }
        ListHeaderComponent={
          error ? null : (
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleBlock}>
                <Text style={styles.sectionTitle}>{t('stationList.nearby')}</Text>
                {!loading && (
                  <Text style={styles.resultCount}>
                    {t('stationList.resultCount', { count: total })}
                  </Text>
                )}
              </View>
              {/* Sort is a visible, labelled control (was a silent icon) */}
              <Pressable style={styles.sortControl} hitSlop={6} onPress={() => setSortOpen(true)}>
                <Ionicons name="swap-vertical" size={15} color={colors.textBody} />
                <Text style={styles.sortControlText}>{t(`stationList.sort.${sort}`)}</Text>
                <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
              </Pressable>
            </View>
          )
        }
        ListEmptyComponent={
          error ? (
            <View style={styles.stateBox}>
              <Ionicons name="cloud-offline-outline" size={40} color={colors.textMuted} />
              <Text style={styles.stateText}>{t('stationList.error')}</Text>
              <Pressable style={styles.retryBtn} onPress={retry}>
                <Ionicons name="refresh" size={16} color={colors.textInverse} />
                <Text style={styles.retryText}>{t('stationList.retry')}</Text>
              </Pressable>
            </View>
          ) : loading ? (
            <View style={styles.skelWrap}>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </View>
          ) : (
            <View style={styles.stateBox}>
              <EmptyState variant="search" />
              <Text style={styles.stateText}>{t('stationList.empty')}</Text>
            </View>
          )
        }
        ListFooterComponent={
          !loading && !error && stations.length > 0 ? (
            <View style={styles.footerWrap}>
              {/* Cursor pagination: fetch the next page from the last position */}
              {hasMore && (
                <Pressable
                  style={styles.showMore}
                  disabled={loadingMore}
                  onPress={loadMore}
                >
                  {loadingMore ? (
                    <ActivityIndicator color={colors.primary} size="small" />
                  ) : (
                    <>
                      <Text style={styles.showMoreText}>{t('stationList.showMore')}</Text>
                      <Text style={styles.showMoreCount}>
                        {t('stationList.showingCount', { shown: stations.length, total })}
                      </Text>
                    </>
                  )}
                </Pressable>
              )}
              <View style={styles.promo}>
                <View style={styles.promoIcon}>
                  <Ionicons name="pricetag" size={20} color={colors.primaryDark} />
                </View>
                <View style={styles.promoBody}>
                  <Text style={styles.promoTitle}>{t('stationList.promoTitle')}</Text>
                  <Text style={styles.promoText}>{t('stationList.promoBody')}</Text>
                </View>
              </View>
            </View>
          ) : null
        }
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={11}
        removeClippedSubviews
      />

      {/* Sort sheet */}
      <BottomSheet visible={sortOpen} onClose={() => setSortOpen(false)} title={t('stationList.sortTitle')}>
        {SORTS.map(({ key, icon }) => {
          const active = sort === key;
          return (
            <Pressable
              key={key}
              style={[styles.sortRow, active && styles.sortRowActive]}
              onPress={() => {
                setSort(key);
                setSortOpen(false);
              }}
            >
              <View style={[styles.sortIcon, active && styles.sortIconActive]}>
                <Ionicons name={icon} size={18} color={active ? colors.primary : colors.textMuted} />
              </View>
              <Text style={[styles.sortLabel, active && styles.sortLabelActive]}>
                {t(`stationList.sort.${key}`)}
              </Text>
              {active && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
            </Pressable>
          );
        })}
      </BottomSheet>

      {/* Notifications panel — appears immediately (fade), not sliding up */}
      <BottomSheet
        visible={notifOpen}
        onClose={() => setNotifOpen(false)}
        title={t('stationList.notificationsTitle')}
        animation="fade"
      >
        <View style={styles.notifEmpty}>
          <EmptyState variant="notifications" />
          <Text style={styles.stateText}>{t('stationList.notificationsEmpty')}</Text>
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },

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

  chipScroll: { flexGrow: 0 },
  chipRow: { paddingHorizontal: spacing.lg, gap: spacing.sm, paddingBottom: spacing.md, alignItems: 'center' },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipDivider: { width: 1, alignSelf: 'stretch', marginVertical: spacing.xs, marginHorizontal: spacing.xs, backgroundColor: colors.border },
  chipText: { fontSize: fontSizes.body, fontWeight: fontWeights.medium, color: colors.textBody },
  chipTextActive: { color: colors.textInverse },
  // Clear-filters pill (dark, to read as an action rather than another toggle)
  clearChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.textStrong,
  },
  clearChipText: { fontSize: fontSizes.caption, fontWeight: fontWeights.semibold, color: colors.textInverse },

  list: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  sectionTitleBlock: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  sectionTitle: { fontSize: fontSizes.heading, fontWeight: fontWeights.bold, color: colors.textStrong },
  resultCount: { fontSize: fontSizes.caption, color: colors.textMuted },
  // Visible sort control (replaces the silent options icon)
  sortControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sortControlText: { fontSize: fontSizes.caption, fontWeight: fontWeights.semibold, color: colors.textBody },

  // Empty / error / notifications states
  stateBox: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxl },
  stateText: { fontSize: fontSizes.body, color: colors.textMuted, textAlign: 'center' },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  retryText: { fontSize: fontSizes.body, fontWeight: fontWeights.semibold, color: colors.textInverse },
  notifEmpty: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl },

  // Skeleton
  skelWrap: { gap: spacing.md },
  skel: { backgroundColor: colors.surfaceAlt, borderColor: colors.surfaceAlt },
  skelLine: { height: 12, borderRadius: radius.sm, marginBottom: spacing.sm },
  skelBadge: { height: 20, width: 110, borderRadius: radius.full, marginTop: spacing.xs },

  // Station card — one surface, soft ambient shadow (modern, flat-ish)
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
    shadowColor: colors.textStrong,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  cardPressed: { backgroundColor: colors.surfaceAlt },
  cardTop: { flexDirection: 'row', gap: spacing.md },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1, gap: spacing.xs },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stationName: { flex: 1, fontSize: fontSizes.heading, fontWeight: fontWeights.bold, color: colors.textStrong },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  ratingText: { fontSize: fontSizes.caption, fontWeight: fontWeights.semibold, color: colors.textStrong },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  address: { flex: 1, fontSize: fontSizes.body, color: colors.textMuted },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap', marginTop: 2 },
  // Fast-charge badge: neutral pill, emerald only in the bolt glyph
  fastBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  fastBadgeText: { fontSize: fontSizes.caption, fontWeight: fontWeights.semibold, color: colors.textBody },
  price: { fontSize: fontSizes.body, fontWeight: fontWeights.bold, color: colors.textStrong },
  meta: { fontSize: fontSizes.caption, color: colors.textMuted },

  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  availPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  availDot: { width: 7, height: 7, borderRadius: radius.full },
  availText: { fontSize: fontSizes.caption, fontWeight: fontWeights.semibold },
  directionsBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.sm },
  directionsText: { fontSize: fontSizes.body, fontWeight: fontWeights.semibold, color: colors.primary },

  footerWrap: { gap: spacing.md },
  // Cursor-pagination "show more" control
  showMore: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
  },
  showMoreText: { fontSize: fontSizes.body, fontWeight: fontWeights.semibold, color: colors.primary },
  showMoreCount: { fontSize: fontSizes.caption, color: colors.textMuted },

  promo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.xs,
  },
  promoIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoBody: { flex: 1, gap: spacing.xs },
  promoTitle: { fontSize: fontSizes.body, fontWeight: fontWeights.bold, color: colors.primaryDark },
  promoText: { fontSize: fontSizes.caption, color: colors.textBody, lineHeight: lineHeights.body },

  // Sort sheet rows
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  sortRowActive: { backgroundColor: colors.primarySoft },
  sortIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortIconActive: { backgroundColor: colors.surface },
  sortLabel: { flex: 1, fontSize: fontSizes.body, color: colors.textBody },
  sortLabelActive: { color: colors.textStrong, fontWeight: fontWeights.semibold },
});
