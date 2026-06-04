export interface StructureDesignMetrics {
  maxDisplacementCm: number;
  maxRotationDeg: number;
}

const GRAVITY = 9.8;

export function aggregateDisplacement(accelMag: number, dtSec: number): number {
  const displacementM = Math.max(0, (accelMag - GRAVITY) * dtSec * dtSec * 50);
  return displacementM * 100;
}

export function aggregateRotation(gyroMag: number, dtSec: number): number {
  return Math.abs(gyroMag) * dtSec * (180 / Math.PI);
}

export function rankStructuresByStability<
  T extends StructureDesignMetrics & { label: string },
>(designs: T[]): T[] {
  return [...designs].sort(
    (a, b) =>
      a.maxDisplacementCm + a.maxRotationDeg - (b.maxDisplacementCm + b.maxRotationDeg),
  );
}

export function scoreStructure(metrics: StructureDesignMetrics): number {
  return metrics.maxDisplacementCm + metrics.maxRotationDeg;
}
