import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
const source = readFileSync(new URL('./ownerFinanceAnalytics.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022 } });
const { mockOwnerFinanceAnalytics } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
const stations = [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }, { id: 'c', name: 'C' }];
const now = new Date('2026-10-18T17:00:00Z');
test('mock daily and station totals reconcile with the report', () => {
  const report = mockOwnerFinanceAnalytics(stations, {}, now);
  assert.equal(report.daily.length, 7);
  assert.equal(report.daily.at(-1).date, '2026-10-19');
  assert.equal(report.from, '2026-10-12T17:00:00.000Z');
  assert.equal(report.to, '2026-10-19T17:00:00.000Z');
  assert.equal(report.daily.reduce((sum, row) => sum + row.netVnd, 0), report.netVnd);
  assert.equal(report.stations.reduce((sum, row) => sum + row.netVnd, 0), report.netVnd);
});
test('station filter supports negative net from an earlier-period receipt', () => {
  const report = mockOwnerFinanceAnalytics(stations, { stationId: 'b' }, now);
  assert.equal(report.grossVnd, 0);
  assert.equal(report.netVnd, -120000);
  assert.deepEqual(report.stations.map((row) => row.stationId), ['b']);
});
test('30-day scope includes older cash events', () => {
  const report = mockOwnerFinanceAnalytics(stations, { stationId: 'b', period: '30d' }, now);
  assert.equal(report.daily.length, 30);
  assert.equal(report.grossVnd, 240000);
  assert.equal(report.netVnd, 120000);
});
test('station with no cash events has a successful zero report', () => {
  const report = mockOwnerFinanceAnalytics(stations, { stationId: 'c' }, now);
  assert.equal(report.netVnd, 0);
  assert.equal(report.stationCount, 0);
  assert.deepEqual(report.stations, []);
});
