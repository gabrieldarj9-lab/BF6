import type { EndToEndProgressionRequest } from "../api/types";
import type { PriorityProfile } from "../scoring/types";

const defaults = {
  primaryEquivalenceThreshold: 1.5,
  minimumRelevantGain: 1,
  majorUpgradeThreshold: 5.5,
  softCollateralLossStart: 5,
  hardTotalCollateralLoss: 30,
};

export const fixturePrimaryProfile: PriorityProfile = {
  id: "fixture-assault-short-range",
  categoryId: "assault-rifles",
  priorityId: "short-range",
  name: "Curta distância",
  defaults,
  primaryMetrics: [
    { metricId: "ttk.10m", weight: 60 },
    { metricId: "handling.adsTime", weight: 40 },
  ],
  protectedMetrics: [
    { metricId: "recoil.ads.amount", maxAllowedLoss: 20 },
  ],
};

export const integrationFixtureRequest: EndToEndProgressionRequest = {
  weapon: {
    id: "fixture-rifle",
    categoryId: "assault-rifles",
    budget: 35,
    slots: [
      { id: "barrel", maxEquipped: 1 },
      { id: "underbarrel", maxEquipped: 1 },
      { id: "top-accessory", maxEquipped: 1 },
    ],
    restrictions: [
      {
        id: "quick-grip-vs-laser",
        type: "INCOMPATIBLE_WITH_ATTACHMENT",
        attachmentId: "quick-grip",
        incompatibleAttachmentId: "laser",
      },
    ],
    attachments: [
      {
        id: "quick-grip",
        slotId: "underbarrel",
        cost: 10,
        unlock: { type: "MASTERY", level: 1, label: "Maestria 1" },
        effects: [
          { metricId: "handling.adsTime", operation: "ADD", value: -50 },
          { metricId: "recoil.ads.amount", operation: "MULTIPLY", value: 0.9 },
        ],
      },
      {
        id: "laser",
        slotId: "top-accessory",
        cost: 5,
        unlock: { type: "MASTERY", level: 1, label: "Maestria 1" },
        effects: [
          { metricId: "handling.adsTime", operation: "ADD", value: -10 },
        ],
      },
      {
        id: "cosmetic-charm",
        slotId: "top-accessory",
        cost: 5,
        unlock: { type: "MASTERY", level: 1, label: "Maestria 1" },
        effects: [],
      },
      {
        id: "rapid-barrel",
        slotId: "barrel",
        cost: 20,
        unlock: { type: "MASTERY", level: 5, label: "Maestria 5" },
        effects: [
          { metricId: "fire.rpm", operation: "SET", value: 720 },
          { metricId: "recoil.ads.amount", operation: "ADD", value: 0.1 },
        ],
      },
      {
        id: "heavy-ammo-conversion",
        slotId: "barrel",
        cost: 35,
        unlock: { type: "MASTERY", level: 8, label: "Maestria 8" },
        effects: [],
        runtimeOverride: {
          damageCurve: [
            { rangeM: 0, damage: 50 },
            { rangeM: 50, damage: 50 },
          ],
        },
      },
      {
        id: "extended-mag",
        slotId: "underbarrel",
        cost: 25,
        unlock: { type: "MASTERY", level: 10, label: "Maestria 10" },
        effects: [
          { metricId: "magazine.capacity", operation: "SET", value: 40 },
          { metricId: "handling.adsTime", operation: "ADD", value: 25 },
        ],
      },
    ],
    base: {
      technical: {
        "handling.adsTime": 300,
        "recoil.ads.amount": 1,
        "fire.rpm": 600,
        "magazine.capacity": 30,
        "reload.effective": 2000,
        "ballistics.velocity": 700,
      },
      resolutionRules: {
        "handling.adsTime": { kind: "DIRECT" },
        "recoil.ads.amount": { kind: "DIRECT" },
        "fire.rpm": { kind: "DIRECT" },
        "magazine.capacity": { kind: "DIRECT" },
        "reload.effective": { kind: "DIRECT" },
        "ballistics.velocity": { kind: "DIRECT" },
      },
      damageCurve: [
        { rangeM: 0, damage: 25 },
        { rangeM: 50, damage: 25 },
      ],
      projectileType: "SINGLE_PROJECTILE",
      projectileCount: 1,
      cadence: { kind: "STANDARD", rpm: 600 },
      magazineCapacity: 30,
      reload: {
        kind: "FULL_MAGAZINE",
        effectiveEmptyReloadMs: 2000,
      },
      projectileVelocityMps: 700,
      dragPerMeter: 0,
      healthBaseline: 100,
      bodyMultiplier: 1,
    },
  },
  primaryProfile: fixturePrimaryProfile,
  normalizationRules: {
    "ttk.10m": {
      metricId: "ttk.10m",
      mode: "FIXED_RANGE",
      min: 0,
      max: 500,
      direction: "LOWER_IS_BETTER",
    },
    "handling.adsTime": {
      metricId: "handling.adsTime",
      mode: "FIXED_RANGE",
      min: 100,
      max: 500,
      direction: "LOWER_IS_BETTER",
    },
    "recoil.ads.amount": {
      metricId: "recoil.ads.amount",
      mode: "FIXED_RANGE",
      min: 0.5,
      max: 2,
      direction: "LOWER_IS_BETTER",
    },
    "fire.rpm": {
      metricId: "fire.rpm",
      mode: "FIXED_RANGE",
      min: 300,
      max: 1000,
      direction: "HIGHER_IS_BETTER",
    },
    "magazine.capacity": {
      metricId: "magazine.capacity",
      mode: "FIXED_RANGE",
      min: 5,
      max: 100,
      direction: "HIGHER_IS_BETTER",
    },
    "reload.effective": {
      metricId: "reload.effective",
      mode: "FIXED_RANGE",
      min: 500,
      max: 5000,
      direction: "LOWER_IS_BETTER",
    },
    "ballistics.velocity": {
      metricId: "ballistics.velocity",
      mode: "FIXED_RANGE",
      min: 300,
      max: 1200,
      direction: "HIGHER_IS_BETTER",
    },
  },
  maxSearchNodes: 100000,
  candidateDominance: {
    metricIds: ["structural-equivalence"],
    comparisonKey(candidate) {
      return candidate.attachmentIds
        .filter((id) => id !== "cosmetic-charm")
        .sort()
        .join("|");
    },
    evaluate() {
      return { values: { "structural-equivalence": 0 } };
    },
  },
};
