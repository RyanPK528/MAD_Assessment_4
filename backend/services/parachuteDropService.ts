export const GRAVITY = 9.8;

export interface ParachutePhysicsResult {
  impactSpeedMs: number | null;
  accelerationMs2: number | null;
  netForceN: number | null;
  dragForceN: number | null;
  gForce: number | null;
}

export function computeAverageVelocity(dropHeightM: number, fallTimeSec: number): number {
  if (fallTimeSec <= 0) return 0;
  return (2 * dropHeightM) / fallTimeSec;
}

export function computeAcceleration(dropHeightM: number, fallTimeSec: number): number {
  if (fallTimeSec <= 0) return 0;
  return (2 * dropHeightM) / (fallTimeSec * fallTimeSec);
}

export function computeParachutePhysics(
  dropHeightM: number,
  toyMassKg: number,
  fallTimeSec: number | null,
  contactTimeSec: number | null,
  hasBounce = false,
  reboundSpeedMs: number | null = null,
): ParachutePhysicsResult {
  if (!fallTimeSec || fallTimeSec <= 0) {
    return {
      impactSpeedMs: null,
      accelerationMs2: null,
      netForceN: null,
      dragForceN: null,
      gForce: null,
    };
  }

  const impactSpeedMs = computeAverageVelocity(dropHeightM, fallTimeSec);
  const accelerationMs2 = computeAcceleration(dropHeightM, fallTimeSec);
  const netForceN = toyMassKg * accelerationMs2;
  const weight = toyMassKg * GRAVITY;
  const dragForceN = Math.max(0, weight - netForceN);

  let gForce: number | null = null;
  if (contactTimeSec && contactTimeSec > 0) {
    if (hasBounce && reboundSpeedMs !== null) {
      gForce = (impactSpeedMs + reboundSpeedMs) / contactTimeSec / GRAVITY;
    } else {
      gForce = impactSpeedMs / contactTimeSec / GRAVITY;
    }
  }

  return {
    impactSpeedMs: Math.round(impactSpeedMs * 100) / 100,
    accelerationMs2: Math.round(accelerationMs2 * 100) / 100,
    netForceN: Math.round(netForceN * 100) / 100,
    dragForceN: Math.round(dragForceN * 100) / 100,
    gForce: gForce !== null ? Math.round(gForce * 100) / 100 : null,
  };
}

export function getGForceRiskLabel(gForce: number): string {
  if (gForce <= 5) return '1–5 g: No injury risk';
  if (gForce <= 10) return '5–10 g: Possible bruising';
  if (gForce <= 30) return '10–30 g: Serious injury possible';
  if (gForce <= 50) return '30–50 g: High injury risk';
  return '50+ g: Life-threatening';
}
