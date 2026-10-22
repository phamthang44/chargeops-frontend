import assert from 'node:assert/strict';
import test from 'node:test';
import { getOverlayLayout, getAvatarPreviewSize, getPortraitGuideSize } from '../src/utils/overlayLayout.ts';

test('sheet versus dialog uses available width and height together', () => {
  assert.equal(getOverlayLayout(599, 844).isDialog, false);
  assert.equal(getOverlayLayout(600, 360).isDialog, true);
  assert.equal(getOverlayLayout(960, 359).isDialog, false);
  assert.equal(getOverlayLayout(960, 480).maxHeight, 448);
});
test('avatar preview and portrait guide fit short landscape and narrow phone', () => {
  for (const [width, height] of [[390, 844], [960, 480], [768, 1024], [320, 360]]) {
    const avatar = getAvatarPreviewSize(width, height);
    const guide = getPortraitGuideSize(width, height);
    assert.ok(avatar <= width - 48 && avatar <= height - 240);
    assert.ok(guide.width <= width - 48 && guide.height <= height - 220);
    assert.ok(Math.abs(guide.width / guide.height - 0.8) < 0.0001);
  }
});
test('fully occluded geometry cannot become negative', () => {
  assert.equal(getOverlayLayout(0, 0).maxHeight, 0);
  assert.equal(getAvatarPreviewSize(0, 0), 0);
  assert.deepEqual(getPortraitGuideSize(0, 0), { width: 0, height: 0 });
});
