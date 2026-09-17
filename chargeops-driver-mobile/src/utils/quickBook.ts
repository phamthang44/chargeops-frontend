import {
  getConnectorsByStation,
  getStationAvailability,
  getStationDetail,
  isRangeBusy,
  resolveAccessToken,
} from '@/services/stationService';

function formatDateParam(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Execute Fast-Track (1-Click) Booking:
 * 1. Resolves connectors for the station and selects the best connector (highest power DC, AVAILABLE).
 * 2. Fetches availability & TOU price ranges.
 * 3. Calculates the earliest available non-conflicting 60-minute charging slot today (aligned to 30-min grid).
 * 4. Navigates straight to BookingConfirmationScreen with pre-filled parameters.
 *    The back action from BookingConfirmation is handled intelligently:
 *    BookingConfirmation -> TimeRangePicker -> StationDetail -> Home/Map.
 */
export async function executeQuickBook(
  stationId: string,
  navigation: any,
  onLoadingChange?: (loading: boolean) => void,
): Promise<void> {
  try {
    onLoadingChange?.(true);

    const token = resolveAccessToken();

    // 1. Fetch connectors for this station (via getStationDetail to guarantee real backend data)
    const detail = await getStationDetail(stationId, { accessToken: token });
    const connectors = detail?.connectors && detail.connectors.length > 0
      ? detail.connectors
      : await getConnectorsByStation(stationId, { accessToken: token });

    if (!connectors || connectors.length === 0) {
      navigation.navigate('StationDetail', { stationId });
      return;
    }

    // 2. Prioritize AVAILABLE connectors, sorted by powerKw descending
    const available = connectors.filter((c) => c.runtimeStatus === 'AVAILABLE' || (c as any).status === 'AVAILABLE');
    const sorted = (available.length > 0 ? available : connectors).slice().sort(
      (a, b) => (b.powerKw ?? 0) - (a.powerKw ?? 0),
    );
    const chosenConnector = sorted[0];

    // 3. Determine earliest start time (align to 30-min grid & >= 60-min lead time per BookingTimePolicy)
    const now = new Date();
    const todayStr = formatDateParam(now);

    const availability = await getStationAvailability(stationId, chosenConnector.id, todayStr, { accessToken: token });

    let startAtDate: Date;
    if (availability?.earliestStartAt) {
      startAtDate = new Date(availability.earliestStartAt);
      startAtDate.setSeconds(0, 0);
      const remainderMin = startAtDate.getMinutes() % 30;
      if (remainderMin !== 0) {
        startAtDate.setMinutes(startAtDate.getMinutes() + (30 - remainderMin));
      }
    } else {
      startAtDate = new Date(now.getTime() + 60 * 60_000); // 60-minute minimum advance
      startAtDate.setSeconds(0, 0);
      const remainderMin = startAtDate.getMinutes() % 30;
      if (remainderMin !== 0) {
        startAtDate.setMinutes(startAtDate.getMinutes() + (30 - remainderMin));
      }
    }

    const durationMin = 60; // Standard 1-hour session

    // 4. Check for busy range conflicts and advance by 30-min grid to next available slot
    if (availability?.busyRanges && availability.busyRanges.length > 0) {
      for (let attempt = 0; attempt < 8; attempt++) {
        const slotEnd = new Date(startAtDate.getTime() + durationMin * 60_000);
        const busy = isRangeBusy(
          availability.busyRanges,
          startAtDate.toISOString(),
          slotEnd.toISOString(),
        );
        if (!busy) break;
        startAtDate = new Date(startAtDate.getTime() + 30 * 60_000);
      }
    }

    // 5. Jump straight to BookingConfirmationScreen with isFastTrack flag.
    // BookingConfirmationScreen & TimeRangePickerScreen intercept the back navigation
    // to unwind smoothly: BookingConfirmation -> TimeRangePicker -> StationDetail -> Home.
    navigation.navigate('BookingConfirmation', {
      stationId,
      connectorId: chosenConnector.id,
      startAt: startAtDate.toISOString(),
      durationMin,
      priceRanges: availability?.priceRanges,
      isFastTrack: true,
    });
  } catch (err) {
    console.warn('Fast-track quick booking failed, falling back to StationDetail:', err);
    navigation.navigate('StationDetail', { stationId });
  } finally {
    onLoadingChange?.(false);
  }
}
