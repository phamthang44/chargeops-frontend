import assert from 'node:assert/strict';
import test from 'node:test';
import { getDiscoveryPaneLayout, getStationDetailLayout } from '../src/utils/stationPaneLayout.ts';

test('discovery reserves usable map width at the smallest split size', () => {
  assert.equal(getDiscoveryPaneLayout({ width: 719, height: 480 }).split, false);
  const layout = getDiscoveryPaneLayout({ width: 728, height: 480 });
  assert.equal(layout.split, true);
  assert.equal(layout.panelWidth, 320);
  assert.equal(layout.mapWidth, 408);
});

test('discovery panel is capped on larger windows and does not split short or large-text windows', () => {
  assert.equal(getDiscoveryPaneLayout({ width: 1400, height: 900 }).panelWidth, 360);
  assert.equal(getDiscoveryPaneLayout({ width: 848, height: 359 }).split, false);
  assert.equal(getDiscoveryPaneLayout({ width: 728, height: 480, fontScale: 1.3 }).split, false);
  assert.equal(getDiscoveryPaneLayout({ width: 848, height: 480, fontScale: 1.3 }).split, true);
});

test('detail columns use the full stack width, independently of tab rail width', () => {
  assert.equal(getStationDetailLayout({ width: 839, height: 768 }).split, false);
  assert.equal(getStationDetailLayout({ width: 840, height: 768 }).split, true);
  assert.equal(getStationDetailLayout({ width: 1024, height: 768 }).informationWidth, 512);
  assert.equal(getStationDetailLayout({ width: 840, height: 768, fontScale: 1.3 }).split, false);
});

test('short landscape hero leaves room for content while the phone baseline remains unchanged', () => {
  assert.equal(getStationDetailLayout({ width: 390, height: 844 }).galleryHeight, 260);
  assert.equal(getStationDetailLayout({ width: 960, height: 480 }).galleryHeight, 160);
  assert.equal(getStationDetailLayout({ width: 740, height: 390 }).galleryHeight, 160);
  assert.equal(getStationDetailLayout({ width: 1280, height: 900 }).galleryHeight, 260);
});

test('resize round trip returns the same geometry and cannot consume more width than available', () => {
  const before = getDiscoveryPaneLayout({ width: 848, height: 480 });
  getDiscoveryPaneLayout({ width: 390, height: 844 });
  assert.deepEqual(getDiscoveryPaneLayout({ width: 848, height: 480 }), before);
  assert.equal(before.panelWidth + before.mapWidth, 848);
});
