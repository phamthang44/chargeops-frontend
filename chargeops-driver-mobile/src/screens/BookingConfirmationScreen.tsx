import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton, GlassButton, StatusBadge } from '@/components';
import { bookingErrorMessage } from '@/i18n/bookingErrors';
import type { RootStackParamList } from '@/navigation/types';
import { createBooking, findOverlappingBookings } from '@/services/bookingService';
import {
  getChargePointsByStation,
  getConnectorsByStation,
  getStationById,
} from '@/services/stationService';
import { colors, fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';
import type { ChargePoint, Connector, PaymentMethod, Station } from '@/types';
import { formatDate, formatTime, formatTimeRange, formatVnd, splitDuration } from '@/utils/format';
import { PAYMENT_META, SELECTABLE_PAYMENT_METHODS } from '@/utils/payments';
import { quoteBooking } from '@/utils/pricing';

type Nav = NativeStackNavigationProp<RootStackParamList, 'BookingConfirmation'>;
type Route = RouteProp<RootStackParamList, 'BookingConfirmation'>;

/**
 * "Xác nhận đặt chỗ" — review the chosen time range, see the invoice, pick a
 * payment method, then create the booking. The booking is only created here
 * (after "pay"), not on the time-range step.
 */
export function BookingConfirmationScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { t } = useTranslation();

  const [station, setStation] = useState<Station | null>(null);
  const [connector, setConnector] = useState<Connector | null>(null);
  const [chargePoint, setChargePoint] = useState<ChargePoint | null>(null);
  const [loading, setLoading] = useState(true);
  const [method, setMethod] = useState<PaymentMethod>('MOMO');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      getStationById(params.stationId),
      getConnectorsByStation(params.stationId),
      getChargePointsByStation(params.stationId),
    ]).then(([s, connectors, points]) => {
      if (!active) return;
      const picked = connectors.find((c) => c.id === params.connectorId) ?? null;
      setStation(s);
      setConnector(picked);
      setChargePoint(points.find((p) => p.id === picked?.chargePointId) ?? null);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [params.stationId, params.connectorId]);

  const endAt = useMemo(
    () => new Date(new Date(params.startAt).getTime() + params.durationMin * 60_000).toISOString(),
    [params.startAt, params.durationMin],
  );
  // Same pure quote the picker showed and the booking will snapshot.
  const quote = useMemo(
    () => (connector ? quoteBooking(connector, params.startAt, params.durationMin) : null),
    [connector, params.startAt, params.durationMin],
  );
  // Pseudo invoice id for display until the booking exists (real code on success).
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
      // Create the booking as PENDING, then hand off to the payment-processing
      // screen which waits for the gateway to settle before showing success.
      const booking = await createBooking({
        stationId: params.stationId,
        connectorId: connector.id,
        startAt: params.startAt,
        durationMin: params.durationMin,
        paymentMethod: method,
      });
      // Replace so the user can't go "back" into payment and pay again.
      navigation.replace('PaymentProcessing', { bookingId: booking.id });
    } catch (e) {
      // Booking creation edge cases (range taken / network) — let the user retry.
      setError(bookingErrorMessage(t, e));
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePay() {
    if (!connector) return;
    // BR-BOK-08: holding two bookings over the same hours on different ports is
    // allowed, but it is nearly always a mistake — warn before committing, and
    // let the driver proceed if they meant it.
    const clashes = await findOverlappingBookings(params.startAt, endAt, connector.id);
    if (clashes.length > 0) {
      const other = clashes[0];
      Alert.alert(
        t('bookingConfirm.overlapTitle'),
        t('bookingConfirm.overlapBody', {
          start: formatTime(other.startAt),
          end: formatTime(other.endAt),
          station: other.stationName,
        }),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('bookingConfirm.overlapConfirm'), onPress: () => void submitBooking() },
        ],
      );
      return;
    }
    await submitBooking();
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Custom header */}
      <View style={styles.header}>
        <GlassButton
          size={40}
          glassEffectStyle="regular"
          fallbackColor={colors.surfaceAlt}
          accessibilityLabel={t('common.back')}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={22} color={colors.textStrong} />
        </GlassButton>
        <Text style={styles.headerTitle}>{t('bookingConfirm.title')}</Text>
        <View style={styles.headerBtn} />
      </View>

      {loading || !station || !connector || !quote ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : (
        <>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Station summary */}
            <View style={styles.stationCard}>
              <View style={styles.stationThumb}>
                <Ionicons name="flash" size={26} color={colors.primaryDark} />
              </View>
              <View style={styles.stationBody}>
                {connector.currentType === 'DC' && (
                  <StatusBadge variant="success" label={t('bookingConfirm.fastCharge')} />
                )}
                <Text style={styles.stationName} numberOfLines={2}>
                  {station.name}
                </Text>
                <Text style={styles.stationAddr} numberOfLines={2}>
                  {station.address}
                </Text>
              </View>
            </View>

            {/* Booking details */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>{t('bookingConfirm.detailTitle')}</Text>
              <View style={styles.idPill}>
                <Text style={styles.idPillText}>{t('bookingConfirm.bookingId', { code: previewCode })}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailBox}>
                <View style={styles.detailLabelRow}>
                  <Ionicons name="calendar-outline" size={14} color={colors.primary} />
                  <Text style={styles.detailLabel}>{t('bookingConfirm.date')}</Text>
                </View>
                <Text style={styles.detailValue}>{formatDate(params.startAt)}</Text>
              </View>
              <View style={styles.detailBox}>
                <View style={styles.detailLabelRow}>
                  <Ionicons name="time-outline" size={14} color={colors.primary} />
                  <Text style={styles.detailLabel}>{t('bookingConfirm.time')}</Text>
                </View>
                <Text style={styles.detailValue}>{formatTimeRange(params.startAt, endAt)}</Text>
                <Text style={styles.detailSub}>{durationLabel(params.durationMin)}</Text>
              </View>
            </View>

            <View style={styles.chargerBox}>
              <View style={styles.chargerIcon}>
                <Ionicons name="flash" size={20} color={colors.primaryDark} />
              </View>
              <View style={styles.chargerBody}>
                <Text style={styles.detailLabel}>{t('bookingConfirm.connector')}</Text>
                <Text style={styles.detailValue}>
                  {t('bookingConfirm.connectorValue', {
                    chargePoint: chargePoint?.name ?? '',
                    name: connector.name,
                    power: connector.powerKw,
                    connector: connector.connectorType,
                  })}
                </Text>
                {chargePoint?.zoneLabel && (
                  <Text style={styles.detailSub}>{chargePoint.zoneLabel}</Text>
                )}
              </View>
            </View>

            {/* Invoice — one line per TOU band the window crosses (BookingPriceLine) */}
            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>{t('bookingConfirm.invoiceTitle')}</Text>
            {quote.priceLines.map((line, i) => (
              <View key={i} style={styles.invoiceRow}>
                <View style={styles.flex1}>
                  <Text style={styles.invoiceLabel}>
                    {formatTimeRange(line.fromAt, line.toAt)} ·{' '}
                    {t(`timeRangePicker.band.${line.rateKind}`)}
                  </Text>
                  <Text style={styles.invoiceSub}>
                    {t('bookingConfirm.lineDetail', {
                      kwh: line.energyKwh,
                      rate: formatVnd(line.rateVndPerKwh),
                    })}
                  </Text>
                </View>
                <Text style={styles.invoiceValue}>{formatVnd(line.amount)}</Text>
              </View>
            ))}
            <View style={styles.invoiceRow}>
              <Text style={styles.invoiceLabel}>{t('bookingConfirm.serviceFee')}</Text>
              <Text style={styles.invoiceValue}>{formatVnd(quote.serviceFee)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.invoiceRow}>
              <Text style={styles.totalLabel}>{t('bookingConfirm.total')}</Text>
              <Text style={styles.totalValue}>{formatVnd(quote.totalPrice)}</Text>
            </View>

            {/* Refund policy (green) — grace period first, then the time tiers */}
            <View style={styles.refundCard}>
              <View style={styles.refundHeader}>
                <Ionicons name="shield-checkmark-outline" size={18} color={colors.primaryDark} />
                <Text style={styles.refundTitle}>{t('bookingConfirm.refundTitle')}</Text>
              </View>
              {[
                t('bookingConfirm.refundGrace'),
                t('bookingConfirm.refund1'),
                t('bookingConfirm.refund2'),
                t('bookingConfirm.refund3'),
              ].map((line, i) => (
                <View key={i} style={styles.refundLine}>
                  <Ionicons
                    name={i === 3 ? 'information-circle-outline' : 'checkmark-circle-outline'}
                    size={15}
                    color={i === 3 ? colors.textMuted : colors.primary}
                  />
                  <Text style={styles.refundText}>{line}</Text>
                </View>
              ))}
            </View>

            {/* Payment methods */}
            <Text style={styles.sectionTitle}>{t('payment.title')}</Text>
            <View style={styles.methods}>
              {SELECTABLE_PAYMENT_METHODS.map((m) => {
                const meta = PAYMENT_META[m];
                const active = m === method;
                return (
                  <Pressable
                    key={m}
                    onPress={() => setMethod(m)}
                    style={[styles.method, active && styles.methodActive]}
                  >
                    <View style={[styles.methodIcon, { backgroundColor: `${meta.color}1A` }]}>
                      <Ionicons name={meta.icon} size={20} color={meta.color} />
                    </View>
                    <Text style={styles.methodLabel}>{t(`payment.${m}`)}</Text>
                    <Ionicons
                      name={active ? 'radio-button-on' : 'radio-button-off'}
                      size={22}
                      color={active ? colors.primary : colors.border}
                    />
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          {/* Footer: total + pay CTA */}
          <View style={styles.footer}>
            {error && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color={colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
            <View style={styles.footerTop}>
              <View>
                <Text style={styles.footerTotalLabel}>{t('bookingConfirm.totalToPay')}</Text>
                <Text style={styles.footerTotal}>{formatVnd(quote.totalPrice)}</Text>
              </View>
              <View style={styles.secureRow}>
                <Ionicons name="lock-closed" size={14} color={colors.primary} />
                <Text style={styles.secureText}>{t('bookingConfirm.secure')}</Text>
              </View>
            </View>
            <AppButton label={t('bookingConfirm.cta')} loading={submitting} onPress={handlePay} />
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex1: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerBtn: { width: 40, height: 40 },
  headerTitle: { fontSize: fontSizes.heading, fontWeight: fontWeights.semibold, color: colors.textStrong },
  loader: { marginTop: spacing.xl },
  scroll: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },

  // Station summary
  stationCard: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  stationThumb: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stationBody: { flex: 1, gap: spacing.xs },
  stationName: { fontSize: fontSizes.body, fontWeight: fontWeights.bold, color: colors.textStrong },
  stationAddr: { fontSize: fontSizes.caption, color: colors.textMuted, lineHeight: lineHeights.caption },

  // Section
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  sectionTitle: { fontSize: fontSizes.heading, fontWeight: fontWeights.bold, color: colors.textStrong },
  idPill: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  idPillText: { fontSize: fontSizes.caption, color: colors.textMuted, fontWeight: fontWeights.medium },

  // Detail boxes
  detailRow: { flexDirection: 'row', gap: spacing.md },
  detailBox: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  detailLabelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  detailLabel: { fontSize: fontSizes.caption, fontWeight: fontWeights.semibold, color: colors.textMuted, letterSpacing: 0.5 },
  detailValue: { fontSize: fontSizes.body, fontWeight: fontWeights.bold, color: colors.textStrong },
  detailSub: { fontSize: fontSizes.caption, color: colors.textMuted },
  chargerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  chargerIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chargerBody: { flex: 1, gap: spacing.xs },

  // Invoice
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.xs },
  invoiceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  invoiceLabel: { fontSize: fontSizes.body, color: colors.textBody },
  invoiceSub: { fontSize: fontSizes.caption, color: colors.textMuted },
  invoiceValue: { fontSize: fontSizes.body, color: colors.textStrong, fontWeight: fontWeights.medium },
  totalLabel: { fontSize: fontSizes.heading, fontWeight: fontWeights.bold, color: colors.textStrong },
  totalValue: { fontSize: fontSizes.heading, fontWeight: fontWeights.bold, color: colors.primary },

  // Refund (green tint)
  refundCard: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  refundHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  refundTitle: { fontSize: fontSizes.body, fontWeight: fontWeights.bold, color: colors.primaryDark },
  refundLine: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  refundText: { flex: 1, fontSize: fontSizes.caption, color: colors.textBody, lineHeight: lineHeights.body },

  // Payment methods
  methods: { gap: spacing.sm },
  method: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  methodActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  methodIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodLabel: { flex: 1, fontSize: fontSizes.body, fontWeight: fontWeights.medium, color: colors.textStrong },

  // Footer
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.md,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: `${colors.error}14`,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  errorText: { flex: 1, fontSize: fontSizes.caption, color: colors.error, fontWeight: fontWeights.medium },
  footerTop: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  footerTotalLabel: { fontSize: fontSizes.caption, color: colors.textMuted, letterSpacing: 0.5 },
  footerTotal: { fontSize: fontSizes.title, fontWeight: fontWeights.bold, color: colors.textStrong },
  secureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingBottom: spacing.xs },
  secureText: { fontSize: fontSizes.caption, color: colors.primary, fontWeight: fontWeights.medium },
});
