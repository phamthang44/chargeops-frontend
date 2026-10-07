import { useCallback, useEffect, useMemo, useState } from 'react';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { Ionicons } from '@expo/vector-icons';

import type { DiscoveryFilterState } from '@/components';
import { useAuth } from '@/context/AuthContext';
import { useDebounce } from '@/hooks/useDebounce';
import { useUserLocation } from '@/hooks/useUserLocation';
import type { RootStackParamList } from '@/navigation/types';
import {
  getAdministrativeProvinces,
  type AdministrativeProvince,
  FALLBACK_PROVINCES,
} from '@/services/locationService';
import { getUnreadCount, type AppNotification } from '@/services/notificationService';
import { getNearbyStations, STATION_PAGE_SIZE, type StationFilter } from '@/services/stationService';
import type { Station } from '@/types';
import { executeQuickBook } from '@/utils/quickBook';

export type SortKey = 'nearest' | 'cheapest' | 'available';

export const SORTS: { key: SortKey; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'nearest', icon: 'navigate-outline' },
  { key: 'cheapest', icon: 'pricetag-outline' },
  { key: 'available', icon: 'flash-outline' },
];

export const ALL_REGIONS_ITEM: AdministrativeProvince = {
  code: 'all',
  name: 'Toàn quốc',
  fullName: 'Tất cả các tỉnh thành trên toàn quốc',
};

const INITIAL_FILTER_STATE: DiscoveryFilterState = {
  connectorTypes: [],
  currentType: null,
  minPowerKw: undefined,
  availableOnly: false,
  openOnly: false,
  maxDistanceKm: undefined,
};

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function useStationList() {
  const { getAccessToken } = useAuth();
  const { coords: userCoords, refreshLocation } = useUserLocation();

  // Region / Provinces
  const [provinces, setProvinces] = useState<AdministrativeProvince[]>([
    ALL_REGIONS_ITEM,
    ...FALLBACK_PROVINCES,
  ]);
  const [selectedProvinceCode, setSelectedProvinceCode] = useState<string>('all');
  const [selectedRegionName, setSelectedRegionName] = useState<string>('Toàn quốc');
  const [regionModalOpen, setRegionModalOpen] = useState(false);
  const [regionSearch, setRegionSearch] = useState<string>('');

  // Search & Filters
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 350);
  const [filterState, setFilterState] = useState<DiscoveryFilterState>(INITIAL_FILTER_STATE);

  // Sorting
  const [sort, setSort] = useState<SortKey>('nearest');
  const [sortOpen, setSortOpen] = useState(false);

  // Modals & Sheets
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [promoDismissed, setPromoDismissed] = useState(false);

  // Notifications & Quick booking
  const [unreadCount, setUnreadCount] = useState(0);
  const [quickBookingId, setQuickBookingId] = useState<string | null>(null);

  // Stations state
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  // Parallel background fetching of provinces and unread notifications
  useEffect(() => {
    let active = true;
    Promise.allSettled([
      getAdministrativeProvinces({ accessToken: getAccessToken() }),
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
  }, [getAccessToken]);

  // Filter criteria computation
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

  const load = useCallback(
    async (criteria: StationFilter) => {
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
    },
    [getAccessToken],
  );

  // Trigger load when filter changes
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

  const handleClearFilters = useCallback(() => {
    setFilterState(INITIAL_FILTER_STATE);
  }, []);

  const handleSelectProvince = useCallback((province: AdministrativeProvince) => {
    setSelectedProvinceCode(province.code);
    setSelectedRegionName(province.name);
    setRegionModalOpen(false);
    setRegionSearch('');
  }, []);

  const handleQuickBook = useCallback(
    (stationId: string, navigation: Nav) => {
      executeQuickBook(stationId, navigation, (isLoading) => {
        setQuickBookingId(isLoading ? stationId : null);
      });
    },
    [],
  );

  const onNotificationNavigate = useCallback(
    (n: AppNotification, navigation: Nav) => {
      if (!n.referenceId && !n.target) return;
      // Prefer typed target from backend (#57)
      const targetType = n.target?.type;
      if (targetType === 'OPEN_BOOKING' || n.type === 'charging' || n.type === 'booking') {
        const bookingId = n.target?.bookingId ?? n.referenceId;
        if (bookingId) {
          if (n.type === 'charging') navigation.navigate('ChargingSession', { bookingId });
          else navigation.navigate('BookingDetail', { bookingId });
        }
      } else if (targetType === 'OPEN_TICKET' || targetType === 'OPEN_CASE' || n.type === 'ticket') {
        const ticketId = n.target?.ticketId ?? n.referenceId;
        if (ticketId) navigation.navigate('TicketDetail', { ticketId });
        else navigation.navigate('MyTickets');
      } else if (targetType === 'OPEN_REFUND' || n.type === 'finance') {
        const bookingId = n.target?.bookingId ?? n.referenceId;
        if (bookingId) navigation.navigate('BookingDetail', { bookingId });
        else navigation.navigate('Tabs', { screen: 'BookingHistory' });
      } else if (n.type === 'wallet') {
        navigation.navigate('Tabs', { screen: 'Profile' });
      }
    },
    [],
  );

  return {
    // Provinces / Location selector
    provinces,
    selectedProvinceCode,
    selectedRegionName,
    regionModalOpen,
    setRegionModalOpen,
    regionSearch,
    setRegionSearch,
    filteredProvinces,
    handleSelectProvince,

    // Search query & filters
    query,
    setQuery,
    filterState,
    setFilterState,
    handleClearFilters,
    drawerOpen,
    setDrawerOpen,

    // Sort
    sort,
    setSort,
    sortOpen,
    setSortOpen,

    // Sheet states
    notifOpen,
    setNotifOpen,
    settingsOpen,
    setSettingsOpen,
    promoDismissed,
    setPromoDismissed,

    // Notifications & quick booking
    unreadCount,
    setUnreadCount,
    quickBookingId,
    handleQuickBook,
    onNotificationNavigate,

    // Stations list data
    stations,
    loading,
    refreshing,
    error,
    total,
    hasMore,
    loadingMore,
    loadMore,
    onRefresh,
    retry,
  };
}
