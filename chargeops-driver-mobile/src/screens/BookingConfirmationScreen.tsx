import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, BackHandler, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton, BottomSheet, GlassButton, StatusBadge } from '@/components';
import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import { bookingErrorMessage } from '@/i18n/bookingErrors';
import type { RootStackParamList } from '@/navigation/types';
import {
  createBooking,
  findOverlappingBookings,
  generateIdempotencyKey,
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
} from '@/services/stationService';
import { fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';
import type { Booking, ChargePoint, Connector, PaymentMethod, Station } from '@/types';
import { formatDate, formatEquipmentName, formatTime, formatTimeRange, formatVnd, splitDuration } from '@/utils/format';
import { ONLY_SIMULATOR_PAYMENT, PAYMENT_META, SELECTABLE_PAYMENT_METHODS } from '@/utils/payments';
import { quoteBooking, type Quote } from '@/utils/pricing';

type Nav = NativeStackNavigationProp<RootStackParamList, 'BookingConfirmation'>;
type Route = RouteProp<RootStackParamList, 'BookingConfirmation'>;

/**
 * "Xác nhận đặt chỗ" — review chosen time range, see invoice, pick payment method, create booking.
 * Includes BR-BOK-08 duplicate/overlapping booking warning modal & dynamic Dark/Light mode theme support.
 */
export function BookingConfirmationScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { t, i18n } = useTranslation();
  const { themeColors, isDark } = usePreferences();
  const { getAccessToken } = useAuth();
  const insets = useSafeAreaInsets();

  const [station, setStation] = useState<Station | null>(null);
  const [connector, setConnector] = useState<Connector | null>(null);
  const [chargePoint, setChargePoint] = useState<ChargePoint | null>(null);
  const [loading, setLoading] = useState(true);
  const [method, setMethod] = useState<PaymentMethod>('SIMULATOR');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
          }).catch(() => null),
        ]);

        if (!active) return;

        if (preview) {
          setBackendPreview(preview);
        }

        if (overlaps && overlaps.length > 0) {
          setOverlappingBooking(overlaps[0]);
          setShowOverlapModal(true);
        }
      } catch (err) {
        console.warn('Failed to load booking confirmation details:', err);
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
    const activePreview = overridePreview ?? backendPreview;
    const activeTotal = overridePreview ? overridePreview.totalAmount : (quote?.totalPrice ?? 0);
    const activePricingVersion = activePreview?.pricingVersion ?? '';
    const activePolicyVersion =
      activePreview?.policy?.policyVersion ??
      activePreview?.policy?.version ??
      'booking-v4.9';

    setSubmitting(true);
    setError(null);
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
      navigation.replace('PaymentProcessing', { bookingId: booking.id });
    } catch (e) {
      if (e instanceof PriceChangedError) {
        setPendingPricePreview(e.latestPricePreview);
        setShowPriceChangedModal(true);
        return;
      }
      const msg = bookingErrorMessage(t, e);
      setError(msg);
      Alert.alert(t('bookingConfirmation.errorTitle'), msg);
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
    // Renew idempotency key for new price agreement
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

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top', 'left', 'right']}>
        <ActivityIndicator color={themeColors.primary} style={styles.loader} />
      </SafeAreaView>
    );
  }

  if (!station || !connector || !quote) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top', 'left', 'right']}>
        <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
          <GlassButton
            size={40}
            glassEffectStyle="regular"
            fallbackColor={themeColors.surfaceAlt}
            accessibilityLabel={t('common.back')}
            onPress={handleBack}
          >
            <Ionicons name="chevron-back" size={22} color={themeColors.textStrong} />
          </GlassButton>
          <Text style={[styles.headerTitle, { color: themeColors.textStrong }]}>{t('bookingConfirmation.title')}</Text>
          <View style={styles.headerBtn} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl, gap: spacing.md }}>
          <Ionicons name="alert-circle-outline" size={48} color={themeColors.warning} />
          <Text style={{ fontSize: fontSizes.heading, fontWeight: fontWeights.bold, color: themeColors.textStrong, textAlign: 'center' }}>
            {t('bookingConfirmation.notFound', 'Không thể tải thông tin cổng sạc hoặc trạm')}
          </Text>
          <Text style={{ fontSize: fontSizes.body, color: themeColors.textMuted, textAlign: 'center' }}>
            {t('bookingConfirmation.notFoundDesc', 'Vui lòng kiểm tra lại kết nối hoặc quay lại chọn cổng sạc khác.')}
          </Text>
          <AppButton
            label={t('common.back', 'Quay lại')}
            variant="secondary"
            onPress={handleBack}
            style={{ marginTop: spacing.md }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
        <GlassButton
          size={40}
          glassEffectStyle="regular"
          fallbackColor={themeColors.surfaceAlt}
          accessibilityLabel={t('common.back')}
          onPress={handleBack}
        >
          <Ionicons name="chevron-back" size={22} color={themeColors.textStrong} />
        </GlassButton>
        <Text style={[styles.headerTitle, { color: themeColors.textStrong }]}>{t('bookingConfirmation.title')}</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Fast-Track 1-Click Banner */}
        {params.isFastTrack && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              backgroundColor: isDark ? 'rgba(16, 185, 129, 0.16)' : '#ECFDF5',
              borderColor: isDark ? 'rgba(16, 185, 129, 0.35)' : '#A7F3D0',
              borderWidth: 1,
              borderRadius: radius.lg,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.md - 2,
            }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: isDark ? 'rgba(16, 185, 129, 0.25)' : '#D1FAE5',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="flash" size={18} color="#10B981" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: isDark ? '#34D399' : '#047857' }}>
                {t('bookingConfirmation.fastTrackTitle', '⚡ Đặt chỗ nhanh (1-Click)')}
              </Text>
              <Text style={{ fontSize: 12, color: isDark ? '#A7F3D0' : '#065F46', marginTop: 2 }}>
                {t('bookingConfirmation.fastTrackDesc', 'Đã tự động chọn cổng khả dụng tốt nhất & khung giờ sạc sớm nhất.')}
              </Text>
            </View>
          </View>
        )}

        {/* Station summary */}
        <View style={[styles.card, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <Text style={[styles.stationName, { color: themeColors.textStrong, flex: 1 }]}>{station.name}</Text>
            <Pressable
              onPress={() => navigation.navigate('StationDetail', { stationId: params.stationId })}
              hitSlop={6}
              style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.sm, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6' }}
            >
              <Text style={{ color: themeColors.primary, fontSize: 12, fontWeight: '600' }}>
                {t('bookingConfirmation.changeConnector', 'Đổi cổng')}
              </Text>
            </Pressable>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={14} color={themeColors.textMuted} />
            <Text style={[styles.metaText, { color: themeColors.textMuted }]} numberOfLines={1}>
              {station.address}
            </Text>
          </View>
          <View style={[styles.connectorPill, { backgroundColor: themeColors.surfaceAlt }]}>
            <Ionicons name="flash-outline" size={14} color={themeColors.primary} />
            <Text style={[styles.connectorText, { color: themeColors.textStrong }]}>
              {chargePoint?.name ? `${formatEquipmentName(chargePoint.name, i18n.language)} · ` : ''}{formatEquipmentName(connector.name, i18n.language)} ({connector.connectorType}) · {connector.powerKw} kW
            </Text>
          </View>
        </View>

        {/* Overlapping booking warning banner if driver proceeds */}
        {overlappingBooking && (
          <Pressable
            style={[styles.overlapCard, { backgroundColor: `${themeColors.warning}1A`, borderColor: themeColors.warning }]}
            onPress={() => setShowOverlapModal(true)}
          >
            <Ionicons name="warning-outline" size={20} color={themeColors.warning} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.overlapTitle, { color: themeColors.warning }]}>{t('bookingConfirm.overlapTitle')}</Text>
              <Text style={[styles.overlapSub, { color: themeColors.textBody }]}>
                {t('bookingConfirm.overlapBody', {
                  start: formatTime(overlappingBooking.startAt),
                  end: formatTime(overlappingBooking.endAt),
                  station: overlappingBooking.stationName,
                })}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={themeColors.warning} />
          </Pressable>
        )}

        {/* Time summary */}
        <View style={[styles.card, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="calendar-outline" size={18} color={themeColors.primary} />
            <Text style={[styles.cardTitle, { color: themeColors.textStrong }]}>{t('bookingConfirmation.timeTitle')}</Text>
            <Pressable
              onPress={() => navigation.navigate('TimeRangePicker', { stationId: params.stationId, connectorId: params.connectorId })}
              hitSlop={6}
              style={{ marginLeft: 'auto', paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.sm, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6' }}
            >
              <Text style={{ color: themeColors.primary, fontSize: 12, fontWeight: '600' }}>
                {t('bookingConfirmation.changeTime', 'Đổi giờ')}
              </Text>
            </Pressable>
          </View>

          <View style={styles.timeBlock}>
            <View style={styles.timeCell}>
              <Text style={[styles.timeLabel, { color: themeColors.textMuted }]}>{t('bookingConfirmation.date')}</Text>
              <Text style={[styles.timeValue, { color: themeColors.textStrong }]}>{formatDate(params.startAt)}</Text>
            </View>
            <View style={[styles.timeDivider, { backgroundColor: themeColors.border }]} />
            <View style={styles.timeCell}>
              <Text style={[styles.timeLabel, { color: themeColors.textMuted }]}>{t('bookingConfirmation.timeRange')}</Text>
              <Text style={[styles.timeValue, { color: themeColors.textStrong }]}>{formatTimeRange(params.startAt, endAt)}</Text>
              <Text style={[styles.timeSub, { color: themeColors.textMuted }]}>{durationLabel(params.durationMin)}</Text>
            </View>
          </View>

          <View style={[styles.holdHint, { backgroundColor: isDark ? '#152A4A' : '#EFF6FF' }]}>
            <Ionicons name="information-circle-outline" size={16} color={themeColors.info} />
            <Text style={[styles.holdHintText, { color: themeColors.textBody }]}>{t('bookingConfirmation.holdNotice')}</Text>
          </View>
        </View>

        {/* Invoice breakdown */}
        <View style={[styles.card, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="receipt-outline" size={18} color={themeColors.primary} />
            <Text style={[styles.cardTitle, { color: themeColors.textStrong }]}>{t('bookingConfirmation.invoiceTitle')}</Text>
            <StatusBadge
              variant={backendPreview ? 'success' : 'neutral'}
              label={backendPreview ? `${previewCode} · BE Verified` : previewCode}
            />
          </View>

          {quote.priceLines.map((line, i) => (
            <View key={i} style={styles.invoiceRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.invoiceLineTitle, { color: themeColors.textStrong }]}>
                  {t('bookingConfirmation.chargingBand', {
                    kind: t(`timeRangePicker.band.${line.rateKind}`),
                    from: formatTime(line.fromAt),
                    to: formatTime(line.toAt),
                  })}
                </Text>
                <Text style={[styles.invoiceLineSub, { color: themeColors.textMuted }]}>
                  {t('bookingConfirmation.bandSub', {
                    kwh: line.energyKwh,
                    rate: formatVnd(line.rateVndPerKwh),
                  })}
                </Text>
              </View>
              <Text style={[styles.invoiceLineAmount, { color: themeColors.textStrong }]}>{formatVnd(line.amount)}</Text>
            </View>
          ))}

          {quote.serviceFee > 0 && (
            <View style={styles.invoiceRow}>
              <Text style={[styles.invoiceFeeLabel, { color: themeColors.textMuted }]}>{t('bookingConfirmation.serviceFee')}</Text>
              <Text style={[styles.invoiceFeeAmount, { color: themeColors.textStrong }]}>{formatVnd(quote.serviceFee)}</Text>
            </View>
          )}

          <View style={[styles.invoiceTotalRow, { borderTopColor: themeColors.border }]}>
            <Text style={[styles.totalLabel, { color: themeColors.textStrong }]}>{t('bookingConfirmation.total')}</Text>
            <Text style={[styles.totalAmount, { color: themeColors.textStrong }]}>{formatVnd(quote.totalPrice)}</Text>
          </View>
        </View>

        {/* Payment method selector */}
        <View style={[styles.card, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="wallet-outline" size={18} color={themeColors.primary} />
            <Text style={[styles.cardTitle, { color: themeColors.textStrong }]}>{t('bookingConfirmation.paymentTitle')}</Text>
          </View>

          {SELECTABLE_PAYMENT_METHODS.map((pm) => {
            const meta = PAYMENT_META[pm];
            const isSel = method === pm;
            const isDisabled = ONLY_SIMULATOR_PAYMENT && pm !== 'SIMULATOR';
            return (
              <Pressable
                key={pm}
                disabled={isDisabled}
                style={[
                  styles.paymentRow,
                  {
                    backgroundColor: isSel ? themeColors.primarySoft : themeColors.surfaceAlt,
                    borderColor: isSel ? themeColors.primary : themeColors.border,
                    opacity: isDisabled ? 0.45 : 1,
                  },
                ]}
                onPress={() => {
                  if (!isDisabled) {
                    setMethod(pm);
                  }
                }}
              >
                <View style={[styles.paymentIcon, { backgroundColor: `${meta.color}1A` }]}>
                  <Ionicons name={meta.icon} size={20} color={meta.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                    <Text style={[styles.paymentName, { color: themeColors.textStrong }]}>{t(`payment.${pm}`)}</Text>
                    {isDisabled && (
                      <View
                        style={{
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          borderRadius: 4,
                          backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB',
                        }}
                      >
                        <Text style={{ fontSize: 10, color: themeColors.textMuted, fontWeight: '600' }}>
                          {t('payment.comingSoon')}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.paymentDesc, { color: themeColors.textMuted }]}>{t(`payment.${pm}_desc`)}</Text>
                </View>
                <View
                  style={[
                    styles.radio,
                    { borderColor: isSel ? themeColors.primary : themeColors.border },
                  ]}
                >
                  {isSel && <View style={[styles.radioDot, { backgroundColor: themeColors.primary }]} />}
                </View>
              </Pressable>
            );
          })}
        </View>

        {error && (
          <View style={[styles.errorBox, { backgroundColor: `${themeColors.error}1A` }]}>
            <Ionicons name="alert-circle-outline" size={18} color={themeColors.error} />
            <Text style={[styles.errorText, { color: themeColors.error }]}>{error}</Text>
          </View>
        )}
      </ScrollView>

      {/* Sticky footer */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: themeColors.surface,
            borderTopColor: themeColors.border,
            paddingBottom: Math.max(insets.bottom, spacing.md),
          },
        ]}
      >
        <View style={styles.footerRow}>
          <View>
            <Text style={[styles.footerLabel, { color: themeColors.textMuted }]}>{t('bookingConfirmation.totalPayment')}</Text>
            <Text style={[styles.footerAmount, { color: themeColors.textStrong }]}>{formatVnd(quote.totalPrice)}</Text>
          </View>
          <AppButton
            label={t('bookingConfirmation.payBtn', { amount: formatVnd(quote.totalPrice) })}
            loading={submitting}
            onPress={submitBooking}
            style={styles.payBtn}
          />
        </View>
      </View>

      {/* Duplicate / Overlapping Booking Warning Sheet (BR-BOK-08) */}
      {overlappingBooking && (
        <BottomSheet
          visible={showOverlapModal}
          onClose={() => setShowOverlapModal(false)}
          title={t('bookingConfirm.overlapTitle')}
        >
          <View style={styles.modalContent}>
            <View style={[styles.modalIconRing, { backgroundColor: `${themeColors.warning}1A` }]}>
              <Ionicons name="warning-outline" size={32} color={themeColors.warning} />
            </View>
            <Text style={[styles.modalBodyText, { color: themeColors.textBody }]}>
              {t('bookingConfirm.overlapBody', {
                start: formatTime(overlappingBooking.startAt),
                end: formatTime(overlappingBooking.endAt),
                station: overlappingBooking.stationName,
              })}
            </Text>
            <View style={styles.modalActions}>
              <AppButton
                label={t('bookingConfirm.overlapConfirm')}
                onPress={() => setShowOverlapModal(false)}
              />
              <AppButton
                label={t('common.cancel')}
                variant="secondary"
                onPress={() => {
                  setShowOverlapModal(false);
                  navigation.goBack();
                }}
              />
            </View>
          </View>
        </BottomSheet>
      )}

      {/* 409 PRICE_CHANGED Re-Consent BottomSheet (BKG-020) */}
      {pendingPricePreview && (
        <BottomSheet
          visible={showPriceChangedModal}
          onClose={handleDeclineNewPrice}
          title={t('bookingConfirmation.priceChangedTitle')}
        >
          <View style={styles.modalContent}>
            <View style={[styles.modalIconRing, { backgroundColor: `${themeColors.info}1A` }]}>
              <Ionicons name="pricetag-outline" size={32} color={themeColors.info} />
            </View>
            <Text style={[styles.modalBodyText, { color: themeColors.textBody }]}>
              {t('bookingConfirmation.priceChangedMessage')}
            </Text>
            <View style={[styles.priceChangeComparison, { backgroundColor: themeColors.surfaceAlt, borderColor: themeColors.border }]}>
              <View style={styles.priceChangeRow}>
                <Text style={[styles.priceChangeLabel, { color: themeColors.textMuted }]}>
                  {t('bookingConfirmation.oldPrice')}:
                </Text>
                <Text style={[styles.priceChangeOldValue, { color: themeColors.textMuted }]}>
                  {formatVnd(quote?.totalPrice ?? 0)}
                </Text>
              </View>
              <View style={styles.priceChangeRow}>
                <Text style={[styles.priceChangeLabel, { color: themeColors.textStrong, fontWeight: fontWeights.semibold }]}>
                  {t('bookingConfirmation.newPrice')}:
                </Text>
                <Text style={[styles.priceChangeNewValue, { color: themeColors.primary, fontWeight: fontWeights.bold }]}>
                  {formatVnd(pendingPricePreview.totalAmount)}
                </Text>
              </View>
            </View>
            <View style={styles.modalActions}>
              <AppButton
                label={t('bookingConfirmation.acceptNewPrice')}
                onPress={handleAcceptNewPrice}
              />
              <AppButton
                label={t('bookingConfirmation.reviewBooking')}
                variant="secondary"
                onPress={handleDeclineNewPrice}
              />
            </View>
          </View>
        </BottomSheet>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  headerBtn: { width: 40, height: 40 },
  headerTitle: { fontSize: fontSizes.heading, fontWeight: fontWeights.semibold },

  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },

  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  stationName: { fontSize: fontSizes.heading, fontWeight: fontWeights.bold },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  metaText: { fontSize: fontSizes.caption },

  connectorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  connectorText: { fontSize: fontSizes.caption, fontWeight: fontWeights.semibold },

  overlapCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  overlapTitle: { fontSize: fontSizes.body, fontWeight: fontWeights.bold },
  overlapSub: { fontSize: fontSizes.caption, lineHeight: lineHeights.caption },

  cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.xs },
  cardTitle: { flex: 1, fontSize: fontSizes.heading, fontWeight: fontWeights.bold },

  timeBlock: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  timeCell: { flex: 1, gap: 2 },
  timeLabel: { fontSize: fontSizes.caption },
  timeValue: { fontSize: fontSizes.body, fontWeight: fontWeights.bold },
  timeSub: { fontSize: fontSizes.caption },
  timeDivider: { width: 1, height: 36 },

  holdHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  holdHintText: { flex: 1, fontSize: fontSizes.caption, lineHeight: lineHeights.caption },

  invoiceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  invoiceLineTitle: { fontSize: fontSizes.body, fontWeight: fontWeights.semibold },
  invoiceLineSub: { fontSize: fontSizes.caption },
  invoiceLineAmount: { fontSize: fontSizes.body, fontWeight: fontWeights.semibold },
  invoiceFeeLabel: { fontSize: fontSizes.caption },
  invoiceFeeAmount: { fontSize: fontSizes.body },
  invoiceTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: spacing.md,
  },
  totalLabel: { fontSize: fontSizes.body, fontWeight: fontWeights.bold },
  totalAmount: { fontSize: fontSizes.heading, fontWeight: fontWeights.bold },

  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  paymentIcon: { width: 36, height: 36, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  paymentName: { fontSize: fontSizes.body, fontWeight: fontWeights.semibold },
  paymentDesc: { fontSize: fontSizes.caption },
  radio: { width: 20, height: 20, borderRadius: radius.full, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: radius.full },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  errorText: { flex: 1, fontSize: fontSizes.caption },

  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
  },
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  footerLabel: { fontSize: fontSizes.caption },
  footerAmount: { fontSize: fontSizes.heading, fontWeight: fontWeights.bold },
  payBtn: { flex: 1 },

  modalContent: { gap: spacing.md, alignItems: 'center', paddingTop: spacing.xs },
  modalIconRing: { width: 64, height: 64, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  modalBodyText: { fontSize: fontSizes.body, textAlign: 'center', lineHeight: lineHeights.body },
  modalActions: { alignSelf: 'stretch', gap: spacing.sm, marginTop: spacing.sm },

  priceChangeComparison: {
    alignSelf: 'stretch',
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.xs,
  },
  priceChangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceChangeLabel: {
    fontSize: fontSizes.body,
  },
  priceChangeOldValue: {
    fontSize: fontSizes.body,
    textDecorationLine: 'line-through',
  },
  priceChangeNewValue: {
    fontSize: fontSizes.body,
  },
});
