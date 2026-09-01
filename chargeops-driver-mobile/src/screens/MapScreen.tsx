import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AppHeader,
  FloatingViewSwitch,
  MapStationPeekSheet,
  NotificationSheet,
  SettingsModal,
  StationCardV2,
  StationFilterCapsuleBar,
  StationFilterDrawer,
  StationSearchBar,
  useTabBarInset,
  type DiscoveryFilterState,
} from '@/components';
import { RealStationMap, type RealStationMapRef } from '@/components/map';
import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import { useDebounce } from '@/hooks/useDebounce';
import { useUserLocation } from '@/hooks/useUserLocation';
import type { RootStackParamList } from '@/navigation/types';
import { getUnreadCount, type AppNotification } from '@/services/notificationService';
import { getNearbyStations, type StationFilter } from '@/services/stationService';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';
import type { Station } from '@/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/**
 * "Bản đồ" tab — modernized map discovery view featuring real Leaflet & CartoDB tiles.
 */
export function MapScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const { themeColors, isDark } = usePreferences();
  const { getAccessToken } = useAuth();
  const { coords: userCoords } = useUserLocation();
  const tabInset = useTabBarInset();

  const [stations, setStations] = useState<Station[]>([]);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 350);

  const [selected, setSelected] = useState<number | null>(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const [filterState, setFilterState] = useState<DiscoveryFilterState>({
    connectorTypes: [],
    currentType: null,
    minPowerKw: undefined,
    availableOnly: false,
    openOnly: false,
    maxDistanceKm: undefined,
  });

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

  const discoveryFilter: StationFilter = useMemo(
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
    }),
    [debouncedQuery, filterState, userCoords],
  );

  useEffect(() => {
    let active = true;
    const token = getAccessToken();
    getNearbyStations(discoveryFilter, { page: 1, size: 40 }, { accessToken: token }).then((page) => {
      if (active) {
        setStations(page.items);
      }
    });
    return () => {
      active = false;
    };
  }, [discoveryFilter, getAccessToken]);

  const mapRef = useRef<RealStationMapRef>(null);

  const selectedStation =
    selected !== null && selected >= 0 && selected < stations.length
      ? stations[selected]
      : null;

  const recenter = () => {
    mapRef.current?.recenterToUser();
  };

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
      {/* Top Header */}
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

      {/* Modern Capsule Search Bar */}
      <StationSearchBar
        value={query}
        onChangeText={setQuery}
        placeholder={t('map.searchPlaceholder', 'Tìm trạm trên bản đồ...')}
      />

      {/* Quick Filter Capsule Bar */}
      <StationFilterCapsuleBar
        filters={filterState}
        onUpdateFilters={setFilterState}
        onOpenDrawer={() => setDrawerOpen(true)}
        onClearAll={handleClearFilters}
      />

      {/* Map Content View */}
      <View style={styles.mapWrap}>
        {/* Real Interactive Map Canvas */}
        <View style={styles.map}>
          <RealStationMap
            ref={mapRef}
            stations={stations}
            selectedStationId={selectedStation?.id}
            onSelectStation={(st) => {
              const idx = stations.findIndex((x) => x.id === st.id);
              if (idx !== -1) setSelected(idx);
            }}
            userCoords={userCoords}
            isDark={isDark}
          />
        </View>

        {/* Floating Controls: Recenter & List View Switcher */}
        <Pressable
          style={[
            styles.recenterBtn,
            {
              backgroundColor: isDark ? '#161B1A' : '#FFFFFF',
              borderColor: isDark ? '#2A312F' : themeColors.border,
            },
          ]}
          hitSlop={8}
          onPress={recenter}
        >
          <Ionicons name="locate" size={20} color={themeColors.primary} />
        </Pressable>

        {/* Floating View Switcher to List (only shown when no station is selected to avoid overlap) */}
        {!selectedStation && (
          <FloatingViewSwitch
            currentView="map"
            onToggle={() => navigation.navigate('Tabs', { screen: 'StationList' })}
            bottomOffset={tabInset + 16}
          />
        )}

        {/* Bottom Peek Sheet */}
        {selectedStation && (
          <MapStationPeekSheet
            station={selectedStation}
            onOpenDetail={(id) => navigation.navigate('StationDetail', { stationId: id })}
            onDirections={(st) => {
              mapRef.current?.navigateToStation(st);
            }}
            onQuickBook={(id) => navigation.navigate('StationDetail', { stationId: id })}
            onClose={() => setSelected(null)}
            bottomOffset={tabInset + 12}
          />
        )}
      </View>

      {/* Notifications sheet */}
      <NotificationSheet
        visible={notifOpen}
        onClose={() => setNotifOpen(false)}
        onNavigate={onNotificationNavigate}
        onUnreadChange={setUnreadCount}
      />

      {/* Settings modal */}
      <SettingsModal
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      {/* Filter Drawer */}
      <StationFilterDrawer
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        filters={filterState}
        onApply={(newFilters) => setFilterState(newFilters)}
        onReset={handleClearFilters}
        totalResults={stations.length}
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

  mapWrap: { flex: 1, position: 'relative' },
  map: { flex: 1, overflow: 'hidden' },

  recenterBtn: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.lg,
    width: 44,
    height: 44,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 25,
  },
});
