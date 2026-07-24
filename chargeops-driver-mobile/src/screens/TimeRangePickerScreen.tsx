import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton, GlassButton, StatusBadge } from '@/components';
import { usePreferences } from '@/context/PreferencesContext';
import type { RootStackParamList } from '@/navigation/types';
import { getBusyRanges } from '@/services/bookingService';
import {
  getChargePointsByStation,
  getConnectorsByStation,
  getStationById,
} from '@/services/stationService';
import { fontSizes, fontWeights, lineHeights, radius, spacing } from '@/theme';
import type { ChargePoint, Connector, Station } from '@/types';
import {
  earliestStartMin,
  formatMinutes,
  getUpcomingDates,
  isoAtMinutes,
  type BusyRange,
} from '@/utils/availability';
import { formatVnd, splitDuration } from '@/utils/format';
import { quoteBooking } from '@/utils/pricing';

type Nav = NativeStackNavigationProp<RootStackParamList, 'TimeRangePicker'>;
type Route = RouteProp<RootStackParamList, 'TimeRangePicker'>;

const SLOT_MIN = 30;

interface SlotCell {
  startMin: number;
  startAt: string;
  booked: boolean;
  price: number;
}

/**
 * "Chọn khung giờ" — step 3 of the booking flow. Dynamic theme & light/dark mode support.
 */
export function TimeRangePickerScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { t } = useTranslation();
  const { themeColors } = usePreferences();

  const dates = useMemo(() => getUpcomingDates(), []);
  const weekdays = t('timeRangePicker.weekdays', { returnObjects: true }) as string[];

  const [selectedDate, setSelectedDate] = useState<Date>(dates[0]);

  const [station, setStation] = useState<Station | null>(null);
  const [chargePoint, setChargePoint] = useState<ChargePoint | null>(null);
  const [connector, setConnector] = useState<Connector | null>(null);

  const [busy, setBusy] = useState<BusyRange[]>([]);
  const [loading, setLoading] = useState(true);

  const [anchor, setAnchor] = useState<number | null>(null);
  const [focus, setFocus] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      getStationById(params.stationId),
      getConnectorsByStation(params.stationId),
      getChargePointsByStation(params.stationId),
    ]).then(([st, conns, cps]) => {
      if (!active) return;
      setStation(st);
      const conn = conns.find((c) => c.id === params.connectorId) ?? conns[0];
      setConnector(conn ?? null);
      if (conn) {
        setChargePoint(cps.find((cp) => cp.id === conn.chargePointId) ?? null);
      }
    });
    return () => {
      active = false;
    };
  }, [params.stationId, params.connectorId]);

  useEffect(() => {
    if (!connector) return;
    let active = true;
    setLoading(true);
    getBusyRanges(connector.id, selectedDate.toISOString()).then((data) => {
      if (active) {
        setBusy(data);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [connector, selectedDate]);

  useEffect(() => {
    setAnchor(null);
    setFocus(null);
  }, [selectedDate]);

  const opensAtMin = station?.opensAtMin ?? 0;
  const closesAtMin = station?.closesAtMin ?? 1440;

  const isToday = selectedDate.toDateString() === new Date().toDateString();
  const minStartMin = isToday ? earliestStartMin(selectedDate, opensAtMin) : 0;

  const slots = useMemo<SlotCell[]>(() => {
    if (!connector) return [];
    const list: SlotCell[] = [];

    const firstSlot = Math.max(opensAtMin, Math.ceil(minStartMin / SLOT_MIN) * SLOT_MIN);
    const lastSlot = closesAtMin - SLOT_MIN;

    for (let m = firstSlot; m <= lastSlot; m += SLOT_MIN) {
      const startAtIso = isoAtMinutes(selectedDate, m);
      const slotEndMin = m + SLOT_MIN;

      const isBooked = busy.some((b) => m < b.toMin && slotEndMin > b.fromMin);

      const singleQuote = quoteBooking(connector, startAtIso, SLOT_MIN);

      list.push({
        startMin: m,
        startAt: startAtIso,
        booked: isBooked,
        price: singleQuote.chargingFee,
      });
    }

    return list;
  }, [connector, opensAtMin, closesAtMin, minStartMin, selectedDate, busy]);

  const hasSel = anchor !== null && focus !== null;
  const selStart = hasSel ? Math.min(anchor!, focus!) : null;
  const selEnd = hasSel ? Math.max(anchor!, focus!) : null;

  function rangeFree(a: number, b: number): boolean {
    for (let i = a; i <= b; i++) {
      if (slots[i]?.booked) return false;
    }
    return true;
  }

  function tapSlot(i: number) {
    if (slots[i].booked) return;
    if (anchor === null || focus === null) {
      setAnchor(i);
      setFocus(i);
      return;
    }
    if (i === anchor && focus === anchor) {
      setAnchor(null);
      setFocus(null);
      return;
    }
    const a = Math.min(anchor, i);
    const b = Math.max(anchor, i);
    if (rangeFree(a, b)) setFocus(i);
    else {
      setAnchor(i);
      setFocus(i);
    }
  }

  const startAt = hasSel ? slots[selStart!].startAt : null;
  const durationMin = hasSel ? (selEnd! - selStart! + 1) * SLOT_MIN : 0;
  const endMin = hasSel ? slots[selEnd!].startMin + SLOT_MIN : 0;
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
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top', 'bottom']}>
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
        <Text style={[styles.headerTitle, { color: themeColors.textStrong }]}>{t('timeRangePicker.title')}</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Date Selector */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="calendar-outline" size={18} color={themeColors.primary} />
            <Text style={[styles.sectionTitle, { color: themeColors.textStrong }]}>{t('timeRangePicker.selectDate')}</Text>
          </View>
          <Text style={[styles.monthLabel, { color: themeColors.textMuted }]}>{monthLabel}</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateRow}>
          {dates.map((d) => {
            const active = d.getTime() === selectedDate.getTime();
            return (
              <Pressable
                key={d.toISOString()}
                onPress={() => setSelectedDate(d)}
                style={[
                  styles.dateCard,
                  {
                    backgroundColor: active ? themeColors.primary : themeColors.surface,
                    borderColor: active ? themeColors.primary : themeColors.border,
                  },
                ]}
              >
                <Text style={[styles.dateWeekday, { color: active ? '#FFFFFF' : themeColors.textMuted }]}>
                  {weekdays[d.getDay()]}
                </Text>
                <Text style={[styles.dateDay, { color: active ? '#FFFFFF' : themeColors.textStrong }]}>
                  {d.getDate()}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Port info card */}
        {connector && chargePoint && station && (
          <View style={[styles.connectorCard, { backgroundColor: themeColors.surfaceAlt, borderColor: themeColors.border }]}>
            <View style={[styles.connectorIcon, { backgroundColor: themeColors.primarySoft }]}>
              <Ionicons name="flash" size={22} color={themeColors.primaryDark} />
            </View>
            <View style={styles.connectorBody}>
              <Text style={[styles.connectorName, { color: themeColors.textStrong }]}>
                {chargePoint.name} · {connector.name}
              </Text>
              <Text style={[styles.connectorSub, { color: themeColors.textMuted }]} numberOfLines={1}>
                {chargePoint.zoneLabel ?? station.name}
              </Text>
              <View style={styles.connectorMetaRow}>
                <StatusBadge variant="success" label={connector.connectorType} />
                <Text style={[styles.connectorMeta, { color: themeColors.textMuted }]}>
                  {connector.powerKw} kW · {t('timeRangePicker.openUntil', {
                    time: formatMinutes(Math.min(closesAtMin, 1439)),
                  })}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Availability */}
        <View style={styles.sectionTitleRow}>
          <Ionicons name="time-outline" size={18} color={themeColors.primary} />
          <Text style={[styles.sectionTitle, { color: themeColors.textStrong }]}>{t('timeRangePicker.availability')}</Text>
        </View>

        {loading ? (
          <ActivityIndicator color={themeColors.primary} style={styles.loader} />
        ) : slots.length === 0 ? (
          <Text style={[styles.empty, { color: themeColors.textMuted }]}>{t('timeRangePicker.empty')}</Text>
        ) : (
          <>
            <View style={[styles.slotHint, { backgroundColor: themeColors.primarySoft }]}>
              <Ionicons name="hand-left-outline" size={15} color={themeColors.primary} />
              <Text style={[styles.slotHintText, { color: themeColors.primaryDark }]}>{t('timeRangePicker.slotHint')}</Text>
            </View>

            <View style={styles.grid}>
              {slots.map((sl, i) => {
                const selected = hasSel && i >= selStart! && i <= selEnd!;
                return (
                  <Pressable
                    key={sl.startMin}
                    disabled={sl.booked}
                    onPress={() => tapSlot(i)}
                    style={[
                      styles.slot,
                      {
                        backgroundColor: selected
                          ? themeColors.primary
                          : sl.booked
                            ? themeColors.surfaceAlt
                            : themeColors.surface,
                        borderColor: selected ? themeColors.primary : themeColors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.slotTime,
                        {
                          color: selected
                            ? '#FFFFFF'
                            : sl.booked
                              ? themeColors.textMuted
                              : themeColors.textStrong,
                        },
                        sl.booked && styles.slotTimeDim,
                      ]}
                    >
                      {formatMinutes(sl.startMin)}
                    </Text>
                    {sl.booked ? (
                      <Text style={[styles.slotTag, { color: themeColors.textMuted }]}>{t('timeRangePicker.slotBooked')}</Text>
                    ) : (
                      <Text style={[styles.slotPrice, { color: selected ? '#FFFFFF' : themeColors.textMuted }]}>
                        {formatVnd(sl.price)}
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendSw, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]} />
                <Text style={[styles.legendText, { color: themeColors.textMuted }]}>{t('timeRangePicker.legendFree')}</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendSw, { backgroundColor: themeColors.primary, borderColor: themeColors.primary }]} />
                <Text style={[styles.legendText, { color: themeColors.textMuted }]}>{t('timeRangePicker.legendSelected')}</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendSw, { backgroundColor: themeColors.surfaceAlt, borderColor: themeColors.border }]} />
                <Text style={[styles.legendText, { color: themeColors.textMuted }]}>{t('timeRangePicker.legendBooked')}</Text>
              </View>
            </View>
          </>
        )}

        {/* Price Breakdown */}
        {quote && startAt && (
          <View style={[styles.priceCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <Text style={[styles.priceTitle, { color: themeColors.textStrong }]}>{t('timeRangePicker.priceTitle')}</Text>
            {quote.priceLines.map((line, i) => (
              <View key={i} style={styles.priceRow}>
                <View style={styles.priceLineLeft}>
                  <Text style={[styles.priceRange, { color: themeColors.textBody }]}>
                    {formatMinutes(new Date(line.fromAt).getHours() * 60 + new Date(line.fromAt).getMinutes())}
                    –
                    {formatMinutes(new Date(line.toAt).getHours() * 60 + new Date(line.toAt).getMinutes())}
                  </Text>
                  <Text style={[styles.priceBand, { color: themeColors.textMuted }]}>
                    {t(`timeRangePicker.band.${line.rateKind}`)} · {t('timeRangePicker.perKwh', { rate: formatVnd(line.rateVndPerKwh) })}
                  </Text>
                </View>
                <Text style={[styles.priceAmount, { color: themeColors.textStrong }]}>{formatVnd(line.amount)}</Text>
              </View>
            ))}
            <View style={styles.priceRow}>
              <Text style={[styles.priceBand, { color: themeColors.textMuted }]}>
                {t('timeRangePicker.estEnergy', { kwh: quote.energyKwh })}
              </Text>
              <Text style={[styles.priceBand, { color: themeColors.textMuted }]}>{t('timeRangePicker.serviceFee')}: {formatVnd(quote.serviceFee)}</Text>
            </View>
            <View style={[styles.priceTotalRow, { borderTopColor: themeColors.border }]}>
              <Text style={[styles.priceTotalLabel, { color: themeColors.textStrong }]}>{t('timeRangePicker.total')}</Text>
              <Text style={[styles.priceTotal, { color: themeColors.textStrong }]}>{formatVnd(quote.totalPrice)}</Text>
            </View>
          </View>
        )}

        {/* Refund Policy */}
        <View style={[styles.refundCard, { backgroundColor: `${themeColors.warning}1A` }]}>
          <Ionicons name="alert-circle-outline" size={20} color={themeColors.warning} />
          <View style={styles.refundBody}>
            <Text style={[styles.refundTitle, { color: themeColors.warning }]}>{t('timeRangePicker.refundTitle')}</Text>
            <Text style={[styles.refundText, { color: themeColors.textBody }]}>{t('timeRangePicker.refundBody')}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { backgroundColor: themeColors.surface, borderTopColor: themeColors.border }]}>
        {!hasSel ? (
          <View style={[styles.hint, { borderColor: themeColors.border }]}>
            <Ionicons name="time-outline" size={16} color={themeColors.textMuted} />
            <Text style={[styles.hintText, { color: themeColors.textMuted }]}>{t('timeRangePicker.selectHint')}</Text>
          </View>
        ) : (
          <View style={styles.summaryRow}>
            <View>
              <Text style={[styles.summaryLabel, { color: themeColors.textMuted }]}>{t('timeRangePicker.selectedWindow')}</Text>
              <Text style={[styles.summaryValue, { color: themeColors.textStrong }]}>
                {formatMinutes(slots[selStart!].startMin)} – {formatMinutes(endMin)}
              </Text>
              <Text style={[styles.summarySub, { color: themeColors.textMuted }]}>
                {t('timeRangePicker.slotSummary', { count: slotCount, duration: durationLabel(durationMin) })}
              </Text>
            </View>
            <View style={styles.summaryTotalBlock}>
              <Text style={[styles.summaryLabel, { color: themeColors.textMuted }]}>{t('timeRangePicker.total')}</Text>
              <Text style={[styles.summaryTotal, { color: themeColors.textStrong }]}>{formatVnd(quote?.totalPrice ?? 0)}</Text>
            </View>
          </View>
        )}
        <AppButton label={t('timeRangePicker.cta')} disabled={!hasSel} onPress={handleContinue} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: fontSizes.heading, fontWeight: fontWeights.semibold },
  scroll: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sectionTitle: { fontSize: fontSizes.heading, fontWeight: fontWeights.bold },
  monthLabel: { fontSize: fontSizes.body },

  dateRow: { gap: spacing.sm, paddingVertical: spacing.xs },
  dateCard: {
    width: 64,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  dateWeekday: { fontSize: fontSizes.caption, fontWeight: fontWeights.medium },
  dateDay: { fontSize: fontSizes.heading, fontWeight: fontWeights.bold },

  connectorCard: {
    flexDirection: 'row',
    gap: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
  },
  connectorIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectorBody: { flex: 1, gap: spacing.xs },
  connectorName: { fontSize: fontSizes.body, fontWeight: fontWeights.bold },
  connectorSub: { fontSize: fontSizes.caption },
  connectorMetaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  connectorMeta: { fontSize: fontSizes.caption },

  loader: { marginVertical: spacing.xl },
  empty: { fontSize: fontSizes.body, textAlign: 'center', paddingVertical: spacing.lg },

  slotHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  slotHintText: { flex: 1, fontSize: fontSizes.caption, fontWeight: fontWeights.medium, lineHeight: lineHeights.caption },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  slot: {
    width: '48%',
    borderRadius: radius.md,
    borderWidth: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: 2,
  },
  slotTime: { fontSize: fontSizes.body, fontWeight: fontWeights.bold },
  slotTimeDim: { textDecorationLine: 'line-through' },
  slotPrice: { fontSize: fontSizes.caption },
  slotTag: { fontSize: fontSizes.caption, fontWeight: fontWeights.medium },

  legendRow: { flexDirection: 'row', gap: spacing.lg },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendSw: { width: 12, height: 12, borderRadius: 3, borderWidth: 1 },
  legendText: { fontSize: fontSizes.caption, fontWeight: fontWeights.medium },

  priceCard: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  priceTitle: { fontSize: fontSizes.body, fontWeight: fontWeights.bold },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  priceLineLeft: { flex: 1, gap: 2 },
  priceRange: { fontSize: fontSizes.body, fontWeight: fontWeights.semibold },
  priceBand: { fontSize: fontSizes.caption },
  priceAmount: { fontSize: fontSizes.body, fontWeight: fontWeights.semibold },
  priceTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: spacing.sm,
  },
  priceTotalLabel: { fontSize: fontSizes.body, fontWeight: fontWeights.bold },
  priceTotal: { fontSize: fontSizes.heading, fontWeight: fontWeights.bold },

  refundCard: {
    flexDirection: 'row',
    gap: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  refundBody: { flex: 1, gap: spacing.xs },
  refundTitle: { fontSize: fontSizes.body, fontWeight: fontWeights.bold },
  refundText: { fontSize: fontSizes.caption, lineHeight: lineHeights.body },

  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderTopWidth: 1,
    gap: spacing.md,
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  hintText: { fontSize: fontSizes.body },
  summaryRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  summaryLabel: { fontSize: fontSizes.caption },
  summaryValue: { fontSize: fontSizes.heading, fontWeight: fontWeights.bold },
  summarySub: { fontSize: fontSizes.caption, marginTop: 1 },
  summaryTotalBlock: { alignItems: 'flex-end' },
  summaryTotal: { fontSize: fontSizes.heading, fontWeight: fontWeights.bold },
});
