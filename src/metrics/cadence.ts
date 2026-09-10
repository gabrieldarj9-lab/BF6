import type { FireCadence } from "./types";

function validPositive(value: number | undefined): value is number {
  return value !== undefined && Number.isFinite(value) && value > 0;
}

export function intervalAfterShotMs(
  cadence: FireCadence,
  shotNumberOneBased: number,
): number | null {
  if (!Number.isInteger(shotNumberOneBased) || shotNumberOneBased < 1) {
    return null;
  }

  if (cadence.kind === "STANDARD") {
    if (!validPositive(cadence.rpm)) return null;
    return 60000 / cadence.rpm;
  }

  if (cadence.kind === "CYCLE") {
    return validPositive(cadence.intervalMs)
      ? cadence.intervalMs
      : null;
  }

  if (cadence.kind === "PUMP") {
    return validPositive(cadence.cycleMs)
      ? cadence.cycleMs
      : null;
  }

  if (
    !Number.isInteger(cadence.burstRounds) ||
    cadence.burstRounds <= 0 ||
    !validPositive(cadence.burstRpm) ||
    !validPositive(cadence.burstsPerMinute)
  ) {
    return null;
  }

  const normal = 60000 / cadence.burstRpm;
  const positionInBurst = (shotNumberOneBased - 1) % cadence.burstRounds;

  if (positionInBurst < cadence.burstRounds - 1) {
    return normal;
  }

  return Math.max(
    normal,
    60000 / cadence.burstsPerMinute -
      (cadence.burstRounds - 1) * normal,
  );
}

export function firingTimeForShotsMs(
  cadence: FireCadence,
  shotsToKill: number,
): number | null {
  if (!Number.isInteger(shotsToKill) || shotsToKill <= 0) {
    return null;
  }

  if (shotsToKill === 1) return 0;

  let total = 0;

  for (let shot = 1; shot < shotsToKill; shot += 1) {
    const interval = intervalAfterShotMs(cadence, shot);
    if (interval === null) return null;
    total += interval;
  }

  return Math.round(total);
}

export function firstMechanicalFollowUpMs(
  cadence: FireCadence,
): number | null {
  return intervalAfterShotMs(cadence, 1);
}
