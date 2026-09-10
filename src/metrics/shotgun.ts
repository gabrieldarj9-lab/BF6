import type {
  ResolvedBuildMetricInput,
  ShotgunLethalitySample,
} from "./types";
import {
  damageAtDistance,
  minimumProjectileHitsToKill,
  shotsToKill,
} from "./damage";

export function shotgunLethalityAtDistance(
  input: ResolvedBuildMetricInput,
  distanceM: number,
): ShotgunLethalitySample | null {
  const curve = input.damageCurve;
  const count = input.projectileCount ?? 1;
  const health = input.healthBaseline ?? 100;
  const bodyMultiplier = input.bodyMultiplier ?? 1;

  if (!curve || !curve.length || !Number.isInteger(count) || count <= 0) {
    return null;
  }

  const damagePerProjectile = damageAtDistance(curve, distanceM);
  if (damagePerProjectile === null) return null;

  const minimumHits = minimumProjectileHitsToKill(
    damagePerProjectile,
    health,
    bodyMultiplier,
  );

  const theoreticalDamagePerShot =
    damagePerProjectile * count * bodyMultiplier;

  const theoreticalShots = shotsToKill(
    theoreticalDamagePerShot,
    health,
    1,
  );

  const oneShotPossible =
    minimumHits !== null &&
    minimumHits <= count;

  const oneShotMargin =
    minimumHits === null
      ? null
      : count - minimumHits;

  return {
    distanceM,
    damagePerProjectile,
    projectileCount: count,
    theoreticalDamagePerShot,
    minimumProjectileHitsToKill: minimumHits,
    theoreticalShotsToKill: theoreticalShots,
    oneShotPossible,
    oneShotMargin,
  };
}

export function farthestSampledOneShotDistance(
  input: ResolvedBuildMetricInput,
  samplesM: readonly number[],
): number | null {
  let farthest: number | null = null;

  for (const distanceM of samplesM) {
    const sample = shotgunLethalityAtDistance(input, distanceM);
    if (sample?.oneShotPossible) {
      farthest = Math.max(farthest ?? 0, distanceM);
    }
  }

  return farthest;
}
