/**
 * Deterministic mock dataset — ported from the seed() logic in
 * design-console/ChargeOps Console.dc.html so screens match the design.
 * Same seed → same data on every reload (stable for demos and tests).
 */
import type {
  Booking,
  BookingStatus,
  Charger,
  ConnectorType,
  License,
  PaymentMethod,
  PolicyDoc,
  PricingConfig,
  RateKind,
  Station,
  Transaction,
  UserAccount,
} from '../types';

export interface MockDb {
  bookings: Booking[];
  chargers: Charger[];
  provisioned: Charger[];
  ownerStations: Station[];
  approvalQueue: Station[];
  licenses: License[];
  users: UserAccount[];
  policyDocs: PolicyDoc[];
  transactions: Transaction[];
  pricing: PricingConfig;
  /** Station ids owned by the mock owner account. */
  ownerStationIds: string[];
}

function lcg(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const pad = (n: number) => String(n).padStart(2, '0');

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
    ['CHAdeMO', 50, 3800],
    ['Type2AC', 22, 3000],
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
    const rateKind: RateKind = sh >= 17 && sh < 21 ? 'peak' : sh >= 21 || sh < 5 ? 'offpeak' : 'standard';
    const rateVndPerKwh = rateKind === 'peak' ? baseRate + 800 : rateKind === 'offpeak' ? baseRate - 600 : baseRate;
    const energyKwh = +(powerKw * (durationMin / 60) * 0.62).toFixed(1);
    const amountVnd = Math.round((energyKwh * rateVndPerKwh) / 1000) * 1000;
    // BR-PAY-03 refund tiers by time-before-start at cancel moment
    let refundPct: number | null = null;
    let refundVnd = 0;
    if (status === 'cancelled') {
      refundPct = pick([100, 100, 50, 0, 0]);
      refundVnd = Math.round((amountVnd * refundPct) / 100 / 1000) * 1000;
    }
    const eh = Math.floor(endTot / 60);
    bookings.push({
      id: 'BK-' + (38100 + i),
      stationId: stationIds[stationName],
      stationName,
      ownerName: owners[stationName],
      chargerId: 'CH-' + pad(1 + Math.floor(R() * 8)),
      connector,
      powerKw,
      driverName: pick(drivers),
      driverPhone: '+84 9' + pad(Math.floor(R() * 90)) + ' •••• ' + pad(Math.floor(R() * 90)) + Math.floor(R() * 9),
      startAt: `2026-06-${pad(day)}T${pad(sh)}:${pad(sm)}:00`,
      endAt: `2026-06-${pad(eh >= 24 ? day + 1 : day)}T${pad(eh % 24)}:${pad(endTot % 60)}:00`,
      durationMin,
      rateKind,
      rateVndPerKwh,
      energyKwh,
      amountVnd,
      refundPct,
      refundVnd,
      method: pick(methods),
      status,
    });
  }
  bookings.sort((a, b) => (a.startAt < b.startAt ? 1 : -1));

  /* ---- chargers (owner's Trạm Hà Đông) ---- */
  const chargers: Charger[] = [
    { id: 'CH-01', stationId: 'ST-1001', name: 'Cổng A1', connector: 'CCS2', powerKw: 60, status: 'available', utilizationPct: 72, sessionsToday: 14, uptime30dPct: 99.6, kwhToday: 248, faultCount: 0, lastSeen: '12 giây trước' },
    { id: 'CH-02', stationId: 'ST-1001', name: 'Cổng A2', connector: 'CCS2', powerKw: 60, status: 'available', utilizationPct: 81, sessionsToday: 17, uptime30dPct: 99.9, kwhToday: 296, faultCount: 0, lastSeen: '4 giây trước' },
    { id: 'CH-03', stationId: 'ST-1001', name: 'Cổng B1', connector: 'CHAdeMO', powerKw: 50, status: 'maintenance', utilizationPct: 0, sessionsToday: 0, uptime30dPct: 92.1, kwhToday: 0, faultCount: 2, lastSeen: '2 giờ trước' },
    { id: 'CH-04', stationId: 'ST-1001', name: 'Cổng B2', connector: 'Type2AC', powerKw: 22, status: 'offline', utilizationPct: 0, sessionsToday: 0, uptime30dPct: 78.4, kwhToday: 0, faultCount: 1, lastSeen: '1 ngày trước' },
    { id: 'CH-05', stationId: 'ST-1001', name: 'Cổng C1', connector: 'CCS2', powerKw: 120, status: 'available', utilizationPct: 64, sessionsToday: 11, uptime30dPct: 99.2, kwhToday: 372, faultCount: 0, lastSeen: '9 giây trước' },
  ];

  /* ---- admin-provisioned records ---- */
  const provisioned: Charger[] = [
    { id: 'CH-3303', stationId: 'ST-1042', name: 'Cổng A1', connector: 'CCS2', powerKw: 60, status: 'available', utilizationPct: 0, sessionsToday: 0, uptime30dPct: 100, kwhToday: 0, faultCount: 0, lastSeen: '—' },
    { id: 'CH-3302', stationId: 'ST-1042', name: '—', connector: 'CCS2', powerKw: 60, status: 'unclaimed', utilizationPct: 0, sessionsToday: 0, uptime30dPct: 0, kwhToday: 0, faultCount: 0, lastSeen: '—' },
    { id: 'CH-3301', stationId: 'ST-1042', name: '—', connector: 'CHAdeMO', powerKw: 50, status: 'unclaimed', utilizationPct: 0, sessionsToday: 0, uptime30dPct: 0, kwhToday: 0, faultCount: 0, lastSeen: '—' },
    { id: 'CH-3300', stationId: 'ST-1042', name: '—', connector: 'Type2AC', powerKw: 22, status: 'unclaimed', utilizationPct: 0, sessionsToday: 0, uptime30dPct: 0, kwhToday: 0, faultCount: 0, lastSeen: '—' },
  ];

  /* ---- owner stations (FR12) ---- */
  const ownerStations: Station[] = [
    { id: 'ST-1001', name: 'Trạm Hà Đông', city: 'Hà Nội', address: '210 Quang Trung, Hà Đông', ownerName: 'EVGo Co.', chargerCount: 5, onlineCount: 4, status: 'active', licenseSummary: 'Năm · hết hạn 12/09/2026', rejectionReason: null, bookingsToday: 24, revenueWeekVnd: 12_400_000, utilizationPct: 68, submittedAt: null },
    { id: 'ST-1018', name: 'Trạm Cầu Giấy', city: 'Hà Nội', address: '88 Trần Thái Tông, Cầu Giấy', ownerName: 'EVGo Co.', chargerCount: 6, onlineCount: 6, status: 'active', licenseSummary: 'Tháng · hết hạn 30/07/2026', rejectionReason: null, bookingsToday: 31, revenueWeekVnd: 15_800_000, utilizationPct: 74, submittedAt: null },
    { id: 'ST-1056', name: 'Trạm Mỹ Đình', city: 'Hà Nội', address: '15 Phạm Hùng, Nam Từ Liêm', ownerName: 'EVGo Co.', chargerCount: 4, onlineCount: 0, status: 'pending', licenseSummary: null, rejectionReason: null, bookingsToday: 0, revenueWeekVnd: 0, utilizationPct: 0, submittedAt: '2026-06-26' },
    { id: 'ST-1049', name: 'Trạm Gia Lâm', city: 'Hà Nội', address: '7 Ngô Gia Tự, Long Biên', ownerName: 'EVGo Co.', chargerCount: 3, onlineCount: 0, status: 'rejected', licenseSummary: null, rejectionReason: 'Thiếu giấy phép kinh doanh hợp lệ; vui lòng nộp lại bản công chứng.', bookingsToday: 0, revenueWeekVnd: 0, utilizationPct: 0, submittedAt: '2026-06-20' },
  ];

  /* ---- admin approval queue ---- */
  const approvalQueue: Station[] = [
    { id: 'ST-1042', name: 'Trạm Long Biên', city: 'Hà Nội', address: '123 Ngọc Lâm', ownerName: 'Minh Phát EV', chargerCount: 4, onlineCount: 0, status: 'pending', licenseSummary: null, rejectionReason: null, bookingsToday: 0, revenueWeekVnd: 0, utilizationPct: 0, submittedAt: '2026-06-27' },
    { id: 'ST-1041', name: 'Trạm Đống Đa', city: 'Hà Nội', address: '45 Tây Sơn', ownerName: 'GreenVolt', chargerCount: 2, onlineCount: 0, status: 'pending', licenseSummary: null, rejectionReason: null, bookingsToday: 0, revenueWeekVnd: 0, utilizationPct: 0, submittedAt: '2026-06-27' },
    { id: 'ST-1039', name: 'Trạm Thủ Đức', city: 'TP.HCM', address: '88 Võ Văn Ngân', ownerName: 'SaigonCharge', chargerCount: 6, onlineCount: 0, status: 'pending', licenseSummary: null, rejectionReason: null, bookingsToday: 0, revenueWeekVnd: 0, utilizationPct: 0, submittedAt: '2026-06-26' },
    { id: 'ST-1037', name: 'Trạm Hải Châu', city: 'Đà Nẵng', address: '12 Bạch Đằng', ownerName: 'DaNang EV', chargerCount: 3, onlineCount: 0, status: 'pending', licenseSummary: null, rejectionReason: null, bookingsToday: 0, revenueWeekVnd: 0, utilizationPct: 0, submittedAt: '2026-06-25' },
    { id: 'ST-1034', name: 'Trạm Ninh Kiều', city: 'Cần Thơ', address: '5 Hai Bà Trưng', ownerName: 'MekongVolt', chargerCount: 2, onlineCount: 0, status: 'pending', licenseSummary: null, rejectionReason: null, bookingsToday: 0, revenueWeekVnd: 0, utilizationPct: 0, submittedAt: '2026-06-24' },
  ];

  /* ---- licenses ---- */
  const licenses: License[] = [
    { stationId: 'ST-1001', stationName: 'Trạm Hà Đông', ownerName: 'EVGo Co.', plan: 'yearly', startDate: '2025-09-12', expiryDate: '2026-09-12', daysLeft: 76, status: 'active', priceVnd: 4_800_000 },
    { stationId: 'ST-1018', stationName: 'Trạm Cầu Giấy', ownerName: 'VinCharge', plan: 'monthly', startDate: '2026-06-30', expiryDate: '2026-07-30', daysLeft: 31, status: 'active', priceVnd: 500_000 },
    { stationId: 'ST-1023', stationName: 'Trạm Thanh Xuân', ownerName: 'GreenVolt', plan: 'yearly', startDate: '2025-07-10', expiryDate: '2026-07-10', daysLeft: 11, status: 'expiring', priceVnd: 4_800_000 },
    { stationId: 'ST-1009', stationName: 'Trạm Đống Đa', ownerName: 'SaigonCharge', plan: 'monthly', startDate: '2026-05-02', expiryDate: '2026-06-02', daysLeft: -27, status: 'expired', priceVnd: 500_000 },
    { stationId: 'ST-1031', stationName: 'Trạm Hoàn Kiếm', ownerName: 'CityVolt', plan: 'yearly', startDate: '2026-01-20', expiryDate: '2027-01-20', daysLeft: 205, status: 'active', priceVnd: 4_800_000 },
  ];

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

  /* ---- policy KB (FR15) ---- */
  const policyDocs: PolicyDoc[] = [
    { id: 'POL-01', category: 'Hủy & hoàn tiền', content: 'Hủy trước giờ bắt đầu từ 60 phút trở lên được hoàn 100%; từ 15–60 phút hoàn 50%; dưới 15 phút hoặc không đến (no-show) hoàn 0%.', updatedAt: '2026-06-24' },
    { id: 'POL-02', category: 'Hủy & hoàn tiền', content: 'Chỉ được hủy đặt chỗ khi đang ở trạng thái Chờ thanh toán hoặc Đã xác nhận. Đặt chỗ đã Check-in hoặc Đang sạc không thể hủy.', updatedAt: '2026-06-24' },
    { id: 'POL-03', category: 'Check-in', content: 'Cửa sổ check-in mở từ thời điểm bắt đầu khung giờ và đóng đúng 15 phút sau đó. Không thể check-in trước giờ bắt đầu hoặc sau khi cửa sổ đã đóng.', updatedAt: '2026-06-24' },
    { id: 'POL-04', category: 'Check-in', content: 'Nếu tài xế không check-in trong vòng 15 phút kể từ giờ bắt đầu, đặt chỗ tự động bị hủy và hoàn 0% (xử lý như no-show).', updatedAt: '2026-06-24' },
    { id: 'POL-05', category: 'Thanh toán', content: 'Đặt chỗ chỉ chuyển sang Đã xác nhận sau khi cổng thanh toán xác nhận thu tiền thành công. Phần đặt chỗ được giữ tối đa 10 phút chờ thanh toán.', updatedAt: '2026-06-24' },
    { id: 'POL-06', category: 'Giá', content: 'Thay đổi giờ hoạt động và giá chỉ áp dụng cho đặt chỗ mới. Đặt chỗ hiện hữu giữ nguyên mức giá đã chụp tại thời điểm đặt (BookingPriceLine).', updatedAt: '2026-06-24' },
    { id: 'POL-07', category: 'Trụ sạc', content: 'Mã QR trên trụ chỉ mã hóa Charger ID, là nhãn nhận diện tĩnh dùng cho tài xế check-in; không dùng để chuyển quyền sở hữu hay thao tác quản trị.', updatedAt: '2026-06-24' },
  ];

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
    slotDurationMin: 60,
    basePriceVnd: 3400,
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
      { id: 'TOU-2', name: 'Giờ thường', days: 'daily', from: '05:00', to: '17:00', rateVnd: 3400 },
      { id: 'TOU-3', name: 'Giờ thấp điểm', days: 'daily', from: '21:00', to: '05:00', rateVnd: 2800 },
    ],
    availability: { autoLock: true, maxAdvanceDays: 7, nightDiscount: false },
  };

  return {
    bookings,
    chargers,
    provisioned,
    ownerStations,
    approvalQueue,
    licenses,
    users,
    policyDocs,
    transactions,
    pricing,
    ownerStationIds: ['ST-1001', 'ST-1018'],
  };
}
