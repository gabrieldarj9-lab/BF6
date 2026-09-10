import type { CandidateConfiguration } from "../candidate/types";
import { validateCompleteCandidate } from "../candidate/restrictions";
import { deriveMetric } from "../metrics/derive-metrics";
import type { DerivedMetricContext, MetricResult } from "../metrics/types";
import { resolveBuildState } from "../resolver/resolve-build";
import type { EngineWeaponDefinition } from "./types";
import { buildResolvedMetricInput } from "./materialize";

export interface QueryBuildMetricsRequest {
  weapon: EngineWeaponDefinition;
  attachmentIds?: readonly string[];
  metricIds: readonly string[];
  metricContext?: DerivedMetricContext;
}

export interface QueryBuildMetricsResult {
  weaponId: string;
  attachmentIds: readonly string[];
  totalCost: number;
  resolvedTechnical: Readonly<Record<string, number | null>>;
  resolverDiagnostics: readonly {
    metricId: string;
    code: string;
    message: string;
  }[];
  metrics: Readonly<Record<string, MetricResult>>;
}

function makeCandidate(
  weapon: EngineWeaponDefinition,
  attachmentIds: readonly string[],
): CandidateConfiguration {
  const byId = new Map(weapon.attachments.map((attachment) => [attachment.id, attachment]));
  const occupiedSlots: Record<string, string[]> = Object.fromEntries(
    weapon.slots.map((slot) => [slot.id, []]),
  );

  let totalCost = 0;
  for (const id of attachmentIds) {
    const attachment = byId.get(id);
    if (!attachment) {
      throw new Error(`Unknown attachment ${id}.`);
    }
    totalCost += attachment.cost;
    (occupiedSlots[attachment.slotId] ??= []).push(id);
  }

  return {
    id: `${weapon.id}__metrics__${[...attachmentIds].sort().join("+") || "base"}`,
    weaponId: weapon.id,
    attachmentIds: [...attachmentIds],
    totalCost,
    occupiedSlots,
  };
}

export function queryBuildMetrics(
  request: QueryBuildMetricsRequest,
): QueryBuildMetricsResult {
  const attachmentIds = request.attachmentIds ?? [];
  if (new Set(attachmentIds).size !== attachmentIds.length) {
    throw new Error("attachmentIds contains duplicates.");
  }

  const attachmentById = new Map(weaponAttachments(request.weapon));
  const candidate = makeCandidate(request.weapon, attachmentIds);

  const validation = validateCompleteCandidate(candidate, {
    weaponId: request.weapon.id,
    budget: request.weapon.budget,
    slots: request.weapon.slots,
    attachmentById,
    restrictions: request.weapon.restrictions ?? [],
  });

  if (!validation.valid) {
    throw new Error(`Invalid build configuration: ${validation.reason ?? "UNKNOWN"}.`);
  }

  const resolved = resolveBuildState(
    {
      id: request.weapon.id,
      baseTechnical: request.weapon.base.technical,
      resolutionRules: request.weapon.base.resolutionRules,
    },
    request.weapon.attachments.map((attachment) => ({
      id: attachment.id,
      effects: attachment.effects,
    })),
    attachmentIds,
  );

  const selected = attachmentIds.map((id) => {
    const attachment = request.weapon.attachments.find((item) => item.id === id);
    if (!attachment) throw new Error(`Unknown attachment ${id}.`);
    return attachment;
  });

  const metricInput = buildResolvedMetricInput(
    request.weapon,
    selected,
    resolved.technical,
  );

  const metrics: Record<string, MetricResult> = {};
  for (const metricId of request.metricIds) {
    metrics[metricId] = deriveMetric(metricInput, metricId, request.metricContext ?? {});
  }

  return {
    weaponId: request.weapon.id,
    attachmentIds: [...attachmentIds],
    totalCost: candidate.totalCost,
    resolvedTechnical: resolved.technical,
    resolverDiagnostics: resolved.diagnostics,
    metrics,
  };
}

function weaponAttachments(
  weapon: EngineWeaponDefinition,
): [string, {
  id: string;
  slotId: string;
  cost: number;
  compatibleWeaponIds?: readonly string[];
  exclusiveGroupIds?: readonly string[];
}][] {
  return weapon.attachments.map((attachment) => [
    attachment.id,
    {
      id: attachment.id,
      slotId: attachment.slotId,
      cost: attachment.cost,
      compatibleWeaponIds: attachment.compatibleWeaponIds,
      exclusiveGroupIds: attachment.exclusiveGroupIds,
    },
  ]);
}
