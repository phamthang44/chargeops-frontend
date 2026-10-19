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

import {
  AppHeader,
  FloatingViewSwitch,
  HeaderActionBtn,
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
import { useNotifications } from '@/context/NotificationContext';
import type { AppNotification } from '@/services/notificationService';
import { getNearbyStations, type StationFilter } from '@/services/stationService';
import { executeQuickBook } from '@/utils/quickBook';
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
  const {
    coords: userCoords,
    loading: locationLoading,
    refreshLocation,
  } = useUserLocation();
  const [locationBannerDismissed, setLocationBannerDismissed] = useState(false);
  const tabInset = useTabBarInset();

  const [stations, setStations] = useState<Station[]>([]);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 350);

  const [selected, setSelected] = useState<number | null>(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { unreadCount } = useNotifications();

  const [filterState, setFilterState] = useState<DiscoveryFilterState>({
    connectorTypes: [],
    currentType: null,
    minPowerKw: undefined,
    availableOnly: false,
    openOnly: false,
    maxDistanceKm: undefined,
  });

  const onNotificationNavigate = (n: AppNotification) => {
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
    if (!userCoords) {
      refreshLocation();
      return;
    }
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
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Top Header */}
      <AppHeader
        title="Charge"
        accent="Ops"
        icon="flash"
        slogan={[t('stationList.slogan1', 'Sạc xanh hơn'), t('stationList.slogan2', 'Hành trình xa hơn')]}
        trailing={
          <>
            <HeaderActionBtn
              icon="settings-outline"
              onPress={() => setSettingsOpen(true)}
              accessibilityLabel={t('settings.title')}
            />
            <HeaderActionBtn
              icon="notifications-outline"
              badgeCount={unreadCount}
              onPress={() => setNotifOpen(true)}
              accessibilityLabel={t('stationList.notificationsTitle')}
            />
          </>
        }
      >
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
      </AppHeader>

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

        {/* Location Notice Banner when GPS is not enabled */}
        {!userCoords && !locationLoading && !locationBannerDismissed && (
          <View
            style={[
              styles.locationWarningCard,
              {
                backgroundColor: isDark ? 'rgba(20, 29, 26, 0.95)' : 'rgba(255, 255, 255, 0.96)',
                borderColor: isDark ? '#2D3F37' : '#FDE68A',
              },
            ]}
          >
            <View style={styles.locationWarningLeft}>
              <View style={styles.locationIconWrap}>
                <Ionicons name="location-outline" size={17} color="#F59E0B" />
              </View>
              <View style={styles.locationTextWrap}>
                <Text
                  style={[
                    styles.locationWarningTitle,
                    { color: isDark ? '#F8FAFC' : themeColors.textStrong },
                  ]}
                >
                  {t('map.locationRequiredTitle', 'Chưa bật định vị')}
                </Text>
                <Text
                  style={[
                    styles.locationWarningDesc,
                    { color: isDark ? '#94A3B8' : themeColors.textMuted },
                  ]}
                  numberOfLines={2}
                >
                  {t(
                    'map.locationRequiredDesc',
                    'Bật vị trí để thấy khoảng cách chính xác và tìm trạm sạc gần bạn nhất.',
                  )}
                </Text>
              </View>
            </View>

            <View style={styles.locationWarningActions}>
              <Pressable
                style={[
                  styles.locationEnableBtn,
                  { backgroundColor: themeColors.primary },
                ]}
                onPress={refreshLocation}
                hitSlop={4}
              >
                <Text style={styles.locationEnableBtnText}>
                  {t('map.enableLocation', 'Bật vị trí')}
                </Text>
              </Pressable>
              <Pressable
                style={styles.locationDismissBtn}
                onPress={() => setLocationBannerDismissed(true)}
                hitSlop={8}
              >
                <Ionicons name="close" size={18} color={themeColors.textMuted} />
              </Pressable>
            </View>
          </View>
        )}

        {/* Floating Controls: Recenter & List View Switcher */}
        <Pressable
          style={[
            styles.recenterBtn,
            {
              top: !userCoords && !locationLoading && !locationBannerDismissed ? 82 : spacing.md,
              backgroundColor: isDark ? '#161B1A' : '#FFFFFF',
              borderColor: isDark ? '#2A312F' : themeColors.border,
            },
          ]}
          hitSlop={8}
          onPress={recenter}
        >
          <Ionicons
            name={userCoords ? 'locate' : 'locate-outline'}
            size={20}
            color={userCoords ? themeColors.primary : themeColors.textMuted}
          />
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
            onOpenDetail={(id) => navigation.navigate('StationDetail', { stationId: id, distanceKm: selectedStation.distanceKm })}
            onDirections={(st) => {
              mapRef.current?.navigateToStation(st);
            }}
            onQuickBook={(id) => executeQuickBook(id, navigation)}
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
      />

      {/* Settings modal */}
      <SettingsModal
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onOpenTickets={() => navigation.navigate('MyTickets')}
        onOpenNotifications={() => setNotifOpen(true)}
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
    </View>
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
  locationWarningCard: {
    position: 'absolute',
    top: 10,
    left: 12,
    right: 12,
    zIndex: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  locationWarningLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginRight: 8,
  },
  locationIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationTextWrap: {
    flex: 1,
  },
  locationWarningTitle: {
    fontSize: 12.5,
    fontWeight: fontWeights.bold,
    marginBottom: 2,
  },
  locationWarningDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  locationWarningActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationEnableBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  locationEnableBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: fontWeights.bold,
  },
  locationDismissBtn: {
    padding: 4,
  },
});
