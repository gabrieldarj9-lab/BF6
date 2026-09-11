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
    observedAt: "2026-09-11",
  },
  {
    id: "ea-loadouts",
    kind: "EA_OFFICIAL",
    title: "How to build loadouts in Battlefield 6",
    url: "https://help.ea.com/articles/battlefield/battlefield-6/how-to-build-loadouts/",
    observedAt: "2026-09-11",
  },
  {
    id: "rnkd-svk-86-2026-09-11",
    kind: "RNKD",
    title: "SVK-8.6 Stats, Builds & Meta - Battlefield 6",
    url: "https://rnkd.gg/battlefield6/weapons/svk-86/",
    observedAt: "2026-09-11",
  },
  {
    id: "battlefieldmeta-svk-86-2026-09-10",
    kind: "BATTLEFIELDMETA",
    title: "SVK-8.6 - Best Loadouts & Builds | Battlefield 6",
    url: "https://battlefieldmeta.gg/best-loadouts/svk-86",
    observedAt: "2026-09-11",
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
  costPoints: number,
  masteryLevel: number,
  sourceIds: readonly string[] = ["rnkd-svk-86-2026-09-11"],
): WeaponAttachmentRecord {
  return {
    id: `svk-86-${slug(name)}`,
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
  attachment("ammunition", "TUNGSTEN CORE", 5, 15),
  attachment("ammunition", "FRANGIBLE", 20, 20),
  attachment("ammunition", "HOLLOW POINT", 20, 30),
  attachment("ammunition", "MATCH GRADE", 10, 37),

  // Barrel
  attachment("barrel", "560MM FACTORY", 15, 0),
  attachment("barrel", "560MM CUT", 10, 10),
  attachment("barrel", "457MM URBAN", 15, 39),

  // Left accessory
  attachment("left-accessory", "TACLIGHT - AIMED", 5, 0),
  attachment("left-accessory", "TACLIGHT - HIP", 15, 0),
  attachment("left-accessory", "FLASHLIGHT", 10, 6),
  attachment("left-accessory", "RANGE FINDER", 15, 38),

  // Magazine
  attachment("magazine", "10RND MAGAZINE", 5, 0),
  attachment("magazine", "10RND FAST MAG", 10, 25),

  // Muzzle
  attachment("muzzle", "HYBRID SUPPRESSOR (K)", 50, 0),
  attachment("muzzle", "TRIPLE-PORT BRAKE", 10, 0),
  attachment("muzzle", "SINGLE-PORT BRAKE", 10, 0),
  attachment("muzzle", "HYBRID SUPPRESSOR (L)", 30, 0),
  attachment("muzzle", "HYBRID SUPPRESSOR (S)", 40, 0),
  attachment("muzzle", "STANDARD SUPPRESSOR", 20, 1),
  attachment("muzzle", "FLASH HIDER", 10, 5),
  attachment("muzzle", "LINEAR COMP", 10, 7),
  attachment("muzzle", "CQB SUPPRESSOR", 30, 14),
  attachment("muzzle", "SHORTENED SUPPRESSOR", 30, 18),
  attachment("muzzle", "COMPENSATED BRAKE", 20, 20),
  attachment("muzzle", "LONG SUPPRESSOR", 25, 21),
  attachment("muzzle", "LIGHTENED SUPPRESSOR", 30, 30),

  // Optic accessory
  attachment("optic-accessory", "CANTED IRON SIGHTS", 5, 4),
  attachment("optic-accessory", "CANTED REFLEX", 10, 16),

  // Scope
  attachment("scope", "LDS 4.50X", 10, 0),
  attachment("scope", "IRON SIGHTS", 5, 0),
  attachment("scope", "CCO 2.00X", 10, 1),
  attachment("scope", "2PRO 1.25X", 10, 2),
  attachment("scope", "BAKER 3.00X", 10, 6),
  attachment("scope", "OSA-7 1.00X", 10, 6),
  attachment("scope", "CQ RDS 1.25X", 10, 7),
  attachment("scope", "3VZR 1.75X", 10, 8),
  attachment("scope", "ST PRISM 5.00X", 10, 9),
  attachment("scope", "SU-123 1.50X", 10, 11),
  attachment("scope", "R4T 2.00X", 10, 12),
  attachment("scope", "BF-2M 2.50X", 10, 12),
  attachment("scope", "1P87 1.50X", 10, 14),
  attachment("scope", "ROX 1.50X", 10, 14),
  attachment("scope", "DVO 5.00X", 10, 16),
  attachment("scope", "SF-G2 5.00X", 10, 16),
  attachment("scope", "S-VPS 6.00X", 10, 18),
  attachment("scope", "RO-M 1.75X", 10, 19),
  attachment("scope", "SDO 3.50X", 10, 21),
  attachment("scope", "PVQ-31 4.00X", 10, 22),
  attachment("scope", "MINI FLEX 1.00X", 10, 23),
  attachment("scope", "SSDS 6.00X", 10, 24),
  attachment("scope", "GRIM 1.50X", 25, 25),
  attachment("scope", "MARS-F LPVO", 25, 26),
  attachment("scope", "R-MR 1.00X", 10, 27),
  attachment("scope", "NFX 8.00X", 10, 28),
  attachment("scope", "MC-CO LPVO", 25, 29),
  attachment("scope", "PAS-35 3.00X", 25, 31),
  attachment("scope", "RO-S 1.25X", 10, 32),
  attachment("scope", "1P88 VARIABLE", 25, 33),
  attachment("scope", "LERT 8.00X", 10, 34),
  attachment("scope", "R-VPS 10.00X", 10, 35),
  attachment("scope", "DVO LPVO", 25, 37),
  attachment("scope", "SM RIFLE VARIABLE", 25, 38),
  attachment("scope", "A-P2 1.75X", 10, 39),
  attachment("scope", "TS-HD 6.00X", 25, 40),

  // Top accessory
  {
    ...attachment("top-accessory", "50 MW VIOLET", 10, 0, [
      "rnkd-svk-86-2026-09-11",
      "battlefieldmeta-svk-86-2026-09-10",
    ]),
    unlock: {
      type: "UNKNOWN",
      label: "Conflito entre disponibilidade padrão e desbloqueio sazonal",
    },
  },
  attachment("top-accessory", "5 MW RED", 10, 3),
  attachment("top-accessory", "5 MW GREEN", 10, 18),
  attachment("top-accessory", "50 MW GREEN", 20, 26),
  attachment("top-accessory", "50 MW BLUE", 20, 33),
  attachment("top-accessory", "120 MW BLUE", 30, 36),

  // Underbarrel
  attachment("underbarrel", "FOLDING VERTICAL", 10, 2),
  attachment("underbarrel", "ALLOY VERTICAL", 20, 4),
  attachment("underbarrel", "RIBBED VERTICAL", 20, 8),
  attachment("underbarrel", "6H64 VERTICAL", 25, 11),
  attachment("underbarrel", "CLASSIC VERTICAL", 35, 13),
  attachment("underbarrel", "PTT GRIP POD", 20, 15),
  attachment("underbarrel", "BIPOD", 10, 17),
  attachment("underbarrel", "FOLDING STUBBY", 20, 17),
  attachment("underbarrel", "RIBBED STUBBY", 30, 19),
  attachment("underbarrel", "ADJUSTABLE ANGLED", 25, 20),
  attachment("underbarrel", "CANTED STUBBY", 30, 22),
  attachment("underbarrel", "STIPPLED STUBBY", 35, 23),
  attachment("underbarrel", "LOW-PROFILE STUBBY", 45, 27),
  attachment("underbarrel", "QD GRIP POD", 30, 29),
  attachment("underbarrel", "SLIM ANGLED", 25, 32),
  attachment("underbarrel", "CLASSIC GRIP POD", 30, 36),
  attachment("underbarrel", "FULL ANGLED", 25, 40),

  // Current seasonal/current-patch item observed in BattlefieldMeta.
  {
    id: "svk-86-extended",
    name: "EXTENDED",
    slotId: "barrel",
    costPoints: 5,
    unlock: {
      type: "UNKNOWN",
      label: "Disponibilidade atual observada, origem do desbloqueio ainda não reconciliada",
    },
    sourceIds: ["battlefieldmeta-svk-86-2026-09-10"],
    effects: null,
  },
];

export const svk86WeaponRecord: WeaponDataRecord = {
  id: "svk-86",
  name: "SVK-8.6",
  categoryId: "dmr",
  budget: 100,
  careerUnlockLevel: 33,
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
    { id: "top-accessory", maxEquipped: 1 },
    { id: "left-accessory", maxEquipped: 1 },
  ],
  attachments,
  baseStatEvidence: [
    {
      metricId: "damage.base",
      observations: [
        { value: 66, unit: "damage", sourceId: "rnkd-svk-86-2026-09-11" },
      ],
    },
    {
      metricId: "fire.rpm",
      observations: [
        { value: 150, unit: "rpm", sourceId: "rnkd-svk-86-2026-09-11" },
        { value: 149, unit: "rpm", sourceId: "battlefieldmeta-svk-86-2026-09-10" },
      ],
    },
    {
      metricId: "magazine.capacity",
      observations: [
        { value: 10, unit: "rounds", sourceId: "rnkd-svk-86-2026-09-11" },
        { value: 10, unit: "rounds", sourceId: "battlefieldmeta-svk-86-2026-09-10" },
      ],
    },
    {
      metricId: "reload.effective",
      observations: [
        { value: 2967, unit: "ms", sourceId: "rnkd-svk-86-2026-09-11" },
        { value: 2967, unit: "ms", sourceId: "battlefieldmeta-svk-86-2026-09-10" },
      ],
    },
    {
      metricId: "handling.adsTime",
      observations: [
        { value: 433, unit: "ms", sourceId: "rnkd-svk-86-2026-09-11" },
      ],
    },
    {
      metricId: "ballistics.velocity",
      observations: [
        { value: 850, unit: "m/s", sourceId: "rnkd-svk-86-2026-09-11" },
        { value: 750, unit: "m/s", sourceId: "battlefieldmeta-svk-86-2026-09-10" },
      ],
    },
    {
      metricId: "damage.headshotMultiplier",
      observations: [
        { value: 1.5, sourceId: "rnkd-svk-86-2026-09-11" },
        { value: 1.35, sourceId: "battlefieldmeta-svk-86-2026-09-10" },
      ],
    },
  ],
  sources,
  engineBase: null,
};
