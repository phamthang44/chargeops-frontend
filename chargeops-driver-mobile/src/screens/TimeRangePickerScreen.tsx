import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton, DayAgenda, GlassButton, StatusBadge } from '@/components';
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
  DURATION_OPTIONS,
  earliestStartMin,
  formatMinutes,
  getUpcomingDates,
  isoAtMinutes,
  maxDurationFrom,
  MIN_DURATION_MIN,
  startOptions,
  STEP_MIN,
  type BusyRange,
} from '@/utils/availability';
import { effectiveConnectorStatus } from '@/utils/connectors';
import { formatVnd, splitDuration } from '@/utils/format';
import { quoteBooking } from '@/utils/pricing';

type Nav = NativeStackNavigationProp<RootStackParamList, 'TimeRangePicker'>;
type Route = RouteProp<RootStackParamList, 'TimeRangePicker'>;

/**
 * "Chọn khung giờ" — step 3 of the booking flow (FR05/FR11).
 *
 * The driver picks a date, a start time and a duration. There is no slot grid:
 * bookable time is derived from the station's operating hours minus the ranges
 * already booked on the chosen connector, so the timeline shows what's left and
 * the duration options are capped by the next booking.
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
  const [startMin, setStartMin] = useState<number | null>(null);
  const [durationMin, setDurationMin] = useState<number>(60);

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
    setStartMin(null); // a start time is only meaningful for one day
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

  const starts = useMemo(
    () => startOptions(selectedDate, opensAtMin, closesAtMin, busy),
    [selectedDate, opensAtMin, closesAtMin, busy],
  );

  /** Longest booking possible from the chosen start — caps the duration pills. */
  const maxDuration = useMemo(
    () => (startMin === null ? 0 : maxDurationFrom(startMin, busy, closesAtMin)),
    [startMin, busy, closesAtMin],
  );

  // Snap a tapped position on the timeline to the nearest selectable start.
  function pickStartFromTimeline(rawMin: number) {
    const snapped = Math.round(rawMin / STEP_MIN) * STEP_MIN;
    const nearest = [...starts]
      .filter((o) => o.maxDurationMin >= MIN_DURATION_MIN)
      .sort((a, b) => Math.abs(a.startMin - snapped) - Math.abs(b.startMin - snapped))[0];
    if (nearest) selectStart(nearest.startMin, nearest.maxDurationMin);
  }

  function selectStart(min: number, allowed: number) {
    setStartMin(min);
    // Keep the current duration when it still fits, otherwise fall back to the
    // longest option that does — never leave an impossible window selected.
    if (durationMin > allowed) {
      const fits = [...DURATION_OPTIONS].reverse().find((d) => d <= allowed);
      if (fits) setDurationMin(fits);
    }
  }

  const startAt = startMin === null ? null : isoAtMinutes(selectedDate, startMin);
  const quote = useMemo(
    () => (connector && startAt ? quoteBooking(connector, startAt, durationMin) : null),
    [connector, startAt, durationMin],
  );

  function handleContinue() {
    if (!connector || !startAt) return;
    // The booking itself is created after the confirmation step.
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

  const noneAvailable = !loading && starts.every((o) => o.maxDurationMin < MIN_DURATION_MIN);

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
        ) : (
          <>
            <DayAgenda
              opensAtMin={opensAtMin}
              closesAtMin={closesAtMin}
              busy={busy}
              earliestMin={earliestMin}
              selection={startMin === null ? null : { startMin, durationMin }}
              onPickStart={pickStartFromTimeline}
            />

            {noneAvailable ? (
              <Text style={styles.empty}>{t('timeRangePicker.empty')}</Text>
            ) : (
              <>
                {/* Prompt until the driver taps a start on the agenda */}
                {startMin === null && (
                  <View style={styles.tapHint}>
                    <Ionicons name="hand-left-outline" size={16} color={colors.primary} />
                    <Text style={styles.tapHintText}>{t('timeRangePicker.tapToStart')}</Text>
                  </View>
                )}

                {/* Duration */}
                <Text style={styles.fieldLabel}>{t('timeRangePicker.duration')}</Text>
                <View style={styles.durationRow}>
                  {DURATION_OPTIONS.map((d) => {
                    // Before a start is chosen every option is offered; after,
                    // anything that would run into the next booking is out.
                    const disabled = startMin !== null && d > maxDuration;
                    const active = d === durationMin;
                    return (
                      <Pressable
                        key={d}
                        disabled={disabled}
                        onPress={() => setDurationMin(d)}
                        style={[
                          styles.duration,
                          active && styles.durationActive,
                          disabled && styles.chipDisabled,
                        ]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            active && styles.chipTextActive,
                            disabled && styles.chipTextDisabled,
                          ]}
                        >
                          {durationLabel(d)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                {startMin !== null && maxDuration < DURATION_OPTIONS[DURATION_OPTIONS.length - 1] && (
                  <Text style={styles.capHint}>
                    {t('timeRangePicker.durationCapped', {
                      duration: durationLabel(maxDuration),
                    })}
                  </Text>
                )}
              </>
            )}
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

      {/* Footer: chosen window + gated CTA */}
      <View style={styles.footer}>
        {startAt === null ? (
          <View style={styles.hint}>
            <Ionicons name="time-outline" size={16} color={colors.textMuted} />
            <Text style={styles.hintText}>{t('timeRangePicker.selectHint')}</Text>
          </View>
        ) : (
          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.summaryLabel}>{t('timeRangePicker.selectedWindow')}</Text>
              <Text style={styles.summaryValue}>
                {formatMinutes(startMin!)} – {formatMinutes(startMin! + durationMin)}
              </Text>
            </View>
            <View style={styles.summaryTotalBlock}>
              <Text style={styles.summaryLabel}>{t('timeRangePicker.total')}</Text>
              <Text style={styles.summaryTotal}>{formatVnd(quote?.totalPrice ?? 0)}</Text>
            </View>
          </View>
        )}
        <AppButton
          label={t('timeRangePicker.cta')}
          disabled={startAt === null}
          onPress={handleContinue}
        />
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

  fieldLabel: { fontSize: fontSizes.body, fontWeight: fontWeights.semibold, color: colors.textStrong },

  // Tap prompt shown until a start is chosen on the agenda
  tapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  tapHintText: { flex: 1, fontSize: fontSizes.body, fontWeight: fontWeights.medium, color: colors.primaryDark },

  // Shared chip text (duration pills)
  chipDisabled: { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
  chipText: { fontSize: fontSizes.body, fontWeight: fontWeights.semibold, color: colors.textStrong },
  chipTextActive: { color: colors.textInverse },
  chipTextDisabled: { color: colors.textMuted, opacity: 0.6 },

  // Duration pills
  durationRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  duration: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  durationActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  capHint: { fontSize: fontSizes.caption, color: colors.textMuted },

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
  summaryTotalBlock: { alignItems: 'flex-end' },
  summaryTotal: { fontSize: fontSizes.heading, fontWeight: fontWeights.bold, color: colors.textStrong },
});
