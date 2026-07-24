import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton, BottomSheet, GlassButton, StatusBadge } from '@/components';
import { usePreferences } from '@/context/PreferencesContext';
import { bookingErrorMessage } from '@/i18n/bookingErrors';
import type { RootStackParamList } from '@/navigation/types';
import { createBooking, findOverlappingBookings } from '@/services/bookingService';
import {
  getChargePointsByStation,
  getConnectorsByStation,
  getStationById,
} from '@/services/stationService';
import { fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';
import type { Booking, ChargePoint, Connector, PaymentMethod, Station } from '@/types';
import { formatDate, formatTime, formatTimeRange, formatVnd, splitDuration } from '@/utils/format';
import { PAYMENT_META, SELECTABLE_PAYMENT_METHODS } from '@/utils/payments';
import { quoteBooking } from '@/utils/pricing';

type Nav = NativeStackNavigationProp<RootStackParamList, 'BookingConfirmation'>;
type Route = RouteProp<RootStackParamList, 'BookingConfirmation'>;

/**
 * "Xác nhận đặt chỗ" — review chosen time range, see invoice, pick payment method, create booking.
 * Includes BR-BOK-08 duplicate/overlapping booking warning modal & dynamic Dark/Light mode theme support.
 */
export function BookingConfirmationScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { t } = useTranslation();
  const { themeColors, isDark } = usePreferences();

  const [station, setStation] = useState<Station | null>(null);
  const [connector, setConnector] = useState<Connector | null>(null);
  const [chargePoint, setChargePoint] = useState<ChargePoint | null>(null);
  const [loading, setLoading] = useState(true);
  const [method, setMethod] = useState<PaymentMethod>('MOMO');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Duplicate booking warning state (BR-BOK-08)
  const [overlappingBooking, setOverlappingBooking] = useState<Booking | null>(null);
  const [showOverlapModal, setShowOverlapModal] = useState(false);

  const endAt = useMemo(
    () => new Date(new Date(params.startAt).getTime() + params.durationMin * 60_000).toISOString(),
    [params.startAt, params.durationMin],
  );

  useEffect(() => {
    let active = true;
    Promise.all([
      getStationById(params.stationId),
      getConnectorsByStation(params.stationId),
      getChargePointsByStation(params.stationId),
      findOverlappingBookings(params.startAt, endAt),
    ]).then(([s, connectors, points, overlaps]) => {
      if (!active) return;
      const picked = connectors.find((c) => c.id === params.connectorId) ?? null;
      setStation(s);
      setConnector(picked);
      setChargePoint(points.find((p) => p.id === picked?.chargePointId) ?? null);
      setLoading(false);

      if (overlaps.length > 0) {
        setOverlappingBooking(overlaps[0]);
        setShowOverlapModal(true);
      }
    });
    return () => {
      active = false;
    };
  }, [params.stationId, params.connectorId, params.startAt, endAt]);

  const quote = useMemo(
    () => (connector ? quoteBooking(connector, params.startAt, params.durationMin) : null),
    [connector, params.startAt, params.durationMin],
  );

  const previewCode = useMemo(() => `CO-${String(Date.now()).slice(-4)}`, []);

  function durationLabel(min: number): string {
    const { hours, minutes } = splitDuration(min);
    if (hours === 0) return t('timeRangePicker.durationMin', { minutes });
    if (minutes === 0) return t('timeRangePicker.durationHour', { hours });
    return t('timeRangePicker.durationHourMin', { hours, minutes });
  }

  async function submitBooking() {
    if (!connector) return;
    setSubmitting(true);
    setError(null);
    try {
      const booking = await createBooking({
        stationId: params.stationId,
        connectorId: connector.id,
        startAt: params.startAt,
        durationMin: params.durationMin,
        paymentMethod: method,
      });
      navigation.replace('PaymentProcessing', { bookingId: booking.id });
    } catch (e) {
      const msg = bookingErrorMessage(t, e);
      setError(msg);
      Alert.alert(t('bookingConfirmation.errorTitle'), msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !station || !connector || !quote) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top', 'bottom']}>
        <ActivityIndicator color={themeColors.primary} style={styles.loader} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
        <GlassButton
          size={40}
          glassEffectStyle="regular"
          fallbackColor={themeColors.surfaceAlt}
          accessibilityLabel={t('common.back')}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={22} color={themeColors.textStrong} />
        </GlassButton>
        <Text style={[styles.headerTitle, { color: themeColors.textStrong }]}>{t('bookingConfirmation.title')}</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Station summary */}
        <View style={[styles.card, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <Text style={[styles.stationName, { color: themeColors.textStrong }]}>{station.name}</Text>
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={14} color={themeColors.textMuted} />
            <Text style={[styles.metaText, { color: themeColors.textMuted }]} numberOfLines={1}>
              {station.address}
            </Text>
          </View>
          <View style={[styles.connectorPill, { backgroundColor: themeColors.surfaceAlt }]}>
            <Ionicons name="flash-outline" size={14} color={themeColors.primary} />
            <Text style={[styles.connectorText, { color: themeColors.textStrong }]}>
              {chargePoint?.name ?? ''} · {connector.name} ({connector.connectorType}) · {connector.powerKw} kW
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
            <StatusBadge variant="neutral" label={previewCode} />
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

          <View style={styles.invoiceRow}>
            <Text style={[styles.invoiceFeeLabel, { color: themeColors.textMuted }]}>{t('bookingConfirmation.serviceFee')}</Text>
            <Text style={[styles.invoiceFeeAmount, { color: themeColors.textStrong }]}>{formatVnd(quote.serviceFee)}</Text>
          </View>

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
            return (
              <Pressable
                key={pm}
                style={[
                  styles.paymentRow,
                  {
                    backgroundColor: isSel ? themeColors.primarySoft : themeColors.surfaceAlt,
                    borderColor: isSel ? themeColors.primary : themeColors.border,
                  },
                ]}
                onPress={() => setMethod(pm)}
              >
                <View style={[styles.paymentIcon, { backgroundColor: `${meta.color}1A` }]}>
                  <Ionicons name={meta.icon} size={20} color={meta.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.paymentName, { color: themeColors.textStrong }]}>{t(`payment.${pm}`)}</Text>
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
      <View style={[styles.footer, { backgroundColor: themeColors.surface, borderTopColor: themeColors.border }]}>
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
});
