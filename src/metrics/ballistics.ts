/**
 * Tempo de voo no modelo 1D com drag quadrático:
 *
 * dv/dt = -k v²
 *
 * T(x) = expm1(kx)/(k v0), k > 0
 * T(x) = x/v0, k = 0
 */
export function timeToImpactMs(
  distanceM: number,
  initialVelocityMps: number,
  dragPerMeter = 0,
): number | null {
  if (
    !Number.isFinite(distanceM) ||
    distanceM < 0 ||
    !Number.isFinite(initialVelocityMps) ||
    initialVelocityMps <= 0 ||
    !Number.isFinite(dragPerMeter) ||
    dragPerMeter < 0
  ) {
    return null;
  }

  if (distanceM === 0) return 0;

  const seconds =
    dragPerMeter > 0
      ? Math.expm1(dragPerMeter * distanceM) /
        (dragPerMeter * initialVelocityMps)
      : distanceM / initialVelocityMps;

  return seconds * 1000;
}
