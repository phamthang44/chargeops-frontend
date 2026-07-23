import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton, GlassButton, StatusBadge } from '@/components';
import type { RootStackParamList } from '@/navigation/types';
import { getBusyRanges } from '@/services/bookingService';
import {
  getChargePointsByStation,
  getConnectorsByStation,
  getStationById,
} from '@/services/stationService';
import { colors, fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';
import type { ChargePoint, Connector, Station } from '@/types';
import {
  earliestStartMin,
  formatMinutes,
  getUpcomingDates,
  isoAtMinutes,
  type BusyRange,
} from '@/utils/availability';
import { effectiveConnectorStatus } from '@/utils/connectors';
import { formatVnd, splitDuration } from '@/utils/format';
import { quoteBooking } from '@/utils/pricing';

type Nav = NativeStackNavigationProp<RootStackParamList, 'TimeRangePicker'>;
type Route = RouteProp<RootStackParamList, 'TimeRangePicker'>;

/** The booking quantum: bookable time is chosen in 30-minute slots. */
const SLOT_MIN = 30;

interface SlotCell {
  startMin: number;
  startAt: string;
  booked: boolean;
  /** Charging cost of this 30-minute slot (TOU rate for its band), fee excluded. */
  price: number;
}

/**
 * "Chọn khung giờ" — step 3 of the booking flow (FR05/FR11).
 *
 * The day is shown as a grid of 30-minute slots. The driver taps a start slot,
 * then taps another free slot to stretch a contiguous range (06:00–06:30, or
 * 06:00–08:00 …) — always in 30-minute steps, which keeps the range trivial to
 * validate here and on the backend. A booking still reserves one continuous
 * range (start + duration); the slots are just the selection grid, not stored
 * entities (SRS §7).
 */
export function TimeRangePickerScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { t } = useTranslation();

  const dates = useMemo(() => getUpcomingDates(), []);
  const weekdays = t('timeRangePicker.weekdays', { returnObjects: true }) as string[];

  const [station, setStation] = useState<Station | null>(null);
  const [connector, setConnector] = useState<Connector | null>(null);
  const [chargePoint, setChargePoint] = useState<ChargePoint | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(dates[0]);
  const [busy, setBusy] = useState<BusyRange[]>([]);
  const [loading, setLoading] = useState(true);
  // Contiguous 30-minute slot selection: anchor = first tapped, focus = last.
  const [anchor, setAnchor] = useState<number | null>(null);
  const [focus, setFocus] = useState<number | null>(null);

  // Load the station and resolve which connector is being booked.
  useEffect(() => {
    let active = true;
    Promise.all([
      getStationById(params.stationId),
      getConnectorsByStation(params.stationId),
      getChargePointsByStation(params.stationId),
    ]).then(([s, connectors, points]) => {
      if (!active) return;
      setStation(s);
      const bookable = connectors.filter((c) => {
        const cp = points.find((p) => p.id === c.chargePointId);
        return cp && effectiveConnectorStatus(cp.status, c.runtimeStatus) === 'AVAILABLE';
      });
      const picked =
        connectors.find((c) => c.id === params.connectorId) ?? bookable[0] ?? connectors[0] ?? null;
      setConnector(picked);
      setChargePoint(points.find((p) => p.id === picked?.chargePointId) ?? null);
    });
    return () => {
      active = false;
    };
  }, [params.stationId, params.connectorId]);

  // Reload the day's occupancy whenever the connector or date changes.
  useEffect(() => {
    if (!connector) return;
    let active = true;
    setLoading(true);
    setAnchor(null); // selection is only meaningful for one day
    setFocus(null);
    getBusyRanges(connector.id, selectedDate.toISOString()).then((ranges) => {
      if (!active) return;
      setBusy(ranges);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [connector, selectedDate]);

  const opensAtMin = station?.opensAtMin ?? 0;
  const closesAtMin = station?.closesAtMin ?? 24 * 60;
  const earliestMin = useMemo(
    () => earliestStartMin(selectedDate, opensAtMin),
    [selectedDate, opensAtMin],
  );

  // Bookable 30-minute slots for the day: operating hours, dropping the past,
  // each flagged if a booking overlaps it. Adjacent array entries are exactly
  // 30 minutes apart, so a contiguous index range == a contiguous time range.
  const slots = useMemo<SlotCell[]>(() => {
    if (!connector) return [];
    const out: SlotCell[] = [];
    const first = Math.ceil(opensAtMin / SLOT_MIN) * SLOT_MIN;
    for (let s = first; s + SLOT_MIN <= closesAtMin; s += SLOT_MIN) {
      if (s < earliestMin) continue; // slot has already started
      const startAt = isoAtMinutes(selectedDate, s);
      const booked = busy.some((b) => s < b.toMin && b.fromMin < s + SLOT_MIN);
      out.push({ startMin: s, startAt, booked, price: quoteBooking(connector, startAt, SLOT_MIN).chargingFee });
    }
    return out;
  }, [connector, opensAtMin, closesAtMin, selectedDate, busy, earliestMin]);

  const selStart = anchor === null || focus === null ? null : Math.min(anchor, focus);
  const selEnd = anchor === null || focus === null ? null : Math.max(anchor, focus);
  const hasSel = selStart !== null && selEnd !== null;

  /** Every slot across an inclusive index range is free (no booking cuts through). */
  function rangeFree(a: number, b: number): boolean {
    for (let i = a; i <= b; i++) if (slots[i].booked) return false;
    return true;
  }

  /** Tap anchors a start; tapping another free slot stretches the range in 30-min steps. */
  function tapSlot(i: number) {
    if (slots[i].booked) return;
    if (anchor === null) {
      setAnchor(i);
      setFocus(i);
      return;
    }
    if (i === anchor && focus === anchor) {
      setAnchor(null); // tapping the lone selected slot clears it
      setFocus(null);
      return;
    }
    const a = Math.min(anchor, i);
    const b = Math.max(anchor, i);
    if (rangeFree(a, b)) setFocus(i);
    else {
      setAnchor(i); // a booking blocks the span — restart the selection here
      setFocus(i);
    }
  }

  const startAt = hasSel ? slots[selStart].startAt : null;
  const durationMin = hasSel ? (selEnd - selStart + 1) * SLOT_MIN : 0;
  const endMin = hasSel ? slots[selEnd].startMin + SLOT_MIN : 0;
  const slotCount = durationMin / SLOT_MIN;

  const quote = useMemo(
    () => (connector && startAt ? quoteBooking(connector, startAt, durationMin) : null),
    [connector, startAt, durationMin],
  );

  function handleContinue() {
    if (!connector || !startAt) return;
    navigation.navigate('BookingConfirmation', {
      stationId: params.stationId,
      connectorId: connector.id,
      startAt,
      durationMin,
    });
  }

  const monthLabel = t('timeRangePicker.monthYear', {
    month: selectedDate.getMonth() + 1,
    year: selectedDate.getFullYear(),
  });

  function durationLabel(min: number): string {
    const { hours, minutes } = splitDuration(min);
    if (hours === 0) return t('timeRangePicker.durationMin', { minutes });
    if (minutes === 0) return t('timeRangePicker.durationHour', { hours });
    return t('timeRangePicker.durationHourMin', { hours, minutes });
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
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
        <Text style={styles.headerTitle}>{t('timeRangePicker.title')}</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Date */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="calendar-outline" size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>{t('timeRangePicker.selectDate')}</Text>
          </View>
          <Text style={styles.monthLabel}>{monthLabel}</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateRow}>
          {dates.map((d) => {
            const active = d.getTime() === selectedDate.getTime();
            return (
              <Pressable
                key={d.toISOString()}
                onPress={() => setSelectedDate(d)}
                style={[styles.dateCard, active && styles.dateCardActive]}
              >
                <Text style={[styles.dateWeekday, active && styles.dateTextActive]}>
                  {weekdays[d.getDay()]}
                </Text>
                <Text style={[styles.dateDay, active && styles.dateTextActive]}>{d.getDate()}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Which port is being booked — zone label included so the driver can find it */}
        {connector && chargePoint && station && (
          <View style={styles.connectorCard}>
            <View style={styles.connectorIcon}>
              <Ionicons name="flash" size={22} color={colors.primaryDark} />
            </View>
            <View style={styles.connectorBody}>
              <Text style={styles.connectorName}>
                {chargePoint.name} · {connector.name}
              </Text>
              <Text style={styles.connectorSub} numberOfLines={1}>
                {chargePoint.zoneLabel ?? station.name}
              </Text>
              <View style={styles.connectorMetaRow}>
                <StatusBadge variant="success" label={connector.connectorType} />
                <Text style={styles.connectorMeta}>
                  {connector.powerKw} kW · {t('timeRangePicker.openUntil', {
                    time: formatMinutes(Math.min(closesAtMin, 1439)),
                  })}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Availability for the day */}
        <View style={styles.sectionTitleRow}>
          <Ionicons name="time-outline" size={18} color={colors.primary} />
          <Text style={styles.sectionTitle}>{t('timeRangePicker.availability')}</Text>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : slots.length === 0 ? (
          <Text style={styles.empty}>{t('timeRangePicker.empty')}</Text>
        ) : (
          <>
            <View style={styles.slotHint}>
              <Ionicons name="hand-left-outline" size={15} color={colors.primary} />
              <Text style={styles.slotHintText}>{t('timeRangePicker.slotHint')}</Text>
            </View>

            <View style={styles.grid}>
              {slots.map((sl, i) => {
                const selected = hasSel && i >= selStart! && i <= selEnd!;
                return (
                  <Pressable
                    key={sl.startMin}
                    disabled={sl.booked}
                    onPress={() => tapSlot(i)}
                    style={[styles.slot, selected && styles.slotSel, sl.booked && styles.slotBooked]}
                  >
                    <Text
                      style={[styles.slotTime, selected && styles.slotTimeSel, sl.booked && styles.slotTimeDim]}
                    >
                      {formatMinutes(sl.startMin)}
                    </Text>
                    {sl.booked ? (
                      <Text style={styles.slotTag}>{t('timeRangePicker.slotBooked')}</Text>
                    ) : (
                      <Text style={[styles.slotPrice, selected && styles.slotPriceSel]}>
                        {formatVnd(sl.price)}
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendSw, styles.swFree]} />
                <Text style={styles.legendText}>{t('timeRangePicker.legendFree')}</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendSw, styles.swSel]} />
                <Text style={styles.legendText}>{t('timeRangePicker.legendSelected')}</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendSw, styles.swBooked]} />
                <Text style={styles.legendText}>{t('timeRangePicker.legendBooked')}</Text>
              </View>
            </View>
          </>
        )}

        {/* Price breakdown — one line per TOU band the window crosses */}
        {quote && startAt && (
          <View style={styles.priceCard}>
            <Text style={styles.priceTitle}>{t('timeRangePicker.priceTitle')}</Text>
            {quote.priceLines.map((line, i) => (
              <View key={i} style={styles.priceRow}>
                <View style={styles.priceLineLeft}>
                  <Text style={styles.priceRange}>
                    {formatMinutes(
                      new Date(line.fromAt).getHours() * 60 + new Date(line.fromAt).getMinutes(),
                    )}
                    –
                    {formatMinutes(
                      new Date(line.toAt).getHours() * 60 + new Date(line.toAt).getMinutes(),
                    )}
                  </Text>
                  <Text style={styles.priceBand}>
                    {t(`timeRangePicker.band.${line.rateKind}`)} ·{' '}
                    {t('timeRangePicker.perKwh', { rate: formatVnd(line.rateVndPerKwh) })}
                  </Text>
                </View>
                <Text style={styles.priceAmount}>{formatVnd(line.amount)}</Text>
              </View>
            ))}
            <View style={styles.priceRow}>
              <Text style={styles.priceBand}>
                {t('timeRangePicker.estEnergy', { kwh: quote.energyKwh })}
              </Text>
              <Text style={styles.priceBand}>{t('timeRangePicker.serviceFee')}: {formatVnd(quote.serviceFee)}</Text>
            </View>
            <View style={styles.priceTotalRow}>
              <Text style={styles.priceTotalLabel}>{t('timeRangePicker.total')}</Text>
              <Text style={styles.priceTotal}>{formatVnd(quote.totalPrice)}</Text>
            </View>
          </View>
        )}

        {/* Refund policy (FR08, grace period first) */}
        <View style={styles.refundCard}>
          <Ionicons name="alert-circle-outline" size={20} color={colors.warning} />
          <View style={styles.refundBody}>
            <Text style={styles.refundTitle}>{t('timeRangePicker.refundTitle')}</Text>
            <Text style={styles.refundText}>{t('timeRangePicker.refundBody')}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer: chosen range + gated CTA */}
      <View style={styles.footer}>
        {!hasSel ? (
          <View style={styles.hint}>
            <Ionicons name="time-outline" size={16} color={colors.textMuted} />
            <Text style={styles.hintText}>{t('timeRangePicker.selectHint')}</Text>
          </View>
        ) : (
          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.summaryLabel}>{t('timeRangePicker.selectedWindow')}</Text>
              <Text style={styles.summaryValue}>
                {formatMinutes(slots[selStart!].startMin)} – {formatMinutes(endMin)}
              </Text>
              <Text style={styles.summarySub}>
                {t('timeRangePicker.slotSummary', { count: slotCount, duration: durationLabel(durationMin) })}
              </Text>
            </View>
            <View style={styles.summaryTotalBlock}>
              <Text style={styles.summaryLabel}>{t('timeRangePicker.total')}</Text>
              <Text style={styles.summaryTotal}>{formatVnd(quote?.totalPrice ?? 0)}</Text>
            </View>
          </View>
        )}
        <AppButton label={t('timeRangePicker.cta')} disabled={!hasSel} onPress={handleContinue} />
      </View>
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
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: fontSizes.heading, fontWeight: fontWeights.semibold, color: colors.textStrong },
  scroll: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sectionTitle: { fontSize: fontSizes.heading, fontWeight: fontWeights.bold, color: colors.textStrong },
  monthLabel: { fontSize: fontSizes.body, color: colors.textMuted },

  // Date strip
  dateRow: { gap: spacing.sm, paddingVertical: spacing.xs },
  dateCard: {
    width: 64,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    gap: spacing.xs,
  },
  dateCardActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dateWeekday: { fontSize: fontSizes.caption, fontWeight: fontWeights.medium, color: colors.textMuted },
  dateDay: { fontSize: fontSizes.heading, fontWeight: fontWeights.bold, color: colors.textStrong },
  dateTextActive: { color: colors.textInverse },

  // Connector summary
  connectorCard: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  connectorIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectorBody: { flex: 1, gap: spacing.xs },
  connectorName: { fontSize: fontSizes.body, fontWeight: fontWeights.bold, color: colors.textStrong },
  connectorSub: { fontSize: fontSizes.caption, color: colors.textMuted },
  connectorMetaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  connectorMeta: { fontSize: fontSizes.caption, color: colors.textMuted },

  loader: { marginVertical: spacing.xl },
  empty: { fontSize: fontSizes.body, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.lg },

  // Slot grid instruction
  slotHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  slotHintText: { flex: 1, fontSize: fontSizes.caption, fontWeight: fontWeights.medium, color: colors.primaryDark, lineHeight: lineHeights.caption },

  // 30-minute slot grid (2 columns)
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  slot: {
    width: '48%',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: 2,
  },
  slotSel: { backgroundColor: colors.primary, borderColor: colors.primary },
  slotBooked: { backgroundColor: colors.surfaceAlt, borderColor: colors.border, opacity: 0.7 },
  slotTime: { fontSize: fontSizes.body, fontWeight: fontWeights.bold, color: colors.textStrong },
  slotTimeSel: { color: colors.textInverse },
  slotTimeDim: { color: colors.textMuted, textDecorationLine: 'line-through' },
  slotPrice: { fontSize: fontSizes.caption, color: colors.textMuted },
  slotPriceSel: { color: colors.textInverse, opacity: 0.85 },
  slotTag: { fontSize: fontSizes.caption, color: colors.textMuted, fontWeight: fontWeights.medium },

  // Legend
  legendRow: { flexDirection: 'row', gap: spacing.lg },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendSw: { width: 12, height: 12, borderRadius: 3, borderWidth: 1 },
  swFree: { backgroundColor: colors.surface, borderColor: colors.border },
  swSel: { backgroundColor: colors.primary, borderColor: colors.primary },
  swBooked: { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
  legendText: { fontSize: fontSizes.caption, color: colors.textMuted, fontWeight: fontWeights.medium },

  // Price breakdown
  priceCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  priceTitle: { fontSize: fontSizes.body, fontWeight: fontWeights.bold, color: colors.textStrong },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  priceLineLeft: { flex: 1, gap: 2 },
  priceRange: { fontSize: fontSizes.body, fontWeight: fontWeights.semibold, color: colors.textBody },
  priceBand: { fontSize: fontSizes.caption, color: colors.textMuted },
  priceAmount: { fontSize: fontSizes.body, fontWeight: fontWeights.semibold, color: colors.textStrong },
  priceTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  priceTotalLabel: { fontSize: fontSizes.body, fontWeight: fontWeights.bold, color: colors.textStrong },
  priceTotal: { fontSize: fontSizes.heading, fontWeight: fontWeights.bold, color: colors.textStrong },

  // Refund policy (amber)
  refundCard: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: `${colors.warning}1A`,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  refundBody: { flex: 1, gap: spacing.xs },
  refundTitle: { fontSize: fontSizes.body, fontWeight: fontWeights.bold, color: colors.warning },
  refundText: { fontSize: fontSizes.caption, color: colors.textBody, lineHeight: lineHeights.body },

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
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  hintText: { fontSize: fontSizes.body, color: colors.textMuted },
  summaryRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  summaryLabel: { fontSize: fontSizes.caption, color: colors.textMuted },
  summaryValue: { fontSize: fontSizes.heading, fontWeight: fontWeights.bold, color: colors.textStrong },
  summarySub: { fontSize: fontSizes.caption, color: colors.textMuted, marginTop: 1 },
  summaryTotalBlock: { alignItems: 'flex-end' },
  summaryTotal: { fontSize: fontSizes.heading, fontWeight: fontWeights.bold, color: colors.textStrong },
});
