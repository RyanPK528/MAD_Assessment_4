/**
 * Pure motion-analysis helpers (no React Native dependencies).
 */

import { DELTA_TO_MM_SCALE } from '../services/humanPerformanceTypes';

export function computeMagnitude(x: number, y: number, z: number): number {
  return Math.sqrt(x * x + y * y + z * z);
}

export function magnitudeDelta(current: number, previous: number): number {
  return Math.abs(current - previous);
}

export function smoothSignal(values: number[]): number[] {
  if (values.length < 3) {
    return [...values];
  }

  const smoothed: number[] = [];
  for (let i = 0; i < values.length; i += 1) {
    const prev = values[i - 1] ?? values[i];
    const current = values[i];
    const next = values[i + 1] ?? values[i];
    smoothed.push((prev + current + next) / 3);
  }
  return smoothed;
}

export function deltaToMillimeters(delta: number): number {
  return Math.round(delta * DELTA_TO_MM_SCALE * 10) / 10;
}

export function formatRecordingTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export function formatOutcome(durationSec: number, largestMovementMm: number): string {
  return `${largestMovementMm} mm in ${durationSec} s`;
}

export function clampSmoothness(value: number): number {
  return Math.max(0, Math.min(100, value));
}

export function decreaseSmoothness(current: number, delta: number, factor: number): number {
  return clampSmoothness(current - delta * factor);
}
