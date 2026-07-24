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

import {
  AppHeader,
  BottomSheet,
  EmptyState,
  NotificationSheet,
  StationThumb,
  useTabBarInset,
} from '@/components';
import { usePreferences } from '@/context/PreferencesContext';
import type { RootStackParamList } from '@/navigation/types';
import { getUnreadCount, type AppNotification } from '@/services/notificationService';
import { getNearbyStations, type StationFilter } from '@/services/stationService';
import { fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';
import type { ConnectorType, Station } from '@/types';
import { formatRate } from '@/utils/format';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type SortKey = 'nearest' | 'cheapest' | 'rating' | 'available';

const CONNECTOR_TYPES: ConnectorType[] = ['CCS2', 'CHADEMO', 'TYPE2', 'GBT'];

const SORTS: { key: SortKey; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'nearest', icon: 'navigate-outline' },
  { key: 'cheapest', icon: 'pricetag-outline' },
  { key: 'rating', icon: 'star-outline' },
  { key: 'available', icon: 'flash-outline' },
];

/** One toggleable FR02 filter chip. Dynamic theme aware. */
function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const { themeColors } = usePreferences();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? themeColors.primary : themeColors.surfaceAlt,
          borderColor: active ? themeColors.primary : themeColors.border,
        },
      ]}
    >
      <Text
        style={[
          styles.chipText,
          { color: active ? '#FFFFFF' : themeColors.textBody },
          active && styles.chipTextActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function etaMinutes(distanceKm?: number): number {
  return Math.max(1, Math.round((distanceKm ?? 0) * 3));
}

/** One station row in the discovery list. Dynamic theme aware. */
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
  const { themeColors } = usePreferences();
  const full = station.availableConnectors === 0;
  const statusColor = full ? themeColors.error : themeColors.primary;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: pressed ? themeColors.surfaceAlt : themeColors.surface,
          borderColor: themeColors.border,
          shadowColor: themeColors.textStrong,
        },
      ]}
      onPress={onOpen}
    >
      <View style={styles.cardTop}>
        <StationThumb size={64} />
        <View style={styles.cardBody}>
          <View style={styles.nameRow}>
            <Text style={[styles.stationName, { color: themeColors.textStrong }]} numberOfLines={1}>
              {station.name}
            </Text>
            {station.rating !== undefined && (
              <View style={[styles.ratingPill, { backgroundColor: themeColors.surfaceAlt }]}>
                <Ionicons name="star" size={12} color={themeColors.warning} />
                <Text style={[styles.ratingText, { color: themeColors.textStrong }]}>
                  {station.rating.toFixed(1)}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={13} color={themeColors.textMuted} />
            <Text style={[styles.address, { color: themeColors.textMuted }]} numberOfLines={1}>
              {station.address}
            </Text>
          </View>

          <View style={styles.metaRow}>
            {station.hasFastCharging && (
              <View style={[styles.fastBadge, { backgroundColor: themeColors.primarySoft }]}>
                <Ionicons name="flash" size={11} color={themeColors.primaryDark} />
                <Text style={[styles.fastBadgeText, { color: themeColors.primaryDark }]}>
                  {t('stationList.fastCharge')}
                </Text>
              </View>
            )}
            {station.minRatePerKwh !== undefined && (
              <Text style={[styles.price, { color: themeColors.textStrong }]}>
                {formatRate(station.minRatePerKwh)}
              </Text>
            )}
            {station.distanceKm !== undefined && (
              <Text style={[styles.meta, { color: themeColors.textMuted }]}>
                · {station.distanceKm} km · {t('stationList.eta', { minutes: etaMinutes(station.distanceKm) })}
              </Text>
            )}
          </View>
        </View>
      </View>

      <View style={[styles.cardFooter, { borderTopColor: themeColors.border }]}>
        <View style={[styles.availPill, { backgroundColor: themeColors.surfaceAlt }]}>
          <View style={[styles.availDot, { backgroundColor: statusColor }]} />
          <Text
            style={[
              styles.availText,
              { color: full ? themeColors.error : themeColors.primaryDark },
            ]}
          >
            {full
              ? t('stationList.full')
              : t('stationList.ports', {
                  available: station.availableConnectors,
                  total: station.totalConnectors,
                })}
          </Text>
        </View>
        <Pressable style={styles.directionsBtn} hitSlop={6} onPress={onDirections}>
          <Ionicons name="navigate" size={15} color={themeColors.primary} />
          <Text style={[styles.directionsText, { color: themeColors.primary }]}>
            {t('stationList.directions')}
          </Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

/** Greyed-out placeholder card shown while the list loads. Dynamic theme aware. */
function SkeletonCard() {
  const { themeColors } = usePreferences();
  return (
    <View style={[styles.card, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
      <View style={styles.cardTop}>
        <View style={[styles.thumb, { backgroundColor: themeColors.surfaceAlt }]} />
        <View style={styles.cardBody}>
          <View style={[styles.skelLine, { width: '70%', backgroundColor: themeColors.surfaceAlt }]} />
          <View style={[styles.skelLine, { width: '90%', backgroundColor: themeColors.surfaceAlt }]} />
          <View style={[styles.skelLine, { width: '50%', backgroundColor: themeColors.surfaceAlt }]} />
          <View style={[styles.skelBadge, { backgroundColor: themeColors.surfaceAlt }]} />
        </View>
      </View>
    </View>
  );
}

/**
 * "Tìm trạm" tab — home / discovery list. Dynamic theme aware.
 */
export function StationListScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const { themeColors } = usePreferences();
  // The floating tab bar is absolutely positioned, so the list has to pad for it.
  const tabInset = useTabBarInset();

  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [openOnly, setOpenOnly] = useState(false);
  const [currentType, setCurrentType] = useState<'AC' | 'DC' | null>(null);
  const [types, setTypes] = useState<ConnectorType[]>([]);
  const [sort, setSort] = useState<SortKey>('nearest');
  const [sortOpen, setSortOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Badge count on the bell. Refreshed on mount; the sheet reports its own
  // changes back through onUnreadChange so the two never drift apart.
  useEffect(() => {
    let active = true;
    getUnreadCount().then((n) => {
      if (active) setUnreadCount(n);
    });
    return () => {
      active = false;
    };
  }, []);

  /**
   * Open whatever a notification is about (FR-notify): the charging session or
   * the booking it references. Routing lives here, not in the sheet — the sheet
   * only knows `type` + `referenceId`.
   */
  const onNotificationNavigate = (n: AppNotification) => {
    if (!n.referenceId) return;
    if (n.type === 'charging') navigation.navigate('ChargingSession', { bookingId: n.referenceId });
    else if (n.type === 'booking') navigation.navigate('BookingDetail', { bookingId: n.referenceId });
    else if (n.type === 'wallet') navigation.navigate('Tabs', { screen: 'Profile' });
  };

  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

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

  useEffect(() => {
    let active = true;
    load(filter).finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [load, filter]);

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
      // Keep what we have
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
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top']}>
      {/* Top app bar — brand wordmark + driver role + notifications */}
      <AppHeader
        title="Charge"
        accent="Ops"
        trailing={
          <Pressable
            style={[styles.iconBtn, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}
            hitSlop={8}
            onPress={() => setNotifOpen(true)}
          >
            <Ionicons name="notifications-outline" size={22} color={themeColors.textBody} />
            {/* Unread badge — a count up to 9, then "9+" */}
            {unreadCount > 0 && (
              <View style={[styles.notifBadge, { backgroundColor: themeColors.error, borderColor: themeColors.surface }]}>
                <Text style={styles.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </Pressable>
        }
      />

      {/* Search bar */}
      <View style={styles.searchWrap}>
        <View style={[styles.searchBar, { backgroundColor: themeColors.surfaceAlt, borderColor: themeColors.border }]}>
          <Ionicons name="search" size={18} color={themeColors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: themeColors.textStrong }]}
            placeholder={t('stationList.searchPlaceholder')}
            placeholderTextColor={themeColors.textMuted}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable hitSlop={8} onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={themeColors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
        style={styles.chipScroll}
      >
        {hasActiveFilters && (
          <Pressable style={[styles.clearChip, { backgroundColor: themeColors.textStrong }]} onPress={clearFilters} hitSlop={4}>
            <Ionicons name="close" size={14} color={themeColors.textInverse} />
            <Text style={[styles.clearChipText, { color: themeColors.textInverse }]}>{t('stationList.clearFilters')}</Text>
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
        <View style={[styles.chipDivider, { backgroundColor: themeColors.border }]} />
        {CONNECTOR_TYPES.map((type) => (
          <FilterChip
            key={type}
            label={t(`stationList.connectorTypes.${type}`)}
            active={types.includes(type)}
            onPress={() => toggleType(type)}
          />
        ))}
      </ScrollView>

      {/* List */}
      <FlatList
        style={styles.list}
        contentContainerStyle={[styles.content, { paddingBottom: tabInset }]}
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
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={themeColors.primary}
            colors={[themeColors.primary]}
          />
        }
        ListHeaderComponent={
          error ? null : (
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleBlock}>
                <Text style={[styles.sectionTitle, { color: themeColors.textStrong }]}>{t('stationList.nearby')}</Text>
                {!loading && (
                  <Text style={[styles.resultCount, { color: themeColors.textMuted }]}>
                    {t('stationList.resultCount', { count: total })}
                  </Text>
                )}
              </View>
              <Pressable
                style={[styles.sortControl, { backgroundColor: themeColors.surfaceAlt, borderColor: themeColors.border }]}
                hitSlop={6}
                onPress={() => setSortOpen(true)}
              >
                <Ionicons name="swap-vertical" size={15} color={themeColors.textBody} />
                <Text style={[styles.sortControlText, { color: themeColors.textBody }]}>{t(`stationList.sort.${sort}`)}</Text>
                <Ionicons name="chevron-down" size={14} color={themeColors.textMuted} />
              </Pressable>
            </View>
          )
        }
        ListEmptyComponent={
          error ? (
            <View style={styles.stateBox}>
              <Ionicons name="cloud-offline-outline" size={40} color={themeColors.textMuted} />
              <Text style={[styles.stateText, { color: themeColors.textMuted }]}>{t('stationList.error')}</Text>
              <Pressable style={[styles.retryBtn, { backgroundColor: themeColors.primary }]} onPress={retry}>
                <Ionicons name="refresh" size={16} color={themeColors.textInverse} />
                <Text style={[styles.retryText, { color: themeColors.textInverse }]}>{t('stationList.retry')}</Text>
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
              <Text style={[styles.stateText, { color: themeColors.textMuted }]}>{t('stationList.empty')}</Text>
            </View>
          )
        }
        ListFooterComponent={
          !loading && !error && stations.length > 0 ? (
            <View style={styles.footerWrap}>
              {hasMore && (
                <Pressable
                  style={[styles.showMore, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}
                  disabled={loadingMore}
                  onPress={loadMore}
                >
                  {loadingMore ? (
                    <ActivityIndicator color={themeColors.primary} size="small" />
                  ) : (
                    <>
                      <Text style={[styles.showMoreText, { color: themeColors.primary }]}>{t('stationList.showMore')}</Text>
                      <Text style={[styles.showMoreCount, { color: themeColors.textMuted }]}>
                        {t('stationList.showingCount', { shown: stations.length, total })}
                      </Text>
                    </>
                  )}
                </Pressable>
              )}
              <View style={[styles.promo, { backgroundColor: themeColors.primarySoft }]}>
                <View style={[styles.promoIcon, { backgroundColor: themeColors.surface }]}>
                  <Ionicons name="pricetag" size={20} color={themeColors.primaryDark} />
                </View>
                <View style={styles.promoBody}>
                  <Text style={[styles.promoTitle, { color: themeColors.primaryDark }]}>{t('stationList.promoTitle')}</Text>
                  <Text style={[styles.promoText, { color: themeColors.textBody }]}>{t('stationList.promoBody')}</Text>
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
      <BottomSheet
        visible={sortOpen}
        onClose={() => setSortOpen(false)}
        title={t('stationList.sortTitle')}
      >
        {SORTS.map(({ key, icon }) => {
          const active = sort === key;
          return (
            <Pressable
              key={key}
              style={[styles.sortRow, active && { backgroundColor: themeColors.primarySoft }]}
              onPress={() => {
                setSort(key);
                setSortOpen(false);
              }}
            >
              <View style={[styles.sortIcon, { backgroundColor: active ? themeColors.surface : themeColors.surfaceAlt }]}>
                <Ionicons name={icon} size={18} color={active ? themeColors.primary : themeColors.textMuted} />
              </View>
              <Text
                style={[
                  styles.sortLabel,
                  { color: active ? themeColors.textStrong : themeColors.textBody },
                  active && styles.sortLabelActive,
                ]}
              >
                {t(`stationList.sort.${key}`)}
              </Text>
              {active && <Ionicons name="checkmark" size={18} color={themeColors.primary} />}
            </Pressable>
          );
        })}
      </BottomSheet>

      {/* Notifications sheet with mock notifications data */}
      <NotificationSheet
        visible={notifOpen}
        onClose={() => setNotifOpen(false)}
        onNavigate={onNotificationNavigate}
        onUnreadChange={setUnreadCount}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  // Unread badge on the bell — sits on the top-right corner, ringed in the
  // surface color so it reads as a separate chip against the icon button.
  notifBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: radius.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadgeText: { fontSize: 10, fontWeight: fontWeights.bold, color: '#FFFFFF' },

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

  chipScroll: { flexGrow: 0 },
  chipRow: { paddingHorizontal: spacing.lg, gap: spacing.sm, paddingBottom: spacing.md, alignItems: 'center' },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  chipActive: {},
  chipDivider: { width: 1, alignSelf: 'stretch', marginVertical: spacing.xs, marginHorizontal: spacing.xs },
  chipText: { fontSize: fontSizes.body, fontWeight: fontWeights.medium },
  chipTextActive: { fontWeight: fontWeights.semibold },
  clearChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  clearChipText: { fontSize: fontSizes.caption, fontWeight: fontWeights.semibold },

  list: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  sectionTitleBlock: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  sectionTitle: { fontSize: fontSizes.heading, fontWeight: fontWeights.bold },
  resultCount: { fontSize: fontSizes.caption },
  sortControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  sortControlText: { fontSize: fontSizes.caption, fontWeight: fontWeights.semibold },

  stateBox: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxl },
  stateText: { fontSize: fontSizes.body, textAlign: 'center' },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  retryText: { fontSize: fontSizes.body, fontWeight: fontWeights.semibold },
  notifEmpty: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl },

  skelWrap: { gap: spacing.md },
  skelLine: { height: 12, borderRadius: radius.sm, marginBottom: spacing.sm },
  skelBadge: { height: 20, width: 110, borderRadius: radius.full, marginTop: spacing.xs },

  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  cardTop: { flexDirection: 'row', gap: spacing.md },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1, gap: spacing.xs },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stationName: { flex: 1, fontSize: fontSizes.heading, fontWeight: fontWeights.bold },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  ratingText: { fontSize: fontSizes.caption, fontWeight: fontWeights.semibold },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  address: { flex: 1, fontSize: fontSizes.body },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap', marginTop: 2 },
  fastBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  fastBadgeText: { fontSize: fontSizes.caption, fontWeight: fontWeights.semibold },
  price: { fontSize: fontSizes.body, fontWeight: fontWeights.bold },
  meta: { fontSize: fontSizes.caption },

  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: spacing.md,
  },
  availPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  availDot: { width: 7, height: 7, borderRadius: radius.full },
  availText: { fontSize: fontSizes.caption, fontWeight: fontWeights.semibold },
  directionsBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.sm },
  directionsText: { fontSize: fontSizes.body, fontWeight: fontWeights.semibold },

  footerWrap: { gap: spacing.md },
  showMore: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingVertical: spacing.sm,
  },
  showMoreText: { fontSize: fontSizes.body, fontWeight: fontWeights.semibold },
  showMoreCount: { fontSize: fontSizes.caption },

  promo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.xs,
  },
  promoIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoBody: { flex: 1, gap: spacing.xs },
  promoTitle: { fontSize: fontSizes.body, fontWeight: fontWeights.bold },
  promoText: { fontSize: fontSizes.caption, lineHeight: lineHeights.body },

  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  sortIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortLabel: { flex: 1, fontSize: fontSizes.body },
  sortLabelActive: { fontWeight: fontWeights.semibold },
});
