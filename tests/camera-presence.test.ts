import assert from 'node:assert/strict';
import test from 'node:test';
import { CAMERA_ABSENCE_END_MS, CAMERA_ABSENCE_PAUSE_MS, isUsableFaceBox } from '../lib/camera-presence';

test('camera absence thresholds preserve a recovery window', () => {
  assert.equal(CAMERA_ABSENCE_PAUSE_MS, 10_000);
  assert.equal(CAMERA_ABSENCE_END_MS, 60_000);
  assert.ok(CAMERA_ABSENCE_END_MS > CAMERA_ABSENCE_PAUSE_MS);
});

test('accepts a clearly framed face and rejects tiny or edge detections', () => {
  assert.equal(isUsableFaceBox({ originX: 180, originY: 90, width: 240, height: 260 }, 640, 480), true);
  assert.equal(isUsableFaceBox({ originX: 290, originY: 210, width: 40, height: 40 }, 640, 480), false);
  assert.equal(isUsableFaceBox({ originX: -100, originY: 90, width: 140, height: 220 }, 640, 480), false);
});
