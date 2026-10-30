// Test suite for Amenities V1 across driver mobile adapter, normalizer, service and quick-book
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');

const root = path.resolve(__dirname, '..');
const mobileSrc = path.join(root, 'chargeops-driver-mobile', 'src');
const ts = require(path.join(root, 'chargeops-driver-mobile/node_modules/typescript'));

// Mock react-native for Node test environment
const mockReactNative = {
  Platform: { OS: 'ios', select: (objs) => objs.ios ?? objs.default },
  NativeModules: {},
};
const reactNativePath = path.resolve(__dirname, 'virtual-react-native.js');
require.cache[reactNativePath] = {
  id: reactNativePath,
  filename: reactNativePath,
  loaded: true,
  exports: mockReactNative,
};

// Mock expo-constants for Node test environment
const expoConfig = { hostUri: 'localhost:8082' };
const mockExpoConstants = {
  default: { expoConfig },
  expoConfig,
};
const expoConstantsPath = path.resolve(__dirname, 'virtual-expo-constants.js');
require.cache[expoConstantsPath] = {
  id: expoConstantsPath,
  filename: expoConstantsPath,
  loaded: true,
  exports: mockExpoConstants,
};

// Enable TS loading with alias resolution for @/
const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, parent, isMain, options) {
  if (request === 'react-native') {
    return reactNativePath;
  }
  if (request === 'expo-constants') {
    return expoConstantsPath;
  }
  if (request.startsWith('@/')) {
    const target = path.join(mobileSrc, request.slice(2));
    if (fs.existsSync(target + '.ts')) return target + '.ts';
    if (fs.existsSync(target + '.tsx')) return target + '.tsx';
    if (fs.existsSync(path.join(target, 'index.ts'))) return path.join(target, 'index.ts');
    if (fs.existsSync(path.join(target, 'index.tsx'))) return path.join(target, 'index.tsx');
    return target;
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};

require.extensions['.ts'] = (module, file) => {
  const content = fs.readFileSync(file, 'utf8');
  const transpiled = ts.transpileModule(content, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;
  return module._compile(transpiled, file);
};

// Import unit under test
const { normalizeStationAmenities, CANONICAL_AMENITIES } = require('../chargeops-driver-mobile/src/utils/stationAmenities.ts');
const { adaptStationDiscoveryDetail } = require('../chargeops-driver-mobile/src/services/stationAdapter.ts');
const stationService = require('../chargeops-driver-mobile/src/services/stationService.ts');
const { executeQuickBook } = require('../chargeops-driver-mobile/src/utils/quickBook.ts');

let passCount = 0;
async function test(name, fn) {
  await fn();
  passCount++;
  console.log('✅ PASS:', name);
}

async function runTests() {
  console.log('--- Testing normalizeStationAmenities ---');

  await test('normalizes all 10 canonical codes and orders them by canonical catalog', () => {
    const raw = ['shop', 'carwash', 'atm', 'lounge', 'restroom', 'security', 'parking', 'coffee', 'food', 'wifi'];
    const result = normalizeStationAmenities(raw);
    assert.deepEqual(result, [
      'wifi',
      'food',
      'coffee',
      'parking',
      'security',
      'restroom',
      'lounge',
      'atm',
      'carwash',
      'shop',
    ]);
  });

  await test('maps legacy uppercase aliases (WIFI, CAFE, RESTROOM, PARKING, CONVENIENCE_STORE)', () => {
    const raw = ['CONVENIENCE_STORE', 'CAFE', 'WIFI', 'PARKING', 'RESTROOM'];
    const result = normalizeStationAmenities(raw);
    // Ordered canonically: wifi, coffee, parking, restroom, shop
    assert.deepEqual(result, ['wifi', 'coffee', 'parking', 'restroom', 'shop']);
  });

  await test('preserves legacy SHOPPING separately without converting to shop or sending to backend', () => {
    const raw = ['WIFI', 'SHOPPING', 'food'];
    const result = normalizeStationAmenities(raw);
    assert.deepEqual(result, ['wifi', 'food', 'SHOPPING']);
  });

  await test('discards unknown codes and non-string elements safely', () => {
    const raw = ['wifi', 'UNKNOWN_XYZ', null, 123, '', '   ', 'lounge'];
    const result = normalizeStationAmenities(raw);
    assert.deepEqual(result, ['wifi', 'lounge']);
  });

  await test('returns empty array [] for null, undefined, objects, or non-arrays', () => {
    assert.deepEqual(normalizeStationAmenities(null), []);
    assert.deepEqual(normalizeStationAmenities(undefined), []);
    assert.deepEqual(normalizeStationAmenities({}), []);
    assert.deepEqual(normalizeStationAmenities('wifi'), []);
    assert.deepEqual(normalizeStationAmenities(42), []);
    assert.deepEqual(normalizeStationAmenities([]), []);
  });

  await test('deduplicates duplicate items and aliases', () => {
    const raw = ['wifi', 'WIFI', 'wifi', 'CAFE', 'coffee', 'CAFE'];
    const result = normalizeStationAmenities(raw);
    assert.deepEqual(result, ['wifi', 'coffee']);
  });

  console.log('\n--- Testing adaptStationDiscoveryDetail amenities mapping ---');

  await test('adapts station discovery detail with amenities and preserves existing fields', () => {
    const mockDetail = {
      id: 'st-detail-uuid-001',
      name: 'Trạm Sạc Tân Bình',
      address: '100 Cộng Hòa',
      latitude: 10.8,
      longitude: 106.65,
      openNow: true,
      currentPriceVndPerKwh: 3500,
      amenities: ['coffee', 'wifi', 'food'],
      chargePoints: [
        {
          id: 'cp-1',
          name: 'Trụ 1',
          connectors: [
            { id: 'conn-1', connectorType: 'CCS2', chargerType: 'DC', powerKw: 60, runtimeStatus: 'AVAILABLE', availableNow: true },
          ],
        },
      ],
    };

    const adapted = adaptStationDiscoveryDetail(mockDetail);
    assert.equal(adapted.id, 'st-detail-uuid-001');
    assert.equal(adapted.name, 'Trạm Sạc Tân Bình');
    assert.equal(adapted.isOpen, true);
    assert.equal(adapted.minRatePerKwh, 3500);
    // Amenities canonical order: wifi, food, coffee
    assert.deepEqual(adapted.amenities, ['wifi', 'food', 'coffee']);
  });

  await test('adapts missing or null amenities in detail to empty array []', () => {
    const mockDetail = {
      id: 'st-detail-uuid-002',
      name: 'Trạm Sạc Quận 7',
      latitude: 10.73,
      longitude: 106.71,
      amenities: null,
    };
    const adapted = adaptStationDiscoveryDetail(mockDetail);
    assert.deepEqual(adapted.amenities, []);
  });

  console.log('\n--- Testing getStationDetail fallback prevention in real mode ---');

  const originalFetch = global.fetch;

  await test('real mode 404 returns null and DOES NOT fall back to stationsMock fixture', async () => {
    // Pick an ID that exists in stationsMock (e.g. 'st-001')
    const mockExistingId = 'st-001';
    global.fetch = async () => new Response(JSON.stringify({ error: { code: 'STATION_001', message: 'Station not found' } }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });

    process.env.EXPO_PUBLIC_USE_MOCKS = 'false';
    const result = await stationService.getStationDetail(mockExistingId);
    assert.equal(result, null, 'Real mode HTTP 404 must return null, never fall back to mock fixture');
  });

  await test('real mode network failure returns null and DOES NOT fall back to stationsMock', async () => {
    const mockExistingId = 'st-001';
    global.fetch = async () => {
      throw new Error('Network request failed');
    };

    process.env.EXPO_PUBLIC_USE_MOCKS = 'false';
    const result = await stationService.getStationDetail(mockExistingId);
    assert.equal(result, null, 'Real mode network exception must return null, never fall back to mock fixture');
  });

  await test('real mode HTTP 200 returns adapted bundle with amenities', async () => {
    global.fetch = async () => new Response(JSON.stringify({
      data: {
        id: 'real-st-uuid',
        name: 'Real Backend Station',
        latitude: 10.75,
        longitude: 106.68,
        openNow: true,
        amenities: ['wifi', 'restroom', 'atm'],
        chargePoints: [
          {
            id: 'cp-real-1',
            connectors: [
              { id: 'c-real-1', connectorType: 'CCS2', powerKw: 120, runtimeStatus: 'AVAILABLE', availableNow: true },
            ],
          },
        ],
      },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    process.env.EXPO_PUBLIC_USE_MOCKS = 'false';
    const result = await stationService.getStationDetail('real-st-uuid');
    assert.ok(result !== null);
    assert.equal(result.station.name, 'Real Backend Station');
    assert.deepEqual(result.station.amenities, ['wifi', 'restroom', 'atm']);
    assert.equal(result.connectors.length, 1);
  });

  await test('explicit mock mode returns mock bundle fixture', async () => {
    process.env.EXPO_PUBLIC_USE_MOCKS = 'true';
    const result = await stationService.getStationDetail('st-001');
    assert.ok(result !== null);
    assert.equal(result.station.id, 'st-001');
    process.env.EXPO_PUBLIC_USE_MOCKS = 'false';
  });

  console.log('\n--- Testing executeQuickBook early return on null/empty ---');

  await test('executeQuickBook navigates to StationDetail early if detail is null', async () => {
    global.fetch = async () => new Response(null, { status: 404 });
    process.env.EXPO_PUBLIC_USE_MOCKS = 'false';

    let navigatedScreen = null;
    let navigatedParams = null;
    const fakeNavigation = {
      navigate: (screen, params) => {
        navigatedScreen = screen;
        navigatedParams = params;
      },
    };

    await executeQuickBook('non-existent-station', fakeNavigation);
    assert.equal(navigatedScreen, 'StationDetail');
    assert.deepEqual(navigatedParams, { stationId: 'non-existent-station' });
  });

  await test('executeQuickBook navigates to StationDetail early if connectors are empty', async () => {
    global.fetch = async () => new Response(JSON.stringify({
      data: {
        id: 'st-no-connectors',
        name: 'Empty Station',
        latitude: 10.75,
        longitude: 106.68,
        chargePoints: [],
      },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    process.env.EXPO_PUBLIC_USE_MOCKS = 'false';

    let navigatedScreen = null;
    let navigatedParams = null;
    const fakeNavigation = {
      navigate: (screen, params) => {
        navigatedScreen = screen;
        navigatedParams = params;
      },
    };

    await executeQuickBook('st-no-connectors', fakeNavigation);
    assert.equal(navigatedScreen, 'StationDetail');
    assert.deepEqual(navigatedParams, { stationId: 'st-no-connectors' });
  });

  // Restore
  global.fetch = originalFetch;

  console.log(`\n🎉 All ${passCount} tests passed successfully!`);
}

runTests().catch((err) => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
