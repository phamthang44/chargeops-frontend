import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

const restBundle = await build({
  entryPoints: [new URL('./services.ts', import.meta.url).pathname.replace(/^\/(\w:)/, '$1')],
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'node',
});
const { createRestServices } = await import(
  `data:text/javascript;base64,${Buffer.from(restBundle.outputFiles[0].text).toString('base64')}`
);

test('REST schedule history preserves pending, cancelled, and effective boundary data', async () => {
  const records = [
    {
      scheduleId: 'pending-id',
      effectiveFrom: '2026-11-23T00:00:00Z',
      effectiveTo: null,
      status: 'PENDING',
      open24Hours: true,
      hours: [],
      changedByName: 'Owner',
      changedAt: '2026-11-17T09:29:00Z',
    },
    {
      scheduleId: 'active-id',
      effectiveFrom: '2026-11-17T09:29:00Z',
      effectiveTo: '2026-11-23T00:00:00Z',
      status: 'ACTIVE',
      open24Hours: true,
      hours: [],
      changedByName: 'Owner',
      changedAt: '2026-11-17T09:29:00Z',
    },
    {
      scheduleId: 'cancelled-id',
      effectiveFrom: '2026-11-24T00:00:00Z',
      effectiveTo: null,
      status: 'CANCELLED',
      open24Hours: false,
      hours: [],
      changedByName: 'Owner',
      changedAt: '2026-11-17T09:30:00Z',
      cancelledAt: '2026-11-17T09:35:00Z',
      cancelledByName: 'Station owner',
    },
    {
      scheduleId: 'unknown-id',
      effectiveFrom: '2026-11-25T00:00:00Z',
      effectiveTo: null,
      status: 'UNRECOGNIZED',
      open24Hours: false,
      hours: [],
      changedByName: 'System',
      changedAt: '2026-11-17T09:31:00Z',
    },
  ];
  let requestedPath;
  const services = createRestServices({
    get: async (path) => {
      requestedPath = path;
      return { data: records };
    },
  });

  const history = await services.pricing.history('station-id');

  assert.equal(requestedPath, '/owner/stations/station-id/pricing/schedule-history');
  assert.deepEqual(history.map((item) => item.status), ['PENDING', 'ACTIVE', 'CANCELLED', 'UNKNOWN']);
  assert.equal(history[0].effectiveFrom, records[0].effectiveFrom);
  assert.equal(history[1].effectiveTo, records[1].effectiveTo);
  assert.equal(history[2].cancelledAt, records[2].cancelledAt);
  assert.equal(history[2].cancelledByName, records[2].cancelledByName);
});
