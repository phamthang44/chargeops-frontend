import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, BackHandler } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import { bookingErrorMessage, extractBookingErrorCode } from '@/i18n/bookingErrors';
import type { RootStackParamList } from '@/navigation/types';
import {
  createBooking,
  createCheckout,
  findOverlappingBookings,
  generateIdempotencyKey,
  getLatestPendingBooking,
  getPricePreview,
  PriceChangedError,
  type BackendPricePreviewResponse,
} from '@/services/bookingService';
import {
  getChargePointsByStation,
  getConnectorsByStation,
  getConnectorById,
  getStationAvailability,
  getStationById,
  getStationDetail,
  isMockMode,
} from '@/services/stationService';
import type { Booking, ChargePoint, Connector, PaymentMethod, Station } from '@/types';
import { splitDuration } from '@/utils/format';
import {
  PAYMENT_FEATURE_FLAGS,
} from '@/utils/payments';
import { quoteBooking, type Quote } from '@/utils/pricing';

type Nav = NativeStackNavigationProp<RootStackParamList, 'BookingConfirmation'>;
type Route = RouteProp<RootStackParamList, 'BookingConfirmation'>;

export function useBookingConfirmation() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { t } = useTranslation();
  const { preferredPaymentMethod, setPreferredPaymentMethod } = usePreferences();
  const { getAccessToken } = useAuth();

  const [station, setStation] = useState<Station | null>(null);
  const [connector, setConnector] = useState<Connector | null>(null);
  const [chargePoint, setChargePoint] = useState<ChargePoint | null>(null);
  const [loading, setLoading] = useState(true);
  const [method, setMethod] = useState<PaymentMethod>(() => {
    if (preferredPaymentMethod === 'BANK_TRANSFER' && !PAYMENT_FEATURE_FLAGS.ENABLE_SEPAY_PAYMENT) {
      return 'SIMULATOR';
    }
    return preferredPaymentMethod || 'SIMULATOR';
  });

  useEffect(() => {
    if (preferredPaymentMethod) {
      if (preferredPaymentMethod === 'BANK_TRANSFER' && !PAYMENT_FEATURE_FLAGS.ENABLE_SEPAY_PAYMENT) {
        setMethod('SIMULATOR');
      } else {
        setMethod(preferredPaymentMethod);
      }
    }
  }, [preferredPaymentMethod]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [priceRanges, setPriceRanges] = useState(params.priceRanges ?? null);
  const [backendPreview, setBackendPreview] = useState<BackendPricePreviewResponse | null>(null);

  // Idempotency Key for BKG-020 (persisted across retries, renewed on param/price change)
  const idempotencyKeyRef = useRef<string>(generateIdempotencyKey());
  const [pendingPricePreview, setPendingPricePreview] = useState<BackendPricePreviewResponse | null>(null);
  const [showPriceChangedModal, setShowPriceChangedModal] = useState(false);

  // Duplicate booking warning state (BR-BOK-08)
  const [overlappingBooking, setOverlappingBooking] = useState<Booking | null>(null);
  const [showOverlapModal, setShowOverlapModal] = useState(false);

  const endAt = useMemo(
    () => new Date(new Date(params.startAt).getTime() + params.durationMin * 60_000).toISOString(),
    [params.startAt, params.durationMin],
  );

  useEffect(() => {
    let active = true;
    const token = getAccessToken();

    async function loadData() {
      try {
        setLoading(true);

        // 1. Fetch Station Detail Bundle (station, chargePoints, connectors)
        const detail = await getStationDetail(params.stationId, { accessToken: token });
        if (!active) return;

        let pickedStation = detail?.station ?? null;
        let pickedConnectors = detail?.connectors ?? [];
        let pickedChargePoints = detail?.chargePoints ?? [];

        // Fallbacks if getStationDetail didn't return complete list
        if (!pickedStation) {
          pickedStation = await getStationById(params.stationId, { accessToken: token });
        }
        if (pickedConnectors.length === 0) {
          pickedConnectors = await getConnectorsByStation(params.stationId, { accessToken: token });
        }
        if (pickedChargePoints.length === 0) {
          pickedChargePoints = await getChargePointsByStation(params.stationId, { accessToken: token });
        }

        let pickedConn = pickedConnectors.find((c) => c.id === params.connectorId) ?? null;
        if (!pickedConn) {
          pickedConn = await getConnectorById(params.connectorId);
        }

        setStation(pickedStation);
        setConnector(pickedConn);
        setChargePoint(pickedChargePoints.find((p) => p.id === pickedConn?.chargePointId) ?? null);

        // 2. Fetch Availability if priceRanges not already passed
        let currentPriceRanges = priceRanges ?? params.priceRanges;
        if (!currentPriceRanges && pickedStation && pickedConn) {
          const dateStr = params.startAt.slice(0, 10);
          const avail = await getStationAvailability(params.stationId, pickedConn.id, dateStr, { accessToken: token });
          if (avail?.priceRanges) {
            currentPriceRanges = avail.priceRanges;
            setPriceRanges(avail.priceRanges);
          }
        }

        // 3. Fetch Price Preview & Overlaps concurrently
        const [overlaps, preview] = await Promise.all([
          findOverlappingBookings(params.startAt, endAt, params.connectorId).catch(() => []),
          getPricePreview(params.connectorId, params.startAt, params.durationMin, {
            accessToken: token,
            connector: pickedConn,
            priceRanges: currentPriceRanges,
          }).catch((err) => {
            console.warn('Failed to load price preview:', err);
            const msg = bookingErrorMessage(t, err);
            setError(msg);
            return null;
          }),
        ]);

        if (!active) return;

        if (preview) {
          setBackendPreview(preview);
          setError(null);
        }

        if (overlaps && overlaps.length > 0) {
          setOverlappingBooking(overlaps[0]);
          setShowOverlapModal(true);
        }
      } catch (err) {
        console.warn('Failed to load booking confirmation details:', err);
        const msg = bookingErrorMessage(t, err);
        setError(msg);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, [params.stationId, params.connectorId, params.startAt, endAt, params.priceRanges, getAccessToken]);

  const quote = useMemo<Quote | null>(() => {
    if (backendPreview) {
      return {
        priceLines: backendPreview.priceLines.map((l) => ({
          fromAt: l.startAt,
          toAt: l.endAt,
          rateKind:
            l.periodCode === 'PEAK'
              ? 'PEAK'
              : l.periodCode === 'OFF_PEAK' || l.periodCode === 'OFFPEAK'
                ? 'OFFPEAK'
                : 'STANDARD',
          rateVndPerKwh: l.rateVndPerKwh,
          energyKwh: l.estimatedEnergyKwh,
          amount: l.amount,
        })),
        energyKwh: +backendPreview.priceLines
          .reduce((acc, l) => acc + (l.estimatedEnergyKwh ?? 0), 0)
          .toFixed(1),
        chargingFee: backendPreview.totalAmount,
        serviceFee: 0,
        totalPrice: backendPreview.totalAmount,
      };
    }
    return connector
      ? quoteBooking(connector, params.startAt, params.durationMin, priceRanges ?? params.priceRanges)
      : null;
  }, [backendPreview, connector, params.startAt, params.durationMin, priceRanges, params.priceRanges]);

  const previewCode = useMemo(() => {
    if (backendPreview?.pricingVersion) {
      return `PV-${backendPreview.pricingVersion.slice(0, 6)}`;
    }
    return `CO-${String(Date.now()).slice(-4)}`;
  }, [backendPreview?.pricingVersion]);

  function durationLabel(min: number): string {
    const { hours, minutes } = splitDuration(min);
    if (hours === 0) return t('timeRangePicker.durationMin', { minutes });
    if (minutes === 0) return t('timeRangePicker.durationHour', { hours });
    return t('timeRangePicker.durationHourMin', { hours, minutes });
  }

  async function submitBooking(overridePreview?: BackendPricePreviewResponse) {
    if (!connector) return;
    const isRealPreview = Boolean(
      overridePreview &&
      typeof overridePreview === 'object' &&
      'pricingVersion' in overridePreview &&
      typeof (overridePreview as any).pricingVersion === 'string',
    );
    const resolvedOverride = isRealPreview ? overridePreview : undefined;
    const activePreview = resolvedOverride ?? backendPreview;
    const activeTotal = resolvedOverride?.totalAmount ?? activePreview?.totalAmount ?? quote?.totalPrice ?? 0;
    const activePricingVersion = (activePreview?.pricingVersion ?? '').trim();
    const activePolicyVersion =
      activePreview?.policy?.policyVersion ??
      activePreview?.policy?.version ??
      'booking-v4.9';

    if (!isMockMode()) {
      if (!activePreview || !activePricingVersion || !/^[0-9a-fA-F]{64}$/.test(activePricingVersion)) {
        console.warn('Invalid pricing version:', activePricingVersion, activePreview);
        const msg = t('bookingConfirmation.pricePreviewRequired', {
          defaultValue: 'Chưa có thông tin báo giá hợp lệ từ hệ thống hoặc khung giờ không khả dụng. Vui lòng chọn lại khung giờ.',
        });
        setError(msg);
        Alert.alert(t('bookingConfirmation.errorTitle'), msg);
        return;
      }
      if (typeof activeTotal !== 'number' || isNaN(activeTotal) || activeTotal < 0) {
        const msg = t('bookingConfirmation.invalidTotalAmount', {
          defaultValue: 'Tổng tiền thanh toán không hợp lệ. Vui lòng chọn lại khung giờ.',
        });
        setError(msg);
        Alert.alert(t('bookingConfirmation.errorTitle'), msg);
        return;
      }
    }

    setSubmitting(true);
    setError(null);
    setErrorCode(null);
    try {
      const token = getAccessToken();
      const booking = await createBooking(
        {
          stationId: params.stationId,
          connectorId: connector.id,
          startAt: params.startAt,
          durationMin: params.durationMin,
          paymentMethod: method,
          acceptedTotalAmount: activeTotal,
          acceptedPricingVersion: activePricingVersion,
          acceptedPolicyVersion: activePolicyVersion,
          backendPriceRanges: priceRanges ?? params.priceRanges,
        },
        {
          idempotencyKey: idempotencyKeyRef.current,
          accessToken: token,
          station,
          connector,
          chargePoint,
          priceLines: quote?.priceLines ?? [],
        },
      );

      try {
        const checkout = await createCheckout(booking.id, {
          accessToken: token,
          requestKey: generateIdempotencyKey(),
        });
        booking.checkout = checkout;
      } catch (checkoutErr) {
        console.warn('createCheckout failed after createBooking:', checkoutErr);
      }

      navigation.replace('BookingDetail', { bookingId: booking.id });
    } catch (e) {
      if (e instanceof PriceChangedError) {
        setPendingPricePreview(e.latestPricePreview);
        setShowPriceChangedModal(true);
        return;
      }
      const code = extractBookingErrorCode(e);
      setErrorCode(code);
      const msg = bookingErrorMessage(t, e);
      setError(msg);

      const isPendingLimit =
        code === 'BKG_PENDING_LIMIT_EXCEEDED' ||
        code === 'PENDING_LIMIT_EXCEEDED' ||
        code === 'DRIVER_ACTIVE_BOOKING_LIMIT_EXCEEDED';

      if (isPendingLimit) {
        getLatestPendingBooking().then((pending) => {
          Alert.alert(
            t('bookingConfirmation.errorTitle'),
            msg,
            [
              { text: t('common.cancel', 'Đóng'), style: 'cancel' },
              {
                text: t('bookingConfirmation.viewPendingDetail', 'Xem đơn đang chờ'),
                onPress: () => {
                  if (pending?.id) {
                    navigation.navigate('BookingDetail', { bookingId: pending.id });
                  } else {
                    navigation.navigate('Tabs', { screen: 'Bookings' });
                  }
                },
              },
            ],
          );
        });
      } else {
        Alert.alert(t('bookingConfirmation.errorTitle'), msg);
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleAcceptNewPrice() {
    if (!pendingPricePreview) return;
    const newPreview = pendingPricePreview;
    setShowPriceChangedModal(false);
    setPendingPricePreview(null);
    setBackendPreview(newPreview);
    idempotencyKeyRef.current = generateIdempotencyKey();
    setTimeout(() => {
      submitBooking(newPreview);
    }, 150);
  }

  function handleDeclineNewPrice() {
    setShowPriceChangedModal(false);
    setPendingPricePreview(null);
  }

  const handleBack = useCallback(() => {
    if (params.isFastTrack) {
      navigation.replace('TimeRangePicker', {
        stationId: params.stationId,
        connectorId: params.connectorId,
        isFromFastTrack: true,
      });
      return true;
    }
    navigation.goBack();
    return true;
  }, [navigation, params]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBack();
      return true;
    });
    return () => sub.remove();
  }, [handleBack]);

  const selectPaymentMethod = (pm: PaymentMethod) => {
    setMethod(pm);
    setPreferredPaymentMethod(pm);
  };

  return {
    params,
    station,
    connector,
    chargePoint,
    loading,
    method,
    selectPaymentMethod,
    submitting,
    error,
    errorCode,
    backendPreview,
    quote,
    previewCode,
    endAt,
    durationLabel,
    submitBooking,
    handleBack,
    // Price Changed Modal
    showPriceChangedModal,
    pendingPricePreview,
    handleAcceptNewPrice,
    handleDeclineNewPrice,
    // Overlapping Booking Modal
    showOverlapModal,
    setShowOverlapModal,
    overlappingBooking,
  };
}
