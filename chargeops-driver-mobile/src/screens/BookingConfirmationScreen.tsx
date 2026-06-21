import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton, GlassButton, StatusBadge } from '@/components';
import { bookingErrorMessage } from '@/i18n/bookingErrors';
import type { RootStackParamList } from '@/navigation/types';
import { SERVICE_FEE, createBooking } from '@/services/bookingService';
import { getChargersByStation, getStationById } from '@/services/stationService';
import { colors, fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';
import type { Charger, PaymentMethod, Station } from '@/types';
import { formatDate, formatTimeRange, formatVnd } from '@/utils/format';
import { PAYMENT_META, SELECTABLE_PAYMENT_METHODS } from '@/utils/payments';

type Nav = NativeStackNavigationProp<RootStackParamList, 'BookingConfirmation'>;
type Route = RouteProp<RootStackParamList, 'BookingConfirmation'>;

/**
 * "Xác nhận đặt chỗ" — review the chosen slots, see the invoice, pick a payment
 * method, then create the booking. The booking is only created here (after
 * "pay"), not on the slot-picker step.
 */
export function BookingConfirmationScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { t } = useTranslation();

  const [station, setStation] = useState<Station | null>(null);
  const [charger, setCharger] = useState<Charger | null>(null);
  const [loading, setLoading] = useState(true);
  const [method, setMethod] = useState<PaymentMethod>('MOMO');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([getStationById(params.stationId), getChargersByStation(params.stationId)]).then(
      ([s, chargers]) => {
        if (!active) return;
        setStation(s);
        setCharger(chargers.find((c) => c.id === params.chargerId) ?? null);
        setLoading(false);
      },
    );
    return () => {
      active = false;
    };
  }, [params.stationId, params.chargerId]);

  const sortedSlots = useMemo(
    () => [...params.slots].sort((a, b) => (a.startAt < b.startAt ? -1 : 1)),
    [params.slots],
  );
  const first = sortedSlots[0];
  const last = sortedSlots[sortedSlots.length - 1];
  const chargingFee = useMemo(() => sortedSlots.reduce((sum, s) => sum + s.price, 0), [sortedSlots]);
  const total = chargingFee + SERVICE_FEE;
  // Pseudo invoice id for display until the booking exists (real code on success).
  const previewCode = useMemo(() => `CO-${String(Date.now()).slice(-4)}`, []);

  async function handlePay() {
    if (!charger) return;
    setSubmitting(true);
    setError(null);
    try {
      // Create the booking as PENDING, then hand off to the payment-processing
      // screen which waits for the gateway to settle before showing success.
      const booking = await createBooking({
        stationId: params.stationId,
        chargerId: charger.id,
        slots: sortedSlots,
        paymentMethod: method,
      });
      // Replace so the user can't go "back" into payment and pay again.
      navigation.replace('PaymentProcessing', { bookingId: booking.id });
    } catch (e) {
      // Booking creation edge cases (slot taken / network) — let the user retry.
      setError(bookingErrorMessage(t, e));
    } finally {
      setSubmitting(false);
    }
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

      {loading || !station || !charger || !first ? (
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
                {charger.chargerType === 'DC' && (
                  <StatusBadge variant="success" label={t('stationDetail.status.AVAILABLE')} />
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
                <Text style={styles.detailValue}>{formatDate(first.startAt)}</Text>
              </View>
              <View style={styles.detailBox}>
                <View style={styles.detailLabelRow}>
                  <Ionicons name="time-outline" size={14} color={colors.primary} />
                  <Text style={styles.detailLabel}>{t('bookingConfirm.time')}</Text>
                </View>
                <Text style={styles.detailValue}>{formatTimeRange(first.startAt, last.endAt)}</Text>
              </View>
            </View>

            <View style={styles.chargerBox}>
              <View style={styles.chargerIcon}>
                <Ionicons name="flash" size={20} color={colors.primaryDark} />
              </View>
              <View style={styles.chargerBody}>
                <Text style={styles.detailLabel}>{t('bookingConfirm.charger')}</Text>
                <Text style={styles.detailValue}>
                  {t('bookingConfirm.chargerValue', {
                    name: charger.name,
                    power: charger.powerKw,
                    connector: charger.connectorType,
                  })}
                </Text>
              </View>
            </View>

            {/* Invoice */}
            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>{t('bookingConfirm.invoiceTitle')}</Text>
            <View style={styles.invoiceRow}>
              <Text style={styles.invoiceLabel}>
                {t('bookingConfirm.chargingFee', { count: sortedSlots.length })}
              </Text>
              <Text style={styles.invoiceValue}>{formatVnd(chargingFee)}</Text>
            </View>
            <View style={styles.invoiceRow}>
              <Text style={styles.invoiceLabel}>{t('bookingConfirm.serviceFee')}</Text>
              <Text style={styles.invoiceValue}>{formatVnd(SERVICE_FEE)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.invoiceRow}>
              <Text style={styles.totalLabel}>{t('bookingConfirm.total')}</Text>
              <Text style={styles.totalValue}>{formatVnd(total)}</Text>
            </View>

            {/* Refund policy (green) */}
            <View style={styles.refundCard}>
              <View style={styles.refundHeader}>
                <Ionicons name="shield-checkmark-outline" size={18} color={colors.primaryDark} />
                <Text style={styles.refundTitle}>{t('bookingConfirm.refundTitle')}</Text>
              </View>
              {[
                t('bookingConfirm.refund1'),
                t('bookingConfirm.refund2'),
                t('bookingConfirm.refund3'),
              ].map((line, i) => (
                <View key={i} style={styles.refundLine}>
                  <Ionicons
                    name={i === 2 ? 'information-circle-outline' : 'checkmark-circle-outline'}
                    size={15}
                    color={i === 2 ? colors.textMuted : colors.primary}
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
                <Text style={styles.footerTotal}>{formatVnd(total)}</Text>
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
