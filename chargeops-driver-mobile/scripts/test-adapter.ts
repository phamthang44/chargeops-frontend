import {
  adaptChargePointsFromDetail,
  adaptConnectorsFromDetail,
  adaptStationDiscoveryDetail,
  adaptStationDiscoveryItem,
  buildStationDiscoveryQueryParams,
  deriveHasFastCharging,
  mapFrontendSortToBackend,
  type BackendStationDiscoveryDetail,
  type BackendStationDiscoveryItem,
} from '../src/services/stationAdapter';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${message}`);
}

console.log('--- Testing deriveHasFastCharging ---');
assert(deriveHasFastCharging({ maxPowerKw: 120 }) === true, 'maxPowerKw >= 50 is fast charging');
assert(deriveHasFastCharging({ maxPowerKw: 22 }) === false, 'maxPowerKw 22 is NOT fast charging');
assert(deriveHasFastCharging({ connectorTypes: ['CCS2'] }) === true, 'CCS2 connector is fast charging');
assert(deriveHasFastCharging({ connectorTypes: ['CHADEMO'] }) === true, 'CHADEMO is fast charging');
assert(deriveHasFastCharging({ connectorTypes: ['TYPE2'] }) === false, 'TYPE2 is NOT fast charging');
assert(
  deriveHasFastCharging({
    chargePoints: [
      {
        id: 'cp-1',
        name: 'Trụ DC',
        maxPowerKw: 120,
        connectors: [
          { id: 'c-1', connectorType: 'CCS2', chargerType: 'DC', powerKw: 120, availableNow: true },
        ],
      },
    ],
  }) === true,
  'DC charge point/connector is fast charging',
);
assert(
  deriveHasFastCharging({
    chargePoints: [
      {
        id: 'cp-2',
        name: 'Trụ AC',
        maxPowerKw: 22,
        connectors: [
          { id: 'c-2', connectorType: 'TYPE2', chargerType: 'AC', powerKw: 22, availableNow: true },
        ],
      },
    ],
  }) === false,
  'AC charge point/connector is NOT fast charging',
);

console.log('\n--- Testing adaptStationDiscoveryItem ---');
const mockBackendDiscoveryItem: BackendStationDiscoveryItem = {
  id: 'uuid-1234',
  name: 'Vincom Center Landmark 81',
  address: '720A Dien Bien Phu, Binh Thanh, HCMC',
  latitude: 10.795,
  longitude: 106.7219,
  distanceKm: 2.5,
  primaryImageUrl: 'https://images.unsplash.com/photo-station-1',
  priceFromVndPerKwh: 3850,
  maxPowerKw: 150,
  connectorTypes: ['CCS2', 'TYPE2'],
  totalConnectorCount: 8,
  availableConnectorCount: 4,
  openNow: true,
};

const adaptedItem = adaptStationDiscoveryItem(mockBackendDiscoveryItem);

assert(adaptedItem.id === 'uuid-1234', 'id mapped');
assert(adaptedItem.imageUrl === 'https://images.unsplash.com/photo-station-1', 'primaryImageUrl -> imageUrl mapped');
assert(adaptedItem.minRatePerKwh === 3850, 'priceFromVndPerKwh -> minRatePerKwh mapped');
assert(adaptedItem.availableConnectors === 4, 'availableConnectorCount -> availableConnectors mapped');
assert(adaptedItem.totalConnectors === 8, 'totalConnectorCount -> totalConnectors mapped');
assert(adaptedItem.isOpen === true, 'openNow -> isOpen mapped');
assert(adaptedItem.hasFastCharging === true, 'hasFastCharging derived as true');
assert(adaptedItem.maxPowerKw === 150, 'maxPowerKw mapped');
assert(adaptedItem.connectorTypes?.length === 2, 'connectorTypes mapped');

console.log('\n--- Testing adaptStationDiscoveryDetail with chargePoints[].connectors[] ---');
const mockBackendDetail: BackendStationDiscoveryDetail = {
  id: 'uuid-5678',
  stationCode: 'ST-5678',
  name: 'Station Detail Test',
  description: 'Test station description',
  address: '123 Nguyen Hue',
  wardName: 'Ben Nghe',
  provinceName: 'Quan 1',
  latitude: 10.77,
  longitude: 106.7,
  contactPhone: '0901234567',
  primaryImageUrl: 'https://images.unsplash.com/photo-detail',
  currentPriceVndPerKwh: 3200,
  open24Hours: true,
  openNow: true,
  chargePoints: [
    {
      id: 'cp-101',
      chargePointCode: 'A',
      name: 'Trụ DC A',
      zoneLabel: 'Hầm B2',
      maxPowerKw: 120,
      operationalStatus: 'ACTIVE',
      connectors: [
        { id: 'c-1', connectorCode: 'Cổng 1', connectorType: 'CCS2', chargerType: 'DC', powerKw: 120, runtimeStatus: 'AVAILABLE', availableNow: true },
        { id: 'c-2', connectorCode: 'Cổng 2', connectorType: 'CCS2', chargerType: 'DC', powerKw: 120, runtimeStatus: 'IN_USE', availableNow: false },
      ],
    },
    {
      id: 'cp-102',
      chargePointCode: 'B',
      name: 'Trụ AC B',
      zoneLabel: 'Hầm B2',
      maxPowerKw: 22,
      operationalStatus: 'ACTIVE',
      connectors: [
        { id: 'c-3', connectorCode: 'Cổng 3', connectorType: 'TYPE2', chargerType: 'AC', powerKw: 22, runtimeStatus: 'AVAILABLE', availableNow: true },
      ],
    },
  ],
};

const adaptedDetail = adaptStationDiscoveryDetail(mockBackendDetail);
assert(adaptedDetail.id === 'uuid-5678', 'id mapped');
assert(adaptedDetail.imageUrl === 'https://images.unsplash.com/photo-detail', 'imageUrl mapped');
assert(adaptedDetail.minRatePerKwh === 3200, 'currentPriceVndPerKwh -> minRatePerKwh mapped');
assert(adaptedDetail.availableConnectors === 2, 'availableConnectors computed from connectors: 1 + 0 + 1 = 2');
assert(adaptedDetail.totalConnectors === 3, 'totalConnectors computed from connectors: 2 + 1 = 3');
assert(adaptedDetail.isOpen === true, 'isOpen mapped');
assert(adaptedDetail.hasFastCharging === true, 'hasFastCharging derived from DC charge points/connectors');
assert(adaptedDetail.operatingHours === '24/7', 'operatingHours mapped');

const adaptedChargePoints = adaptChargePointsFromDetail(mockBackendDetail);
assert(adaptedChargePoints.length === 2, '2 charge points extracted');
assert(adaptedChargePoints[0].name === 'Trụ DC A', 'charge point name mapped');
assert(adaptedChargePoints[0].maxPowerKw === 120, 'charge point maxPowerKw mapped');

const adaptedConnectors = adaptConnectorsFromDetail(mockBackendDetail);
assert(adaptedConnectors.length === 3, '3 connectors extracted across charge points');
assert(adaptedConnectors[0].currentType === 'DC', 'DC connector mapped');
assert(adaptedConnectors[0].ratePerKwh === 3200, 'ratePerKwh inherited from currentPriceVndPerKwh');
assert(adaptedConnectors[2].currentType === 'AC', 'AC connector mapped');

console.log('\n--- Testing mapFrontendSortToBackend & buildStationDiscoveryQueryParams ---');
assert(mapFrontendSortToBackend('nearest') === 'NEAREST', 'nearest -> NEAREST');
assert(mapFrontendSortToBackend('cheapest') === 'CHEAPEST', 'cheapest -> CHEAPEST');
assert(mapFrontendSortToBackend('available') === 'AVAILABLE', 'available -> AVAILABLE');
assert(mapFrontendSortToBackend(undefined) === 'NEAREST', 'default -> NEAREST');

const queryParams = buildStationDiscoveryQueryParams({
  query: 'Vincom',
  availableOnly: true,
  currentType: 'DC',
  sort: 'cheapest',
}, { page: 2, size: 12 });

assert(queryParams.get('query') === 'Vincom', 'query param present');
assert(queryParams.get('availableOnly') === 'true', 'availableOnly param present');
assert(queryParams.get('chargerType') === 'DC', 'chargerType param present');
assert(queryParams.get('page') === '2', 'one-based page param present');
assert(queryParams.get('size') === '12', 'size param present');
console.log('\n--- Testing BackendStationAvailabilityResponse structure ---');
import type { BackendStationAvailabilityResponse } from '../src/services/stationAdapter';

const mockAvailabilityResponse: BackendStationAvailabilityResponse = {
  stationId: 'st-001',
  connectorId: 'c-101',
  date: '2026-09-01',
  timezone: 'Asia/Ho_Chi_Minh',
  generatedAt: '2026-09-01T08:00:00Z',
  minDurationMinutes: 30,
  durationStepMinutes: 15,
  maxDurationMinutes: 180,
  operatingWindows: [{ startAt: '2026-09-01T06:00:00Z', endAt: '2026-09-01T22:00:00Z' }],
  busyRanges: [{ startAt: '2026-09-01T09:00:00Z', endAt: '2026-09-01T10:00:00Z' }],
  priceRanges: [
    { startAt: '2026-09-01T06:00:00Z', endAt: '2026-09-01T17:00:00Z', rateVndPerKwh: 3500, periodCode: 'NORMAL' },
    { startAt: '2026-09-01T17:00:00Z', endAt: '2026-09-01T20:00:00Z', rateVndPerKwh: 4200, periodCode: 'PEAK' },
    { startAt: '2026-09-01T20:00:00Z', endAt: '2026-09-01T22:00:00Z', rateVndPerKwh: 3500, periodCode: 'NORMAL' },
  ],
};

assert(mockAvailabilityResponse.priceRanges.length === 3, 'priceRanges has 3 items');
assert(mockAvailabilityResponse.priceRanges[1].rateVndPerKwh === 4200, 'PEAK rate is 4200');
assert(mockAvailabilityResponse.priceRanges[1].periodCode === 'PEAK', 'periodCode is PEAK');

console.log('\n🎉 ALL UPDATED ADAPTER TESTS PASSED SUCCESSFULLY!');
