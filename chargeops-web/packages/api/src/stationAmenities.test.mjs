import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

const httpBundle = await build({
  entryPoints: [new URL('./http.ts', import.meta.url).pathname.replace(/^\/(\w:)/, '$1')],
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'node',
});
const { HttpClient, ApiError } = await import(
  `data:text/javascript;base64,${Buffer.from(httpBundle.outputFiles[0].text).toString('base64')}`
);

const restBundle = await build({
  entryPoints: [new URL('./rest/services.ts', import.meta.url).pathname.replace(/^\/(\w:)/, '$1')],
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'node',
});
const { createRestServices } = await import(
  `data:text/javascript;base64,${Buffer.from(restBundle.outputFiles[0].text).toString('base64')}`
);

const mockBundle = await build({
  entryPoints: [new URL('./mock/services.ts', import.meta.url).pathname.replace(/^\/(\w:)/, '$1')],
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'node',
  external: ['exceljs'],
});
const { createMockServices } = await import(
  `data:text/javascript;base64,${Buffer.from(
    mockBundle.outputFiles[0].text.replace(/import\(["']exceljs["']\)/g, `import('${import.meta.resolve('exceljs')}')`)
  ).toString('base64')}`
);

const originalFetch = globalThis.fetch;
const originalTimeout = AbortSignal.timeout;
globalThis.window = { location: { origin: 'https://console.chargeops.online' } };
afterEach(() => {
  globalThis.fetch = originalFetch;
  AbortSignal.timeout = originalTimeout;
});

const config = {
  baseUrl: 'https://api.chargeops.online/api/v1',
  useMocks: false,
  getToken: async () => 'owner-token-123',
  getLanguage: () => 'vi',
};

test('REST getAmenities sends GET to /owner/stations/{id}/amenities with auth and returns data', async () => {
  const stationId = 'st-test-001';
  let requestedUrl;
  let requestedOpts;

  globalThis.fetch = async (url, opts) => {
    requestedUrl = url.toString();
    requestedOpts = opts;
    return new Response(
      JSON.stringify({
        data: {
          stationId,
          amenities: ['wifi', 'coffee'],
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  };

  const client = new HttpClient(config);
  const services = createRestServices(client);
  const result = await services.stations.getAmenities(stationId);

  assert.equal(requestedUrl, `https://api.chargeops.online/api/v1/owner/stations/${stationId}/amenities`);
  assert.equal(requestedOpts.method, 'GET');
  assert.equal(requestedOpts.headers.Authorization, 'Bearer owner-token-123');
  assert.equal(requestedOpts.headers['Accept-Language'], 'vi');
  assert.deepEqual(result, {
    stationId,
    amenities: ['wifi', 'coffee'],
  });
});

test('REST updateAmenities sends PUT to canonical /owner/stations/{id}/amenities and does NOT call legacy route', async () => {
  const stationId = 'st-test-002';
  let requestedUrl;
  let requestedOpts;

  globalThis.fetch = async (url, opts) => {
    requestedUrl = url.toString();
    requestedOpts = opts;
    assert.doesNotMatch(requestedUrl, /\/api\/v1\/stations\/[^/]+\/amenities/, 'Legacy route must never be called');
    return new Response(
      JSON.stringify({
        data: {
          stationId,
          amenities: ['wifi', 'coffee', 'restroom'],
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  };

  const client = new HttpClient(config);
  const services = createRestServices(client);
  const result = await services.stations.updateAmenities(stationId, ['wifi', 'coffee', 'restroom']);

  assert.equal(requestedUrl, `https://api.chargeops.online/api/v1/owner/stations/${stationId}/amenities`);
  assert.equal(requestedOpts.method, 'PUT');
  assert.equal(requestedOpts.headers.Authorization, 'Bearer owner-token-123');
  assert.deepEqual(JSON.parse(requestedOpts.body), { amenities: ['wifi', 'coffee', 'restroom'] });
  assert.deepEqual(result, {
    stationId,
    amenities: ['wifi', 'coffee', 'restroom'],
  });
});

test('REST updateAmenities sends empty array [] to clear all amenities', async () => {
  const stationId = 'st-test-003';
  let requestedOpts;

  globalThis.fetch = async (url, opts) => {
    requestedOpts = opts;
    return new Response(
      JSON.stringify({
        data: {
          stationId,
          amenities: [],
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  };

  const client = new HttpClient(config);
  const services = createRestServices(client);
  const result = await services.stations.updateAmenities(stationId, []);

  assert.deepEqual(JSON.parse(requestedOpts.body), { amenities: [] });
  assert.deepEqual(result, {
    stationId,
    amenities: [],
  });
});

test('Mock getAmenities and updateAmenities: dedup, catalog ordering, empty array, unknown station', async () => {
  const mockServices = createMockServices({ ownerView: true });
  const stations = await mockServices.stations.mine();
  assert.ok(stations.length > 0, 'Should have mock stations for owner');
  const target = stations[0];

  // 1. Initial getAmenities
  const initial = await mockServices.stations.getAmenities(target.id);
  assert.equal(initial.stationId, target.id);
  assert.ok(Array.isArray(initial.amenities));

  // 2. Update with duplicates and unordered items: ['shop', 'wifi', 'shop', 'coffee']
  const updated = await mockServices.stations.updateAmenities(target.id, ['shop', 'wifi', 'shop', 'coffee']);
  assert.equal(updated.stationId, target.id);
  // Catalog order: wifi, food, coffee, parking, security, restroom, lounge, atm, carwash, shop
  assert.deepEqual(updated.amenities, ['wifi', 'coffee', 'shop']);

  // Readback via getAmenities reflects the saved state
  const readback = await mockServices.stations.getAmenities(target.id);
  assert.deepEqual(readback.amenities, ['wifi', 'coffee', 'shop']);

  // 3. Clear all amenities via []
  const cleared = await mockServices.stations.updateAmenities(target.id, []);
  assert.deepEqual(cleared.amenities, []);
  const readbackCleared = await mockServices.stations.getAmenities(target.id);
  assert.deepEqual(readbackCleared.amenities, []);

  // 4. Unknown station throws
  await assert.rejects(
    async () => mockServices.stations.getAmenities('unknown-station-id-999'),
    /Không tìm thấy trạm/
  );
  await assert.rejects(
    async () => mockServices.stations.updateAmenities('unknown-station-id-999', ['wifi']),
    /Không tìm thấy trạm/
  );
});
