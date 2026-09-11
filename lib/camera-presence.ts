export const CAMERA_ABSENCE_PAUSE_MS = 10_000;
export const CAMERA_ABSENCE_END_MS = 60_000;

export type CameraPresenceStatus =
  | 'idle'
  | 'requesting'
  | 'checking'
  | 'present'
  | 'missing'
  | 'unavailable';

type FaceBox = {
  originX: number;
  originY: number;
  width: number;
  height: number;
};

/**
 * Reject tiny or almost entirely off-screen detections. This is presence only:
 * no landmarks, embeddings, identity, expression, or demographic inference.
 */
export function isUsableFaceBox(box: FaceBox | undefined, videoWidth: number, videoHeight: number): boolean {
  if (!box || videoWidth <= 0 || videoHeight <= 0) return false;
  const widthRatio = box.width / videoWidth;
  const heightRatio = box.height / videoHeight;
  const centerX = (box.originX + box.width / 2) / videoWidth;
  const centerY = (box.originY + box.height / 2) / videoHeight;
  return widthRatio >= 0.12
    && heightRatio >= 0.12
    && centerX >= 0.08
    && centerX <= 0.92
    && centerY >= 0.08
    && centerY <= 0.92;
}
