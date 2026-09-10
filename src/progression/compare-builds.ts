import type {
  MetricDelta,
  ProgressionBuild,
  ProgressionChange,
} from "./types";

export function buildSignature(
  build: Pick<ProgressionBuild, "attachmentIds">,
): string {
  return [...build.attachmentIds].sort().join("|");
}

export function sameConfiguration(
  a: Pick<ProgressionBuild, "attachmentIds">,
  b: Pick<ProgressionBuild, "attachmentIds">,
): boolean {
  return buildSignature(a) === buildSignature(b);
}

export function compareAttachments(
  before: Pick<ProgressionBuild, "attachmentIds">,
  after: Pick<ProgressionBuild, "attachmentIds">,
): ProgressionChange {
  const beforeSet = new Set(before.attachmentIds);
  const afterSet = new Set(after.attachmentIds);

  return {
    removedAttachmentIds: [...beforeSet]
      .filter((id) => !afterSet.has(id))
      .sort(),
    addedAttachmentIds: [...afterSet]
      .filter((id) => !beforeSet.has(id))
      .sort(),
  };
}

export function compareMetrics(
  before: Readonly<Record<string, number | null | undefined>>,
  after: Readonly<Record<string, number | null | undefined>>,
): MetricDelta[] {
  const ids = [...new Set([
    ...Object.keys(before),
    ...Object.keys(after),
  ])].sort();

  return ids.map((metricId) => {
    const a = before[metricId];
    const b = after[metricId];

    const beforeValue =
      a === undefined || a === null || !Number.isFinite(a)
        ? null
        : a;

    const afterValue =
      b === undefined || b === null || !Number.isFinite(b)
        ? null
        : b;

    return {
      metricId,
      before: beforeValue,
      after: afterValue,
      delta:
        beforeValue === null || afterValue === null
          ? null
          : afterValue - beforeValue,
    };
  });
}
