import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, BackHandler, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton, GlassButton } from '@/components';
import { StationPolicyCard } from '@/components/station-detail';
import {
  TimePickerDateSelector,
  TimePickerDurationChips,
  TimePickerPeriodTabs,
  TimePickerQuoteCard,
  TimePickerSlotItem,
  TimePickerStationBrief,
  TimePickerStickyBar,
  type TimeFilterPeriod,
} from '@/components/time-picker';
import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import type { RootStackParamList } from '@/navigation/types';
import {
  getStationAvailability,
  getStationDetail,
  isRangeBusy,
  isRangeInOperatingWindows,
  type BackendStationAvailabilityResponse,
} from '@/services/stationService';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';
import type { ChargePoint, Connector, Station } from '@/types';
import {
  earliestStartMin,
  formatMinutes,
  getUpcomingDates,
  isoAtMinutes,
} from '@/utils/availability';
import { splitDuration } from '@/utils/format';
import { quoteBooking } from '@/utils/pricing';

type Nav = NativeStackNavigationProp<RootStackParamList, 'TimeRangePicker'>;
type Route = RouteProp<RootStackParamList, 'TimeRangePicker'>;

const SLOT_MIN = 30;

interface SlotCell {
  startMin: number;
  startAt: string;
  booked: boolean;
}

function formatDateParam(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatClockIso(iso?: string): string {
  if (!iso) return '--:--';
  const d = new Date(iso);
  return formatMinutes(d.getHours() * 60 + d.getMinutes());
}

/**
 * "Chọn khung giờ" — Step 2/3 of the booking flow.
 * Redesigned for rich, friendly, ergonomic mobile EV charging experience.
 */
export function TimeRangePickerScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { t } = useTranslation();
  const { themeColors } = usePreferences();
  const { getAccessToken } = useAuth();

  const dates = useMemo(() => getUpcomingDates(2), []);
  const weekdays = t('timeRangePicker.weekdays', { returnObjects: true }) as string[];

  const [selectedDate, setSelectedDate] = useState<Date>(dates[0]);

  const [station, setStation] = useState<Station | null>(null);
  const [chargePoint, setChargePoint] = useState<ChargePoint | null>(null);
  const [connector, setConnector] = useState<Connector | null>(null);

  const [availability, setAvailability] = useState<BackendStationAvailabilityResponse | null>(null);
  const [availabilityError, setAvailabilityError] = useState(false);
  const [loading, setLoading] = useState(true);

  const [anchor, setAnchor] = useState<number | null>(null);
  const [focus, setFocus] = useState<number | null>(null);
  const [durationTargetMin, setDurationTargetMin] = useState(SLOT_MIN);
  const [timeFilter, setTimeFilter] = useState<TimeFilterPeriod>('ALL');
  const [helpModalVisible, setHelpModalVisible] = useState(false);

  // Atomic data loader: fetches station detail, selects connector, and loads live availability
  const loadData = useCallback(async () => {
    let active = true;
    setLoading(true);
    setAvailabilityError(false);
    const token = getAccessToken();

    try {
      const detail = await getStationDetail(params.stationId, { accessToken: token });
      if (!active) return;
      if (!detail) {
        setStation(null);
        setChargePoint(null);
        setConnector(null);
        setAvailability(null);
        setLoading(false);
        return;
      }

      const targetConnectorId = params.connectorId;
      const conn =
        (targetConnectorId
          ? detail.connectors.find((c) => c.id.toLowerCase() === targetConnectorId.toLowerCase())
          : undefined) ??
        detail.connectors.find((c) => c.runtimeStatus === 'AVAILABLE') ??
        detail.connectors[0] ??
        null;

      setStation(detail.station);
      setConnector(conn);
      setChargePoint(conn ? detail.chargePoints.find((cp) => cp.id === conn.chargePointId) ?? null : null);

      if (!conn) {
        setAvailability(null);
        setLoading(false);
        return;
      }

      const dateParam = formatDateParam(selectedDate);
      const availData = await getStationAvailability(params.stationId, conn.id, dateParam, { accessToken: token });
      if (!active) return;
      setAvailability(availData);
      setAvailabilityError(!availData);
    } catch (err) {
      console.warn('[TimeRangePicker] Failed to load station detail or availability:', err);
      if (!active) return;
      setAvailability(null);
      setAvailabilityError(true);
    } finally {
      if (active) {
        setLoading(false);
      }
    }
  }, [params.stationId, params.connectorId, selectedDate, getAccessToken]);

  // Load and refresh data on focus or parameter/date changes
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  // Reset selection on date switch
  useEffect(() => {
    setAnchor(null);
    setFocus(null);
  }, [selectedDate]);

  const opensAtMin = station?.opensAtMin ?? 0;
  const closesAtMin = station?.closesAtMin ?? 1440;

  const durationStepMin = availability?.durationStepMinutes ?? SLOT_MIN;
  const minDurationMin = availability?.minDurationMinutes ?? SLOT_MIN;
  const maxDurationMin = availability?.maxDurationMinutes ?? 180;

  const durationChoices = useMemo(() => {
    const raw = [minDurationMin, 60, 90, 120, 180, maxDurationMin];
    return Array.from(
      new Set(
        raw.filter((min) => min >= minDurationMin && min <= maxDurationMin && min % durationStepMin === 0),
      ),
    ).sort((a, b) => a - b);
  }, [durationStepMin, maxDurationMin, minDurationMin]);

  useEffect(() => {
    setDurationTargetMin((current) => Math.min(maxDurationMin, Math.max(minDurationMin, current)));
  }, [maxDurationMin, minDurationMin]);

  const isToday = selectedDate.toDateString() === new Date().toDateString();
  const isCrossMidnightStation = Boolean(
    station?.open24Hours || (opensAtMin === 0 && closesAtMin === 1440),
  );

  const selectedDateMidnightMs = useMemo(() => {
    const d = new Date(selectedDate);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, [selectedDate]);

  // Use earliestStartAt from backend if available (handles lead 60m + 30m grid and cross-midnight)
  const minStartMin = useMemo(() => {
    if (availability?.earliestStartAt) {
      const earliestMs = new Date(availability.earliestStartAt).getTime();
      const diffMin = Math.ceil((earliestMs - selectedDateMidnightMs) / 60000);
      return Math.max(opensAtMin, diffMin);
    }
    return isToday ? earliestStartMin(selectedDate, opensAtMin) : opensAtMin;
  }, [availability?.earliestStartAt, selectedDateMidnightMs, opensAtMin, isToday, selectedDate]);

  // 3. Generate Timeline Slots
  const slots = useMemo<SlotCell[]>(() => {
    if (!connector || availabilityError || !availability) return [];
    if (availability.operatingWindows && availability.operatingWindows.length === 0) return [];

    const list: SlotCell[] = [];

    // Backend availability coverage extends cross-midnight for overnight sessions (dayEnd + maxDurationMinutes)
    const hasCrossMidnightOperatingWindow = Boolean(
      availability?.operatingWindows?.some((win) => {
        const winEndMs = new Date(win.endAt).getTime();
        return winEndMs > selectedDateMidnightMs + 1440 * 60000;
      }),
    );
    const allowCrossMidnight = isCrossMidnightStation || hasCrossMidnightOperatingWindow;

    const firstSlot = Math.max(opensAtMin, Math.ceil(minStartMin / durationStepMin) * durationStepMin);
    const normalLastSlot = closesAtMin - durationStepMin;
    const extendedEndSlot =
      allowCrossMidnight
        ? Math.max(normalLastSlot, 1440 + maxDurationMin - durationStepMin)
        : normalLastSlot;

    for (let m = firstSlot; m <= extendedEndSlot; m += durationStepMin) {
      const startAtIso = isoAtMinutes(selectedDate, m);
      const endAtIso = isoAtMinutes(selectedDate, m + durationStepMin);

      const isPast = m < minStartMin;
      const isClosed =
        availability?.operatingWindows && availability.operatingWindows.length > 0
          ? !isRangeInOperatingWindows(availability.operatingWindows, startAtIso, endAtIso)
          : false;
      const isBooked =
        isPast || isClosed || (availability ? isRangeBusy(availability.busyRanges, startAtIso, endAtIso) : false);

      list.push({
        startMin: m,
        startAt: startAtIso,
        booked: isBooked,
      });
    }

    return list;
  }, [
    connector,
    availability,
    availabilityError,
    opensAtMin,
    closesAtMin,
    minStartMin,
    selectedDate,
    selectedDateMidnightMs,
    durationStepMin,
    isCrossMidnightStation,
    maxDurationMin,
  ]);

  const hasSel = anchor !== null && focus !== null;
  const selStart = hasSel ? Math.min(anchor!, focus!) : null;
  const selEnd = hasSel ? Math.max(anchor!, focus!) : null;

  function rangeFree(a: number, b: number): boolean {
    for (let i = a; i <= b; i++) {
      if (slots[i]?.booked) return false;
    }
    return true;
  }

  function slotsNeededFor(durationMin: number): number {
    return Math.max(1, Math.ceil(durationMin / durationStepMin));
  }

  function canFitFrom(i: number, durationMin = durationTargetMin): boolean {
    const end = i + slotsNeededFor(durationMin) - 1;
    return !!slots[i] && !!slots[end] && rangeFree(i, end);
  }

  function tapSlot(i: number) {
    if (slots[i].booked || !canFitFrom(i)) return;
    setAnchor(i);
    setFocus(i + slotsNeededFor(durationTargetMin) - 1);
  }

  function selectDurationChoice(min: number) {
    setDurationTargetMin(min);
    if (anchor === null) return;
    const nextFocus = anchor + slotsNeededFor(min) - 1;
    if (slots[nextFocus] && rangeFree(anchor, nextFocus)) {
      setFocus(nextFocus);
    } else {
      setAnchor(null);
      setFocus(null);
    }
  }

  // 4. Period Available Slot Counts
  const periodCounts = useMemo<Record<TimeFilterPeriod, number>>(() => {
    const counts: Record<TimeFilterPeriod, number> = {
      ALL: 0,
      MORNING: 0,
      AFTERNOON: 0,
      EVENING: 0,
      NIGHT: 0,
    };

    slots.forEach((s, idx) => {
      if (s.startMin >= 1440) return;
      if (!canFitFrom(idx)) return;

      counts.ALL += 1;
      if (s.startMin >= 300 && s.startMin < 720) counts.MORNING += 1;
      else if (s.startMin >= 720 && s.startMin < 1080) counts.AFTERNOON += 1;
      else if (s.startMin >= 1080 && s.startMin < 1320) counts.EVENING += 1;
      else if (s.startMin < 300 || s.startMin >= 1320) counts.NIGHT += 1;
    });

    return counts;
  }, [slots, durationTargetMin, durationStepMin]);

  // 5. Visible Slots by Period Filter
  const visibleSlots = useMemo(() => {
    const baseSlots = slots.filter((s) => s.startMin < 1440);
    if (timeFilter === 'ALL') return baseSlots;
    return baseSlots.filter((s) => {
      if (timeFilter === 'MORNING') return s.startMin >= 300 && s.startMin < 720;
      if (timeFilter === 'AFTERNOON') return s.startMin >= 720 && s.startMin < 1080;
      if (timeFilter === 'EVENING') return s.startMin >= 1080 && s.startMin < 1320;
      if (timeFilter === 'NIGHT') return s.startMin < 300 || s.startMin >= 1320;
      return true;
    });
  }, [slots, timeFilter]);

  const startAt = hasSel ? slots[selStart!].startAt : null;
  const durationMin = hasSel ? (selEnd! - selStart! + 1) * durationStepMin : 0;
  const endMin = hasSel ? slots[selEnd!].startMin + durationStepMin : 0;
  const slotCount = durationStepMin > 0 ? durationMin / durationStepMin : 0;

  const quote = useMemo(
    () => (connector && startAt ? quoteBooking(connector, startAt, durationMin, availability?.priceRanges) : null),
    [connector, startAt, durationMin, availability?.priceRanges],
  );

  const meetsMinDuration = durationMin >= minDurationMin;
  const meetsMaxDuration = durationMin <= maxDurationMin;
  const hasValidPolicy = Boolean(
    station?.cancellationPolicy && typeof station.cancellationPolicy.gracePeriodMinutes === 'number',
  );
  const canContinue = hasSel && meetsMinDuration && meetsMaxDuration && hasValidPolicy;

  const isCrossDay = hasSel && endMin > 1440;

  function handleContinue() {
    if (!connector || !startAt || !canContinue || !hasValidPolicy) return;
    navigation.navigate('BookingConfirmation', {
      stationId: params.stationId,
      connectorId: connector.id,
      startAt,
      durationMin,
      priceRanges: availability?.priceRanges,
    });
  }

  function handleResetSelection() {
    setAnchor(null);
    setFocus(null);
  }

  const handleBack = useCallback(() => {
    if (params.isFromFastTrack) {
      navigation.replace('StationDetail', {
        stationId: params.stationId,
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

  function durationLabel(min: number): string {
    const { hours, minutes } = splitDuration(min);
    if (hours === 0) return t('timeRangePicker.durationMin', { minutes });
    if (minutes === 0) return t('timeRangePicker.durationHour', { hours });
    return t('timeRangePicker.durationHourMin', { hours, minutes });
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top', 'left', 'right']}>
      {/* Upgraded Navigation Header with Flow Indicator */}
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

        {/* Center: Step indicator badge + Screen Title */}
        <View style={styles.headerCenterCol}>
          <View style={[styles.stepBadge, { backgroundColor: `${themeColors.primary}18` }]}>
            <Text style={[styles.stepBadgeText, { color: themeColors.primaryDark }]}>
              {t('timeRangePicker.stepBadge')} · {t('timeRangePicker.stepSubtitle')}
            </Text>
          </View>
          <Text style={[styles.headerTitle, { color: themeColors.textStrong }]}>
            {t('timeRangePicker.title')}
          </Text>
        </View>

        {/* Right Action: Help Modal Guide button */}
        <GlassButton
          size={40}
          glassEffectStyle="regular"
          fallbackColor={themeColors.surfaceAlt}
          accessibilityLabel={t('timeRangePicker.helpTooltip')}
          onPress={() => setHelpModalVisible(true)}
        >
          <Ionicons name="help-circle-outline" size={22} color={themeColors.textStrong} />
        </GlassButton>
      </View>

      {/* Progress Track Line (Step 2 of 3 = 66%) */}
      <View style={[styles.progressBarTrack, { backgroundColor: `${themeColors.border}` }]}>
        <View style={[styles.progressBarFill, { backgroundColor: themeColors.primary }]} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Section 1: Station & Connector Quick Summary */}
        {connector && station && (
          <TimePickerStationBrief
            station={station}
            chargePoint={chargePoint}
            connector={connector}
            themeColors={themeColors}
            t={t}
          />
        )}

        {/* Section 2: Modern Date Scroller */}
        <TimePickerDateSelector
          dates={dates}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          weekdays={weekdays}
          themeColors={themeColors}
          t={t}
        />

        {/* Section 3: Duration Selector Chips */}
        <TimePickerDurationChips
          durationChoices={durationChoices}
          durationTargetMin={durationTargetMin}
          onSelectDuration={selectDurationChoice}
          minDurationMin={minDurationMin}
          maxDurationMin={maxDurationMin}
          themeColors={themeColors}
          t={t}
          durationLabel={durationLabel}
        />

        {/* Section 4: Available Time Slots Matrix */}
        <View style={styles.slotsSectionContainer}>
          {/* Header Row: Section Title + Live Status Sync & Legend */}
          <View style={styles.slotsHeaderRow}>
            <View style={styles.slotsTitleGroup}>
              <View style={[styles.sectionIconBadge, { backgroundColor: `${themeColors.primary}18` }]}>
                <Ionicons name="time" size={15} color={themeColors.primaryDark} />
              </View>
              <Text style={[styles.slotsSectionTitle, { color: themeColors.textStrong }]}>
                {t('timeRangePicker.sectionSlots')}
              </Text>
            </View>

            {/* Live dot */}
            <View style={[styles.liveIndicator, { backgroundColor: themeColors.primarySoft }]}>
              <View style={[styles.liveDot, { backgroundColor: themeColors.primary }]} />
              <Text style={[styles.liveText, { color: themeColors.primaryDark }]}>
                {availability?.generatedAt
                  ? formatClockIso(availability.generatedAt)
                  : t('timeRangePicker.liveAvailability')}
              </Text>
            </View>
          </View>

          {/* Friendly Legend */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: themeColors.surface, borderColor: `${themeColors.primary}80` }]} />
              <Text style={[styles.legendText, { color: themeColors.textMuted }]}>
                {t('timeRangePicker.legendFree')}
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: themeColors.primary }]} />
              <Text style={[styles.legendText, { color: themeColors.textMuted }]}>
                {t('timeRangePicker.legendSelected')}
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: themeColors.surfaceAlt, borderColor: themeColors.border }]} />
              <Text style={[styles.legendText, { color: themeColors.textMuted }]}>
                {t('timeRangePicker.legendUnavailable')}
              </Text>
            </View>
          </View>

          {/* Period Filter Tabs */}
          <TimePickerPeriodTabs
            timeFilter={timeFilter}
            onSelectFilter={setTimeFilter}
            periodCounts={periodCounts}
            themeColors={themeColors}
            t={t}
          />

          {/* Slot Grid */}
          {loading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={themeColors.primary} />
              <Text style={[styles.loaderText, { color: themeColors.textMuted }]}>
                {t('timeRangePicker.awaitingAvailability')}
              </Text>
            </View>
          ) : slots.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: themeColors.surfaceAlt, borderColor: themeColors.border }]}>
              <Ionicons name="calendar-outline" size={38} color={themeColors.textMuted} />
              <Text style={[styles.emptyTitle, { color: themeColors.textStrong }]}>
                {t('timeRangePicker.empty')}
              </Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {visibleSlots.map((sl) => {
                const originalIdx = slots.findIndex((s) => s.startMin === sl.startMin);
                const isSelected = hasSel && originalIdx >= selStart! && originalIdx <= selEnd!;
                const unavailableForDuration = !sl.booked && !canFitFrom(originalIdx);

                return (
                  <TimePickerSlotItem
                    key={sl.startMin}
                    startMin={sl.startMin}
                    durationMin={durationTargetMin}
                    isBooked={sl.booked}
                    isSelected={isSelected}
                    isUnavailableForDuration={unavailableForDuration}
                    onPress={() => tapSlot(originalIdx)}
                    themeColors={themeColors}
                    t={t}
                  />
                );
              })}
            </View>
          )}
        </View>

        {/* Section 5: Price & Energy Quote Card */}
        {quote && startAt && (
          <TimePickerQuoteCard
            quote={quote}
            startAt={startAt}
            themeColors={themeColors}
            t={t}
          />
        )}

        {/* Section 6: Cancellation / Refund Policy Card */}
        <StationPolicyCard cancellationPolicy={station?.cancellationPolicy} />
      </ScrollView>

      {/* Section 7: Sticky Floating Bottom Action Bar */}
      <TimePickerStickyBar
        hasSel={hasSel}
        meetsMinDuration={meetsMinDuration}
        minDurationMin={minDurationMin}
        durationStepMin={durationStepMin}
        startMin={selStart !== null ? slots[selStart].startMin : null}
        endMin={hasSel ? endMin : null}
        durationMin={durationMin}
        slotCount={slotCount}
        isCrossDay={isCrossDay}
        totalPrice={quote?.totalPrice ?? 0}
        canContinue={canContinue}
        hasValidPolicy={hasValidPolicy}
        onContinue={handleContinue}
        onReset={hasSel ? handleResetSelection : undefined}
        themeColors={themeColors}
        t={t}
        durationLabel={durationLabel}
      />

      {/* Interactive Booking Help Guide Modal */}
      <Modal
        visible={helpModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setHelpModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setHelpModalVisible(false)}
        >
          <Pressable
            style={[styles.modalCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHead}>
              <View style={[styles.modalIconBox, { backgroundColor: `${themeColors.primary}18` }]}>
                <Ionicons name="information-circle" size={24} color={themeColors.primary} />
              </View>
              <Text style={[styles.modalTitle, { color: themeColors.textStrong }]}>
                {t('timeRangePicker.helpModalTitle')}
              </Text>
            </View>

            <Text style={[styles.modalDesc, { color: themeColors.textMuted }]}>
              {t('timeRangePicker.helpModalDesc')}
            </Text>

            <View style={styles.stepsList}>
              <View style={styles.stepItem}>
                <Ionicons name="calendar-outline" size={17} color={themeColors.primary} />
                <Text style={[styles.stepItemText, { color: themeColors.textStrong }]}>
                  {t('timeRangePicker.guideStep1')}
                </Text>
              </View>
              <View style={styles.stepItem}>
                <Ionicons name="timer-outline" size={17} color={themeColors.primary} />
                <Text style={[styles.stepItemText, { color: themeColors.textStrong }]}>
                  {t('timeRangePicker.guideStep2')}
                </Text>
              </View>
              <View style={styles.stepItem}>
                <Ionicons name="flash-outline" size={17} color={themeColors.primary} />
                <Text style={[styles.stepItemText, { color: themeColors.textStrong }]}>
                  {t('timeRangePicker.guideStep3')}
                </Text>
              </View>
            </View>

            <AppButton
              label={t('timeRangePicker.understood')}
              onPress={() => setHelpModalVisible(false)}
            />
          </Pressable>
        </Pressable>
      </Modal>
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
    paddingTop: spacing.xs + 2,
    paddingBottom: spacing.sm,
  },
  headerCenterCol: {
    alignItems: 'center',
    gap: 3,
  },
  stepBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: fontWeights.bold,
  },
  headerTitle: {
    fontSize: fontSizes.heading,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  progressBarTrack: {
    height: 2.5,
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    width: '66%',
    borderRadius: radius.full,
  },

  scroll: { flex: 1 },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.xl + 4,
    paddingBottom: spacing.xxl + 24,
  },

  slotsSectionContainer: {
    gap: spacing.md,
  },
  slotsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  slotsTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 4,
  },
  sectionIconBadge: {
    width: 26,
    height: 26,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotsSectionTitle: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.bold,
  },

  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveText: {
    fontSize: 11.5,
    fontWeight: fontWeights.bold,
  },

  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 2,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.2,
  },
  legendText: {
    fontSize: 12,
    fontWeight: fontWeights.medium,
  },

  loaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  loaderText: {
    fontSize: fontSizes.caption,
  },
  emptyCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semibold,
    textAlign: 'center',
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs + 4,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.xl,
    gap: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
  },
  modalIconBox: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16.5,
    fontWeight: fontWeights.bold,
  },
  modalDesc: {
    fontSize: 13.5,
    lineHeight: 19,
  },
  stepsList: {
    gap: spacing.sm + 2,
    paddingVertical: 4,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  stepItemText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
});
