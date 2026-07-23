/**
 * Time already reserved on a connector by *other* drivers.
 *
 * The booking store only holds the current driver's bookings, but the time-range
 * picker has to show every range that is spoken for — otherwise the driver picks
 * a window that the backend then rejects. This stands in for the availability
 * the server will return from `GET /connectors/:id/availability`.
 *
 * Ranges are anchored to "today" so a demo always has a realistically busy day
 * whatever the device clock says.
 */
export interface OccupiedRange {
  connectorId: string;
  startAt: string; // ISO datetime
  endAt: string;
}

/** ISO for `dayOffset` days from today at HH:MM local. */
function at(dayOffset: number, hour: number, minute = 0): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function range(connectorId: string, dayOffset: number, from: [number, number], to: [number, number]): OccupiedRange {
  return {
    connectorId,
    startAt: at(dayOffset, from[0], from[1]),
    endAt: at(dayOffset, to[0], to[1]),
  };
}

export const occupancyMock: OccupiedRange[] = [
  // cn-1011 — the busiest port at Vincom (fast DC, city centre)
  range('cn-1011', 0, [8, 0], [9, 30]),
  range('cn-1011', 0, [12, 0], [13, 0]),
  range('cn-1011', 0, [18, 0], [19, 30]),
  range('cn-1011', 1, [7, 0], [8, 0]),
  range('cn-1011', 1, [14, 0], [16, 0]),
  // cn-1012
  range('cn-1012', 0, [10, 0], [11, 0]),
  range('cn-1012', 1, [17, 30], [19, 0]),
  // cn-1022
  range('cn-1022', 0, [15, 0], [16, 30]),
  // cn-2011
  range('cn-2011', 0, [6, 0], [7, 0]),
  range('cn-2011', 0, [20, 0], [22, 0]),
  // cn-3011
  range('cn-3011', 0, [9, 0], [10, 30]),
  range('cn-3011', 0, [15, 0], [17, 0]),
  range('cn-3011', 1, [11, 0], [12, 30]),
];
