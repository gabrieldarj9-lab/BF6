import type {
  WeaponAttachmentRecord,
  WeaponAttachmentSlotId,
  WeaponDataRecord,
  WeaponDataSource,
} from "../types";

const sources: WeaponDataSource[] = [
  {
    id: "ea-progression-2026-04-14",
    kind: "EA_OFFICIAL",
    title: "Everything You Need to Know About Battlefield 6 Progression, Ranks and Unlocks",
    url: "https://www.ea.com/games/battlefield/battlefield-6/news/progression-in-battlefield-6",
    observedAt: "2026-09-10",
  },
  {
    id: "rnkd-svdm-2026-09-10",
    kind: "RNKD",
    title: "SVDM Stats, Builds & Meta - Battlefield 6",
    url: "https://rnkd.gg/battlefield6/weapons/SVDM/",
    observedAt: "2026-09-10",
  },
  {
    id: "battlefieldmeta-svdm-2026-09-10",
    kind: "BATTLEFIELDMETA",
    title: "SVDM - Best Loadouts & Builds | Battlefield 6",
    url: "https://battlefieldmeta.gg/best-loadouts/svdm",
    observedAt: "2026-09-10",
  },
];

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function attachment(
  slotId: WeaponAttachmentSlotId,
  name: string,
  costPoints: number | null,
  masteryLevel: number,
  sourceIds: readonly string[] = ["rnkd-svdm-2026-09-10"],
): WeaponAttachmentRecord {
  return {
    id: `svdm-${slug(name)}`,
    name,
    slotId,
    costPoints,
    unlock: masteryLevel <= 0
      ? { type: "DEFAULT", label: "Disponível por padrão" }
      : { type: "MASTERY", level: masteryLevel, label: `Maestria ${masteryLevel}` },
    sourceIds,
    effects: null,
  };
}

const attachments: WeaponAttachmentRecord[] = [
  // Ammunition
  attachment("ammunition", "FMJ", 5, 0),
  attachment("ammunition", "TUNGSTEN CORE", 5, 14),
  attachment("ammunition", "MATCH GRADE", 10, 24),
  attachment("ammunition", "FRANGIBLE", 20, 29),
  attachment("ammunition", "HOLLOW POINT", 20, 36),

  // Barrel
  attachment("barrel", "550MM FACTORY", 15, 0),
  attachment("barrel", "565MM PARA", 10, 1),
  // RNKD reports 15 pts while the current BattlefieldMeta builds report 5 pts.
  // Keep cost unresolved until reconciled rather than selecting one silently.
  attachment("barrel", "620MM CLASSIC", null, 15, [
    "rnkd-svdm-2026-09-10",
    "battlefieldmeta-svdm-2026-09-10",
  ]),
  attachment("barrel", "565MM FLUTED", 20, 30),

  // Ergonomics
  attachment("ergonomics", "IMPROVED MAG CATCH", 5, 25, [
    "rnkd-svdm-2026-09-10",
    "battlefieldmeta-svdm-2026-09-10",
  ]),
  // Current BattlefieldMeta catalog item; point cost is not exposed on the
  // attachment listing, so it remains unresolved.
  attachment("ergonomics", "AFTERMARKET BUFFER", null, 0, [
    "battlefieldmeta-svdm-2026-09-10",
  ]),

  // Left accessory
  attachment("left-accessory", "TACLIGHT - AIMED", 5, 0),
  attachment("left-accessory", "TACLIGHT - HIP", 15, 0),
  attachment("left-accessory", "FLASHLIGHT", 10, 3),
  attachment("left-accessory", "RANGE FINDER", 15, 21),

  // Magazine
  attachment("magazine", "10RND MAGAZINE", 5, 0),
  attachment("magazine", "5RND FAST MAG", 5, 14),
  attachment("magazine", "10RND FAST MAG", 10, 16),
  attachment("magazine", "20RND MAGAZINE", 45, 25, [
    "rnkd-svdm-2026-09-10",
    "battlefieldmeta-svdm-2026-09-10",
  ]),

  // Muzzle
  attachment("muzzle", "HYBRID SUPPRESSOR (K)", 50, 0),
  attachment("muzzle", "HYBRID SUPPRESSOR (S)", 40, 0),
  attachment("muzzle", "HYBRID SUPPRESSOR (L)", 30, 0),
  attachment("muzzle", "FLASH HIDER", 10, 0),
  attachment("muzzle", "CQB SUPPRESSOR", 30, 5),
  attachment("muzzle", "LINEAR COMP", 10, 6, [
    "rnkd-svdm-2026-09-10",
    "battlefieldmeta-svdm-2026-09-10",
  ]),
  attachment("muzzle", "STANDARD SUPPRESSOR", 20, 9),
  attachment("muzzle", "SINGLE-PORT BRAKE", 10, 10),
  attachment("muzzle", "LONG SUPPRESSOR", 25, 11, [
    "rnkd-svdm-2026-09-10",
    "battlefieldmeta-svdm-2026-09-10",
  ]),
  attachment("muzzle", "DOUBLE-PORT BRAKE", 10, 19),
  attachment("muzzle", "COMPENSATED BRAKE", 20, 31),
  attachment("muzzle", "LIGHTENED SUPPRESSOR", 30, 39),

  // Optic accessory
  attachment("optic-accessory", "PIGGYBACK REFLEX", 10, 8),
  attachment("optic-accessory", "CANTED IRON SIGHTS", 5, 13),
  attachment("optic-accessory", "CANTED REFLEX", 10, 22),

  // Right accessory / lasers
  attachment("right-accessory", "50 MW VIOLET", 10, 0),
  attachment("right-accessory", "5 MW RED", 10, 2),
  attachment("right-accessory", "5 MW GREEN", 10, 6),
  attachment("right-accessory", "50 MW GREEN", 20, 15, [
    "rnkd-svdm-2026-09-10",
    "battlefieldmeta-svdm-2026-09-10",
  ]),
  attachment("right-accessory", "50 MW BLUE", 20, 26),
  attachment("right-accessory", "120 MW BLUE", 30, 38),

  // Scope
  attachment("scope", "BF-2M 2.50X", 10, 0),
  attachment("scope", "IRON SIGHTS", 5, 0),
  attachment("scope", "3VZR 1.75X", 10, 2),
  attachment("scope", "CCO 2.00X", 10, 3),
  attachment("scope", "PVQ-31 4.00X", 10, 5),
  attachment("scope", "OSA-7 1.00X", 10, 7),
  attachment("scope", "RO-M 1.75X", 10, 9),
  attachment("scope", "SDO 3.50X", 10, 10),
  attachment("scope", "R4T 2.00X", 10, 11),
  attachment("scope", "BAKER 3.00X", 10, 12, [
    "rnkd-svdm-2026-09-10",
    "battlefieldmeta-svdm-2026-09-10",
  ]),
  attachment("scope", "2PRO 1.25X", 10, 13),
  attachment("scope", "CQ RDS 1.25X", 10, 16),
  attachment("scope", "A-P2 1.75X", 10, 17),
  attachment("scope", "ST PRISM 5.00X", 10, 18),
  attachment("scope", "SF-G2 5.00X", 10, 19),
  attachment("scope", "LDS 4.50X", 10, 20),
  attachment("scope", "R-MR 1.00X", 10, 21),
  attachment("scope", "SU-123 1.50X", 10, 22),
  attachment("scope", "SSDS 6.00X", 10, 23),
  attachment("scope", "1P87 1.50X", 10, 24),
  attachment("scope", "ROX 1.50X", 10, 25),
  attachment("scope", "MARS-F LPVO", 25, 26),
  attachment("scope", "S-VPS 6.00X", 10, 28),
  attachment("scope", "PAS-35 3.00X", 25, 29),
  attachment("scope", "MC-CO LPVO", 25, 30),
  attachment("scope", "RO-S 1.25X", 10, 31),
  attachment("scope", "NFX 8.00X", 10, 32),
  attachment("scope", "MINI FLEX 1.00X", 10, 33),
  attachment("scope", "TS-HD 6.00X", 25, 34),
  attachment("scope", "DVO LPVO", 25, 35),
  attachment("scope", "R-VPS 10.00X", 10, 36),
  attachment("scope", "1P88 VARIABLE", 25, 37),
  attachment("scope", "LERT 8.00X", 10, 38),
  attachment("scope", "GRIM 1.50X", 25, 39),
  attachment("scope", "SM RIFLE VARIABLE", 25, 40),
  // Current BattlefieldMeta-only catalog entries. Point costs are intentionally
  // unresolved until a source exposes them directly for this weapon.
  attachment("scope", "SU-230 LPVO", null, 0, ["battlefieldmeta-svdm-2026-09-10"]),
  attachment("scope", "TH-RDS 1.00X", null, 0, ["battlefieldmeta-svdm-2026-09-10"]),

  // Underbarrel
  attachment("underbarrel", "FOLDING VERTICAL", 10, 1, [
    "rnkd-svdm-2026-09-10",
    "battlefieldmeta-svdm-2026-09-10",
  ]),
  attachment("underbarrel", "ALLOY VERTICAL", 20, 4),
  attachment("underbarrel", "PTT GRIP POD", 20, 7),
  attachment("underbarrel", "RIBBED VERTICAL", 20, 8),
  attachment("underbarrel", "6H64 VERTICAL", 25, 12, [
    "rnkd-svdm-2026-09-10",
    "battlefieldmeta-svdm-2026-09-10",
  ]),
  attachment("underbarrel", "CLASSIC VERTICAL", 35, 16),
  attachment("underbarrel", "FOLDING STUBBY", 20, 17),
  attachment("underbarrel", "BIPOD", 10, 17),
  attachment("underbarrel", "QD GRIP POD", 30, 20),
  attachment("underbarrel", "RIBBED STUBBY", 30, 21),
  attachment("underbarrel", "CANTED STUBBY", 30, 23),
  attachment("underbarrel", "STIPPLED STUBBY", 35, 27),
  attachment("underbarrel", "LOW-PROFILE STUBBY", 45, 32),
  attachment("underbarrel", "ADJUSTABLE ANGLED", 15, 33),
  attachment("underbarrel", "CLASSIC GRIP POD", 30, 34),
  attachment("underbarrel", "SLIM ANGLED", 25, 37),
  attachment("underbarrel", "FULL ANGLED", 25, 40, [
    "rnkd-svdm-2026-09-10",
    "battlefieldmeta-svdm-2026-09-10",
  ]),
  // Seasonal/current catalog item surfaced by BattlefieldMeta.
  {
    ...attachment("underbarrel", "SLIM HANDSTOP", null, 0, [
      "battlefieldmeta-svdm-2026-09-10",
    ]),
    unlock: {
      type: "SEASONAL",
      label: "Season 1 Hardware 4",
    },
  },
];

export const svdmWeaponRecord: WeaponDataRecord = {
  id: "svdm",
  name: "SVDM",
  categoryId: "dmr",
  budget: 100,
  // EA lists the SVDM under Weapon Assignments rather than the normal Career
  // Rank table, so careerUnlockLevel is intentionally omitted.
  mastery: {
    minRank: 0,
    maxRank: 50,
  },
  slots: [
    { id: "scope", maxEquipped: 1 },
    { id: "optic-accessory", maxEquipped: 1 },
    { id: "muzzle", maxEquipped: 1 },
    { id: "barrel", maxEquipped: 1 },
    { id: "underbarrel", maxEquipped: 1 },
    { id: "magazine", maxEquipped: 1 },
    { id: "ammunition", maxEquipped: 1 },
    { id: "ergonomics", maxEquipped: 1 },
    { id: "left-accessory", maxEquipped: 1 },
    { id: "right-accessory", maxEquipped: 1 },
  ],
  attachments,
  baseStatEvidence: [
    {
      metricId: "damage.base",
      observations: [{ value: 41, unit: "damage", sourceId: "rnkd-svdm-2026-09-10" }],
    },
    {
      metricId: "fire.rpm",
      observations: [{ value: 300, unit: "rpm", sourceId: "rnkd-svdm-2026-09-10" }],
    },
    {
      metricId: "ballistics.velocity",
      observations: [{ value: 608, unit: "m/s", sourceId: "rnkd-svdm-2026-09-10" }],
    },
    {
      metricId: "magazine.capacity",
      observations: [{ value: 10, unit: "rounds", sourceId: "rnkd-svdm-2026-09-10" }],
    },
    {
      metricId: "reload.effective",
      observations: [{ value: 2500, unit: "ms", sourceId: "rnkd-svdm-2026-09-10" }],
    },
    {
      metricId: "handling.adsTime",
      observations: [{ value: 300, unit: "ms", sourceId: "rnkd-svdm-2026-09-10" }],
    },
    {
      metricId: "damage.headshotMultiplier",
      observations: [{ value: 1.5, sourceId: "rnkd-svdm-2026-09-10" }],
    },
    {
      metricId: "summary.mobility",
      observations: [{ value: 44, unit: "%", sourceId: "rnkd-svdm-2026-09-10" }],
    },
    {
      metricId: "summary.hipfire",
      observations: [{ value: 40, unit: "%", sourceId: "rnkd-svdm-2026-09-10" }],
    },
    {
      metricId: "summary.precision",
      observations: [{ value: 55, unit: "%", sourceId: "rnkd-svdm-2026-09-10" }],
    },
    {
      metricId: "summary.control",
      observations: [{ value: 17, unit: "%", sourceId: "rnkd-svdm-2026-09-10" }],
    },
  ],
  sources,
  engineBase: null,
};
