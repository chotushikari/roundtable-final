'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { isUsableFaceBox, type CameraPresenceStatus } from '@/lib/camera-presence';

const WASM_ROOT = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm';
const FACE_MODEL = 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite';
const DETECTION_INTERVAL_MS = 250;
const REQUIRED_PRESENT_SAMPLES = 2;
const REQUIRED_MISSING_SAMPLES = 3;

type Detector = {
  detectForVideo: (video: HTMLVideoElement, timestamp: number) => { detections: Array<{ boundingBox?: { originX: number; originY: number; width: number; height: number } }> };
  close: () => void;
};

export type CameraPresenceController = {
  status: CameraPresenceStatus;
  stream: MediaStream | null;
  error: string | null;
  start: () => Promise<void>;
  stop: () => void;
};

export function useCameraPresence(enabled: boolean): CameraPresenceController {
  const [status, setStatus] = useState<CameraPresenceStatus>('idle');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<Detector | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const intervalRef = useRef<number | null>(null);
  const runRef = useRef(0);

  const stop = useCallback(() => {
    runRef.current += 1;
    if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
    intervalRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setStream(null);
    detectorRef.current?.close();
    detectorRef.current = null;
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
    videoRef.current = null;
    setStatus('idle');
  }, []);

  const start = useCallback(async () => {
    if (!enabled) return;
    stop();
    const run = runRef.current;
    setStatus('requesting');
    setError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('This browser does not support camera access.');
      const nextStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 15, max: 24 } },
        audio: false,
      });
      if (run !== runRef.current) {
        nextStream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = nextStream;
      setStream(nextStream);
      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      video.srcObject = nextStream;
      videoRef.current = video;
      await video.play();
      setStatus('checking');

      const { FaceDetector, FilesetResolver } = await import('@mediapipe/tasks-vision');
      const fileset = await FilesetResolver.forVisionTasks(WASM_ROOT);
      let detector: Detector;
      try {
        detector = await FaceDetector.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: FACE_MODEL, delegate: 'GPU' },
          runningMode: 'VIDEO',
          minDetectionConfidence: 0.65,
        }) as Detector;
      } catch {
        detector = await FaceDetector.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: FACE_MODEL, delegate: 'CPU' },
          runningMode: 'VIDEO',
          minDetectionConfidence: 0.65,
        }) as Detector;
      }
      if (run !== runRef.current) {
        detector.close();
        return;
      }
      detectorRef.current = detector;

      let presentSamples = 0;
      let missingSamples = 0;
      let detectionRunning = false;
      const detect = () => {
        if (detectionRunning || run !== runRef.current) return;
        if (document.hidden || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
          presentSamples = 0;
          missingSamples += 1;
          if (missingSamples >= REQUIRED_MISSING_SAMPLES) setStatus('missing');
          return;
        }
        detectionRunning = true;
        try {
          const result = detector.detectForVideo(video, performance.now());
          const facePresent = result.detections.some((detection) => isUsableFaceBox(detection.boundingBox, video.videoWidth, video.videoHeight));
          if (facePresent) {
            presentSamples += 1;
            missingSamples = 0;
            if (presentSamples >= REQUIRED_PRESENT_SAMPLES) setStatus('present');
          } else {
            presentSamples = 0;
            missingSamples += 1;
            if (missingSamples >= REQUIRED_MISSING_SAMPLES) setStatus('missing');
          }
        } catch {
          presentSamples = 0;
          missingSamples += 1;
          if (missingSamples >= REQUIRED_MISSING_SAMPLES) setStatus('missing');
        } finally {
          detectionRunning = false;
        }
      };
      detect();
      intervalRef.current = window.setInterval(detect, DETECTION_INTERVAL_MS);
      const cameraTrack = nextStream.getVideoTracks()[0];
      cameraTrack?.addEventListener('ended', () => {
        if (run !== runRef.current) return;
        setError('Camera access ended. Re-enable it to continue.');
        setStatus('unavailable');
      }, { once: true });
    } catch (cameraError) {
      if (run !== runRef.current) return;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setStream(null);
      setStatus('unavailable');
      const denied = cameraError instanceof DOMException && cameraError.name === 'NotAllowedError';
      setError(denied
        ? 'Camera permission was denied. Allow camera access in your browser, then try again.'
        : cameraError instanceof Error ? cameraError.message : 'The camera could not be started.');
    }
  }, [enabled, stop]);

  useEffect(() => () => stop(), [stop]);
  useEffect(() => {
    if (!enabled) stop();
  }, [enabled, stop]);

  return { status, stream, error, start, stop };
}
