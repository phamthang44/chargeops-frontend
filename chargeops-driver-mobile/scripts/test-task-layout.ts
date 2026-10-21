import assert from 'node:assert/strict';
import test from 'node:test';
import { getTaskLayout } from '../src/utils/taskLayout.ts';

test('phone and portrait tablet retain a readable single column', () => {
  for (const width of [360, 390, 768, 959]) {
    assert.equal(getTaskLayout(width, 844).split, false);
    assert.equal(getTaskLayout(width, 844).contentMaxWidth, 720);
  }
});
test('landscape tasks use columns while actions remain bounded', () => {
  for (const [width, height] of [[960, 480], [1024, 768], [1280, 800]]) {
    assert.deepEqual(getTaskLayout(width, height), { split: true, contentMaxWidth: 1120, footerMaxWidth: 720 });
  }
});
test('short windows and large text fall back without changing task state', () => {
  assert.equal(getTaskLayout(1024, 359).split, false);
  assert.equal(getTaskLayout(1024, 768, 1.3).split, false);
  assert.equal(getTaskLayout(1280, 800, 2).split, false);
  assert.equal(getTaskLayout(960, 360).split, true);
});
