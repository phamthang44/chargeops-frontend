import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BackHandler } from 'react-native';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { TimeFilterPeriod } from '@/components/time-picker';
import { useAuth } from '@/context/AuthContext';
import type { RootStackParamList } from '@/navigation/types';
import {
  getStationAvailability,
  getStationDetail,
  isRangeBusy,
  isRangeInOperatingWindows,
  type BackendStationAvailabilityResponse,
} from '@/services/stationService';
import type { ChargePoint, Connector, Station } from '@/types';
import {
  earliestStartMin,
  formatMinutes,
  getUpcomingDates,
  isoAtMinutes,
} from '@/utils/availability';
import { splitDuration } from '@/utils/format';
import { quoteBooking } from '@/utils/pricing';

export const SLOT_MIN = 30;

export interface SlotCell {
  startMin: number;
  startAt: string;
  booked: boolean;
}

export function formatDateParam(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatClockIso(iso?: string): string {
  if (!iso) return '--:--';
  const d = new Date(iso);
  return formatMinutes(d.getHours() * 60 + d.getMinutes());
}

type Nav = NativeStackNavigationProp<RootStackParamList, 'TimeRangePicker'>;
type Route = RouteProp<RootStackParamList, 'TimeRangePicker'>;

export function useTimeRangePicker() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { t } = useTranslation();
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

  // Use earliestStartAt from backend if available
  const minStartMin = useMemo(() => {
    if (availability?.earliestStartAt) {
      const earliestMs = new Date(availability.earliestStartAt).getTime();
      const diffMin = Math.ceil((earliestMs - selectedDateMidnightMs) / 60000);
      return Math.max(opensAtMin, diffMin);
    }
    return isToday ? earliestStartMin(selectedDate, opensAtMin) : opensAtMin;
  }, [availability?.earliestStartAt, selectedDateMidnightMs, opensAtMin, isToday, selectedDate]);

  // Generate Timeline Slots
  const slots = useMemo<SlotCell[]>(() => {
    if (!connector || availabilityError || !availability) return [];
    if (availability.operatingWindows && availability.operatingWindows.length === 0) return [];

    const list: SlotCell[] = [];

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

  // Period Available Slot Counts
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

  // Visible Slots by Period Filter
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

  return {
    dates,
    weekdays,
    selectedDate,
    setSelectedDate,
    station,
    chargePoint,
    connector,
    availability,
    loading,
    durationChoices,
    durationTargetMin,
    minDurationMin,
    maxDurationMin,
    durationStepMin,
    selectDurationChoice,
    timeFilter,
    setTimeFilter,
    periodCounts,
    slots,
    visibleSlots,
    canFitFrom,
    tapSlot,
    hasSel,
    selStart,
    selEnd,
    startAt,
    endMin,
    durationMin,
    slotCount,
    isCrossDay,
    quote,
    meetsMinDuration,
    hasValidPolicy,
    canContinue,
    handleContinue,
    handleResetSelection,
    handleBack,
    helpModalVisible,
    setHelpModalVisible,
    durationLabel,
  };
}
