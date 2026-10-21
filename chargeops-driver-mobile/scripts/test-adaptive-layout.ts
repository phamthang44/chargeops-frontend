import assert from 'node:assert/strict';
import test from 'node:test';

import { getAdaptiveLayout } from '../src/utils/adaptiveLayout.ts';

test('width boundaries use available logical width', () => {
  for (const [width, expected] of [[599, 'compact'], [600, 'medium'], [839, 'medium'], [840, 'expanded']] as const) {
    assert.equal(getAdaptiveLayout({ width, height: 768 }).widthClass, expected);
  }
  assert.equal(getAdaptiveLayout({ width: 840, height: 768, insets: { left: 1, right: 0, top: 0, bottom: 0 } }).usesNavigationRail, false);
});

test('phone, portrait tablet and expanded tablet select consistent navigation', () => {
  assert.equal(getAdaptiveLayout({ width: 390, height: 844 }).usesNavigationRail, false);
  assert.equal(getAdaptiveLayout({ width: 768, height: 1024 }).usesNavigationRail, false);
  assert.equal(getAdaptiveLayout({ width: 1024, height: 768 }).usesNavigationRail, true);
  assert.equal(getAdaptiveLayout({ width: 960, height: 480 }).usesNavigationRail, true);
});

test('short height is independent of width and respects vertical safe areas', () => {
  assert.equal(getAdaptiveLayout({ width: 1024, height: 481 }).isShortHeight, false);
  assert.equal(getAdaptiveLayout({ width: 390, height: 480 }).isShortHeight, true);
  assert.equal(getAdaptiveLayout({ width: 1024, height: 520, insets: { left: 0, right: 0, top: 24, bottom: 16 } }).isShortHeight, true);
});

test('very short or large-text windows fall back to bottom navigation', () => {
  assert.equal(getAdaptiveLayout({ width: 1024, height: 359 }).usesNavigationRail, false);
  assert.equal(getAdaptiveLayout({ width: 1024, height: 360 }).usesNavigationRail, true);
  assert.equal(getAdaptiveLayout({ width: 1024, height: 768, fontScale: 1.3 }).usesNavigationRail, true);
  assert.equal(getAdaptiveLayout({ width: 1024, height: 768, fontScale: 1.31 }).usesNavigationRail, false);
  assert.equal(getAdaptiveLayout({ width: 1024, height: 768, fontScale: 1.5 }).navigationRailWidth, 0);
});

test('rail accounts for font size and left safe area without consuming content twice', () => {
  const normal = getAdaptiveLayout({ width: 1024, height: 768 });
  const scaled = getAdaptiveLayout({ width: 1024, height: 768, fontScale: 1.3, insets: { left: 24, right: 16, top: 0, bottom: 0 } });
  assert.equal(normal.navigationRailWidth, 112);
  assert.equal(normal.tabContentWidth, 912);
  assert.equal(scaled.navigationRailWidth, 170);
  assert.equal(scaled.tabContentWidth + scaled.navigationRailWidth + 16, 1024);
});

test('occluded windows never produce negative content dimensions', () => {
  const layout = getAdaptiveLayout({ width: 20, height: 20, insets: { left: 20, right: 20, top: 20, bottom: 20 } });
  assert.equal(layout.availableWidth, 0);
  assert.equal(layout.availableHeight, 0);
  assert.equal(layout.tabContentWidth, 0);
  assert.equal(layout.usesNavigationRail, false);
});
