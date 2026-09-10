import type {
  FireCadence,
  SustainedOutputResult,
} from "./types";
import { intervalAfterShotMs } from "./cadence";

export function sustainedOutput(
  windowMs: number,
  damagePerShot: number,
  cadence: FireCadence,
  magazineCapacity: number,
  reloadMs: number,
): SustainedOutputResult | null {
  if (
    !Number.isFinite(windowMs) ||
    windowMs <= 0 ||
    !Number.isFinite(damagePerShot) ||
    damagePerShot < 0 ||
    !Number.isInteger(magazineCapacity) ||
    magazineCapacity <= 0 ||
    !Number.isFinite(reloadMs) ||
    reloadMs < 0
  ) {
    return null;
  }

  let timeMs = 0;
  let shotsFired = 0;
  let reloads = 0;
  let roundsRemaining = magazineCapacity;
  let shotNumberInCadence = 1;
  let damage = 0;
  let lastShotMs = 0;

  // Primeiro disparo em t=0.
  while (timeMs <= windowMs) {
    damage += damagePerShot;
    shotsFired += 1;
    roundsRemaining -= 1;
    lastShotMs = timeMs;

    if (roundsRemaining <= 0) {
      timeMs += reloadMs;
      reloads += 1;
      roundsRemaining = magazineCapacity;
      shotNumberInCadence = 1;
      continue;
    }

    const interval = intervalAfterShotMs(
      cadence,
      shotNumberInCadence,
    );

    if (interval === null) return null;

    timeMs += interval;
    shotNumberInCadence += 1;
  }

  return {
    damage,
    shotsFired,
    reloads,
    elapsedLastShotMs: lastShotMs,
  };
}
