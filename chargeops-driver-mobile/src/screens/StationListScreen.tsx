import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ImageBackground,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  getAdministrativeProvinces,
  type AdministrativeProvince,
  FALLBACK_PROVINCES,
} from '@/services/locationService';

const ALL_REGIONS_ITEM: AdministrativeProvince = {
  code: 'all',
  name: 'Toàn quốc',
  fullName: 'Tất cả các tỉnh thành trên toàn quốc',
};

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
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { themeColors, isDark } = usePreferences();
  const { getAccessToken } = useAuth();
  const { coords: userCoords, refreshLocation } = useUserLocation();
  const tabInset = useTabBarInset();

  const [provinces, setProvinces] = useState<AdministrativeProvince[]>([
    ALL_REGIONS_ITEM,
    ...FALLBACK_PROVINCES,
  ]);
  const [selectedProvinceCode, setSelectedProvinceCode] = useState<string>('all');
  const [selectedRegionName, setSelectedRegionName] = useState<string>('Toàn quốc');
  const [regionModalOpen, setRegionModalOpen] = useState(false);
  const [regionSearch, setRegionSearch] = useState<string>('');

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

  // Parallel background fetching of provinces and unread notifications (non-blocking, zero-lag)
  useEffect(() => {
    let active = true;
    Promise.allSettled([
      getAdministrativeProvinces(),
      getUnreadCount(),
    ]).then(([provResult, notifResult]) => {
      if (!active) return;
      if (provResult.status === 'fulfilled' && provResult.value.length > 0) {
        setProvinces([ALL_REGIONS_ITEM, ...provResult.value]);
      }
      if (notifResult.status === 'fulfilled') {
        setUnreadCount(notifResult.value);
      }
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
      provinceCode: selectedProvinceCode === 'all' ? undefined : selectedProvinceCode,
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
    [debouncedQuery, selectedProvinceCode, filterState, userCoords, sort],
  );

  const filteredProvinces = useMemo(() => {
    if (!regionSearch.trim()) return provinces;
    const q = regionSearch.trim().toLowerCase();
    return provinces.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.fullName && p.fullName.toLowerCase().includes(q)),
    );
  }, [provinces, regionSearch]);

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
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Top Header with header-background.png */}
      <View
        style={[
          styles.headerBackground,
          {
            paddingTop: Math.max(insets.top, 12) + spacing.xs,
            backgroundColor: isDark ? '#0D1412' : '#EAF7F1',
          },
        ]}
      >
        {/* Right-anchored background illustration so EV car & charging post are 100% visible */}
        <Image
          source={require('../../assets/header-background.png')}
          style={styles.headerBgIllustration}
          resizeMode="contain"
        />
        {isDark && <View style={styles.darkOverlay} pointerEvents="none" />}

        {/* Row 1: Brand & Role (Left) + Slogan (Center) + Actions (Right) */}
        <View style={styles.headerTopRow}>
          <View style={styles.headerLeftCol}>
            <View style={styles.brandRow}>
              <View style={styles.brandIconSquircle}>
                <Ionicons name="flash" size={22} color="#FFFFFF" />
              </View>
              <View style={styles.brandTextCol}>
                <Text style={[styles.brandWordmark, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                  Charge<Text style={styles.brandWordmarkAccent}>Ops</Text>
                </Text>
                <Text style={[styles.brandRoleText, { color: isDark ? '#94A3B8' : '#64748B' }]}>{t('common.role', 'TÀI XẾ')}</Text>
              </View>
            </View>
          </View>

          {/* Slogan in Center matching design */}
          <View style={styles.sloganCol}>
            <Text style={[styles.sloganText, { color: isDark ? '#A7F3D0' : '#00875A' }]}>
              {t('stationList.slogan1', 'Sạc xanh hơn')}
            </Text>
            <Text style={[styles.sloganText, { color: isDark ? '#A7F3D0' : '#00875A' }]}>
              {t('stationList.slogan2', 'Hành trình xa hơn')}
            </Text>
            <View style={[styles.sloganLine, { backgroundColor: isDark ? '#34D399' : '#00B074' }]} />
          </View>

          {/* Trailing Actions: Settings & Notifications */}
          <View style={styles.headerActions}>
            <Pressable
              style={[
                styles.circleActionBtn,
                {
                  backgroundColor: isDark ? 'rgba(25, 36, 32, 0.92)' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(52, 211, 153, 0.25)' : 'rgba(226, 232, 240, 0.9)',
                },
              ]}
              hitSlop={8}
              onPress={() => setSettingsOpen(true)}
              accessibilityLabel={t('settings.title')}
            >
              <Ionicons name="settings-outline" size={20} color={isDark ? '#F1F5F9' : '#334155'} />
            </Pressable>

            <Pressable
              style={[
                styles.circleActionBtn,
                {
                  backgroundColor: isDark ? 'rgba(25, 36, 32, 0.92)' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(52, 211, 153, 0.25)' : 'rgba(226, 232, 240, 0.9)',
                },
              ]}
              hitSlop={8}
              onPress={() => setNotifOpen(true)}
              accessibilityLabel={t('stationList.notificationsTitle')}
            >
              <Ionicons name="notifications-outline" size={20} color={isDark ? '#F1F5F9' : '#334155'} />
              <View style={[styles.notifBadge, isDark && { borderColor: '#192420' }]}>
                <Text style={styles.notifBadgeText}>
                  {unreadCount > 0 ? (unreadCount > 9 ? '9+' : unreadCount) : '2'}
                </Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* Row 2: Prominent & Touch-friendly Location Selector Bar */}
        <Pressable
          style={[
            styles.prominentLocationBar,
            {
              backgroundColor: isDark ? 'rgba(22, 27, 26, 0.92)' : 'rgba(255, 255, 255, 0.95)',
              borderColor: isDark ? '#2A312F' : 'rgba(209, 250, 229, 0.95)',
            },
          ]}
          onPress={() => {
            setRegionSearch('');
            setRegionModalOpen(true);
          }}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={t('stationList.regionAccessibility', {
            region: selectedProvinceCode === 'all' ? t('stationList.allRegions', 'Toàn quốc') : selectedRegionName,
            defaultValue: `Khu vực trạm sạc: ${selectedRegionName}. Bấm để thay đổi khu vực.`,
          })}
        >
          <View style={styles.prominentLocationLeft}>
            <View
              style={[
                styles.locationBadgeIcon,
                { backgroundColor: isDark ? 'rgba(0, 176, 116, 0.16)' : '#E8F7F0' },
              ]}
            >
              <Ionicons name="location-sharp" size={17} color="#00B074" />
            </View>
            <View style={styles.prominentLocationTextCol}>
              <Text style={[styles.prominentLocationSub, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                {t('stationList.regionSubtitle', 'KHU VỰC TRẠM SẠC')}
              </Text>
              <Text
                style={[styles.prominentLocationTitle, { color: isDark ? '#F1F5F9' : '#0F172A' }]}
                numberOfLines={1}
              >
                {selectedProvinceCode === 'all' ? t('stationList.allRegions', 'Toàn quốc') : selectedRegionName}
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.changeRegionPill,
              { backgroundColor: isDark ? '#1F2625' : '#F1F5F9' },
            ]}
          >
            <Text style={[styles.changeRegionText, { color: isDark ? '#6EE7B7' : '#059669' }]}>
              {t('stationList.changeRegion', 'Đổi khu vực')}
            </Text>
            <Ionicons name="chevron-down" size={14} color={isDark ? '#6EE7B7' : '#059669'} />
          </View>
        </Pressable>

        {/* Search Bar Capsule with Filter Button on Right */}
        <StationSearchBar
          value={query}
          onChangeText={setQuery}
          placeholder={t('stationList.searchPlaceholder', 'Tìm trạm sạc, địa chỉ…')}
          onPressFilter={() => setDrawerOpen(true)}
        />

        {/* Quick Filter Capsule Bar */}
        <StationFilterCapsuleBar
          filters={filterState}
          onUpdateFilters={setFilterState}
          onOpenDrawer={() => setDrawerOpen(true)}
          onClearAll={handleClearFilters}
        />
      </View>

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
            onOpen={() => navigation.navigate('StationDetail', { stationId: item.id, distanceKm: item.distanceKm })}
            onDirections={() => navigation.navigate('Tabs', { screen: 'Map' })}
            onQuickBook={() => navigation.navigate('StationDetail', { stationId: item.id, distanceKm: item.distanceKm })}
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
                      backgroundColor: isDark ? 'rgba(16, 201, 138, 0.08)' : themeColors.primarySoft,
                      borderColor: isDark ? 'rgba(52, 211, 153, 0.28)' : '#A7F3D0',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.promoIcon,
                      { backgroundColor: isDark ? 'rgba(16, 201, 138, 0.16)' : themeColors.surface },
                    ]}
                  >
                    <Ionicons name="pricetag" size={18} color={isDark ? '#34D399' : themeColors.primaryDark} />
                  </View>
                  <View style={styles.promoBody}>
                    <Text style={[styles.promoTitle, { color: isDark ? '#6EE6A0' : themeColors.primaryDark }]}>
                      {t('stationList.promoTitle')}
                    </Text>
                    <Text style={[styles.promoText, { color: isDark ? '#CBD5E1' : themeColors.textBody }]}>
                      {t('stationList.promoBody')}
                    </Text>
                  </View>
                  <Pressable hitSlop={8} onPress={() => setPromoDismissed(true)}>
                    <Ionicons name="close" size={16} color={isDark ? '#94A3B8' : themeColors.textMuted} />
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

      {/* Region Selector Bottom Sheet */}
      <BottomSheet
        visible={regionModalOpen}
        onClose={() => setRegionModalOpen(false)}
        title={t('stationList.selectRegionTitle', 'Chọn khu vực trạm sạc')}
      >
        {/* Quick Search within Provinces */}
        <View
          style={[
            styles.modalSearchBox,
            {
              backgroundColor: isDark ? '#1F2625' : '#F8FAFC',
              borderColor: isDark ? '#2A312F' : '#E2E8F0',
            },
          ]}
        >
          <Ionicons name="search" size={16} color="#64748B" />
          <TextInput
            style={[styles.modalSearchInput, { color: isDark ? '#FFFFFF' : '#0F172A' }]}
            placeholder={t('stationList.searchRegionPlaceholder', 'Tìm tỉnh, thành phố...')}
            placeholderTextColor="#94A3B8"
            value={regionSearch}
            onChangeText={setRegionSearch}
            autoCorrect={false}
          />
          {regionSearch.length > 0 && (
            <Pressable hitSlop={6} onPress={() => setRegionSearch('')}>
              <Ionicons name="close-circle" size={16} color="#94A3B8" />
            </Pressable>
          )}
        </View>

        <ScrollView style={styles.regionListScroll} showsVerticalScrollIndicator={false}>
          {filteredProvinces.map((r) => {
            const selected = selectedProvinceCode === r.code;
            const displayName = r.code === 'all' ? t('stationList.allRegions', 'Toàn quốc') : r.name;
            const displayDesc = r.code === 'all' ? t('stationList.allRegionsDesc', 'Tất cả các tỉnh thành trên toàn quốc') : (r.fullName || r.name);
            return (
              <Pressable
                key={r.code}
                style={[
                  styles.regionItem,
                  { borderBottomColor: isDark ? '#2A312F' : '#F1F5F9' },
                  selected && { backgroundColor: isDark ? '#113322' : '#F0FDF4' },
                ]}
                onPress={() => {
                  setSelectedProvinceCode(r.code);
                  setSelectedRegionName(r.name);
                  setRegionModalOpen(false);
                  setRegionSearch('');
                }}
              >
                <View style={styles.regionInfo}>
                  <Text
                    style={[
                      styles.regionName,
                      { color: selected ? '#00B074' : (isDark ? '#F1F5F9' : '#0F172A') },
                    ]}
                  >
                    {displayName}
                  </Text>
                  <Text style={[styles.regionDesc, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                    {displayDesc}
                  </Text>
                </View>
                {selected && (
                  <Ionicons name="checkmark-circle" size={20} color="#00B074" />
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBackground: {
    position: 'relative',
    overflow: 'hidden',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingBottom: 6,
    marginBottom: 4,
  },
  headerBgIllustration: {
    position: 'absolute',
    right: -10,
    top: 0,
    bottom: 0,
    width: 580,
    height: '100%',
  },
  sloganCol: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
    paddingHorizontal: 4,
  },
  sloganText: {
    fontSize: 10.5,
    fontWeight: '700',
    lineHeight: 14,
  },
  sloganLine: {
    width: 24,
    height: 2,
    backgroundColor: '#00B074',
    borderRadius: 1,
    marginTop: 2,
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 20, 16, 0.65)',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  headerLeftCol: {
    gap: 8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandIconSquircle: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: '#00B074',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00B074',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  brandTextCol: {
    justifyContent: 'center',
  },
  brandWordmark: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: '#0F172A',
  },
  brandWordmarkAccent: {
    color: '#00B074',
  },
  brandRoleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 1,
  },
  prominentLocationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 48,
    borderRadius: radius.md + 4,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  prominentLocationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  locationBadgeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prominentLocationTextCol: {
    flex: 1,
    justifyContent: 'center',
  },
  prominentLocationSub: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  prominentLocationTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginTop: 1,
  },
  changeRegionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  changeRegionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 42,
    marginBottom: spacing.md,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: fontSizes.body,
    paddingVertical: 0,
  },
  regionListScroll: {
    maxHeight: 380,
  },
  regionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderRadius: radius.md,
  },
  regionInfo: {
    flex: 1,
    marginRight: 10,
  },
  regionName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  regionDesc: {
    fontSize: 12,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 2,
  },
  circleActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.08,
    shadowRadius: 3.5,
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: radius.full,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
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
