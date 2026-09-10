import type { DamagePoint } from "./types";

const EPSILON = 1e-9;

export function validateDamageCurve(
  curve: readonly DamagePoint[],
): string | null {
  if (!curve.length) return "damage curve vazia";

  for (let i = 0; i < curve.length; i += 1) {
    const point = curve[i];

    if (!Number.isFinite(point.rangeM) || point.rangeM < 0) {
      return `range inválido no índice ${i}`;
    }

    if (!Number.isFinite(point.damage) || point.damage < 0) {
      return `damage inválido no índice ${i}`;
    }

    if (i > 0 && point.rangeM < curve[i - 1].rangeM) {
      return "damage curve fora de ordem";
    }
  }

  return null;
}

/**
 * Preserva ranges repetidos.
 *
 * No range exato repetido, o primeiro ponto daquele range (outgoing value)
 * vence. Imediatamente depois, o último ponto repetido passa a ser a origem
 * da interpolação seguinte.
 */
export function damageAtDistance(
  curve: readonly DamagePoint[],
  distanceM: number,
): number | null {
  if (!Number.isFinite(distanceM) || distanceM < 0) return null;
  if (validateDamageCurve(curve)) return null;

  if (distanceM <= curve[0].rangeM) return curve[0].damage;

  for (let i = 1; i < curve.length; i += 1) {
    const current = curve[i];

    if (distanceM === current.rangeM) {
      let firstAtRange = i;
      while (
        firstAtRange > 0 &&
        curve[firstAtRange - 1].rangeM === current.rangeM
      ) {
        firstAtRange -= 1;
      }
      return curve[firstAtRange].damage;
    }

    if (distanceM < current.rangeM) {
      let previousIndex = i - 1;

      while (
        previousIndex + 1 < i &&
        curve[previousIndex + 1].rangeM === curve[previousIndex].rangeM
      ) {
        previousIndex += 1;
      }

      const previous = curve[previousIndex];

      if (current.rangeM === previous.rangeM) continue;

      const t =
        (distanceM - previous.rangeM) /
        (current.rangeM - previous.rangeM);

      return (
        previous.damage +
        (current.damage - previous.damage) * t
      );
    }
  }

  return curve[curve.length - 1].damage;
}

export function shotsToKill(
  damagePerShot: number,
  health = 100,
  bodyMultiplier = 1,
): number | null {
  if (
    !Number.isFinite(damagePerShot) ||
    !Number.isFinite(health) ||
    !Number.isFinite(bodyMultiplier) ||
    damagePerShot <= 0 ||
    health <= 0 ||
    bodyMultiplier <= 0
  ) {
    return null;
  }

  return Math.ceil(
    (health - EPSILON) / (damagePerShot * bodyMultiplier),
  );
}

export function minimumProjectileHitsToKill(
  damagePerProjectile: number,
  health = 100,
  bodyMultiplier = 1,
): number | null {
  return shotsToKill(damagePerProjectile, health, bodyMultiplier);
}
