import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Dimensions,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  CallConfirmationModal,
  ChargePointGroupList,
  StationAmenitiesList,
  StationBentoMetrics,
  StationBookingBottomBar,
  StationHeaderInfo,
  StationHeroGallery,
  StationNoticeBanner,
  StationPolicyCard,
  StationReviewsSection,
  type GroupedPoint,
} from '@/components/station-detail';
import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import { useStationHardwareSocket } from '@/hooks/useStationHardwareSocket';
import type { RootStackParamList } from '@/navigation/types';
import { getReviewsByStation, getStationDetail } from '@/services/stationService';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';
import type { ChargePoint, Connector, Review, Station } from '@/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'StationDetail'>;
type Route = RouteProp<RootStackParamList, 'StationDetail'>;

const { width } = Dimensions.get('window');

/**
 * "Chi tiết trạm sạc" screen — refactored for clean code & modular architecture.
 * Theme-aware (light/dark) with real-time operational state & availability integration.
 */
export function StationDetailScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { isFavorite, toggleFavorite, themeColors, isDark } = usePreferences();
  const { getAccessToken } = useAuth();

  const [station, setStation] = useState<Station | null>(null);
  const [chargePoints, setChargePoints] = useState<ChargePoint[]>([]);
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const hasLoadedRef = useRef(false);
  const [slide, setSlide] = useState(0);

  const [selectedConnectorId, setSelectedConnectorId] = useState<string | null>(null);
  const [callConfirmVisible, setCallConfirmVisible] = useState(false);

  // Generation guard: bumped whenever the screen blurs/unmounts so a response
  // started under a previous focus can never overwrite the current view.
  const requestSeqRef = useRef(0);

  const fetchAndApply = useCallback(async () => {
    const seq = ++requestSeqRef.current;
    const token = getAccessToken();

    try {
      const [detail, revs] = await Promise.all([
        getStationDetail(params.stationId, { accessToken: token }),
        getReviewsByStation(params.stationId),
      ]);
      if (seq !== requestSeqRef.current) return;
      if (detail) {
        hasLoadedRef.current = true;
        setStation(detail.station);
        setChargePoints(detail.chargePoints);
        setConnectors(detail.connectors);
        setReviews(revs);

        setSelectedConnectorId((prevSelectedId) => {
          if (
            prevSelectedId &&
            detail.connectors.some((c) => c.id === prevSelectedId && c.runtimeStatus === 'AVAILABLE')
          ) {
            return prevSelectedId;
          }
          const firstAvail = detail.connectors.find((c) => c.runtimeStatus === 'AVAILABLE');
          return firstAvail ? firstAvail.id : null;
        });
      } else if (!hasLoadedRef.current) {
        setStation(null);
      }
    } catch {
      if (seq !== requestSeqRef.current) return;
      // Initial failure shows the error screen; later failures keep the data
      // already on screen (socket/poll refetches must not blank the view).
      if (!hasLoadedRef.current) {
        setStation(null);
      }
    }
  }, [params.stationId, getAccessToken]);

  const { requestManualRefetch } = useStationHardwareSocket(params.stationId, fetchAndApply);

  const loadData = useCallback(
    async (mode: 'initial' | 'revalidate' | 'manual') => {
      if (mode === 'manual') {
        setRefreshing(true);
      } else if (mode === 'initial' && !hasLoadedRef.current) {
        setLoading(true);
      }
      try {
        // All triggers (focus, pull-to-refresh, socket hint, poll) share one
        // throttled pipeline; this resolves once a fresh refetch has completed.
        await requestManualRefetch();
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [requestManualRefetch],
  );

  useFocusEffect(
    useCallback(() => {
      void loadData(hasLoadedRef.current ? 'revalidate' : 'initial');
      return () => {
        requestSeqRef.current += 1;
      };
    }, [loadData]),
  );

  const onRefresh = useCallback(() => {
    void loadData('manual');
  }, [loadData]);

  useEffect(() => {
    navigation.setOptions({
      title: station?.name ? `${station.name} · ${t('stationDetail.title')}` : t('stationDetail.title'),
    });
  }, [navigation, station?.name, t]);

  const fav = isFavorite(params.stationId);

  const onGalleryScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideWidth = e.nativeEvent.layoutMeasurement?.width || width;
    if (slideWidth > 0) {
      setSlide(Math.round(e.nativeEvent.contentOffset.x / slideWidth));
    }
  };

  const groups = useMemo<GroupedPoint[]>(() => {
    if (chargePoints.length === 0 && connectors.length > 0) {
      return [
        {
          cp: {
            id: 'default',
            stationId: params.stationId,
            name: station?.name || t('stationDetail.defaultChargePoint'),
            zoneLabel: null,
            maxPowerKw: 0,
            status: 'ACTIVE',
          },
          connectors,
        },
      ];
    }
    return chargePoints.map((cp) => ({
      cp,
      connectors: connectors.filter((c) => c.chargePointId === cp.id),
    }));
  }, [chargePoints, connectors, params.stationId, station?.name, t]);

  const selectedConn = useMemo(
    () => connectors.find((c) => c.id === selectedConnectorId),
    [connectors, selectedConnectorId],
  );

  const maxPowerKw = useMemo(
    () => station?.maxPowerKw ?? Math.max(0, ...connectors.map((c) => c.powerKw)),
    [connectors, station?.maxPowerKw],
  );

  const connectorTypesList = useMemo(
    () => Array.from(new Set(connectors.map((c) => c.connectorType).filter(Boolean))),
    [connectors],
  );

  const opState = station?.operatingState || (station?.isOpen ? 'OPEN' : 'CLOSED_BY_SCHEDULE');
  const isPaused = opState === 'PAUSED_BY_OWNER';
  const isMaintenance = opState === 'MAINTENANCE';
  const isNoSchedule = opState === 'SCHEDULE_NOT_CONFIGURED';
  const isClosedBySchedule = opState === 'CLOSED_BY_SCHEDULE';
  const isUnavailable = opState === 'UNAVAILABLE_BY_PLATFORM';

  const hasValidPolicy = Boolean(
    station?.cancellationPolicy && typeof station.cancellationPolicy.gracePeriodMinutes === 'number',
  );

  const isOperatingAllowed = opState === 'OPEN' || isClosedBySchedule;
  const isSelectedConnAvailable = selectedConn?.runtimeStatus === 'AVAILABLE';
  const canBook =
    isOperatingAllowed &&
    (station?.totalConnectors ?? 0) > 0 &&
    !!selectedConnectorId &&
    isSelectedConnAvailable &&
    hasValidPolicy;

  const bookButtonLabel = isPaused
    ? t('stationDetail.action.paused')
    : isMaintenance
      ? t('stationDetail.action.maintenance')
      : isUnavailable
        ? t('stationDetail.action.unavailable')
        : isClosedBySchedule
          ? t('stationDetail.action.scheduleAhead')
          : t('stationDetail.findAvailability');

  const gateHint = isPaused
    ? t('stationDetail.pausedNotice', {
        reason: station?.operationalStatusReason || t('stationDetail.pausedDefaultReason'),
      })
    : isMaintenance
      ? t('stationDetail.maintenanceNotice', {
          reason: station?.operationalStatusReason || t('stationDetail.maintenanceDefaultReason'),
        })
      : isNoSchedule
        ? t('stationDetail.noScheduleNotice')
        : isUnavailable
          ? t('stationDetail.unavailableNotice')
          : isClosedBySchedule
            ? t('stationDetail.closedNotice')
            : (station?.availableConnectors ?? 0) === 0
              ? t('stationDetail.fullHint')
              : !selectedConnectorId
                ? t('stationDetail.selectConnectorHint')
                : !isSelectedConnAvailable
                  ? (selectedConn?.runtimeStatus === 'MAINTENANCE'
                      ? t('stationDetail.operatingState.MAINTENANCE')
                      : t('stationDetail.status.OFFLINE'))
                  : !hasValidPolicy
                    ? t('stationDetail.policy.unavailable')
                    : null;

  const areaLabel = station
    ? [station.wardName, station.provinceName].filter(Boolean).join(', ')
    : '';

  const displayDistance = params.distanceKm !== undefined ? params.distanceKm : station?.distanceKm;

  let statusMeta = {
    color: themeColors.textMuted,
    bg: themeColors.surfaceAlt,
    borderColor: themeColors.border,
    label: t('stationDetail.operatingState.SCHEDULE_NOT_CONFIGURED'),
  };

  if (opState === 'OPEN') {
    const hoursLabel = station?.operatingHours || t('stationDetail.allDay');
    statusMeta = {
      color: '#10B981',
      bg: isDark ? 'rgba(16, 185, 129, 0.12)' : '#ECFDF5',
      borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0',
      label: `${t('stationDetail.openNow')} · ${hoursLabel}`,
    };
  } else if (isClosedBySchedule) {
    statusMeta = {
      color: '#F59E0B',
      bg: isDark ? 'rgba(245, 158, 11, 0.12)' : '#FFFBEB',
      borderColor: isDark ? 'rgba(245, 158, 11, 0.3)' : '#FDE68A',
      label: station?.operatingHours
        ? `${t('stationDetail.operatingState.CLOSED_BY_SCHEDULE')} · ${station.operatingHours}`
        : t('stationDetail.operatingState.CLOSED_BY_SCHEDULE'),
    };
  } else if (isPaused) {
    statusMeta = {
      color: '#EF4444',
      bg: isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEF2F2',
      borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : '#FECACA',
      label: t('stationDetail.operatingState.PAUSED_BY_OWNER'),
    };
  } else if (isMaintenance) {
    statusMeta = {
      color: '#F59E0B',
      bg: isDark ? 'rgba(245, 158, 11, 0.12)' : '#FFFBEB',
      borderColor: isDark ? 'rgba(245, 158, 11, 0.3)' : '#FDE68A',
      label: t('stationDetail.operatingState.MAINTENANCE'),
    };
  } else if (isUnavailable) {
    statusMeta = {
      color: themeColors.textMuted,
      bg: themeColors.surfaceAlt,
      borderColor: themeColors.border,
      label: t('stationDetail.operatingState.UNAVAILABLE_BY_PLATFORM'),
    };
  }

  const openDirections = () => {
    if (!station) return;
    const query = encodeURIComponent(`${station.latitude},${station.longitude}`);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
  };

  const callStation = () => {
    if (!station?.contactPhone) return;
    setCallConfirmVisible(true);
  };

  const executeCall = () => {
    setCallConfirmVisible(false);
    if (station?.contactPhone) {
      Linking.openURL(`tel:${station.contactPhone}`);
    }
  };

  const handleBook = () => {
    if (!canBook || !selectedConnectorId || !isSelectedConnAvailable) return;
    navigation.navigate('TimeRangePicker', {
      stationId: params.stationId,
      connectorId: selectedConnectorId,
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <View style={[styles.heroSkeleton, { backgroundColor: themeColors.surfaceAlt }]} />
        <ActivityIndicator color={themeColors.primary} style={styles.centerLoader} />
      </View>
    );
  }

  if (!station) {
    return (
      <View
        style={[
          styles.container,
          styles.centerEmpty,
          { backgroundColor: themeColors.background, paddingHorizontal: spacing.xl },
        ]}
      >
        <Text style={[styles.errorTitle, { color: themeColors.textStrong }]}>
          {t('stationDetail.errorLoadTitle')}
        </Text>
        <Text style={[styles.errorDesc, { color: themeColors.textMuted }]}>
          {t('stationDetail.errorLoadDesc')}
        </Text>
        <Pressable
          onPress={() => void loadData('initial')}
          style={[styles.retryBtn, { backgroundColor: themeColors.primary }]}
        >
          <Text style={styles.retryBtnText}>{t('common.retry', 'Thử lại')}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={themeColors.primary}
            colors={[themeColors.primary]}
          />
        }
      >
        {/* Hero Gallery with Floating Back, Title Pill & Favorite Buttons */}
        <StationHeroGallery
          title={t('stationDetail.title')}
          imageUrl={station.imageUrl}
          images={station.images}
          slide={slide}
          onScroll={onGalleryScroll}
          isFav={fav}
          onToggleFav={() => toggleFavorite(params.stationId)}
          onBack={() => navigation.goBack()}
          insetsTop={insets.top}
        />

        {/* Content Sheet Overlapping Hero with seamless background extending to bottom */}
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: themeColors.surface,
              paddingBottom: 140 + insets.bottom,
            },
          ]}
        >
          {/* Station Name, Code, Address & Directions */}
          <StationHeaderInfo
            station={station}
            statusMeta={statusMeta}
            distanceKm={displayDistance}
            areaLabel={areaLabel}
            onOpenDirections={openDirections}
            onCallStation={callStation}
          />

          {/* Operational Status Callout when PAUSED or MAINTENANCE */}
          <StationNoticeBanner
            isPaused={isPaused}
            isMaintenance={isMaintenance}
            reason={station.operationalStatusReason}
          />

          {/* Symmetrical 3-Column Bento Metric Card */}
          <StationBentoMetrics
            availableConnectors={station.availableConnectors}
            totalConnectors={station.totalConnectors}
            maxPowerKw={maxPowerKw}
            minRatePerKwh={station.minRatePerKwh}
            connectorTypes={connectorTypesList}
          />

          {/* Amenities Horizontal Strip */}
          <StationAmenitiesList amenities={station.amenities} />

          {/* Cancellation & Refund Policy */}
          <StationPolicyCard cancellationPolicy={station.cancellationPolicy} />

          {/* Charge Points (with Zone) & Connectors Grid */}
          <ChargePointGroupList
            groups={groups}
            selectedConnectorId={selectedConnectorId}
            onSelectConnector={setSelectedConnectorId}
          />

          {/* Driver Reviews */}
          <StationReviewsSection station={station} reviews={reviews} />
        </View>
      </ScrollView>

      {/* Floating Bottom Sticky Bar */}
      <StationBookingBottomBar
        selectedConn={selectedConn}
        canBook={canBook}
        gateHint={gateHint}
        isClosedBySchedule={isClosedBySchedule}
        bookButtonLabel={bookButtonLabel}
        onBook={handleBook}
        insetsBottom={insets.bottom}
      />

      {/* Call Confirmation In-App Modal */}
      <CallConfirmationModal
        visible={callConfirmVisible}
        phone={station.contactPhone}
        onClose={() => setCallConfirmVisible(false)}
        onConfirm={executeCall}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroSkeleton: {
    height: 260,
  },
  centerLoader: {
    flex: 1,
  },
  centerEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorTitle: {
    fontSize: fontSizes.heading,
    fontWeight: fontWeights.bold,
    textAlign: 'center',
  },
  errorDesc: {
    marginTop: spacing.xs,
    fontSize: fontSizes.caption,
    textAlign: 'center',
    maxWidth: 280,
  },
  retryBtn: {
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: fontWeights.semibold,
  },
  sheet: {
    marginTop: -20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.lg,
    flexGrow: 1,
  },
});
