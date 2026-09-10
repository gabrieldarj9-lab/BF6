import type { HttpMetricsRequest, HttpProgressionRequest, ValidationIssue } from "./types";

const CATEGORY_IDS = new Set([
  "assault-rifles", "carbines", "smt", "ml", "dmr", "sniper-rifles", "shotguns", "secondary",
]);
const PRIORITY_IDS = new Set([
  "recoil", "accuracy", "ads-speed", "mobility", "hipfire", "short-range", "range", "sustained-fire",
]);
const UNLOCK_TYPES = new Set(["DEFAULT", "MASTERY", "SEASONAL", "UNKNOWN"]);
const EFFECT_OPERATIONS = new Set(["ADD", "MULTIPLY", "SET", "TIER_MOD", "TIER_SHIFT"]);
const NORMALIZATION_MODES = new Set(["FIXED_RANGE", "PASSTHROUGH_0_100"]);

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function finite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function issue(issues: ValidationIssue[], path: string, code: string, message: string) {
  issues.push({ path, code, message });
}

function requireObject(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
): Record<string, unknown> | null {
  if (!isObject(value)) {
    issue(issues, path, "TYPE", "must be an object");
    return null;
  }
  return value;
}

function validateWeapon(value: unknown, path: string, issues: ValidationIssue[]) {
  const weapon = requireObject(value, path, issues);
  if (!weapon) return;

  if (typeof weapon.id !== "string" || !weapon.id.trim()) {
    issue(issues, `${path}.id`, "REQUIRED", "must be a non-empty string");
  }
  if (typeof weapon.categoryId !== "string" || !CATEGORY_IDS.has(weapon.categoryId)) {
    issue(issues, `${path}.categoryId`, "ENUM", "must be a supported weapon category");
  }
  if (!finite(weapon.budget) || weapon.budget < 0) {
    issue(issues, `${path}.budget`, "RANGE", "must be a finite number >= 0");
  }

  const slotIds = new Set<string>();
  if (!Array.isArray(weapon.slots)) {
    issue(issues, `${path}.slots`, "TYPE", "must be an array");
  } else {
    weapon.slots.forEach((slotValue, index) => {
      const slot = requireObject(slotValue, `${path}.slots[${index}]`, issues);
      if (!slot) return;
      if (typeof slot.id !== "string" || !slot.id.trim()) {
        issue(issues, `${path}.slots[${index}].id`, "REQUIRED", "must be a non-empty string");
      } else if (slotIds.has(slot.id)) {
        issue(issues, `${path}.slots[${index}].id`, "DUPLICATE", `duplicate slot id ${slot.id}`);
      } else {
        slotIds.add(slot.id);
      }
      if (!Number.isInteger(slot.maxEquipped) || (slot.maxEquipped as number) < 0) {
        issue(issues, `${path}.slots[${index}].maxEquipped`, "RANGE", "must be an integer >= 0");
      }
      if (slot.required !== undefined && typeof slot.required !== "boolean") {
        issue(issues, `${path}.slots[${index}].required`, "TYPE", "must be boolean when provided");
      }
    });
  }

  const attachmentIds = new Set<string>();
  if (!Array.isArray(weapon.attachments)) {
    issue(issues, `${path}.attachments`, "TYPE", "must be an array");
  } else {
    weapon.attachments.forEach((attachmentValue, index) => {
      const apath = `${path}.attachments[${index}]`;
      const attachment = requireObject(attachmentValue, apath, issues);
      if (!attachment) return;
      if (typeof attachment.id !== "string" || !attachment.id.trim()) {
        issue(issues, `${apath}.id`, "REQUIRED", "must be a non-empty string");
      } else if (attachmentIds.has(attachment.id)) {
        issue(issues, `${apath}.id`, "DUPLICATE", `duplicate attachment id ${attachment.id}`);
      } else {
        attachmentIds.add(attachment.id);
      }
      if (typeof attachment.slotId !== "string" || !attachment.slotId.trim()) {
        issue(issues, `${apath}.slotId`, "REQUIRED", "must be a non-empty string");
      } else if (slotIds.size && !slotIds.has(attachment.slotId)) {
        issue(issues, `${apath}.slotId`, "UNKNOWN_REFERENCE", `unknown slot ${attachment.slotId}`);
      }
      if (!finite(attachment.cost) || attachment.cost < 0) {
        issue(issues, `${apath}.cost`, "RANGE", "must be a finite number >= 0");
      }

      const unlock = requireObject(attachment.unlock, `${apath}.unlock`, issues);
      if (unlock) {
        if (typeof unlock.type !== "string" || !UNLOCK_TYPES.has(unlock.type)) {
          issue(issues, `${apath}.unlock.type`, "ENUM", "must be DEFAULT, MASTERY, SEASONAL or UNKNOWN");
        }
        if (unlock.type === "MASTERY" && (!Number.isInteger(unlock.level) || (unlock.level as number) < 0)) {
          issue(issues, `${apath}.unlock.level`, "RANGE", "must be an integer >= 0 for MASTERY unlocks");
        }
        if (typeof unlock.label !== "string") {
          issue(issues, `${apath}.unlock.label`, "TYPE", "must be a string");
        }
      }

      if (!Array.isArray(attachment.effects)) {
        issue(issues, `${apath}.effects`, "TYPE", "must be an array");
      } else {
        attachment.effects.forEach((effectValue, effectIndex) => {
          const epath = `${apath}.effects[${effectIndex}]`;
          const effect = requireObject(effectValue, epath, issues);
          if (!effect) return;
          if (typeof effect.metricId !== "string" || !effect.metricId.trim()) {
            issue(issues, `${epath}.metricId`, "REQUIRED", "must be a non-empty string");
          }
          if (typeof effect.operation !== "string" || !EFFECT_OPERATIONS.has(effect.operation)) {
            issue(issues, `${epath}.operation`, "ENUM", "unsupported effect operation");
          }
          if (!finite(effect.value)) {
            issue(issues, `${epath}.value`, "TYPE", "must be a finite number");
          }
        });
      }
    });
  }

  const base = requireObject(weapon.base, `${path}.base`, issues);
  if (base) {
    if (!isObject(base.technical)) {
      issue(issues, `${path}.base.technical`, "TYPE", "must be an object");
    } else {
      for (const [key, metricValue] of Object.entries(base.technical)) {
        if (metricValue !== null && metricValue !== undefined && !finite(metricValue)) {
          issue(issues, `${path}.base.technical.${key}`, "TYPE", "must be a finite number, null or omitted");
        }
      }
    }
  }
}

function validateProfile(value: unknown, path: string, issues: ValidationIssue[]) {
  const profile = requireObject(value, path, issues);
  if (!profile) return;
  if (typeof profile.id !== "string" || !profile.id.trim()) issue(issues, `${path}.id`, "REQUIRED", "must be a non-empty string");
  if (typeof profile.categoryId !== "string" || !CATEGORY_IDS.has(profile.categoryId)) issue(issues, `${path}.categoryId`, "ENUM", "must be a supported weapon category");
  if (typeof profile.priorityId !== "string" || !PRIORITY_IDS.has(profile.priorityId)) issue(issues, `${path}.priorityId`, "ENUM", "must be a supported priority");
  if (typeof profile.name !== "string") issue(issues, `${path}.name`, "TYPE", "must be a string");

  if (!Array.isArray(profile.primaryMetrics) || profile.primaryMetrics.length === 0) {
    issue(issues, `${path}.primaryMetrics`, "REQUIRED", "must be a non-empty array");
  } else {
    profile.primaryMetrics.forEach((metricValue, index) => {
      const metric = requireObject(metricValue, `${path}.primaryMetrics[${index}]`, issues);
      if (!metric) return;
      if (typeof metric.metricId !== "string" || !metric.metricId.trim()) issue(issues, `${path}.primaryMetrics[${index}].metricId`, "REQUIRED", "must be a non-empty string");
      if (!finite(metric.weight) || metric.weight <= 0) issue(issues, `${path}.primaryMetrics[${index}].weight`, "RANGE", "must be a finite number > 0");
    });
  }

  if (!Array.isArray(profile.protectedMetrics)) {
    issue(issues, `${path}.protectedMetrics`, "TYPE", "must be an array");
  }

  const defaults = requireObject(profile.defaults, `${path}.defaults`, issues);
  if (defaults) {
    for (const key of [
      "primaryEquivalenceThreshold", "minimumRelevantGain", "majorUpgradeThreshold", "softCollateralLossStart", "hardTotalCollateralLoss",
    ]) {
      if (!finite(defaults[key])) issue(issues, `${path}.defaults.${key}`, "TYPE", "must be a finite number");
    }
  }
}

function validateNormalization(value: unknown, path: string, issues: ValidationIssue[]) {
  const rules = requireObject(value, path, issues);
  if (!rules) return;
  for (const [key, ruleValue] of Object.entries(rules)) {
    const rpath = `${path}.${key}`;
    const rule = requireObject(ruleValue, rpath, issues);
    if (!rule) continue;
    if (typeof rule.metricId !== "string" || !rule.metricId.trim()) issue(issues, `${rpath}.metricId`, "REQUIRED", "must be a non-empty string");
    if (typeof rule.mode !== "string" || !NORMALIZATION_MODES.has(rule.mode)) issue(issues, `${rpath}.mode`, "ENUM", "must be FIXED_RANGE or PASSTHROUGH_0_100");
    if (rule.mode === "FIXED_RANGE") {
      if (!finite(rule.min)) issue(issues, `${rpath}.min`, "TYPE", "must be finite for FIXED_RANGE");
      if (!finite(rule.max)) issue(issues, `${rpath}.max`, "TYPE", "must be finite for FIXED_RANGE");
      if (finite(rule.min) && finite(rule.max) && rule.max <= rule.min) issue(issues, rpath, "RANGE", "max must be greater than min");
    }
  }
}

function validateStringArray(value: unknown, path: string, issues: ValidationIssue[], options: { nonEmpty?: boolean } = {}) {
  if (!Array.isArray(value)) {
    issue(issues, path, "TYPE", "must be an array");
    return;
  }
  if (options.nonEmpty && value.length === 0) issue(issues, path, "REQUIRED", "must be a non-empty array");
  const seen = new Set<string>();
  value.forEach((item, index) => {
    if (typeof item !== "string" || !item.trim()) issue(issues, `${path}[${index}]`, "TYPE", "must be a non-empty string");
    else if (seen.has(item)) issue(issues, `${path}[${index}]`, "DUPLICATE", `duplicate value ${item}`);
    else seen.add(item);
  });
}

export function validateProgressionRequest(value: unknown): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const root = requireObject(value, "$", issues);
  if (!root) return issues;

  validateWeapon(root.weapon, "$.weapon", issues);
  validateProfile(root.primaryProfile, "$.primaryProfile", issues);
  if (root.secondaryProfile !== undefined) validateProfile(root.secondaryProfile, "$.secondaryProfile", issues);
  validateNormalization(root.normalizationRules, "$.normalizationRules", issues);

  if (root.activeSeasonalAttachmentIds !== undefined) validateStringArray(root.activeSeasonalAttachmentIds, "$.activeSeasonalAttachmentIds", issues);
  if (root.maxSearchNodes !== undefined && (!Number.isInteger(root.maxSearchNodes) || (root.maxSearchNodes as number) <= 0)) {
    issue(issues, "$.maxSearchNodes", "RANGE", "must be an integer > 0");
  }
  if (root.candidateDominance !== undefined) issue(issues, "$.candidateDominance", "UNSUPPORTED_HTTP_FIELD", "candidateDominance contains executable callbacks and is not accepted over HTTP");
  if (root.evaluateStructuralMajor !== undefined) issue(issues, "$.evaluateStructuralMajor", "UNSUPPORTED_HTTP_FIELD", "evaluateStructuralMajor is not accepted over HTTP");

  if (isObject(root.weapon) && isObject(root.primaryProfile) && typeof root.weapon.categoryId === "string" && typeof root.primaryProfile.categoryId === "string" && root.weapon.categoryId !== root.primaryProfile.categoryId) {
    issue(issues, "$.primaryProfile.categoryId", "CATEGORY_MISMATCH", "must match weapon.categoryId");
  }
  return issues;
}

export function validateMetricsRequest(value: unknown): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const root = requireObject(value, "$", issues);
  if (!root) return issues;
  validateWeapon(root.weapon, "$.weapon", issues);
  if (root.attachmentIds === undefined) {
    // Base weapon is valid and intentional.
  } else {
    validateStringArray(root.attachmentIds, "$.attachmentIds", issues);
  }
  validateStringArray(root.metricIds, "$.metricIds", issues, { nonEmpty: true });

  if (Array.isArray(root.attachmentIds) && isObject(root.weapon) && Array.isArray(root.weapon.attachments)) {
    const known = new Set(root.weapon.attachments.filter(isObject).map((attachment) => attachment.id).filter((id): id is string => typeof id === "string"));
    root.attachmentIds.forEach((id, index) => {
      if (typeof id === "string" && !known.has(id)) issue(issues, `$.attachmentIds[${index}]`, "UNKNOWN_REFERENCE", `unknown attachment ${id}`);
    });
  }
  return issues;
}

export function asProgressionRequest(value: unknown): HttpProgressionRequest {
  return value as HttpProgressionRequest;
}

export function asMetricsRequest(value: unknown): HttpMetricsRequest {
  return value as HttpMetricsRequest;
}
