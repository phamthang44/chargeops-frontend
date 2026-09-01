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
  FloatingViewSwitch,
  NotificationSheet,
  SettingsModal,
  StationCardV2,
  StationFilterCapsuleBar,
  StationFilterDrawer,
  StationSearchBar,
  useTabBarInset,
  type DiscoveryFilterState,
} from '@/components';
import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import { useDebounce } from '@/hooks/useDebounce';
import { useUserLocation } from '@/hooks/useUserLocation';
import type { RootStackParamList } from '@/navigation/types';
import { getUnreadCount, type AppNotification } from '@/services/notificationService';
import { getNearbyStations, STATION_PAGE_SIZE, type StationFilter } from '@/services/stationService';
import { fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';
import type { ConnectorType, Station } from '@/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type SortKey = 'nearest' | 'cheapest' | 'available';

const SORTS: { key: SortKey; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'nearest', icon: 'navigate-outline' },
  { key: 'cheapest', icon: 'pricetag-outline' },
  { key: 'available', icon: 'flash-outline' },
];

/** Modernized skeleton placeholder card shown while the list loads. */
function SkeletonCard() {
  const { isDark } = usePreferences();
  return (
    <View
      style={[
        styles.skelCard,
        {
          backgroundColor: isDark ? '#161B1A' : '#FFFFFF',
          borderColor: isDark ? '#2A312F' : '#E5E7EB',
        },
      ]}
    >
      <View style={styles.skelTop}>
        <View style={[styles.skelThumb, { backgroundColor: isDark ? '#1F2625' : '#F3F4F6' }]} />
        <View style={styles.skelBody}>
          <View style={[styles.skelLine, { width: '40%', height: 16, backgroundColor: isDark ? '#1F2625' : '#F3F4F6' }]} />
          <View style={[styles.skelLine, { width: '80%', height: 14, backgroundColor: isDark ? '#1F2625' : '#F3F4F6' }]} />
          <View style={[styles.skelLine, { width: '60%', height: 12, backgroundColor: isDark ? '#1F2625' : '#F3F4F6' }]} />
        </View>
      </View>
      <View style={[styles.skelMiddle, { backgroundColor: isDark ? '#111514' : '#F9FAFB' }]} />
      <View style={styles.skelActions}>
        <View style={[styles.skelBtn, { backgroundColor: isDark ? '#1F2625' : '#F3F4F6' }]} />
        <View style={[styles.skelBtn, { backgroundColor: isDark ? '#1F2625' : '#F3F4F6' }]} />
      </View>
    </View>
  );
}

/**
 * "Tìm trạm" tab — home / discovery list with EV Superapp visual design.
 */
export function StationListScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const { themeColors, isDark } = usePreferences();
  const { getAccessToken } = useAuth();
  const { coords: userCoords, refreshLocation } = useUserLocation();
  const tabInset = useTabBarInset();

  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 350);

  const [filterState, setFilterState] = useState<DiscoveryFilterState>({
    connectorTypes: [],
    currentType: null,
    minPowerKw: undefined,
    availableOnly: false,
    openOnly: false,
    maxDistanceKm: undefined,
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sort, setSort] = useState<SortKey>('nearest');
  const [sortOpen, setSortOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [promoDismissed, setPromoDismissed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let active = true;
    getUnreadCount().then((n) => {
      if (active) setUnreadCount(n);
    });
    return () => {
      active = false;
    };
  }, []);

  const onNotificationNavigate = (n: AppNotification) => {
    if (!n.referenceId) return;
    if (n.type === 'charging') navigation.navigate('ChargingSession', { bookingId: n.referenceId });
    else if (n.type === 'booking') navigation.navigate('BookingDetail', { bookingId: n.referenceId });
    else if (n.type === 'wallet') navigation.navigate('Tabs', { screen: 'Profile' });
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  const filter: StationFilter = useMemo(
    () => ({
      query: debouncedQuery.trim() ? debouncedQuery.trim() : undefined,
      connectorTypes: filterState.connectorTypes.length ? filterState.connectorTypes : undefined,
      currentType: filterState.currentType ?? undefined,
      minPowerKw: filterState.minPowerKw,
      availableOnly: filterState.availableOnly || undefined,
      openOnly: filterState.openOnly || undefined,
      maxDistanceKm: filterState.maxDistanceKm,
      latitude: userCoords?.latitude,
      longitude: userCoords?.longitude,
      sort,
    }),
    [debouncedQuery, filterState, userCoords, sort],
  );

  const load = useCallback(async (criteria: StationFilter) => {
    try {
      const token = getAccessToken();
      const result = await getNearbyStations(
        criteria,
        { page: 1, size: STATION_PAGE_SIZE },
        { accessToken: token },
      );
      setStations(result.items);
      setCurrentPage(result.page);
      setHasMore(result.hasNextPage);
      setTotal(result.total);
      setError(false);
    } catch {
      setError(true);
    }
  }, [getAccessToken]);

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
      const token = getAccessToken();
      const result = await getNearbyStations(
        filter,
        {
          page: currentPage + 1,
          size: STATION_PAGE_SIZE,
        },
        { accessToken: token },
      );
      setStations((prev) => [...prev, ...result.items]);
      setCurrentPage(result.page);
      setHasMore(result.hasNextPage);
      setTotal(result.total);
    } catch {
      // Keep what we have
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, filter, currentPage, getAccessToken]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refreshLocation();
    load(filter).finally(() => setRefreshing(false));
  }, [load, filter, refreshLocation]);

  const retry = useCallback(() => {
    setLoading(true);
    load(filter).finally(() => setLoading(false));
  }, [load, filter]);

  const handleClearFilters = () => {
    setFilterState({
      connectorTypes: [],
      currentType: null,
      minPowerKw: undefined,
      availableOnly: false,
      openOnly: false,
      maxDistanceKm: undefined,
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top']}>
      {/* Top app bar — brand wordmark + driver role + settings & notifications */}
      <AppHeader
        title="Charge"
        accent="Ops"
        trailing={
          <View style={styles.headerActions}>
            <Pressable
              style={[
                styles.iconBtn,
                {
                  backgroundColor: isDark ? '#161B1A' : themeColors.surface,
                  borderColor: isDark ? '#2A312F' : themeColors.border,
                },
              ]}
              hitSlop={8}
              onPress={() => setSettingsOpen(true)}
              accessibilityLabel={t('settings.title')}
            >
              <Ionicons name="settings-outline" size={19} color={themeColors.textBody} />
            </Pressable>

            <Pressable
              style={[
                styles.iconBtn,
                {
                  backgroundColor: isDark ? '#161B1A' : themeColors.surface,
                  borderColor: isDark ? '#2A312F' : themeColors.border,
                },
              ]}
              hitSlop={8}
              onPress={() => setNotifOpen(true)}
              accessibilityLabel={t('stationList.notificationsTitle')}
            >
              <Ionicons name="notifications-outline" size={20} color={themeColors.textBody} />
              {unreadCount > 0 && (
                <View
                  style={[
                    styles.notifBadge,
                    { backgroundColor: themeColors.error, borderColor: themeColors.surface },
                  ]}
                >
                  <Text style={styles.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </Pressable>
          </View>
        }
      />

      {/* Modern Capsule Search bar */}
      <StationSearchBar
        value={query}
        onChangeText={setQuery}
        placeholder={t('stationList.searchPlaceholder', 'Tìm theo tên trạm hoặc địa chỉ...')}
      />

      {/* Quick Filter Capsule Bar */}
      <StationFilterCapsuleBar
        filters={filterState}
        onUpdateFilters={setFilterState}
        onOpenDrawer={() => setDrawerOpen(true)}
        onClearAll={handleClearFilters}
      />

      {/* Station List with StationCardV2 */}
      <FlatList
        style={styles.list}
        contentContainerStyle={[styles.content, { paddingBottom: tabInset + 40 }]}
        showsVerticalScrollIndicator={false}
        data={loading || error ? [] : stations}
        keyExtractor={(s) => s.id}
        renderItem={({ item }) => (
          <StationCardV2
            station={item}
            onOpen={() => navigation.navigate('StationDetail', { stationId: item.id })}
            onDirections={() => navigation.navigate('Tabs', { screen: 'Map' })}
            onQuickBook={() => navigation.navigate('StationDetail', { stationId: item.id })}
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
            <View style={styles.listHeaderWrap}>
              {!promoDismissed && (
                <View
                  style={[
                    styles.promo,
                    {
                      backgroundColor: isDark ? '#111A17' : themeColors.primarySoft,
                      borderColor: isDark ? '#1B382B' : '#A7F3D0',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.promoIcon,
                      { backgroundColor: isDark ? '#161B1A' : themeColors.surface },
                    ]}
                  >
                    <Ionicons name="pricetag" size={18} color={themeColors.primaryDark} />
                  </View>
                  <View style={styles.promoBody}>
                    <Text style={[styles.promoTitle, { color: isDark ? '#6EE6A0' : themeColors.primaryDark }]}>
                      {t('stationList.promoTitle')}
                    </Text>
                    <Text style={[styles.promoText, { color: themeColors.textBody }]}>
                      {t('stationList.promoBody')}
                    </Text>
                  </View>
                  <Pressable hitSlop={8} onPress={() => setPromoDismissed(true)}>
                    <Ionicons name="close" size={16} color={themeColors.textMuted} />
                  </Pressable>
                </View>
              )}

              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleBlock}>
                  <Text style={[styles.sectionTitle, { color: themeColors.textStrong }]}>
                    {t('stationList.nearby')}
                  </Text>
                  {!loading && (
                    <Text style={[styles.resultCount, { color: themeColors.textMuted }]}>
                      {t('stationList.resultCount', { count: total })}
                    </Text>
                  )}
                </View>
                <Pressable
                  style={[
                    styles.sortControl,
                    {
                      backgroundColor: isDark ? '#161B1A' : themeColors.surfaceAlt,
                      borderColor: isDark ? '#2A312F' : themeColors.border,
                    },
                  ]}
                  hitSlop={6}
                  onPress={() => setSortOpen(true)}
                >
                  <Ionicons name="swap-vertical" size={15} color={themeColors.textBody} />
                  <Text style={[styles.sortControlText, { color: themeColors.textBody }]}>
                    {t(`stationList.sort.${sort}`)}
                  </Text>
                  <Ionicons name="chevron-down" size={14} color={themeColors.textMuted} />
                </Pressable>
              </View>
            </View>
          )
        }
        ListEmptyComponent={
          error ? (
            <View style={styles.stateBox}>
              <Ionicons name="cloud-offline-outline" size={40} color={themeColors.textMuted} />
              <Text style={[styles.stateText, { color: themeColors.textMuted }]}>
                {t('stationList.error')}
              </Text>
              <Pressable
                style={[styles.retryBtn, { backgroundColor: themeColors.primary }]}
                onPress={retry}
              >
                <Ionicons name="refresh" size={16} color="#FFFFFF" />
                <Text style={[styles.retryText, { color: '#FFFFFF' }]}>
                  {t('stationList.retry')}
                </Text>
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
              <Text style={[styles.stateText, { color: themeColors.textMuted }]}>
                {t('stationList.empty')}
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          !loading && !error && stations.length > 0 && hasMore ? (
            <View style={styles.footerWrap}>
              <Pressable
                style={[
                  styles.showMore,
                  {
                    backgroundColor: isDark ? '#161B1A' : themeColors.surface,
                    borderColor: isDark ? '#2A312F' : themeColors.border,
                  },
                ]}
                disabled={loadingMore}
                onPress={loadMore}
              >
                {loadingMore ? (
                  <ActivityIndicator color={themeColors.primary} size="small" />
                ) : (
                  <>
                    <Text style={[styles.showMoreText, { color: themeColors.primary }]}>
                      {t('stationList.showMore')}
                    </Text>
                    <Text style={[styles.showMoreCount, { color: themeColors.textMuted }]}>
                      {t('stationList.showingCount', { shown: stations.length, total })}
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          ) : null
        }
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={11}
        removeClippedSubviews
      />

      {/* Floating Map/List View Switch */}
      <FloatingViewSwitch
        currentView="list"
        onToggle={() => navigation.navigate('Tabs', { screen: 'Map' })}
        bottomOffset={tabInset + 14}
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
              style={[
                styles.sortRow,
                active && {
                  backgroundColor: isDark ? '#113322' : themeColors.primarySoft,
                },
              ]}
              onPress={() => {
                setSort(key);
                setSortOpen(false);
              }}
            >
              <View
                style={[
                  styles.sortIcon,
                  {
                    backgroundColor: active
                      ? isDark
                        ? '#161B1A'
                        : themeColors.surface
                      : isDark
                        ? '#1F2625'
                        : themeColors.surfaceAlt,
                  },
                ]}
              >
                <Ionicons
                  name={icon}
                  size={18}
                  color={active ? themeColors.primary : themeColors.textMuted}
                />
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

      {/* Notifications sheet */}
      <NotificationSheet
        visible={notifOpen}
        onClose={() => setNotifOpen(false)}
        onNavigate={onNotificationNavigate}
        onUnreadChange={setUnreadCount}
      />

      {/* Settings modal (theme, language, demo simulation) */}
      <SettingsModal
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      {/* Discovery Advanced Filter Drawer */}
      <StationFilterDrawer
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        filters={filterState}
        onApply={(newFilters) => setFilterState(newFilters)}
        onReset={handleClearFilters}
        totalResults={total}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
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

  list: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, gap: spacing.md },
  listHeaderWrap: {
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  sectionTitleBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSizes.heading,
    fontWeight: fontWeights.bold,
    lineHeight: 24,
    includeFontPadding: false,
  },
  resultCount: {
    fontSize: fontSizes.caption,
    lineHeight: 16,
    includeFontPadding: false,
  },
  sortControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    height: 32,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  sortControlText: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
    lineHeight: 16,
    includeFontPadding: false,
  },

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

  // Skeleton
  skelWrap: { gap: spacing.md },
  skelCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md + 2,
    gap: spacing.md,
  },
  skelTop: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  skelThumb: { width: 72, height: 72, borderRadius: radius.md },
  skelBody: { flex: 1, gap: spacing.sm },
  skelLine: { borderRadius: radius.sm },
  skelMiddle: { height: 36, borderRadius: radius.md },
  skelActions: { flexDirection: 'row', gap: spacing.sm },
  skelBtn: { flex: 1, height: 38, borderRadius: radius.md },

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
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.xs,
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
