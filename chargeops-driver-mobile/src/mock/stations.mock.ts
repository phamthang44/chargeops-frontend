import type { Amenity, ChargePoint, Connector, ConnectorType, Review, Station } from '@/types';

/**
 * Mock stations with realistic Vietnamese data (HCMC District 1 & 3).
 * Used by the service layer until a real API is wired in.
 *
 * The shape follows SRS v4.7: a Station has Charge Points (physical devices,
 * each with a zone_label telling the driver where in the car park it is), and
 * each Charge Point has one or more Connectors — the actual bookable ports.
 */
/** The four hand-authored HCMC anchor stations (curated charge points + connectors). */
const baseStations: Station[] = [
  {
    id: 'st-001',
    name: 'Trạm sạc Vincom Đồng Khởi',
    address: '72 Lê Thánh Tôn, Phường Bến Nghé, Quận 1, TP.HCM',
    description: 'Trạm sạc trong hầm B2 trung tâm thương mại Vincom.',
    latitude: 10.7773,
    longitude: 106.7019,
    distanceKm: 1.2,
    contactPhone: '02838221234',
    operatingHours: '06:00 - 22:00',
    opensAtMin: 6 * 60,
    closesAtMin: 22 * 60,
    availableConnectors: 3,
    totalConnectors: 4,
    rating: 4.9,
    reviewCount: 128,
    isOpen: true,
    hasFastCharging: true,
    minRatePerKwh: 3500,
    amenities: ['wifi', 'food', 'parking', 'security', 'restroom'],
  },
  {
    id: 'st-002',
    name: 'Trạm sạc Bến Thành',
    address: '26 Lê Lợi, Phường Bến Thành, Quận 1, TP.HCM',
    description: 'Bãi đỗ xe gần chợ Bến Thành, thuận tiện trung tâm.',
    latitude: 10.7721,
    longitude: 106.6982,
    distanceKm: 2.0,
    contactPhone: '02838251111',
    operatingHours: '24/7',
    opensAtMin: 0,
    closesAtMin: 24 * 60,
    availableConnectors: 1,
    totalConnectors: 3,
    rating: 4.7,
    reviewCount: 86,
    isOpen: true,
    hasFastCharging: false, // AC-only station (so the DC filter excludes it)
    minRatePerKwh: 3000,
    amenities: ['wifi', 'parking', 'security'],
  },
  {
    id: 'st-003',
    name: 'Trạm sạc Hồ Con Rùa',
    address: '1 Công trường Quốc tế, Phường Võ Thị Sáu, Quận 3, TP.HCM',
    description: 'Trạm sạc ngoài trời cạnh Hồ Con Rùa.',
    latitude: 10.7825,
    longitude: 106.6956,
    distanceKm: 3.4,
    contactPhone: '02839301222',
    operatingHours: '05:00 - 23:00',
    opensAtMin: 5 * 60,
    closesAtMin: 23 * 60,
    availableConnectors: 2,
    totalConnectors: 2,
    rating: 4.5,
    reviewCount: 54,
    isOpen: true,
    hasFastCharging: true,
    minRatePerKwh: 3200,
    amenities: ['wifi', 'food', 'parking'],
  },
  {
    id: 'st-004',
    name: 'Trạm sạc Nhà thờ Tân Định',
    address: '289 Hai Bà Trưng, Phường Võ Thị Sáu, Quận 3, TP.HCM',
    description: 'Trạm sạc trong khuôn viên bãi xe Tân Định.',
    latitude: 10.7901,
    longitude: 106.6905,
    distanceKm: 4.1,
    contactPhone: '02839320333',
    operatingHours: '06:00 - 21:00',
    opensAtMin: 6 * 60,
    closesAtMin: 21 * 60,
    availableConnectors: 0,
    totalConnectors: 2,
    rating: 4.2,
    reviewCount: 31,
    isOpen: false,
    hasFastCharging: true,
    minRatePerKwh: 3500,
    amenities: ['parking', 'security', 'restroom'],
  },
];

/** Charge Points (physical devices) grouped by stationId. */
const baseChargePoints: ChargePoint[] = [
  // st-001 — two devices in the basement car park
  { id: 'cp-101', stationId: 'st-001', name: 'Trụ sạc nhanh A', zoneLabel: 'Hầm B2, cạnh thang máy', maxPowerKw: 120, status: 'ACTIVE' },
  { id: 'cp-102', stationId: 'st-001', name: 'Trụ sạc thường B', zoneLabel: 'Hầm B2, dãy P3', maxPowerKw: 22, status: 'ACTIVE' },
  // st-002
  { id: 'cp-201', stationId: 'st-002', name: 'Trụ sạc A', zoneLabel: 'Tầng trệt, gần cổng B', maxPowerKw: 22, status: 'ACTIVE' },
  { id: 'cp-202', stationId: 'st-002', name: 'Trụ sạc B', zoneLabel: 'Tầng trệt, góc phía Đông', maxPowerKw: 7, status: 'ACTIVE' },
  // st-003
  { id: 'cp-301', stationId: 'st-003', name: 'Trụ sạc A', zoneLabel: 'Bãi xe ngoài trời, ô số 5', maxPowerKw: 150, status: 'ACTIVE' },
  // st-004 — whole device offline, so every connector under it reads offline (BR-CHG-01)
  { id: 'cp-401', stationId: 'st-004', name: 'Trụ sạc A', zoneLabel: 'Bãi xe sau nhà thờ', maxPowerKw: 120, status: 'OFFLINE' },
];

/** Connectors (bookable ports) grouped by chargePointId. `id` is the Charger ID the QR encodes. */
const baseConnectors: Connector[] = [
  // cp-101
  { id: 'cn-1011', chargePointId: 'cp-101', stationId: 'st-001', name: 'Cổng 1', connectorType: 'CCS2', powerKw: 120, currentType: 'DC', runtimeStatus: 'AVAILABLE', qrToken: 'CHG-QR-CN1011', ratePerKwh: 4200 },
  { id: 'cn-1012', chargePointId: 'cp-101', stationId: 'st-001', name: 'Cổng 2', connectorType: 'CHADEMO', powerKw: 60, currentType: 'DC', runtimeStatus: 'AVAILABLE', qrToken: 'CHG-QR-CN1012', ratePerKwh: 3850 },
  // cp-102
  { id: 'cn-1021', chargePointId: 'cp-102', stationId: 'st-001', name: 'Cổng 1', connectorType: 'TYPE2', powerKw: 22, currentType: 'AC', runtimeStatus: 'IN_USE', qrToken: 'CHG-QR-CN1021', ratePerKwh: 3500 },
  { id: 'cn-1022', chargePointId: 'cp-102', stationId: 'st-001', name: 'Cổng 2', connectorType: 'TYPE2', powerKw: 11, currentType: 'AC', runtimeStatus: 'AVAILABLE', qrToken: 'CHG-QR-CN1022', ratePerKwh: 3500 },
  // cp-201
  { id: 'cn-2011', chargePointId: 'cp-201', stationId: 'st-002', name: 'Cổng 1', connectorType: 'TYPE2', powerKw: 22, currentType: 'AC', runtimeStatus: 'AVAILABLE', qrToken: 'CHG-QR-CN2011', ratePerKwh: 3500 },
  { id: 'cn-2012', chargePointId: 'cp-201', stationId: 'st-002', name: 'Cổng 2', connectorType: 'TYPE2', powerKw: 22, currentType: 'AC', runtimeStatus: 'IN_USE', qrToken: 'CHG-QR-CN2012', ratePerKwh: 3500 },
  // cp-202
  { id: 'cn-2021', chargePointId: 'cp-202', stationId: 'st-002', name: 'Cổng 1', connectorType: 'GBT', powerKw: 7, currentType: 'AC', runtimeStatus: 'OFFLINE', qrToken: 'CHG-QR-CN2021', ratePerKwh: 3000 },
  // cp-301
  { id: 'cn-3011', chargePointId: 'cp-301', stationId: 'st-003', name: 'Cổng 1', connectorType: 'CCS2', powerKw: 150, currentType: 'DC', runtimeStatus: 'AVAILABLE', qrToken: 'CHG-QR-CN3011', ratePerKwh: 4200 },
  { id: 'cn-3012', chargePointId: 'cp-301', stationId: 'st-003', name: 'Cổng 2', connectorType: 'TYPE2', powerKw: 22, currentType: 'AC', runtimeStatus: 'AVAILABLE', qrToken: 'CHG-QR-CN3012', ratePerKwh: 3200 },
  // cp-401 (device offline)
  { id: 'cn-4011', chargePointId: 'cp-401', stationId: 'st-004', name: 'Cổng 1', connectorType: 'CCS2', powerKw: 120, currentType: 'DC', runtimeStatus: 'OFFLINE', qrToken: 'CHG-QR-CN4011', ratePerKwh: 4200 },
  { id: 'cn-4012', chargePointId: 'cp-401', stationId: 'st-004', name: 'Cổng 2', connectorType: 'TYPE2', powerKw: 11, currentType: 'AC', runtimeStatus: 'OFFLINE', qrToken: 'CHG-QR-CN4012', ratePerKwh: 3500 },
];

// --- Generated nationwide coverage -----------------------------------------
// A deterministic spread of stations across Vietnamese provinces so the
// discovery UI can be seen at scale — what "hundreds of stations nationwide"
// actually looks like in the list, map, filters and distance sort. Same seed →
// same data on every reload. Each generated station gets real charge points and
// connectors so tapping any of them opens a coherent detail screen.

interface ProvinceSeed {
  city: string;
  wards: string[];
  /** Distance-from-driver range (km); the mock driver sits in HCMC. */
  distKm: [number, number];
}

const PROVINCES: ProvinceSeed[] = [
  { city: 'TP.HCM', wards: ['Quận 1', 'Quận 3', 'Quận 5', 'Quận 7', 'Bình Thạnh', 'Phú Nhuận', 'Thủ Đức', 'Tân Bình', 'Gò Vấp'], distKm: [3, 34] },
  { city: 'Bình Dương', wards: ['Thủ Dầu Một', 'Dĩ An', 'Thuận An'], distKm: [20, 45] },
  { city: 'Đồng Nai', wards: ['Biên Hòa', 'Long Khánh'], distKm: [30, 72] },
  { city: 'Bà Rịa – Vũng Tàu', wards: ['Vũng Tàu', 'Bà Rịa'], distKm: [95, 125] },
  { city: 'Cần Thơ', wards: ['Ninh Kiều', 'Bình Thủy', 'Cái Răng'], distKm: [150, 180] },
  { city: 'Lâm Đồng', wards: ['Đà Lạt', 'Bảo Lộc'], distKm: [180, 300] },
  { city: 'Khánh Hòa', wards: ['Nha Trang', 'Cam Ranh'], distKm: [400, 440] },
  { city: 'Đà Nẵng', wards: ['Hải Châu', 'Thanh Khê', 'Sơn Trà', 'Ngũ Hành Sơn'], distKm: [600, 640] },
  { city: 'Thừa Thiên Huế', wards: ['TP. Huế'], distKm: [660, 700] },
  { city: 'Hải Phòng', wards: ['Ngô Quyền', 'Lê Chân', 'Hồng Bàng', 'Hải An'], distKm: [1090, 1130] },
  { city: 'Hà Nội', wards: ['Hoàn Kiếm', 'Ba Đình', 'Đống Đa', 'Cầu Giấy', 'Tây Hồ', 'Long Biên'], distKm: [1140, 1180] },
  { city: 'Quảng Ninh', wards: ['Hạ Long', 'Cẩm Phả'], distKm: [1200, 1260] },
];

const PLACE_WORDS = ['Vincom', 'Aeon Mall', 'Lotte', 'Central', 'GreenCharge', 'EV Point', 'Bãi xe', 'Petrolimex', 'Co.opmart', 'Sun Plaza', 'Landmark', 'Gigamall', 'BigC', 'Vạn Hạnh'];
const STREETS = ['Nguyễn Huệ', 'Lê Lợi', 'Trần Hưng Đạo', 'Hai Bà Trưng', 'Cách Mạng Tháng 8', 'Nguyễn Văn Linh', 'Phạm Văn Đồng', 'Điện Biên Phủ', 'Lê Duẩn', 'Nguyễn Thị Minh Khai', '3 Tháng 2', 'Võ Văn Kiệt'];
const AMENITY_POOL: Amenity[] = ['wifi', 'food', 'parking', 'security', 'restroom'];

/** Connector archetypes: [type, current, powerKw, baseRate]. */
const CONN_KINDS: [ConnectorType, 'AC' | 'DC', number, number][] = [
  ['CCS2', 'DC', 120, 4200],
  ['CCS2', 'DC', 150, 4300],
  ['CHADEMO', 'DC', 60, 3850],
  ['TYPE2', 'AC', 22, 3500],
  ['TYPE2', 'AC', 11, 3400],
  ['GBT', 'AC', 7, 3000],
];

function lcg(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const GENERATED_COUNT = 120;

function generateCoverage() {
  const rnd = lcg(20260723);
  const pick = <T>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)];
  const between = (a: number, b: number) => a + rnd() * (b - a);

  const stations: Station[] = [];
  const chargePoints: ChargePoint[] = [];
  const connectors: Connector[] = [];

  for (let i = 0; i < GENERATED_COUNT; i++) {
    const n = 100 + i; // ids st-100..st-219
    const stationId = `st-${n}`;
    // Bias toward the earlier (HCMC / nearby) provinces so "nearest" stays local.
    const prov = PROVINCES[Math.floor(Math.pow(rnd(), 1.7) * PROVINCES.length)];
    const ward = pick(prov.wards);
    const name = `Trạm sạc ${pick(PLACE_WORDS)} ${ward}`;
    const address = `${1 + Math.floor(rnd() * 400)} ${pick(STREETS)}, ${ward}, ${prov.city}`;
    const distanceKm = +between(prov.distKm[0], prov.distKm[1]).toFixed(1);

    const stationConnectors: Connector[] = [];
    const cpCount = 1 + Math.floor(rnd() * 3); // 1–3 charge points
    for (let c = 0; c < cpCount; c++) {
      const cpId = `cp-${n}-${c + 1}`;
      const connCount = 1 + Math.floor(rnd() * 2); // 1–2 connectors each
      const kindsHere = Array.from({ length: connCount }, () => pick(CONN_KINDS));
      const maxPow = Math.max(...kindsHere.map((k) => k[2]));
      // A handful of devices are offline/suspended so visibility varies.
      const roll = rnd();
      const status: ChargePoint['status'] = roll < 0.06 ? 'OFFLINE' : roll < 0.09 ? 'SUSPENDED' : 'ACTIVE';
      chargePoints.push({
        id: cpId,
        stationId,
        name: `Trụ ${String.fromCharCode(65 + c)}`,
        zoneLabel: c === 0 ? 'Khu vực chính' : `Dãy ${c + 1}`,
        maxPowerKw: maxPow,
        status,
      });
      kindsHere.forEach(([type, cur, pow, rate], k) => {
        const id = `cn-${n}-${c + 1}${k + 1}`;
        const runtimeStatus: Connector['runtimeStatus'] =
          status !== 'ACTIVE' ? 'OFFLINE' : rnd() < 0.7 ? 'AVAILABLE' : rnd() < 0.5 ? 'IN_USE' : 'OFFLINE';
        const conn: Connector = {
          id,
          chargePointId: cpId,
          stationId,
          name: `Cổng ${k + 1}`,
          connectorType: type,
          powerKw: pow,
          currentType: cur,
          runtimeStatus,
          qrToken: `CHG-QR-${id.toUpperCase()}`,
          ratePerKwh: rate,
        };
        connectors.push(conn);
        stationConnectors.push(conn);
      });
    }

    // Station-level counts reflect only ACTIVE charge points (BR-CHG-01).
    const activeCpIds = new Set(
      chargePoints.filter((cp) => cp.stationId === stationId && cp.status === 'ACTIVE').map((cp) => cp.id),
    );
    const visible = stationConnectors.filter((cn) => activeCpIds.has(cn.chargePointId));
    const total = visible.length;
    const available = visible.filter((cn) => cn.runtimeStatus === 'AVAILABLE').length;
    const open24 = rnd() < 0.3;
    const amenities = AMENITY_POOL.filter(() => rnd() < 0.5);

    stations.push({
      id: stationId,
      name,
      address,
      latitude: +(10 + rnd() * 11).toFixed(4),
      longitude: +(105 + rnd() * 4).toFixed(4),
      distanceKm,
      operatingHours: open24 ? '24/7' : '06:00 - 22:00',
      opensAtMin: open24 ? 0 : 6 * 60,
      closesAtMin: open24 ? 24 * 60 : 22 * 60,
      availableConnectors: available,
      totalConnectors: total,
      rating: +between(3.6, 5).toFixed(1),
      reviewCount: Math.floor(rnd() * 200),
      isOpen: rnd() < 0.85,
      hasFastCharging: visible.some((cn) => cn.currentType === 'DC'),
      minRatePerKwh: visible.length ? Math.min(...visible.map((cn) => cn.ratePerKwh)) : 3500,
      amenities: amenities.length ? amenities : ['parking'],
    });
  }

  return { stations, chargePoints, connectors };
}

const generated = generateCoverage();

/** Every station the driver can discover — the four anchors plus nationwide coverage. */
export const stationsMock: Station[] = [...baseStations, ...generated.stations];
export const chargePointsMock: ChargePoint[] = [...baseChargePoints, ...generated.chargePoints];
export const connectorsMock: Connector[] = [...baseConnectors, ...generated.connectors];

/** Reviews grouped by stationId (display only). */
export const reviewsMock: Review[] = [
  { id: 'rv-001', stationId: 'st-001', authorName: 'Nguyễn Văn An', rating: 5, comment: 'Trạm sạc nhanh, sạch sẽ, nhân viên thân thiện. Sẽ quay lại.', createdAt: '2026-06-15T14:30:00+07:00' },
  { id: 'rv-002', stationId: 'st-001', authorName: 'Trần Thị Bình', rating: 4, comment: 'Vị trí thuận tiện trong trung tâm thương mại, giá hơi cao một chút.', createdAt: '2026-06-12T09:10:00+07:00' },
  { id: 'rv-003', stationId: 'st-001', authorName: 'Lê Minh Châu', rating: 5, comment: 'Có chỗ ngồi chờ và cafe, rất tiện khi sạc.', createdAt: '2026-06-08T18:45:00+07:00' },
  { id: 'rv-004', stationId: 'st-002', authorName: 'Phạm Quốc Đạt', rating: 5, comment: 'Mở cửa 24/7, đỗ xe rộng rãi. Rất hài lòng.', createdAt: '2026-06-14T22:05:00+07:00' },
  { id: 'rv-005', stationId: 'st-002', authorName: 'Võ Thị Hà', rating: 4, comment: 'Chủ yếu là sạc AC nên hơi chậm, nhưng ổn cho qua đêm.', createdAt: '2026-06-10T07:30:00+07:00' },
  { id: 'rv-006', stationId: 'st-003', authorName: 'Đỗ Hoàng Long', rating: 4, comment: 'Trạm ngoài trời, view đẹp cạnh Hồ Con Rùa.', createdAt: '2026-06-11T16:20:00+07:00' },
];
