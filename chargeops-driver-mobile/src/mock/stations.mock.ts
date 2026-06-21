import type { Charger, Review, Slot, Station } from '@/types';

/**
 * Mock stations with realistic Vietnamese data (HCMC District 1 & 3).
 * Used by the service layer until a real API is wired in.
 */
export const stationsMock: Station[] = [
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
    availableChargers: 3,
    totalChargers: 4,
    rating: 4.9,
    reviewCount: 128,
    isOpen: true,
    hasFastCharging: true,
    minRatePerKwh: 3850,
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
    availableChargers: 1,
    totalChargers: 3,
    rating: 4.7,
    reviewCount: 86,
    isOpen: true,
    hasFastCharging: false, // AC-only station (so the DC filter excludes it)
    minRatePerKwh: 3500,
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
    availableChargers: 2,
    totalChargers: 2,
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
    availableChargers: 0,
    totalChargers: 2,
    rating: 4.2,
    reviewCount: 31,
    isOpen: false,
    hasFastCharging: true,
    minRatePerKwh: 4200,
    amenities: ['parking', 'security', 'restroom'],
  },
];

/** Chargers grouped by stationId. */
export const chargersMock: Charger[] = [
  // st-001
  { id: 'ch-101', stationId: 'st-001', name: 'Sạc Nhanh DC-01', connectorType: 'CCS2', powerKw: 120, chargerType: 'DC', status: 'AVAILABLE', ratePerKwh: 4200 },
  { id: 'ch-102', stationId: 'st-001', name: 'Sạc Nhanh DC-02', connectorType: 'CHADEMO', powerKw: 60, chargerType: 'DC', status: 'AVAILABLE', ratePerKwh: 3850 },
  { id: 'ch-103', stationId: 'st-001', name: 'Sạc Thường AC-01', connectorType: 'TYPE2', powerKw: 22, chargerType: 'AC', status: 'IN_USE', ratePerKwh: 3500 },
  { id: 'ch-104', stationId: 'st-001', name: 'Sạc Thường AC-02', connectorType: 'TYPE2', powerKw: 11, chargerType: 'AC', status: 'AVAILABLE', ratePerKwh: 3500 },
  // st-002
  { id: 'ch-201', stationId: 'st-002', name: 'Sạc Thường AC-01', connectorType: 'TYPE2', powerKw: 22, chargerType: 'AC', status: 'AVAILABLE', ratePerKwh: 3500 },
  { id: 'ch-202', stationId: 'st-002', name: 'Sạc Thường AC-02', connectorType: 'TYPE2', powerKw: 22, chargerType: 'AC', status: 'IN_USE', ratePerKwh: 3500 },
  { id: 'ch-203', stationId: 'st-002', name: 'Sạc Thường AC-03', connectorType: 'GBT', powerKw: 7, chargerType: 'AC', status: 'MAINTENANCE', ratePerKwh: 3000 },
  // st-003
  { id: 'ch-301', stationId: 'st-003', name: 'Sạc Nhanh DC-01', connectorType: 'CCS2', powerKw: 150, chargerType: 'DC', status: 'AVAILABLE', ratePerKwh: 4200 },
  { id: 'ch-302', stationId: 'st-003', name: 'Sạc Thường AC-01', connectorType: 'TYPE2', powerKw: 22, chargerType: 'AC', status: 'AVAILABLE', ratePerKwh: 3200 },
  // st-004
  { id: 'ch-401', stationId: 'st-004', name: 'Sạc Nhanh DC-01', connectorType: 'CCS2', powerKw: 120, chargerType: 'DC', status: 'DISABLED', ratePerKwh: 4200 },
  { id: 'ch-402', stationId: 'st-004', name: 'Sạc Thường AC-01', connectorType: 'TYPE2', powerKw: 11, chargerType: 'AC', status: 'MAINTENANCE', ratePerKwh: 3500 },
];

/** Slots grouped by chargerId (fixed snapshot prices in VND). */
export const slotsMock: Slot[] = [
  { id: 'sl-1001', chargerId: 'ch-101', startAt: '2026-06-18T08:00:00+07:00', endAt: '2026-06-18T09:00:00+07:00', price: 90000, status: 'AVAILABLE' },
  { id: 'sl-1002', chargerId: 'ch-101', startAt: '2026-06-18T09:00:00+07:00', endAt: '2026-06-18T10:00:00+07:00', price: 90000, status: 'OCCUPIED' },
  { id: 'sl-1003', chargerId: 'ch-101', startAt: '2026-06-18T10:00:00+07:00', endAt: '2026-06-18T11:00:00+07:00', price: 90000, status: 'MINE' },
  { id: 'sl-2001', chargerId: 'ch-201', startAt: '2026-06-18T08:00:00+07:00', endAt: '2026-06-18T09:00:00+07:00', price: 75000, status: 'AVAILABLE' },
  { id: 'sl-2002', chargerId: 'ch-201', startAt: '2026-06-18T09:00:00+07:00', endAt: '2026-06-18T10:00:00+07:00', price: 75000, status: 'UNAVAILABLE' },
  { id: 'sl-3001', chargerId: 'ch-301', startAt: '2026-06-18T08:00:00+07:00', endAt: '2026-06-18T09:00:00+07:00', price: 120000, status: 'AVAILABLE' },
];

/** Reviews grouped by stationId (display only). */
export const reviewsMock: Review[] = [
  { id: 'rv-001', stationId: 'st-001', authorName: 'Nguyễn Văn An', rating: 5, comment: 'Trạm sạc nhanh, sạch sẽ, nhân viên thân thiện. Sẽ quay lại.', createdAt: '2026-06-15T14:30:00+07:00' },
  { id: 'rv-002', stationId: 'st-001', authorName: 'Trần Thị Bình', rating: 4, comment: 'Vị trí thuận tiện trong trung tâm thương mại, giá hơi cao một chút.', createdAt: '2026-06-12T09:10:00+07:00' },
  { id: 'rv-003', stationId: 'st-001', authorName: 'Lê Minh Châu', rating: 5, comment: 'Có chỗ ngồi chờ và cafe, rất tiện khi sạc.', createdAt: '2026-06-08T18:45:00+07:00' },
  { id: 'rv-004', stationId: 'st-002', authorName: 'Phạm Quốc Đạt', rating: 5, comment: 'Mở cửa 24/7, đỗ xe rộng rãi. Rất hài lòng.', createdAt: '2026-06-14T22:05:00+07:00' },
  { id: 'rv-005', stationId: 'st-002', authorName: 'Võ Thị Hà', rating: 4, comment: 'Chủ yếu là sạc AC nên hơi chậm, nhưng ổn cho qua đêm.', createdAt: '2026-06-10T07:30:00+07:00' },
  { id: 'rv-006', stationId: 'st-003', authorName: 'Đỗ Hoàng Long', rating: 4, comment: 'Trạm ngoài trời, view đẹp cạnh Hồ Con Rùa.', createdAt: '2026-06-11T16:20:00+07:00' },
];
