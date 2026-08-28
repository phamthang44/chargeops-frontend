/**
 * Deterministic mock dataset — ported from the seed() logic in
 * design-console/ChargeOps Console.dc.html so screens match the design.
 * Same seed → same data on every reload (stable for demos and tests).
 */
import type {
  Booking,
  BookingStatus,
  ChargePoint,
  Connector,
  ConnectorType,
  License,
  LicenseStatusEventDto,
  PaymentMethod,
  PolicyDoc,
  PricingConfig,
  RateKind,
  Station,
  StationStaffMember,
  Ticket,
  TicketMessage,
  Transaction,
  UserAccount,
} from '../types';

export interface MockDb {
  bookings: Booking[];
  chargePoints: ChargePoint[];
  connectors: Connector[];
  ownerStations: Station[];
  approvalQueue: Station[];
  /** Every approved station platform-wide (admin scope). */
  allStations: Station[];
  licenses: License[];
  licenseStatusEvents: Record<string, LicenseStatusEventDto[]>;
  users: UserAccount[];
  stationStaff: StationStaffMember[];
  policyDocs: PolicyDoc[];
  transactions: Transaction[];
  tickets: Ticket[];
  /** Keyed by ticket id, oldest-first. */
  ticketMessages: Record<string, TicketMessage[]>;
  pricing: PricingConfig;
  /** Independent Owner override per Station; pricing remains the fallback seed. */
  pricingByStation: Record<string, PricingConfig>;
  /** Station ids owned by the mock owner account. */
  ownerStationIds: string[];
  /** Every known station id/name — admin's reassign target list. */
  stationsDirectory: { id: string; name: string }[];
}

function lcg(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Local wall-clock ISO (no 'Z') — matches the convention of every other seeded timestamp. */
function toLocalIso(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/* ---- TOU banding, mirroring the seeded pricing rules below ---- */
// standard 05:00–17:00 · peak 17:00–21:00 · off-peak 21:00–05:00
const BAND_BOUNDARIES = [300, 1020, 1260, 1440];

function bandOf(totalMin: number): RateKind {
  const m = ((totalMin % 1440) + 1440) % 1440;
  if (m >= 1020 && m < 1260) return 'peak';
  if (m >= 300 && m < 1020) return 'standard';
  return 'offpeak';
}

/** Next TOU boundary at or after `totalMin`, carrying across midnight. */
function nextBoundary(totalMin: number): number {
  const inDay = ((totalMin % 1440) + 1440) % 1440;
  const dayStart = totalMin - inDay;
  for (const b of BAND_BOUNDARIES) if (b > inDay) return dayStart + b;
  return dayStart + 1440;
}

/** Split a booking window into the TOU segments it actually crosses (BookingPriceLine). */
function splitIntoBands(startTot: number, durationMin: number): { from: number; to: number; kind: RateKind }[] {
  const segments: { from: number; to: number; kind: RateKind }[] = [];
  const end = startTot + durationMin;
  let cur = startTot;
  while (cur < end) {
    const to = Math.min(nextBoundary(cur), end);
    segments.push({ from: cur, to, kind: bandOf(cur) });
    cur = to;
  }
  return segments;
}

/** Minute-of-June-`day` → local ISO, rolling into following days as needed. */
function isoAt(day: number, totalMin: number): string {
  const dayOffset = Math.floor(totalMin / 1440);
  const inDay = totalMin - dayOffset * 1440;
  return `2026-06-${pad(day + dayOffset)}T${pad(Math.floor(inDay / 60))}:${pad(inDay % 60)}:00`;
}

export function buildMockDb(): MockDb {
  const R = lcg(99173);
  const pick = <T,>(a: T[]): T => a[Math.floor(R() * a.length)];

  const drivers = ['Nguyễn Văn An', 'Trần Minh Hà', 'Lê Thị Bình', 'Phạm Quốc Dũng', 'Vũ Ngọc Khanh', 'Đỗ Hải Long', 'Bùi Thu Hương', 'Hoàng Văn Tú', 'Đặng Mỹ Linh', 'Ngô Bảo Châu', 'Lý Thanh Sơn', 'Mai Phương Thảo'];
  const stationNames = ['Trạm Hà Đông', 'Trạm Cầu Giấy', 'Trạm Long Biên', 'Trạm Thanh Xuân', 'Trạm Đống Đa'];
  const stationIds: Record<string, string> = { 'Trạm Hà Đông': 'ST-1001', 'Trạm Cầu Giấy': 'ST-1018', 'Trạm Long Biên': 'ST-1042', 'Trạm Thanh Xuân': 'ST-1023', 'Trạm Đống Đa': 'ST-1009' };
  const owners: Record<string, string> = { 'Trạm Hà Đông': 'EVGo Co.', 'Trạm Cầu Giấy': 'EVGo Co.', 'Trạm Long Biên': 'Minh Phát EV', 'Trạm Thanh Xuân': 'GreenVolt', 'Trạm Đống Đa': 'SaigonCharge' };
  const conns: [ConnectorType, number, number][] = [
    ['CCS2', 60, 4200],
    ['CCS2', 120, 5000],
    ['CHADEMO', 50, 3800],
    ['TYPE2', 22, 3000],
  ];
  const statuses: BookingStatus[] = ['pending', 'confirmed', 'confirmed', 'checkedin', 'charging', 'completed', 'completed', 'completed', 'cancelled', 'cancelled'];
  const methods: PaymentMethod[] = ['VNPAY', 'VNPAY', 'MOMO', 'ATM'];

  /* ---- bookings ---- */
  const bookings: Booking[] = [];
  for (let i = 0; i < 90; i++) {
    const stationName = pick(stationNames);
    const [connector, powerKw, baseRate] = pick(conns);
    const day = 28 - Math.floor(R() * 11);
    const sh = 6 + Math.floor(R() * 15);
    const sm = pick([0, 15, 30, 45]);
    const durationMin = pick([45, 60, 90, 60, 120, 30]);
    const endTot = sh * 60 + sm + durationMin;
    const status = statuses[Math.floor(R() * statuses.length)];
    const startTot = sh * 60 + sm;

    // One price line per TOU band the window crosses; the total is their sum,
    // so a 16:30–18:30 booking is genuinely split standard + peak.
    const rateFor = (k: RateKind) => (k === 'peak' ? baseRate + 800 : k === 'offpeak' ? baseRate - 600 : baseRate);
    const priceLines = splitIntoBands(startTot, durationMin).map((seg) => {
      const segMin = seg.to - seg.from;
      const segEnergy = +(powerKw * (segMin / 60) * 0.62).toFixed(1);
      const segRate = rateFor(seg.kind);
      return {
        fromAt: isoAt(day, seg.from),
        toAt: isoAt(day, seg.to),
        rateKind: seg.kind,
        rateVndPerKwh: segRate,
        energyKwh: segEnergy,
        amountVnd: Math.round((segEnergy * segRate) / 1000) * 1000,
      };
    });
    // Dominant band drives the summary chip; the lines drive the money.
    const dominant = [...priceLines].sort(
      (a, b) => new Date(b.toAt).getTime() - new Date(b.fromAt).getTime() - (new Date(a.toAt).getTime() - new Date(a.fromAt).getTime()),
    )[0];
    const rateKind: RateKind = dominant.rateKind;
    const rateVndPerKwh = dominant.rateVndPerKwh;
    const energyKwh = +priceLines.reduce((s, l) => s + l.energyKwh, 0).toFixed(1);
    const amountVnd = priceLines.reduce((s, l) => s + l.amountVnd, 0);
    // BR-PAY-03 refund tiers by time-before-start at cancel moment
    let refundPct: number | null = null;
    let refundVnd = 0;
    if (status === 'cancelled') {
      refundPct = pick([100, 100, 50, 0, 0]);
      refundVnd = Math.round((amountVnd * refundPct) / 100 / 1000) * 1000;
    }
    const eh = Math.floor(endTot / 60);
    // Booking created some lead time before its slot start (BR-BOK-02 style lead, not the 10-min hold window).
    const leadMin = pick([10, 20, 45, 90, 180, 720, 1440]);
    let createdTot = sh * 60 + sm - leadMin;
    let createdDay = day;
    if (createdTot < 0) {
      createdTot += 24 * 60;
      createdDay -= 1;
    }
    bookings.push({
      id: 'BK-' + (38100 + i),
      stationId: stationIds[stationName],
      stationName,
      ownerName: owners[stationName],
      connectorId: 'CH-' + pad(1 + Math.floor(R() * 8)),
      connector,
      powerKw,
      driverName: pick(drivers),
      driverPhone: '+84 9' + pad(Math.floor(R() * 90)) + ' •••• ' + pad(Math.floor(R() * 90)) + Math.floor(R() * 9),
      createdAt: `2026-06-${pad(createdDay)}T${pad(Math.floor(createdTot / 60))}:${pad(createdTot % 60)}:00`,
      // BR-BOK-02: the 10-minute hold only exists while payment is outstanding.
      expiresAt: status === 'pending' ? `2026-06-${pad(createdDay)}T${pad(Math.floor((createdTot + 10) / 60))}:${pad((createdTot + 10) % 60)}:00` : null,
      startAt: isoAt(day, startTot),
      endAt: isoAt(day, endTot),
      durationMin,
      rateKind,
      rateVndPerKwh,
      energyKwh,
      amountVnd,
      priceLines,
      refundPct,
      refundVnd,
      method: pick(methods),
      status,
    });
  }
  bookings.sort((a, b) => (a.startAt < b.startAt ? 1 : -1));

  /* ---- live grace-period demo bookings (FR08) — createdAt anchored to real wall-clock "now" ---- */
  const now = Date.now();
  const freshBookings: [string, number][] = [
    ['BK-39002', 2 * 60_000], // created 2 min ago — still inside the 5-min grace window on load
    ['BK-39001', 20 * 60_000], // created 20 min ago — grace window already closed, normal tiers apply
  ];
  for (const [id, ageMs] of freshBookings) {
    const created = new Date(now - ageMs);
    const start = new Date(now + 90 * 60_000);
    const end = new Date(start.getTime() + 60 * 60_000);
    const [connector, powerKw, baseRate] = conns[0];
    const energyKwh = +(powerKw * 1 * 0.62).toFixed(1);
    const amountVnd = Math.round((energyKwh * baseRate) / 1000) * 1000;
    bookings.unshift({
      id,
      stationId: 'ST-1001',
      stationName: 'Trạm Hà Đông',
      ownerName: 'EVGo Co.',
      connectorId: 'CH-01',
      connector,
      powerKw,
      driverName: 'Nguyễn Văn An',
      driverPhone: '+84 987 654 321',
      createdAt: toLocalIso(created),
      expiresAt: null, // already confirmed — the payment hold no longer applies
      startAt: toLocalIso(start),
      endAt: toLocalIso(end),
      durationMin: 60,
      rateKind: 'standard',
      rateVndPerKwh: baseRate,
      energyKwh,
      amountVnd,
      priceLines: [
        { fromAt: toLocalIso(start), toAt: toLocalIso(end), rateKind: 'standard', rateVndPerKwh: baseRate, energyKwh, amountVnd },
      ],
      refundPct: null,
      refundVnd: 0,
      method: 'VNPAY',
      status: 'confirmed',
    });
  }

  /* ---- charge points & connectors (owner's Trạm Hà Đông) — FR10/FR14 ---- */
  /* ---- charge points & connectors (owner's Trạm Hà Đông) — FR10/FR14 ---- */
  const chargePoints: ChargePoint[] = [
    { id: 'CP-01', stationId: 'ST-1001', name: 'Cổng A1', zoneLabel: 'Gần lối vào', maxPowerKw: 60, provisioningStatus: 'ACTIVE', operationalStatus: 'AVAILABLE' },
    { id: 'CP-02', stationId: 'ST-1001', name: 'Cổng A2', zoneLabel: 'Gần lối vào', maxPowerKw: 60, provisioningStatus: 'ACTIVE', operationalStatus: 'AVAILABLE' },
    { id: 'CP-03', stationId: 'ST-1001', name: 'Cổng B1', zoneLabel: 'Khu vực B, hàng 2', maxPowerKw: 50, provisioningStatus: 'ACTIVE', operationalStatus: 'AVAILABLE' },
    { id: 'CP-04', stationId: 'ST-1001', name: 'Cổng B2', zoneLabel: 'Khu vực B, hàng 2', maxPowerKw: 22, provisioningStatus: 'ACTIVE', operationalStatus: 'AVAILABLE' },
    { id: 'CP-05', stationId: 'ST-1001', name: 'Cổng C1', zoneLabel: 'Sát trạm biến áp', maxPowerKw: 120, provisioningStatus: 'ACTIVE', operationalStatus: 'AVAILABLE' },
  ];
  const connectors: Connector[] = [
    { id: 'CH-01', chargePointId: 'CP-01', connectorCode: 'C-01', name: 'Súng CCS2 1', connectorType: 'CCS2', powerKw: 60, runtimeStatus: 'AVAILABLE', utilizationPct: 72, sessionsToday: 14, uptime30dPct: 99.6, kwhToday: 248, faultCount: 0, lastSeen: '12 giây trước' },
    { id: 'CH-02', chargePointId: 'CP-02', connectorCode: 'C-01', name: 'Súng CCS2 1', connectorType: 'CCS2', powerKw: 60, runtimeStatus: 'AVAILABLE', utilizationPct: 81, sessionsToday: 17, uptime30dPct: 99.9, kwhToday: 296, faultCount: 0, lastSeen: '4 giây trước' },
    { id: 'CH-03', chargePointId: 'CP-03', connectorCode: 'C-01', name: 'Súng CHAdeMO 1', connectorType: 'CHADEMO', powerKw: 50, runtimeStatus: 'OFFLINE', utilizationPct: 0, sessionsToday: 0, uptime30dPct: 92.1, kwhToday: 0, faultCount: 2, lastSeen: '2 giờ trước' },
    { id: 'CH-04', chargePointId: 'CP-04', connectorCode: 'C-01', name: 'Súng AC 1', connectorType: 'TYPE2', powerKw: 22, runtimeStatus: 'OFFLINE', utilizationPct: 0, sessionsToday: 0, uptime30dPct: 78.4, kwhToday: 0, faultCount: 1, lastSeen: '1 ngày trước' },
    { id: 'CH-05', chargePointId: 'CP-05', connectorCode: 'C-01', name: 'Súng CCS2 1', connectorType: 'CCS2', powerKw: 120, runtimeStatus: 'AVAILABLE', utilizationPct: 64, sessionsToday: 11, uptime30dPct: 99.2, kwhToday: 372, faultCount: 0, lastSeen: '9 giây trước' },
  ];

  /* ---- admin-provisioned records (unclaimed Charge Point + its Connectors) ---- */
  const provisionedChargePoints: ChargePoint[] = [
    { id: 'CP-3303', stationId: 'ST-1042', name: 'Cổng A1', zoneLabel: null, maxPowerKw: 60, provisioningStatus: 'ACTIVE', operationalStatus: 'AVAILABLE' },
    { id: 'CP-3302', stationId: 'ST-1042', name: '—', zoneLabel: null, maxPowerKw: 60, provisioningStatus: 'PENDING_ACTIVATION', operationalStatus: 'AVAILABLE' },
    { id: 'CP-3301', stationId: 'ST-1042', name: '—', zoneLabel: null, maxPowerKw: 50, provisioningStatus: 'PENDING_ACTIVATION', operationalStatus: 'AVAILABLE' },
    { id: 'CP-3300', stationId: 'ST-1042', name: '—', zoneLabel: null, maxPowerKw: 22, provisioningStatus: 'PENDING_ACTIVATION', operationalStatus: 'AVAILABLE' },
  ];
  const provisionedConnectors: Connector[] = [
    { id: 'CH-3303', chargePointId: 'CP-3303', connectorCode: 'C-01', name: 'Súng CCS2 1', connectorType: 'CCS2', powerKw: 60, runtimeStatus: 'AVAILABLE', utilizationPct: 0, sessionsToday: 0, uptime30dPct: 100, kwhToday: 0, faultCount: 0, lastSeen: '—' },
    { id: 'CH-3302', chargePointId: 'CP-3302', connectorCode: 'C-01', name: 'Súng CCS2 1', connectorType: 'CCS2', powerKw: 60, runtimeStatus: 'OFFLINE', utilizationPct: 0, sessionsToday: 0, uptime30dPct: 0, kwhToday: 0, faultCount: 0, lastSeen: '—' },
    { id: 'CH-3301', chargePointId: 'CP-3301', connectorCode: 'C-01', name: 'Súng CHAdeMO 1', connectorType: 'CHADEMO', powerKw: 50, runtimeStatus: 'OFFLINE', utilizationPct: 0, sessionsToday: 0, uptime30dPct: 0, kwhToday: 0, faultCount: 0, lastSeen: '—' },
    { id: 'CH-3300', chargePointId: 'CP-3300', connectorCode: 'C-01', name: 'Súng AC 1', connectorType: 'TYPE2', powerKw: 22, runtimeStatus: 'OFFLINE', utilizationPct: 0, sessionsToday: 0, uptime30dPct: 0, kwhToday: 0, faultCount: 0, lastSeen: '—' },
  ];

  /* ---- owner stations (FR12) ---- */
  const ownerStations: Station[] = [
    { id: 'ST-1001', stationCode: 'ST-1001', name: 'Trạm Hà Đông', city: 'Hà Nội', address: '210 Quang Trung, Hà Đông', ownerName: 'EVGo Co.', chargerCount: 5, onlineCount: 4, status: 'active', licenseSummary: 'Năm · hết hạn 12/09/2026', rejectionReason: null, bookingsToday: 24, revenueWeekVnd: 12_400_000, utilizationPct: 68, submittedAt: null, amenities: ['wifi', 'coffee', 'parking', 'restroom'] },
    { id: 'ST-1018', stationCode: 'ST-1018', name: 'Trạm Cầu Giấy', city: 'Hà Nội', address: '88 Trần Thái Tông, Cầu Giấy', ownerName: 'EVGo Co.', chargerCount: 6, onlineCount: 6, status: 'active', licenseSummary: 'Tháng · hết hạn 30/07/2026', rejectionReason: null, bookingsToday: 31, revenueWeekVnd: 15_800_000, utilizationPct: 74, submittedAt: null, amenities: ['wifi', 'food', 'security'] },
    { id: 'ST-1056', stationCode: 'ST-1056', name: 'Trạm Mỹ Đình', city: 'Hà Nội', address: '15 Phạm Hùng, Nam Từ Liêm', ownerName: 'EVGo Co.', chargerCount: 4, onlineCount: 0, status: 'pending', licenseSummary: null, rejectionReason: null, bookingsToday: 0, revenueWeekVnd: 0, utilizationPct: 0, submittedAt: '2026-06-26' },
    { id: 'ST-1049', stationCode: 'ST-1049', name: 'Trạm Gia Lâm', city: 'Hà Nội', address: '7 Ngô Gia Tự, Long Biên', ownerName: 'EVGo Co.', chargerCount: 3, onlineCount: 0, status: 'rejected', licenseSummary: null, rejectionReason: 'Thiếu giấy phép kinh doanh hợp lệ; vui lòng nộp lại bản công chứng.', bookingsToday: 0, revenueWeekVnd: 0, utilizationPct: 0, submittedAt: '2026-06-20' },
  ];

  /* ---- admin approval queue ---- */
  // NB: ST-1042 is deliberately NOT here — it already has provisioned charge
  // points, which under FR14 can only happen after approval (step 2 → step 3).
  const approvalQueue: Station[] = [
    { id: 'ST-1044', stationCode: 'ST-1044', name: 'Trạm Tây Hồ', city: 'Hà Nội', address: '19 Lạc Long Quân', ownerName: 'CityVolt', chargerCount: 3, onlineCount: 0, status: 'pending', licenseSummary: null, rejectionReason: null, bookingsToday: 0, revenueWeekVnd: 0, utilizationPct: 0, submittedAt: '2026-06-27' },
    { id: 'ST-1041', stationCode: 'ST-1041', name: 'Trạm Đống Đa', city: 'Hà Nội', address: '45 Tây Sơn', ownerName: 'GreenVolt', chargerCount: 2, onlineCount: 0, status: 'pending', licenseSummary: null, rejectionReason: null, bookingsToday: 0, revenueWeekVnd: 0, utilizationPct: 0, submittedAt: '2026-06-27' },
    { id: 'ST-1039', stationCode: 'ST-1039', name: 'Trạm Thủ Đức', city: 'TP.HCM', address: '88 Võ Văn Ngân', ownerName: 'SaigonCharge', chargerCount: 6, onlineCount: 0, status: 'pending', licenseSummary: null, rejectionReason: null, bookingsToday: 0, revenueWeekVnd: 0, utilizationPct: 0, submittedAt: '2026-06-26' },
    { id: 'ST-1037', stationCode: 'ST-1037', name: 'Trạm Hải Châu', city: 'Đà Nẵng', address: '12 Bạch Đằng', ownerName: 'DaNang EV', chargerCount: 3, onlineCount: 0, status: 'pending', licenseSummary: null, rejectionReason: null, bookingsToday: 0, revenueWeekVnd: 0, utilizationPct: 0, submittedAt: '2026-06-25' },
    { id: 'ST-1034', stationCode: 'ST-1034', name: 'Trạm Ninh Kiều', city: 'Cần Thơ', address: '5 Hai Bà Trưng', ownerName: 'MekongVolt', chargerCount: 2, onlineCount: 0, status: 'pending', licenseSummary: null, rejectionReason: null, bookingsToday: 0, revenueWeekVnd: 0, utilizationPct: 0, submittedAt: '2026-06-24' },
  ];

  /**
   * Every approved station on the platform (FR12 admin scope). Sized to be
   * realistic rather than convenient: at this count a plain dropdown stops
   * working, which is why the provisioning screen searches and filters instead.
   */
  const cityAreas: [string, string[]][] = [
    ['Hà Nội', ['Hoàn Kiếm', 'Ba Đình', 'Thanh Xuân', 'Hoàng Mai', 'Tây Hồ']],
    ['TP.HCM', ['Quận 1', 'Quận 7', 'Bình Thạnh', 'Thủ Đức', 'Gò Vấp']],
    ['Đà Nẵng', ['Hải Châu', 'Sơn Trà', 'Ngũ Hành Sơn']],
    ['Hải Phòng', ['Lê Chân', 'Ngô Quyền']],
    ['Cần Thơ', ['Ninh Kiều', 'Cái Răng']],
    ['Khánh Hòa', ['Nha Trang', 'Cam Ranh']],
    ['Đồng Nai', ['Biên Hòa']],
    ['Bà Rịa - Vũng Tàu', ['Vũng Tàu']],
    ['Thừa Thiên Huế', ['TP. Huế']],
    ['Quảng Ninh', ['Hạ Long']],
  ];
  const streets = ['Nguyễn Trãi', 'Lê Lợi', 'Trần Hưng Đạo', 'Hùng Vương', 'Nguyễn Huệ', 'Lý Thường Kiệt', 'Phan Chu Trinh'];
  const operators = ['EVGo Co.', 'Minh Phát EV', 'GreenVolt', 'SaigonCharge', 'DaNang EV', 'MekongVolt', 'CityVolt', 'VinCharge', 'Phương Nam Power', 'Trung Bộ EV'];

  const generatedStations: Station[] = [];
  let stationSeq = 1100;
  for (const [city, areas] of cityAreas) {
    for (const area of areas) {
      const owner = pick(operators);
      const chargerCount = 2 + Math.floor(R() * 6);
      const code = 'ST-' + stationSeq++;
      generatedStations.push({
        id: code,
        stationCode: code,
        name: `Trạm ${area}`,
        city,
        address: `${1 + Math.floor(R() * 200)} ${pick(streets)}, ${area}`,
        ownerName: owner,
        chargerCount,
        onlineCount: Math.max(0, chargerCount - Math.floor(R() * 2)),
        status: 'active',
        licenseSummary: R() > 0.5 ? 'Năm · hết hạn 12/09/2026' : 'Tháng · hết hạn 30/07/2026',
        rejectionReason: null,
        bookingsToday: Math.floor(R() * 40),
        revenueWeekVnd: Math.round((2 + R() * 16) * 1_000_000),
        utilizationPct: 40 + Math.floor(R() * 50),
        submittedAt: null,
      });
    }
  }

  const allStations: Station[] = [
    // Long Biên is approved and mid-provisioning — it owns the CP-33xx records.
    { id: 'ST-1042', stationCode: 'ST-1042', name: 'Trạm Long Biên', city: 'Hà Nội', address: '123 Ngọc Lâm, Long Biên', ownerName: 'Minh Phát EV', chargerCount: 4, onlineCount: 1, status: 'active', licenseSummary: 'Năm · hết hạn 01/07/2027', rejectionReason: null, bookingsToday: 0, revenueWeekVnd: 0, utilizationPct: 0, submittedAt: null },
    ...ownerStations.filter((s) => s.status === 'active'),
    ...generatedStations,
  ];

  /* ---- licenses ---- */
  const licenses: License[] = [
    {
      id: '71c9fc68-3bb8-49e1-a27e-c301ad3519b0',
      licenseCode: 'LIC-001001',
      stationId: 'ST-1001',
      stationCode: 'ST-1001',
      stationName: 'Trạm Hà Đông',
      ownerName: 'EVGo Co.',
      plan: 'YEARLY',
      feeAmount: 5_000_000,
      startAt: '2025-09-12T00:00:00Z',
      expiresAt: '2026-09-12T00:00:00Z',
      startDate: '2025-09-12',
      expiryDate: '2026-09-12',
      daysLeft: 76,
      status: 'ACTIVE',
      priceVnd: 5_000_000,
      createdAt: '2025-09-10T08:30:00Z',
      recordedByName: 'Quản trị hệ thống',
    },
    {
      id: 'b4a8e721-5f29-4d63-9e12-871234abcd01',
      licenseCode: 'LIC-001002',
      stationId: 'ST-1018',
      stationCode: 'ST-1018',
      stationName: 'Trạm Cầu Giấy',
      ownerName: 'VinCharge',
      plan: 'MONTHLY',
      feeAmount: 500_000,
      startAt: '2026-06-30T00:00:00Z',
      expiresAt: '2026-07-30T00:00:00Z',
      startDate: '2026-06-30',
      expiryDate: '2026-07-30',
      daysLeft: 31,
      status: 'ACTIVE',
      priceVnd: 500_000,
      createdAt: '2026-06-29T14:15:00Z',
      recordedByName: 'Quản trị hệ thống',
    },
    {
      id: 'e29d4b1a-9812-47c3-bc34-90a12f345678',
      licenseCode: 'LIC-001003',
      stationId: 'ST-1023',
      stationCode: 'ST-1023',
      stationName: 'Trạm Thanh Xuân',
      ownerName: 'GreenVolt',
      plan: 'YEARLY',
      feeAmount: 5_000_000,
      startAt: '2025-07-10T00:00:00Z',
      expiresAt: '2026-07-10T00:00:00Z',
      startDate: '2025-07-10',
      expiryDate: '2026-07-10',
      daysLeft: 11,
      status: 'ACTIVE',
      priceVnd: 5_000_000,
      expiringSoon: true,
      createdAt: '2025-07-08T09:00:00Z',
      recordedByName: 'Quản trị hệ thống',
    },
    {
      id: 'f93c812d-341a-46be-a9b8-12cd456ef789',
      licenseCode: 'LIC-001004',
      stationId: 'ST-1009',
      stationCode: 'ST-1009',
      stationName: 'Trạm Đống Đa',
      ownerName: 'SaigonCharge',
      plan: 'MONTHLY',
      feeAmount: 500_000,
      startAt: '2026-05-02T00:00:00Z',
      expiresAt: '2026-06-02T00:00:00Z',
      startDate: '2026-05-02',
      expiryDate: '2026-06-02',
      daysLeft: -27,
      status: 'EXPIRED',
      priceVnd: 500_000,
      createdAt: '2026-05-01T10:00:00Z',
      recordedByName: 'Quản trị hệ thống',
    },
    {
      id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      licenseCode: 'LIC-001005',
      stationId: 'ST-1031',
      stationCode: 'ST-1031',
      stationName: 'Trạm Hoàn Kiếm',
      ownerName: 'CityVolt',
      plan: 'YEARLY',
      feeAmount: 5_000_000,
      startAt: '2026-01-20T00:00:00Z',
      expiresAt: '2027-01-20T00:00:00Z',
      startDate: '2026-01-20',
      expiryDate: '2027-01-20',
      daysLeft: 205,
      status: 'ACTIVE',
      priceVnd: 5_000_000,
      createdAt: '2026-01-19T11:20:00Z',
      recordedByName: 'Quản trị hệ thống',
    },
    {
      id: 'c87d6e5f-4a3b-2c1d-0e9f-8a7b6c5d4e3f',
      licenseCode: 'LIC-001006',
      stationId: 'ST-1044',
      stationCode: 'ST-1044',
      stationName: 'Trạm Ba Đình',
      ownerName: 'HanoiPower',
      plan: 'YEARLY',
      feeAmount: 5_000_000,
      startAt: '2026-03-15T00:00:00Z',
      expiresAt: '2027-03-15T00:00:00Z',
      startDate: '2026-03-15',
      expiryDate: '2027-03-15',
      daysLeft: 240,
      status: 'SUSPENDED',
      priceVnd: 5_000_000,
      createdAt: '2026-03-14T16:00:00Z',
      recordedByName: 'Quản trị viên Vũ A.',
    },
    {
      id: 'd9e8f7a6-b5c4-3d2e-1f0a-9b8c7d6e5f4a',
      licenseCode: 'LIC-001007',
      stationId: 'ST-1052',
      stationCode: 'ST-1052',
      stationName: 'Trạm Hai Bà Trưng',
      ownerName: 'RedRiver EV',
      plan: 'MONTHLY',
      feeAmount: 500_000,
      startAt: '2026-09-01T00:00:00Z',
      expiresAt: '2026-10-01T00:00:00Z',
      startDate: '2026-09-01',
      expiryDate: '2026-10-01',
      daysLeft: 44,
      status: 'PENDING',
      priceVnd: 500_000,
      createdAt: '2026-08-15T10:00:00Z',
      recordedByName: 'Quản trị hệ thống',
    },
    {
      id: 'f1e2d3c4-b5a6-7890-1234-56789abcdef0',
      licenseCode: 'LIC-001008',
      stationId: 'ST-1060',
      stationCode: 'ST-1060',
      stationName: 'Trạm Tây Hồ',
      ownerName: 'WestLake Ops',
      plan: 'MONTHLY',
      feeAmount: 500_000,
      startAt: '2026-04-10T00:00:00Z',
      expiresAt: '2026-05-10T00:00:00Z',
      startDate: '2026-04-10',
      expiryDate: '2026-05-10',
      daysLeft: -60,
      status: 'CANCELLED',
      priceVnd: 500_000,
      createdAt: '2026-04-09T08:00:00Z',
      recordedByName: 'Quản trị viên Lê B.',
    },
    {
      id: '01234567-89ab-cdef-0123-456789abcdef',
      licenseCode: 'LIC-000998',
      stationId: 'ST-1001',
      stationCode: 'ST-1001',
      stationName: 'Trạm Hà Đông',
      ownerName: 'EVGo Co.',
      plan: 'YEARLY',
      feeAmount: 5_000_000,
      startAt: '2024-09-12T00:00:00Z',
      expiresAt: '2025-09-12T00:00:00Z',
      startDate: '2024-09-12',
      expiryDate: '2025-09-12',
      daysLeft: -280,
      status: 'EXPIRED',
      priceVnd: 5_000_000,
      createdAt: '2024-09-10T09:00:00Z',
      recordedByName: 'Quản trị hệ thống',
    },
    {
      id: 'fedcba98-7654-3210-fedc-ba9876543210',
      licenseCode: 'LIC-000999',
      stationId: 'ST-1023',
      stationCode: 'ST-1023',
      stationName: 'Trạm Thanh Xuân',
      ownerName: 'GreenVolt',
      plan: 'YEARLY',
      feeAmount: 5_000_000,
      startAt: '2024-07-10T00:00:00Z',
      expiresAt: '2025-07-10T00:00:00Z',
      startDate: '2024-07-10',
      expiryDate: '2025-07-10',
      daysLeft: -340,
      status: 'EXPIRED',
      priceVnd: 5_000_000,
      createdAt: '2024-07-08T09:00:00Z',
      recordedByName: 'Quản trị hệ thống',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      licenseCode: 'LIC-001009',
      stationId: 'ST-1065',
      stationCode: 'ST-1065',
      stationName: 'Trạm Long Biên',
      ownerName: 'EVGo Co.',
      plan: 'YEARLY',
      feeAmount: 5_000_000,
      startAt: '2026-02-14T00:00:00Z',
      expiresAt: '2027-02-14T00:00:00Z',
      startDate: '2026-02-14',
      expiryDate: '2027-02-14',
      daysLeft: 180,
      status: 'ACTIVE',
      priceVnd: 5_000_000,
      createdAt: '2026-02-13T10:00:00Z',
      recordedByName: 'Quản trị hệ thống',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      licenseCode: 'LIC-001010',
      stationId: 'ST-1072',
      stationCode: 'ST-1072',
      stationName: 'Trạm Landmark 81',
      ownerName: 'VinCharge',
      plan: 'YEARLY',
      feeAmount: 5_000_000,
      startAt: '2026-04-01T00:00:00Z',
      expiresAt: '2027-04-01T00:00:00Z',
      startDate: '2026-04-01',
      expiryDate: '2027-04-01',
      daysLeft: 226,
      status: 'ACTIVE',
      priceVnd: 5_000_000,
      createdAt: '2026-03-30T15:30:00Z',
      recordedByName: 'Quản trị hệ thống',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440003',
      licenseCode: 'LIC-001011',
      stationId: 'ST-1080',
      stationCode: 'ST-1080',
      stationName: 'Trạm Quận 1 Bến Nghé',
      ownerName: 'SaigonCharge',
      plan: 'MONTHLY',
      feeAmount: 500_000,
      startAt: '2026-08-01T00:00:00Z',
      expiresAt: '2026-09-01T00:00:00Z',
      startDate: '2026-08-01',
      expiryDate: '2026-09-01',
      daysLeft: 14,
      status: 'ACTIVE',
      priceVnd: 500_000,
      expiringSoon: true,
      createdAt: '2026-07-31T09:00:00Z',
      recordedByName: 'Quản trị viên Vũ A.',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440004',
      licenseCode: 'LIC-001012',
      stationId: 'ST-1088',
      stationCode: 'ST-1088',
      stationName: 'Trạm Sơn Trà Đà Nẵng',
      ownerName: 'GreenVolt',
      plan: 'MONTHLY',
      feeAmount: 500_000,
      startAt: '2026-06-15T00:00:00Z',
      expiresAt: '2026-07-15T00:00:00Z',
      startDate: '2026-06-15',
      expiryDate: '2026-07-15',
      daysLeft: -34,
      status: 'EXPIRED',
      priceVnd: 500_000,
      createdAt: '2026-06-14T08:30:00Z',
      recordedByName: 'Quản trị hệ thống',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440005',
      licenseCode: 'LIC-001013',
      stationId: 'ST-1095',
      stationCode: 'ST-1095',
      stationName: 'Trạm Hải Châu',
      ownerName: 'DanangPower',
      plan: 'YEARLY',
      feeAmount: 5_000_000,
      startAt: '2026-05-10T00:00:00Z',
      expiresAt: '2027-05-10T00:00:00Z',
      startDate: '2026-05-10',
      expiryDate: '2027-05-10',
      daysLeft: 265,
      status: 'ACTIVE',
      priceVnd: 5_000_000,
      createdAt: '2026-05-09T11:00:00Z',
      recordedByName: 'Quản trị hệ thống',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440006',
      licenseCode: 'LIC-001014',
      stationId: 'ST-1102',
      stationCode: 'ST-1102',
      stationName: 'Trạm Ninh Kiều Cần Thơ',
      ownerName: 'MekongVolt',
      plan: 'MONTHLY',
      feeAmount: 500_000,
      startAt: '2026-07-05T00:00:00Z',
      expiresAt: '2026-08-05T00:00:00Z',
      startDate: '2026-07-05',
      expiryDate: '2026-08-05',
      daysLeft: -13,
      status: 'EXPIRED',
      priceVnd: 500_000,
      createdAt: '2026-07-04T14:00:00Z',
      recordedByName: 'Quản trị hệ thống',
    },
  ];

  const licenseStatusEvents: Record<string, LicenseStatusEventDto[]> = {
    '71c9fc68-3bb8-49e1-a27e-c301ad3519b0': [
      {
        id: 'LSE-001-1',
        licenseId: '71c9fc68-3bb8-49e1-a27e-c301ad3519b0',
        eventType: 'ISSUED',
        fromStatus: null,
        toStatus: 'PENDING',
        reason: 'Ghi nhận cấp mới License sau xác minh ngoài nền tảng',
        actorType: 'USER',
        performedByName: 'Quản trị hệ thống',
        performedAt: '2025-09-10T08:30:00Z',
      },
      {
        id: 'LSE-001-2',
        licenseId: '71c9fc68-3bb8-49e1-a27e-c301ad3519b0',
        eventType: 'ACTIVATED',
        fromStatus: 'PENDING',
        toStatus: 'ACTIVE',
        reason: 'Bắt đầu kỳ hiệu lực gói 1 năm',
        actorType: 'SYSTEM',
        performedByName: null,
        performedAt: '2025-09-12T00:00:00Z',
      },
    ],
    'c87d6e5f-4a3b-2c1d-0e9f-8a7b6c5d4e3f': [
      {
        id: 'LSE-006-1',
        licenseId: 'c87d6e5f-4a3b-2c1d-0e9f-8a7b6c5d4e3f',
        eventType: 'ISSUED',
        fromStatus: null,
        toStatus: 'ACTIVE',
        reason: 'Cấp mới gói 1 năm',
        actorType: 'USER',
        performedByName: 'Quản trị hệ thống',
        performedAt: '2026-03-14T16:00:00Z',
      },
      {
        id: 'LSE-006-2',
        licenseId: 'c87d6e5f-4a3b-2c1d-0e9f-8a7b6c5d4e3f',
        eventType: 'SUSPENDED',
        fromStatus: 'ACTIVE',
        toStatus: 'SUSPENDED',
        reason: 'Chủ trạm đề nghị tạm dừng bảo dưỡng hạ tầng trạm sạc',
        actorType: 'USER',
        performedByName: 'Quản trị viên Vũ A.',
        performedAt: '2026-07-01T10:00:00Z',
      },
    ],
    'f1e2d3c4-b5a6-7890-1234-56789abcdef0': [
      {
        id: 'LSE-008-1',
        licenseId: 'f1e2d3c4-b5a6-7890-1234-56789abcdef0',
        eventType: 'ISSUED',
        fromStatus: null,
        toStatus: 'ACTIVE',
        reason: 'Cấp mới gói tháng',
        actorType: 'USER',
        performedByName: 'Quản trị viên Lê B.',
        performedAt: '2026-04-09T08:00:00Z',
      },
      {
        id: 'LSE-008-2',
        licenseId: 'f1e2d3c4-b5a6-7890-1234-56789abcdef0',
        eventType: 'CANCELLED',
        fromStatus: 'ACTIVE',
        toStatus: 'CANCELLED',
        reason: 'Trạm ngưng hợp tác vận hành nền tảng',
        actorType: 'USER',
        performedByName: 'Quản trị viên Lê B.',
        performedAt: '2026-05-01T09:30:00Z',
      },
    ],
  };

  /* ---- users (FR12) ---- */
  const users: UserAccount[] = [
    { id: 'U-2041', name: 'Nguyễn Văn An', email: 'an.nguyen@gmail.com', role: 'DRIVER', joined: '2026-03-01', bookingCount: 47, status: 'active' },
    { id: 'U-2038', name: 'EVGo Co. (Vũ A.)', email: 'ops@evgo.vn', role: 'OWNER', joined: '2025-09-01', bookingCount: 0, status: 'active' },
    { id: 'U-2035', name: 'Trần Minh Hà', email: 'ha.tran@gmail.com', role: 'DRIVER', joined: '2026-01-01', bookingCount: 12, status: 'active' },
    { id: 'U-2030', name: 'GreenVolt (Lê B.)', email: 'admin@greenvolt.vn', role: 'OWNER', joined: '2025-07-01', bookingCount: 0, status: 'active' },
    { id: 'U-2024', name: 'Phạm Quốc Dũng', email: 'dung.pham@gmail.com', role: 'DRIVER', joined: '2025-11-01', bookingCount: 3, status: 'suspended' },
    { id: 'U-2011', name: 'Đỗ Hải Long', email: 'long.do@gmail.com', role: 'DRIVER', joined: '2025-05-01', bookingCount: 89, status: 'active' },
    { id: 'U-2002', name: 'Quản trị hệ thống', email: 'admin@chargeops.vn', role: 'ADMIN', joined: '2025-01-01', bookingCount: 0, status: 'active' },
  ];

  /* ---- station staff (FR17 & V19) — assignments across the owner's stations ---- */
  const stationStaff: StationStaffMember[] = [
    {
      assignmentId: 'ASG-1001',
      stationId: 'ST-1001',
      stationName: 'Trạm Hà Đông',
      userId: 'U-2041',
      displayName: 'Nguyễn Văn An',
      name: 'Nguyễn Văn An',
      email: 'an.nguyen@gmail.com',
      maskedPhone: '098****123',
      status: 'ACTIVE',
      note: 'Kỹ thuật viên ca sáng (06:00 - 14:00)',
      assignedBy: 'U-2038',
      assignedAt: '2026-05-14T08:00:00Z',
      primaryRole: 'DRIVER',
      createdAt: '2026-05-14',
    },
    {
      assignmentId: 'ASG-1002',
      stationId: 'ST-1001',
      stationName: 'Trạm Hà Đông',
      userId: 'U-2035',
      displayName: 'Trần Minh Hà',
      name: 'Trần Minh Hà',
      email: 'ha.tran@gmail.com',
      maskedPhone: '091****888',
      status: 'ACTIVE',
      note: 'Trực vận hành & giám sát cổng sạc',
      assignedBy: 'U-2038',
      assignedAt: '2026-06-02T09:30:00Z',
      primaryRole: 'DRIVER',
      createdAt: '2026-06-02',
    },
    {
      assignmentId: 'ASG-1003',
      stationId: 'ST-1018',
      stationName: 'Trạm Cầu Giấy',
      userId: 'U-2011',
      displayName: 'Đỗ Hải Long',
      name: 'Đỗ Hải Long',
      email: 'long.do@gmail.com',
      maskedPhone: '097****999',
      status: 'ACTIVE',
      note: 'Quản lý kỹ thuật trạm Cầu Giấy',
      assignedBy: 'U-2038',
      assignedAt: '2026-06-19T14:00:00Z',
      primaryRole: 'DRIVER',
      createdAt: '2026-06-19',
    },
  ];

  /* ---- policy KB (FR15) ---- */
  const policyDocs: PolicyDoc[] = [
    { id: 'POL-01', category: 'Hủy & hoàn tiền', content: 'Hủy trong vòng 5 phút kể từ khi đặt chỗ (thời gian ân hạn) luôn được hoàn 100%, bất kể còn bao lâu đến giờ bắt đầu. Sau thời gian ân hạn: hủy trước giờ bắt đầu từ 60 phút trở lên được hoàn 100%; từ 15–60 phút hoàn 50%; dưới 15 phút hoặc không đến (no-show) hoàn 0%.', updatedAt: '2026-07-21' },
    { id: 'POL-02', category: 'Hủy & hoàn tiền', content: 'Chỉ được hủy đặt chỗ khi đang ở trạng thái Chờ thanh toán hoặc Đã xác nhận. Đặt chỗ đã Check-in hoặc Đang sạc không thể hủy.', updatedAt: '2026-06-24' },
    { id: 'POL-03', category: 'Check-in', content: 'Cửa sổ check-in mở từ thời điểm bắt đầu khung giờ và đóng đúng 15 phút sau đó. Không thể check-in trước giờ bắt đầu hoặc sau khi cửa sổ đã đóng.', updatedAt: '2026-06-24' },
    { id: 'POL-04', category: 'Check-in', content: 'Nếu tài xế không check-in trong vòng 15 phút kể từ giờ bắt đầu, đặt chỗ tự động bị hủy và hoàn 0% (xử lý như no-show).', updatedAt: '2026-06-24' },
    { id: 'POL-05', category: 'Thanh toán', content: 'Đặt chỗ chỉ chuyển sang Đã xác nhận sau khi cổng thanh toán xác nhận thu tiền thành công. Phần đặt chỗ được giữ tối đa 10 phút chờ thanh toán.', updatedAt: '2026-06-24' },
    { id: 'POL-06', category: 'Giá', content: 'Thay đổi giờ hoạt động và giá chỉ áp dụng cho đặt chỗ mới. Đặt chỗ hiện hữu giữ nguyên mức giá đã chụp tại thời điểm đặt (BookingPriceLine).', updatedAt: '2026-06-24' },
    { id: 'POL-07', category: 'Trụ sạc', content: 'Mỗi cổng sạc (Connector) có một mã QR riêng, chỉ mã hóa Charger ID của Connector đó — là nhãn nhận diện tĩnh dùng cho tài xế check-in; không dùng để chuyển quyền sở hữu hay thao tác quản trị. Một trụ sạc (Charge Point) có thể có nhiều Connector, mỗi Connector một mã QR riêng biệt.', updatedAt: '2026-07-21' },
    { id: 'POL-08', category: 'Giấy phép (License)', content: 'Mối quan hệ độc lập giữa Trạm sạc và Giấy phép: Trạng thái Trạm (Station.status) và Giấy phép (License.status) hoàn toàn độc lập và không tự động đồng bộ. Trạm chỉ hiển thị trên bản đồ tìm kiếm và cho phép tài xế đặt chỗ mới khi trạm ở trạng thái Hoạt động (ACTIVE) và đồng thời có License đang còn hiệu lực thực tế (isEffectivelyActiveAt). Trạm ACTIVE có License hết hạn hoặc tạm ngưng vẫn được giữ nguyên trạng thái phê duyệt của trạm.', updatedAt: '2026-08-17' },
    { id: 'POL-09', category: 'Giấy phép (License)', content: 'Chính sách bảo toàn giao dịch khi License hết hạn hoặc tạm ngưng: Mất hiệu lực License chỉ dừng tiếp nhận các lượt đặt chỗ MỚI từ tài xế. Mọi lịch đặt chỗ đã thanh toán/xác nhận trước thời điểm mất hiệu lực và các phiên sạc đang cắm sạc diễn ra trong thực tế vẫn được bảo đảm hoàn thành bình thường, không tự động hủy hoặc hoàn tiền đột ngột.', updatedAt: '2026-08-17' },
    { id: 'POL-10', category: 'Giấy phép (License)', content: 'Quy chế Subscription License và Ghi nhận: Việc thanh toán mua mới và gia hạn gói License (Gói Tháng 500.000 VNĐ, Gói Năm 5.000.000 VNĐ) được thực hiện ngoài nền tảng (B2B/chuyển khoản) giữa Chủ trạm và Đơn vị điều hành ChargeOps. Quản trị viên sau khi xác minh đối soát sẽ ghi nhận gói lên hệ thống để cấp quyền vận hành và tính toán doanh thu nền tảng.', updatedAt: '2026-08-17' },
  ];

  /* ---- support tickets (cross-cutting: owner/staff scoped, admin sees all) ---- */
  const msg = (ticketId: string, i: number, authorName: string, authorRole: TicketMessage['authorRole'], body: string, createdAt: string): TicketMessage => ({
    id: `MSG-${ticketId.slice(4)}-${i}`,
    ticketId,
    authorName,
    authorRole,
    body,
    createdAt,
  });

  const tickets: Ticket[] = [
    // Station-scoped (CHARGING_ISSUE / station-linked BOOKING) — reach Owner + Staff per BR-TKT-01.
    { id: 'TIC-4821', ticketNo: '#1084', subject: 'Không quét được QR để check-in trụ CH-02', category: 'charging_issue', status: 'open', stationId: 'ST-1001', stationName: 'Trạm Hà Đông', bookingId: bookings[2]?.id ?? null, reporterName: 'Trần Minh Hà', reporterPhone: '+84 987 654 321', assigneeName: null, createdAt: '2026-06-28T07:12:00', updatedAt: '2026-06-28T07:20:00', lastMessagePreview: 'Em đã check-in thủ công cho phiên của anh, anh cắm sạc bình thường.', messageCount: 4 },
    { id: 'TIC-4812', ticketNo: '#1083', subject: 'Sạc rất chậm so với công suất ghi trên trụ', category: 'charging_issue', status: 'in_progress', stationId: 'ST-1001', stationName: 'Trạm Hà Đông', bookingId: bookings[6]?.id ?? null, reporterName: 'Vũ Ngọc Khanh', reporterPhone: '+84 901 234 567', assigneeName: 'Nhân viên Trạm Hà Đông', createdAt: '2026-06-28T06:05:00', updatedAt: '2026-06-28T06:30:00', lastMessagePreview: 'Em đã kiểm tra, trụ đang chia tải với xe bên cạnh. Anh đợi thêm ít phút giúp em.', messageCount: 2 },
    { id: 'TIC-4809', ticketNo: '#1082', subject: 'Trụ CH-05 báo lỗi giữa phiên sạc', category: 'charging_issue', status: 'open', stationId: 'ST-1001', stationName: 'Trạm Hà Đông', bookingId: bookings[8]?.id ?? null, reporterName: 'Phạm Quốc Dũng', reporterPhone: '+84 933 221 100', assigneeName: null, createdAt: '2026-06-28T05:50:00', updatedAt: '2026-06-28T06:10:00', lastMessagePreview: 'Trụ đang được kiểm tra, anh vui lòng đổi sang trụ CH-01 giúp em.', messageCount: 2 },
    { id: 'TIC-4790', ticketNo: '#1079', subject: 'Xin gia hạn giờ giữ chỗ thêm 10 phút', category: 'booking', status: 'resolved', stationId: 'ST-1001', stationName: 'Trạm Hà Đông', bookingId: bookings[11]?.id ?? null, reporterName: 'Ngô Bảo Châu', reporterPhone: '+84 977 888 999', assigneeName: 'Nhân viên Trạm Hà Đông', createdAt: '2026-06-27T14:00:00', updatedAt: '2026-06-27T14:40:00', lastMessagePreview: 'Đã gia hạn 10 phút cho anh, hẹn gặp tại trạm.', messageCount: 3 },
    { id: 'TIC-4830', ticketNo: '#1086', subject: 'Cổng CCS2 không khớp với đầu sạc của xe', category: 'charging_issue', status: 'open', stationId: 'ST-1018', stationName: 'Trạm Cầu Giấy', bookingId: bookings[9]?.id ?? null, reporterName: 'Đỗ Hải Long', reporterPhone: '+84 966 777 111', assigneeName: null, createdAt: '2026-06-28T08:05:00', updatedAt: '2026-06-28T08:15:00', lastMessagePreview: 'Anh cho em xin ảnh đầu cắm trên xe để em xác nhận đúng chuẩn giúp anh.', messageCount: 2 },
    { id: 'TIC-4788', ticketNo: '#1078', subject: 'Không tìm thấy trạm trên bản đồ dù đã đặt', category: 'booking', status: 'in_progress', stationId: 'ST-1018', stationName: 'Trạm Cầu Giấy', bookingId: bookings[17]?.id ?? null, reporterName: 'Hoàng Văn Tú', reporterPhone: '+84 922 333 444', assigneeName: 'Nhân viên Trạm Cầu Giấy', createdAt: '2026-06-27T20:00:00', updatedAt: '2026-06-27T20:30:00', lastMessagePreview: 'Em đang kiểm tra lại vị trí ghim trên bản đồ, sẽ phản hồi sớm.', messageCount: 2 },
    { id: 'TIC-4772', ticketNo: '#1076', subject: 'Đặt nhầm khung giờ, xin đổi sang buổi chiều', category: 'booking', status: 'closed', stationId: 'ST-1018', stationName: 'Trạm Cầu Giấy', bookingId: bookings[13]?.id ?? null, reporterName: 'Mai Phương Thảo', reporterPhone: '+84 988 000 111', assigneeName: 'Nhân viên Trạm Cầu Giấy', createdAt: '2026-06-26T15:10:00', updatedAt: '2026-06-26T15:45:00', lastMessagePreview: 'Anh huỷ trong 5 phút đầu được hoàn 100% rồi đặt lại khung chiều giúp em nhé.', messageCount: 2 },
    // Platform-level (PAYMENT / ACCOUNT / OTHER) — route to Admin only, even though a station is linked.
    { id: 'TIC-4816', ticketNo: '#1085', subject: 'Bị trừ tiền nhưng đặt chỗ báo huỷ', category: 'payment', status: 'in_progress', stationId: 'ST-1001', stationName: 'Trạm Hà Đông', bookingId: bookings[5]?.id ?? null, reporterName: 'Lê Thị Bình', reporterPhone: '+84 912 345 678', assigneeName: 'Đội vận hành trung tâm', createdAt: '2026-06-28T06:38:00', updatedAt: '2026-06-28T06:55:00', lastMessagePreview: 'Em đã chuyển yêu cầu hoàn tiền lên hệ thống thanh toán, chờ xác nhận trong 24h.', messageCount: 2 },
    { id: 'TIC-4771', ticketNo: '#1075', subject: 'Hỏi cách xuất hoá đơn phiên sạc', category: 'account', status: 'closed', stationId: 'ST-1001', stationName: 'Trạm Hà Đông', bookingId: null, reporterName: 'Đỗ Hải Long', reporterPhone: '+84 966 777 111', assigneeName: 'Đội vận hành trung tâm', createdAt: '2026-06-26T09:00:00', updatedAt: '2026-06-26T09:30:00', lastMessagePreview: 'Hoá đơn điện tử được gửi tự động qua email sau khi phiên sạc kết thúc.', messageCount: 2 },
    { id: 'TIC-4805', ticketNo: '#1081', subject: 'Trụ tại Cầu Giấy không nhận thẻ ATM', category: 'payment', status: 'open', stationId: 'ST-1018', stationName: 'Trạm Cầu Giấy', bookingId: bookings[14]?.id ?? null, reporterName: 'Bùi Thu Hương', reporterPhone: '+84 944 555 222', assigneeName: null, createdAt: '2026-06-28T04:20:00', updatedAt: '2026-06-28T04:45:00', lastMessagePreview: 'Anh thử lại bằng VNPay hoặc Momo giúp em trong lúc em báo kỹ thuật kiểm tra đầu đọc thẻ.', messageCount: 2 },
    { id: 'TIC-4750', ticketNo: '#1073', subject: 'Trụ Long Biên báo offline liên tục', category: 'charging_issue', status: 'open', stationId: 'ST-1042', stationName: 'Trạm Long Biên', bookingId: null, reporterName: 'Đặng Mỹ Linh', reporterPhone: '+84 911 222 333', assigneeName: null, createdAt: '2026-06-25T11:00:00', updatedAt: '2026-06-25T13:00:00', lastMessagePreview: 'Minh Phát EV đang cử kỹ thuật xuống kiểm tra nguồn điện của trụ.', messageCount: 2 },
    { id: 'TIC-4733', ticketNo: '#1071', subject: 'Yêu cầu hoàn tiền do sạc gián đoạn', category: 'payment', status: 'resolved', stationId: 'ST-1023', stationName: 'Trạm Thanh Xuân', bookingId: null, reporterName: 'Lý Thanh Sơn', reporterPhone: '+84 909 111 222', assigneeName: 'Đội vận hành trung tâm', createdAt: '2026-06-23T10:00:00', updatedAt: '2026-06-24T09:00:00', lastMessagePreview: 'Đã hoàn 50% theo chính sách do gián đoạn giữa phiên (BR-PAY-03).', messageCount: 2 },
    { id: 'TIC-4700', ticketNo: '#1068', subject: 'Câu hỏi chung về chính sách hủy', category: 'account', status: 'closed', stationId: 'ST-1009', stationName: 'Trạm Đống Đa', bookingId: null, reporterName: 'Mai Phương Thảo', reporterPhone: '+84 988 000 111', assigneeName: 'Đội vận hành trung tâm', createdAt: '2026-06-20T08:00:00', updatedAt: '2026-06-20T09:15:00', lastMessagePreview: 'Đã giải đáp — hủy trước 60 phút được hoàn 100% theo BR-PAY-03.', messageCount: 2 },
  ];

  const ticketMessages: Record<string, TicketMessage[]> = {
    'TIC-4821': [
      msg('TIC-4821', 1, 'Trần Minh Hà', 'driver', 'Mình đưa xe tới CH-02 nhưng app quét QR mãi không nhận, đã thử 3 lần.', '2026-06-28T07:12:00'),
      msg('TIC-4821', 2, 'Nhân viên Trạm Hà Đông', 'station_staff', 'Chào anh, em kiểm tra ngay. Anh thử lau nhẹ tem QR trên trụ và bật lại camera giúp em nhé.', '2026-06-28T07:15:00'),
      msg('TIC-4821', 3, 'Trần Minh Hà', 'driver', 'Vẫn không được ạ. Tem hơi mờ.', '2026-06-28T07:18:00'),
      msg('TIC-4821', 4, 'Nhân viên Trạm Hà Đông', 'station_staff', 'Em đã check-in thủ công cho phiên của anh, anh cắm sạc bình thường. Em báo kỹ thuật thay tem QR trụ CH-02.', '2026-06-28T07:20:00'),
    ],
    'TIC-4816': [
      msg('TIC-4816', 1, 'Lê Thị Bình', 'driver', 'Em đặt chỗ xong bấm huỷ nhầm nhưng tiền vẫn bị trừ, chưa thấy hoàn lại.', '2026-06-28T06:38:00'),
      msg('TIC-4816', 2, 'Nhân viên Trạm Hà Đông', 'station_staff', 'Em đã chuyển yêu cầu hoàn tiền lên hệ thống thanh toán, chờ xác nhận trong 24h.', '2026-06-28T06:55:00'),
    ],
    'TIC-4809': [
      msg('TIC-4809', 1, 'Phạm Quốc Dũng', 'driver', 'Đang sạc thì trụ CH-05 tự dừng, màn hình báo lỗi E-04.', '2026-06-28T05:50:00'),
      msg('TIC-4809', 2, 'Nhân viên Trạm Hà Đông', 'station_staff', 'Trụ đang được kiểm tra, anh vui lòng đổi sang trụ CH-01 giúp em.', '2026-06-28T06:10:00'),
    ],
    'TIC-4812': [
      msg('TIC-4812', 1, 'Vũ Ngọc Khanh', 'driver', 'Trụ ghi 60kW nhưng xe chỉ nhận khoảng 25kW, có phải trụ lỗi không ạ?', '2026-06-28T06:05:00'),
      msg('TIC-4812', 2, 'Nhân viên Trạm Hà Đông', 'station_staff', 'Em đã kiểm tra, trụ đang chia tải với xe bên cạnh. Anh đợi thêm ít phút giúp em.', '2026-06-28T06:30:00'),
    ],
    'TIC-4830': [
      msg('TIC-4830', 1, 'Đỗ Hải Long', 'driver', 'Em ra tới nơi nhưng đầu CCS2 không cắm vừa xe, có cổng nào khác không ạ?', '2026-06-28T08:05:00'),
      msg('TIC-4830', 2, 'Nhân viên Trạm Cầu Giấy', 'station_staff', 'Anh cho em xin ảnh đầu cắm trên xe để em xác nhận đúng chuẩn giúp anh.', '2026-06-28T08:15:00'),
    ],
    'TIC-4772': [
      msg('TIC-4772', 1, 'Mai Phương Thảo', 'driver', 'Mình lỡ đặt khung 8h sáng, muốn đổi sang chiều nay có được không?', '2026-06-26T15:10:00'),
      msg('TIC-4772', 2, 'Nhân viên Trạm Cầu Giấy', 'station_staff', 'Anh huỷ trong 5 phút đầu được hoàn 100% rồi đặt lại khung chiều giúp em nhé.', '2026-06-26T15:45:00'),
    ],
    'TIC-4790': [
      msg('TIC-4790', 1, 'Ngô Bảo Châu', 'driver', 'Mình đang kẹt xe, xin giữ chỗ thêm 10 phút được không ạ?', '2026-06-27T14:00:00'),
      msg('TIC-4790', 2, 'Nhân viên Trạm Hà Đông', 'station_staff', 'Dạ để em kiểm tra khung giờ sau anh giúp em nhé.', '2026-06-27T14:20:00'),
      msg('TIC-4790', 3, 'Nhân viên Trạm Hà Đông', 'station_staff', 'Đã gia hạn 10 phút cho anh, hẹn gặp tại trạm.', '2026-06-27T14:40:00'),
    ],
    'TIC-4771': [
      msg('TIC-4771', 1, 'Đỗ Hải Long', 'driver', 'Mình cần hoá đơn cho phiên sạc hôm qua để làm quyết toán công ty.', '2026-06-26T09:00:00'),
      msg('TIC-4771', 2, 'Nhân viên Trạm Hà Đông', 'station_staff', 'Hoá đơn điện tử được gửi tự động qua email sau khi phiên sạc kết thúc.', '2026-06-26T09:30:00'),
    ],
    'TIC-4805': [
      msg('TIC-4805', 1, 'Bùi Thu Hương', 'driver', 'Trụ ở Cầu Giấy quẹt thẻ ATM báo lỗi hoài, thử 2 trụ đều vậy.', '2026-06-28T04:20:00'),
      msg('TIC-4805', 2, 'Nhân viên Trạm Cầu Giấy', 'station_staff', 'Anh thử lại bằng VNPay hoặc Momo giúp em trong lúc em báo kỹ thuật kiểm tra đầu đọc thẻ.', '2026-06-28T04:45:00'),
    ],
    'TIC-4788': [
      msg('TIC-4788', 1, 'Hoàng Văn Tú', 'driver', 'Mình đặt chỗ Trạm Cầu Giấy nhưng bản đồ chỉ tới sai địa chỉ.', '2026-06-27T20:00:00'),
      msg('TIC-4788', 2, 'Nhân viên Trạm Cầu Giấy', 'station_staff', 'Em đang kiểm tra lại vị trí ghim trên bản đồ, sẽ phản hồi sớm.', '2026-06-27T20:30:00'),
    ],
    'TIC-4750': [
      msg('TIC-4750', 1, 'Đặng Mỹ Linh', 'driver', 'Trụ tại Long Biên báo mất kết nối suốt từ sáng, không đặt được.', '2026-06-25T11:00:00'),
      msg('TIC-4750', 2, 'Minh Phát EV', 'station_owner', 'Minh Phát EV đang cử kỹ thuật xuống kiểm tra nguồn điện của trụ.', '2026-06-25T13:00:00'),
    ],
    'TIC-4733': [
      msg('TIC-4733', 1, 'Lý Thanh Sơn', 'driver', 'Phiên sạc bị ngắt giữa chừng, mình vẫn bị tính tiền đầy đủ.', '2026-06-23T10:00:00'),
      msg('TIC-4733', 2, 'GreenVolt', 'station_owner', 'Đã hoàn 50% theo chính sách do gián đoạn giữa phiên (BR-PAY-03).', '2026-06-24T09:00:00'),
    ],
    'TIC-4700': [
      msg('TIC-4700', 1, 'Mai Phương Thảo', 'driver', 'Cho mình hỏi hủy trước bao lâu thì được hoàn 100%?', '2026-06-20T08:00:00'),
      msg('TIC-4700', 2, 'SaigonCharge', 'station_owner', 'Đã giải đáp — hủy trước 60 phút được hoàn 100% theo BR-PAY-03.', '2026-06-20T09:15:00'),
    ],
  };

  const stationsDirectory = Object.entries(stationIds).map(([name, id]) => ({ id, name }));

  /* ---- transactions: derived from bookings ---- */
  const transactions: Transaction[] = [];
  for (const b of bookings) {
    if (b.status !== 'pending') {
      transactions.push({ id: 'TX-' + b.id.slice(3) + 'P', bookingId: b.id, stationName: b.stationName, type: 'payment', method: b.method, amountVnd: b.amountVnd, date: b.startAt.slice(0, 10) });
    }
    if (b.status === 'cancelled' && b.refundVnd > 0) {
      transactions.push({ id: 'TX-' + b.id.slice(3) + 'R', bookingId: b.id, stationName: b.stationName, type: 'refund', method: b.method, amountVnd: -b.refundVnd, date: b.startAt.slice(0, 10) });
    }
  }

  /* ---- pricing & hours (FR11) ---- */
  const pricing: PricingConfig = {
    minBookingDurationMin: 60,
    bufferMinutes: 10,
    basePriceVnd: 3400,
    open24Hours: false,
    hours: [
      { day: 'T2', open: '06:00', close: '23:00', open24: true },
      { day: 'T3', open: '06:00', close: '23:00', open24: true },
      { day: 'T4', open: '06:00', close: '23:00', open24: true },
      { day: 'T5', open: '06:00', close: '23:00', open24: true },
      { day: 'T6', open: '06:00', close: '23:30', open24: true },
      { day: 'T7', open: '07:00', close: '23:30', open24: true },
      { day: 'CN', open: '—', close: '—', open24: false },
    ],
    touRules: [
      { id: 'TOU-1', name: 'Giờ cao điểm', days: 'weekdays', from: '17:00', to: '21:00', rateVnd: 4200 },
      { id: 'TOU-2', name: 'Giờ thấp điểm', days: 'daily', from: '21:00', to: '05:00', rateVnd: 2800 },
    ],
    availability: { autoLock: true, maxAdvanceDays: 2, bufferMinutes: 10 },
  };

  return {
    bookings,
    chargePoints: [...chargePoints, ...provisionedChargePoints],
    connectors: [...connectors, ...provisionedConnectors],
    ownerStations,
    approvalQueue,
    allStations,
    licenses,
    licenseStatusEvents,
    users,
    stationStaff,
    policyDocs,
    transactions,
    tickets,
    ticketMessages,
    pricing,
    pricingByStation: {
      'ST-1001': structuredClone(pricing),
      'ST-1018': structuredClone(pricing),
    },
    ownerStationIds: ['ST-1001', 'ST-1018'],
    stationsDirectory,
  };
}
