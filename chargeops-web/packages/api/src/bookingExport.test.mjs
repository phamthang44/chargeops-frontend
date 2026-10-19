import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { build } from 'esbuild';
import ExcelJS from 'exceljs';

async function loadTs(url) {
  const { outputText } = ts.transpileModule(readFileSync(url, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
  });
  return import(`data:text/javascript;base64,${Buffer.from(outputText.replace("import('exceljs')", `import('${import.meta.resolve('exceljs')}')`)).toString('base64')}`);
}
const { HttpClient, ApiError } = await loadTs(new URL('./http.ts', import.meta.url));
const { getRangeWindow, downloadBookingFile } = await loadTs(new URL('../../../apps/web/src/owner/features/bookings/bookingExport.ts', import.meta.url));
const { createMockBookingWorkbook } = await loadTs(new URL('./mock/bookingExport.ts', import.meta.url));
const restBundle = await build({ entryPoints: [new URL('./rest/services.ts', import.meta.url).pathname.replace(/^\/(\w:)/, '$1')],
  bundle: true, write: false, format: 'esm', platform: 'node' });
const { createRestServices } = await import(`data:text/javascript;base64,${Buffer.from(restBundle.outputFiles[0].text).toString('base64')}`);
const mockBundle = await build({ entryPoints: [new URL('./mock/services.ts', import.meta.url).pathname.replace(/^\/(\w:)/, '$1')],
  bundle: true, write: false, format: 'esm', platform: 'node', external: ['exceljs'] });
const { createMockServices } = await import(`data:text/javascript;base64,${Buffer.from(mockBundle.outputFiles[0].text
  .replace(/import\(["']exceljs["']\)/g, `import('${import.meta.resolve('exceljs')}')`)).toString('base64')}`);
const originalFetch = globalThis.fetch;
const originalTimeout = AbortSignal.timeout;
globalThis.window = { location: { origin: 'https://console.chargeops.online' } };
afterEach(() => { globalThis.fetch = originalFetch; AbortSignal.timeout = originalTimeout; });
const config = { baseUrl: 'https://api.chargeops.online/api/v1', useMocks: false, getToken: async () => 'owner-token', getLanguage: () => 'vi' };

test('download preserves authentication, language, filters, filename and 60s timeout', async () => {
  let timeout;
  AbortSignal.timeout = (ms) => { timeout = ms; return new AbortController().signal; };
  globalThis.fetch = async (url, opts) => {
    assert.equal(url.searchParams.get('stationId'), 'station-a');
    assert.equal(url.searchParams.get('status'), 'CANCELLED');
    assert.equal(opts.headers.Authorization, 'Bearer owner-token');
    assert.equal(opts.headers['Accept-Language'], 'vi');
    assert.match(opts.headers.Accept, /spreadsheetml/);
    return new Response(new Uint8Array([80, 75]), { headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': "attachment; filename=plain.xlsx; filename*=UTF-8''b%C3%A1o-c%C3%A1o.xlsx",
    } });
  };
  const file = await new HttpClient(config).download('/owner/bookings/export', { stationId: 'station-a', status: 'CANCELLED' });
  assert.equal(timeout, 60_000);
  assert.equal(file.filename, 'báo-cáo.xlsx');
  assert.deepEqual([...new Uint8Array(await file.blob.arrayBuffer())], [80, 75]);
});

test('REST export sends every supported filter and omits pagination', async () => {
  let path, query;
  const api = createRestServices({ download: async (p, q) => { path = p; query = q; return { filename: 'file.xlsx' }; } });
  const filter = { stationId: 's', connectorId: 'c', from: '2026-10-17T17:00:00Z', to: '2026-10-18T17:00:00Z',
    status: 'COMPLETED', windowMode: 'START_IN_WINDOW', sort: 'startAt,asc' };
  await api.ownerBookings.export(filter);
  assert.equal(path, '/owner/bookings/export');
  assert.deepEqual(query, filter);
  assert.equal('page' in query, false);
});

test('download failures retain standard structured JSON error', async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({ error: {
    code: 'BKG_EXPORT_LIMIT_EXCEEDED', messageKey: 'error.booking.exportLimitExceeded',
    message: 'Narrow the filters', details: { maxBookings: 10000 },
  } }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  await assert.rejects(new HttpClient(config).download('/owner/bookings/export'), (error) => {
    assert.ok(error instanceof ApiError); assert.equal(error.code, 'BKG_EXPORT_LIMIT_EXCEEDED');
    assert.equal(error.status, 400); assert.deepEqual(error.details, { maxBookings: 10000 }); return true;
  });
});

test('successful JSON is never downloaded as an Excel file', async () => {
  globalThis.fetch = async () => new Response('{}', { headers: { 'Content-Type': 'application/json' } });
  await assert.rejects(new HttpClient(config).download('/owner/bookings/export'), { code: 'INVALID_FILE' });
});

test('transport timeout and broken download bodies become ApiError', async () => {
  globalThis.fetch = async () => { throw new DOMException('timeout', 'TimeoutError'); };
  await assert.rejects(new HttpClient(config).download('/export'), { code: 'TIMEOUT' });
  globalThis.fetch = async () => ({ ok: true, status: 200, headers: new Headers(), blob: async () => { throw new TypeError('disconnected'); } });
  await assert.rejects(new HttpClient(config).download('/export'), { code: 'NETWORK' });
});

test('existing JSON envelope, pagination, 204, auth failures and timeout default are unchanged', async () => {
  let timeout;
  AbortSignal.timeout = (ms) => { timeout = ms; return new AbortController().signal; };
  const client = new HttpClient(config);
  globalThis.fetch = async () => new Response(JSON.stringify({ data: { value: 42 } }));
  assert.deepEqual(await client.get('/test'), { value: 42 }); assert.equal(timeout, 15000);
  globalThis.fetch = async () => new Response(JSON.stringify({ data: [{ id: 1 }], meta: { page: 1, size: 10, totalElements: 25, totalPages: 3 } }));
  const page = await client.get('/test'); assert.equal(page.total, 25); assert.equal(page.page, 1);
  assert.deepEqual(page.items, [{ id: 1 }]);
  globalThis.fetch = async () => new Response(null, { status: 204 });
  assert.equal(await client.delete('/test'), undefined);
  globalThis.fetch = async () => new Response(JSON.stringify({ error: { code: 'AUTH_006', message: 'Suspended' } }), { status: 403 });
  await assert.rejects(client.get('/test'), { status: 403, code: 'AUTH_006' });
});

test('Vietnam today crosses UTC midnight correctly regardless of browser timezone', () => {
  assert.deepEqual(getRangeWindow('today', new Date('2026-10-18T17:05:00Z')), {
    from: '2026-10-18T17:00:00.000Z', to: '2026-10-19T17:00:00.000Z',
  });
  assert.deepEqual(getRangeWindow('today', new Date('2026-10-18T16:59:59Z')), {
    from: '2026-10-17T17:00:00.000Z', to: '2026-10-18T17:00:00.000Z',
  });
  const now = new Date('2026-10-18T12:00:00Z');
  assert.deepEqual(getRangeWindow('7d', now), { from: '2026-10-11T12:00:00.000Z', to: now.toISOString() });
  assert.deepEqual(getRangeWindow('30d', now), { from: '2026-09-18T12:00:00.000Z', to: now.toISOString() });
  assert.deepEqual(getRangeWindow('all', now), {});
});

test('download click cleans up anchor and object URL, including click failure', () => {
  const createUrl = URL.createObjectURL, revokeUrl = URL.revokeObjectURL, timer = globalThis.setTimeout;
  let removed = 0, revoked = 0, clicked = 0, delayed;
  URL.createObjectURL = () => 'blob:booking'; URL.revokeObjectURL = () => { revoked++; };
  globalThis.setTimeout = (fn) => { delayed = fn; };
  globalThis.document = { body: { appendChild() {} }, createElement: () => ({ remove: () => removed++, click: () => clicked++ }) };
  try {
    downloadBookingFile({ blob: new Blob(), filename: 'report.xlsx' });
    assert.equal(clicked, 1); assert.equal(removed, 1); assert.equal(revoked, 0); delayed(); assert.equal(revoked, 1);
    globalThis.document.createElement = () => ({ remove: () => removed++, click: () => { throw new Error('click'); } });
    assert.throws(() => downloadBookingFile({ blob: new Blob(), filename: 'report.xlsx' }), /click/);
    delayed(); assert.equal(removed, 2); assert.equal(revoked, 2);
  } finally { URL.createObjectURL = createUrl; URL.revokeObjectURL = revokeUrl; globalThis.setTimeout = timer; delete globalThis.document; }
});

test('mock generates two readable Excel sheets with numeric values and inert text', async () => {
  const item = { bookingCode: '000123', driverDisplayName: '=1+1', stationName: 'Trạm Thủ Đức', connectorCode: '0001',
    startAt: '2026-10-18T17:00:00Z', endAt: '2026-10-18T18:30:00Z', status: 'COMPLETED', totalAmount: 126000, currency: 'VND' };
  const file = await createMockBookingWorkbook(Array.from({ length: 25 }, () => item), { status: 'COMPLETED' }, 'vi');
  const workbook = new ExcelJS.Workbook(); await workbook.xlsx.load(await file.blob.arrayBuffer());
  assert.equal(workbook.worksheets.length, 2);
  const details = workbook.getWorksheet('Bookings'); assert.equal(details.rowCount, 26);
  assert.equal(details.getCell('A2').value, '000123'); assert.equal(details.getCell('B2').value, '=1+1');
  assert.equal(details.getCell('C2').value, 'Trạm Thủ Đức'); assert.equal(details.getCell('G2').value, 90);
  assert.equal(details.getCell('J2').value, 126000);
  assert.equal(details.getCell('E2').value.toISOString(), '2026-10-19T00:00:00.000Z');
  const summary = workbook.getWorksheet('Summary'); assert.equal(summary.getCell('B11').value, 25);
  assert.equal(summary.getCell('B16').value, 25);
});

test('mock service exports every filtered page in the same order as its list', async () => {
  const service = createMockServices().ownerBookings;
  const all = await service.list({ pageSize: 10001 });
  assert.ok(all.total > 10);
  const filter = { stationId: all.items[0].stationId, status: all.items[0].status, sort: 'startAt,asc' };
  const expected = await service.list({ ...filter, pageSize: 10001 });
  const file = await service.export(filter);
  const workbook = new ExcelJS.Workbook(); await workbook.xlsx.load(await file.blob.arrayBuffer());
  const sheet = workbook.getWorksheet('Bookings');
  assert.equal(sheet.rowCount - 1, expected.total);
  assert.deepEqual(sheet.getColumn(1).values.slice(2), expected.items.map((item) => item.bookingCode));
  assert.equal(workbook.getWorksheet('Summary').getCell('B11').value, expected.total);
});

test('mock service produces an empty workbook for empty filters', async () => {
  const file = await createMockServices().ownerBookings.export({ stationId: 'no-matching-station' });
  const workbook = new ExcelJS.Workbook(); await workbook.xlsx.load(await file.blob.arrayBuffer());
  assert.equal(workbook.getWorksheet('Bookings').rowCount, 1);
  assert.equal(workbook.getWorksheet('Summary').getCell('B11').value, 0);
});

test('mock service refuses oversized results without returning a partial file', async () => {
  const service = createMockServices().ownerBookings;
  service.list = async (params) => {
    assert.equal(params.page, 0); assert.equal(params.pageSize, 10001);
    return { items: [], total: 10001 };
  };
  await assert.rejects(service.export({}), { code: 'BKG_EXPORT_LIMIT_EXCEEDED', status: 400 });
});
