import {
  getConnectorsByStation,
  getStationAvailability,
  getStationDetail,
  isRangeBusy,
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
 * 3. Calculates the earliest available non-conflicting 60-minute charging slot today.
 * 4. Navigates straight to BookingConfirmationScreen with pre-filled parameters.
 */
export async function executeQuickBook(
  stationId: string,
  navigation: any,
  onLoadingChange?: (loading: boolean) => void,
): Promise<void> {
  try {
    onLoadingChange?.(true);

    // 1. Fetch connectors for this station (via getStationDetail to guarantee real backend data)
    const detail = await getStationDetail(stationId);
    const connectors = detail?.connectors && detail.connectors.length > 0
      ? detail.connectors
      : await getConnectorsByStation(stationId);

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

    // 3. Determine earliest start time (today, rounded up to next 15-minute slot with buffer)
    const now = new Date();
    const todayStr = formatDateParam(now);

    const availability = await getStationAvailability(stationId, chosenConnector.id, todayStr);

    let startAtDate = new Date(now.getTime() + 10 * 60_000); // 10-minute buffer
    const remainderMin = startAtDate.getMinutes() % 15;
    if (remainderMin !== 0) {
      startAtDate.setMinutes(startAtDate.getMinutes() + (15 - remainderMin), 0, 0);
    } else {
      startAtDate.setSeconds(0, 0);
    }

    const durationMin = 60; // Standard 1-hour session

    // 4. Check for busy range conflicts and advance to next available slot
    if (availability?.busyRanges && availability.busyRanges.length > 0) {
      for (let attempt = 0; attempt < 8; attempt++) {
        const slotEnd = new Date(startAtDate.getTime() + durationMin * 60_000);
        const busy = isRangeBusy(
          availability.busyRanges,
          startAtDate.toISOString(),
          slotEnd.toISOString(),
        );
        if (!busy) break;
        startAtDate = new Date(startAtDate.getTime() + 15 * 60_000);
      }
    }

    // 5. Navigate straight to BookingConfirmation
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
