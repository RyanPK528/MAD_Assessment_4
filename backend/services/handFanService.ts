export type FanMaterial = 'paper' | 'cardboard';

export const STIFFNESS_PRESETS: Record<FanMaterial, number> = {
  paper: 0.05,
  cardboard: 0.5,
};

export const MATERIAL_NOTES: Record<FanMaterial, string> = {
  paper: 'Thin printer paper — bends very easily (k ≈ 0.05 N/rad)',
  cardboard: 'Thin cardboard — much harder to bend (k ≈ 0.5 N/rad)',
};

export function degreesToRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function computeEstimatedForce(stiffnessK: number, bendAngleDeg: number): number {
  return stiffnessK * degreesToRadians(bendAngleDeg);
}

export function rankDesignsByBend<T extends { bendAngleDeg: number; estimatedForceN: number }>(designs: T[]): T[] {
  return [...designs].sort((a, b) => b.bendAngleDeg - a.bendAngleDeg);
}
