import type { Charger, Slot, Station } from '@/types';

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
  },
];

/** Chargers grouped by stationId. */
export const chargersMock: Charger[] = [
  // st-001
  { id: 'ch-101', stationId: 'st-001', name: 'Sạc Nhanh DC-01', connectorType: 'CCS2', powerKw: 120, chargerType: 'DC', status: 'AVAILABLE' },
  { id: 'ch-102', stationId: 'st-001', name: 'Sạc Nhanh DC-02', connectorType: 'CHADEMO', powerKw: 60, chargerType: 'DC', status: 'AVAILABLE' },
  { id: 'ch-103', stationId: 'st-001', name: 'Sạc Thường AC-01', connectorType: 'TYPE2', powerKw: 22, chargerType: 'AC', status: 'IN_USE' },
  { id: 'ch-104', stationId: 'st-001', name: 'Sạc Thường AC-02', connectorType: 'TYPE2', powerKw: 11, chargerType: 'AC', status: 'AVAILABLE' },
  // st-002
  { id: 'ch-201', stationId: 'st-002', name: 'Sạc Nhanh DC-01', connectorType: 'CCS2', powerKw: 90, chargerType: 'DC', status: 'AVAILABLE' },
  { id: 'ch-202', stationId: 'st-002', name: 'Sạc Thường AC-01', connectorType: 'TYPE2', powerKw: 22, chargerType: 'AC', status: 'IN_USE' },
  { id: 'ch-203', stationId: 'st-002', name: 'Sạc Thường AC-02', connectorType: 'GBT', powerKw: 7, chargerType: 'AC', status: 'MAINTENANCE' },
  // st-003
  { id: 'ch-301', stationId: 'st-003', name: 'Sạc Nhanh DC-01', connectorType: 'CCS2', powerKw: 150, chargerType: 'DC', status: 'AVAILABLE' },
  { id: 'ch-302', stationId: 'st-003', name: 'Sạc Thường AC-01', connectorType: 'TYPE2', powerKw: 22, chargerType: 'AC', status: 'AVAILABLE' },
  // st-004
  { id: 'ch-401', stationId: 'st-004', name: 'Sạc Nhanh DC-01', connectorType: 'CCS2', powerKw: 120, chargerType: 'DC', status: 'DISABLED' },
  { id: 'ch-402', stationId: 'st-004', name: 'Sạc Thường AC-01', connectorType: 'TYPE2', powerKw: 11, chargerType: 'AC', status: 'MAINTENANCE' },
];

/** Slots grouped by chargerId (fixed snapshot prices in VND). */
export const slotsMock: Slot[] = [
  { id: 'sl-1001', chargerId: 'ch-101', startAt: '2026-06-18T08:00:00+07:00', endAt: '2026-06-18T09:00:00+07:00', price: 90000, status: 'AVAILABLE' },
  { id: 'sl-1002', chargerId: 'ch-101', startAt: '2026-06-18T09:00:00+07:00', endAt: '2026-06-18T10:00:00+07:00', price: 90000, status: 'BOOKED' },
  { id: 'sl-1003', chargerId: 'ch-101', startAt: '2026-06-18T10:00:00+07:00', endAt: '2026-06-18T11:00:00+07:00', price: 90000, status: 'AVAILABLE' },
  { id: 'sl-2001', chargerId: 'ch-201', startAt: '2026-06-18T08:00:00+07:00', endAt: '2026-06-18T09:00:00+07:00', price: 75000, status: 'AVAILABLE' },
  { id: 'sl-2002', chargerId: 'ch-201', startAt: '2026-06-18T09:00:00+07:00', endAt: '2026-06-18T10:00:00+07:00', price: 75000, status: 'DISABLED' },
  { id: 'sl-3001', chargerId: 'ch-301', startAt: '2026-06-18T08:00:00+07:00', endAt: '2026-06-18T09:00:00+07:00', price: 120000, status: 'AVAILABLE' },
];
