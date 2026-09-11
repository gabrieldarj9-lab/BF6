import { buildSourceBackedWeaponBatch, type SourceBackedAttachmentDraft } from "../migration/batch-builder";
import type { WeaponAttachmentSlotId, WeaponBaseStatEvidence, WeaponDataRecord, WeaponDataSource } from "../types";

const observedAt = "2026-09-10";

type AttachmentItem = readonly [name: string, cost: number | null, rank: number];

function group(slotId: WeaponAttachmentSlotId, items: readonly AttachmentItem[], sourceIds?: readonly string[]): SourceBackedAttachmentDraft[] {
  return items.map(([name, costPoints, rank]) => ({
    name,
    slotId,
    costPoints,
    unlock: rank <= 0
      ? { type: "DEFAULT", label: "Disponível por padrão" }
      : { type: "MASTERY", level: rank, label: `Maestria ${rank}` },
    sourceIds,
  }));
}

function slotsFor(attachments: readonly SourceBackedAttachmentDraft[]) {
  return [...new Set(attachments.map((attachment) => attachment.slotId))].map((id) => ({ id, maxEquipped: 1 }));
}

function sourcesFor(slug: string, name: string): WeaponDataSource[] {
  return [
    {
      id: `rnkd-${slug}-2026-09-10`,
      kind: "RNKD",
      title: `${name} Stats, Builds & Meta - Battlefield 6`,
      url: `https://rnkd.gg/battlefield6/weapons/${slug}/`,
      observedAt,
    },
    {
      id: `battlefieldmeta-${slug}-2026-09-10`,
      kind: "BATTLEFIELDMETA",
      title: `${name} - Best Loadouts & Builds | Battlefield 6`,
      url: `https://battlefieldmeta.gg/best-loadouts/${slug}`,
      observedAt,
    },
  ];
}

function statEvidence(sourceId: string, values: {
  damage: number;
  rpm: number;
  velocity: number;
  magazine: number;
  reloadMs: number;
  adsMs: number;
  headshot: number;
  mobility: number;
  hipfire: number;
  precision: number;
  control: number;
}): WeaponBaseStatEvidence[] {
  return [
    { metricId: "damage.base", observations: [{ value: values.damage, unit: "damage", sourceId }] },
    { metricId: "fire.rpm", observations: [{ value: values.rpm, unit: "rpm", sourceId }] },
    { metricId: "ballistics.velocity", observations: [{ value: values.velocity, unit: "m/s", sourceId }] },
    { metricId: "magazine.capacity", observations: [{ value: values.magazine, unit: "rounds", sourceId }] },
    { metricId: "reload.effective", observations: [{ value: values.reloadMs, unit: "ms", sourceId }] },
    { metricId: "handling.adsTime", observations: [{ value: values.adsMs, unit: "ms", sourceId }] },
    { metricId: "damage.headshotMultiplier", observations: [{ value: values.headshot, sourceId }] },
    { metricId: "summary.mobility", observations: [{ value: values.mobility, unit: "%", sourceId }] },
    { metricId: "summary.hipfire", observations: [{ value: values.hipfire, unit: "%", sourceId }] },
    { metricId: "summary.precision", observations: [{ value: values.precision, unit: "%", sourceId }] },
    { metricId: "summary.control", observations: [{ value: values.control, unit: "%", sourceId }] },
  ];
}

function withConflictSources(weaponSlug: string, items: SourceBackedAttachmentDraft[]) {
  return items.map((item) => ({
    ...item,
    sourceIds: [`rnkd-${weaponSlug}-2026-09-10`, `battlefieldmeta-${weaponSlug}-2026-09-10`],
  }));
}

const m4a1Attachments: SourceBackedAttachmentDraft[] = [
  ...group("ammunition", [["FMJ",5,0],["TUNGSTEN CORE",5,11],["POLYMER CASE",10,18],["HOLLOW POINT",20,28],["FRANGIBLE",20,37]]),
  ...group("barrel", [["11.5\" COMMANDO",15,0],["12.5\" MID",10,3],["12.5\" FLUTED",20,25]]),
  ...withConflictSources("m4a1", group("barrel", [["14.5\" CARBINE",null,13]])),
  ...group("ergonomics", [["IMPROVED MAG CATCH",5,4],["MAGWELL FLARE",10,16],["MATCH TRIGGER",15,32]]),
  ...group("magazine", [["30RND MAGAZINE",5,0],["20RND FAST MAG",5,6],["20RND MAGAZINE",5,14],["30RND FAST MAG",10,22],["36RND MAGAZINE",15,31],["40RND MAGAZINE",25,34],["40RND FAST MAG",30,38]]),
  ...group("muzzle", [["HYBRID SUPPRESSOR (K)",50,0],["HYBRID SUPPRESSOR (S)",40,0],["HYBRID SUPPRESSOR (L)",30,0],["FLASH HIDER",10,0],["SINGLE-PORT BRAKE",5,2],["LINEAR COMP",10,7],["DOUBLE-PORT BRAKE",10,15],["COMPENSATED BRAKE",20,21],["STANDARD SUPPRESSOR",20,24],["LONG SUPPRESSOR",25,29],["CQB SUPPRESSOR",30,35],["LIGHTENED SUPPRESSOR",30,39]]),
  ...group("optic-accessory", [["CANTED IRON SIGHTS",5,10],["CANTED REFLEX",15,20]]),
  ...group("right-accessory", [["FLASHLIGHT",10,8]]),
  ...group("scope", [["SU-123 1.50X",10,0],["IRON SIGHTS",5,0],["BAKER 3.00X",10,1],["MINI FLEX 1.00X",10,2],["RO-M 1.75X",10,4],["PVQ-31 4.00X",10,6],["A-P2 1.75X",10,7],["2PRO 1.25X",10,8],["CCO 2.00X",10,9],["DVO 5.00X",10,10],["OSA-7 1.00X",10,12],["SDO 3.50X",10,14],["ROX 1.50X",10,16],["ST PRISM 5.00X",10,17],["1P87 1.50X",10,19],["GRIM 1.50X",25,22],["R4T 2.00X",10,23],["R-MR 1.00X",10,24],["BF-2M 2.50X",10,26],["3VZR 1.75X",10,27],["NGFC LPVO",25,32],["RO-S 1.25X",10,33],["LDS 4.50X",10,35],["PAS-35 3.00X",25,36],["CQ RDS 1.25X",10,38],["SF-G2 5.00X",10,40]]),
  ...group("top-accessory", [["5 MW RED",10,5],["5 MW GREEN",10,12],["50 MW GREEN",20,19],["50 MW BLUE",20,26],["120 MW BLUE",30,33]]),
  ...group("underbarrel", [["UNDERSLUNG MOUNT",10,0],["FOLDING VERTICAL",10,1],["ALLOY VERTICAL",20,3],["RIBBED VERTICAL",20,9],["FOLDING STUBBY",20,11],["PTT GRIP POD",20,13],["CLASSIC VERTICAL",35,15],["6H64 VERTICAL",25,18],["ADJUSTABLE ANGLED",15,21],["SLIM ANGLED",25,23],["RIBBED STUBBY",30,25],["CANTED STUBBY",30,27],["FULL ANGLED",25,29],["QD GRIP POD",30,31],["BIPOD",10,34],["CLASSIC GRIP POD",30,36],["STIPPLED STUBBY",35,37],["LOW-PROFILE STUBBY",45,39]]),
];

const ak205Attachments: SourceBackedAttachmentDraft[] = [
  ...group("ammunition", [["FMJ",5,0],["TUNGSTEN CORE",5,9],["POLYMER CASE",10,15],["HOLLOW POINT",20,23],["FRANGIBLE",20,32],["SYNTHETIC TIP",30,39]]),
  ...group("barrel", [["314MM FACTORY",10,0],["314MM PROTOTYPE",10,3],["314MM FLUTED",20,37]]),
  ...group("ergonomics", [["IMPROVED MAG CATCH",5,6],["MAGWELL FLARE",10,16],["MATCH TRIGGER",15,28]]),
  ...group("left-accessory", [["FLASHLIGHT",10,8]]),
  ...group("magazine", [["30RND MAGAZINE",5,0],["30RND FAST MAG",10,4],["36RND MAGAZINE",15,14],["40RND MAGAZINE",25,17],["40RND FAST MAG",30,22],["45RND MAGAZINE",35,25],["45RND FAST MAG",40,27],["50RND MAGAZINE",45,35]]),
  ...group("muzzle", [["HYBRID SUPPRESSOR (L)",30,0],["HYBRID SUPPRESSOR (S)",40,0],["HYBRID SUPPRESSOR (K)",50,0],["FLASH HIDER",10,0],["LINEAR COMP",10,2],["DOUBLE-PORT BRAKE",10,7],["COMPENSATED BRAKE",20,13],["STANDARD SUPPRESSOR",20,18],["LONG SUPPRESSOR",25,24],["CQB SUPPRESSOR",30,28],["LIGHTENED SUPPRESSOR",30,38]]),
  ...group("optic-accessory", [["CANTED IRON SIGHTS",5,10],["CANTED REFLEX",10,20],["PIGGYBACK REFLEX",10,30]]),
  ...group("right-accessory", [["5 MW RED",10,5],["5 MW GREEN",10,12],["50 MW GREEN",20,19],["50 MW BLUE",20,26],["120 MW BLUE",30,33]]),
  ...group("scope", [["IRON SIGHTS",5,0],["BAKER 3.00X",10,0],["MINI FLEX 1.00X",10,1],["RO-M 1.75X",10,2],["PVQ-31 4.00X",10,3],["RO-S 1.25X",10,5],["CCO 2.00X",10,6],["A-P2 1.75X",10,8],["OSA-7 1.00X",10,9],["LDS 4.50X",10,12],["CQ RDS 1.25X",10,13],["MC-CO LPVO",null,13],["SU-123 1.50X",10,16],["SDO 3.50X",10,17],["3VZR 1.75X",10,18],["ST PRISM 5.00X",10,21],["R4T 2.00X",10,24],["GRIM 1.50X",25,26],["MARS-F LPVO",25,29],["1P87 1.50X",10,32],["2PRO 1.25X",10,33],["BF-2M 2.50X",10,34],["ROX 1.50X",10,35],["PAS-35 3.00X",25,36],["R-MR 1.00X",10,39],["SF-G2 5.00X",10,40]]),
  ...group("underbarrel", [["FOLDING VERTICAL",10,1],["ALLOY VERTICAL",20,4],["RIBBED VERTICAL",20,7],["FOLDING STUBBY",20,11],["6H64 VERTICAL",25,15],["SLIM ANGLED",25,19],["RIBBED STUBBY",30,22],["CANTED STUBBY",30,25],["FULL ANGLED",25,29],["STIPPLED STUBBY",35,31],["CLASSIC VERTICAL",35,34],["LOW-PROFILE STUBBY",45,38]]),
];

const qbz192Attachments: SourceBackedAttachmentDraft[] = [
  ...group("ammunition", [["FMJ",5,0],["TUNGSTEN CORE",5,4],["POLYMER CASE",10,14],["HOLLOW POINT",20,22],["FRANGIBLE",20,29],["SYNTHETIC TIP",30,38]]),
  ...group("barrel", [["10.5\" FACTORY",10,0],["14.5\" COMMON",15,16]]),
  ...group("ergonomics", [["MATCH TRIGGER",15,27]]),
  ...group("magazine", [["30RND MAGAZINE",5,0],["30RND FAST MAG",10,7],["36RND MAGAZINE",15,24],["40RND MAGAZINE",25,35]]),
  ...group("muzzle", [["FLASH HIDER",10,0],["HYBRID SUPPRESSOR (K)",50,0],["HYBRID SUPPRESSOR (S)",40,0],["HYBRID SUPPRESSOR (L)",30,0],["LINEAR COMP",10,2],["STANDARD SUPPRESSOR",20,17]]),
  ...group("optic-accessory", [["CANTED IRON SIGHTS",5,10],["CANTED REFLEX",10,20]]),
  ...group("right-accessory", [["FLASHLIGHT",10,8]]),
  ...group("scope", [["IRON SIGHTS",5,0],["MINI FLEX 1.00X",10,1],["BAKER 3.00X",10,2],["RO-M 1.75X",10,3],["OSA-7 1.00X",10,5],["PVQ-31 4.00X",10,6],["ROX 1.50X",10,7],["SU-123 1.50X",10,9],["CQ RDS 1.25X",10,11],["LDS 4.50X",10,12],["R4T 2.00X",10,13],["GRIM 1.50X",25,15],["ST PRISM 5.00X",10,17],["R-MR 1.00X",10,19],["BF-2M 2.50X",10,21],["3VZR 1.75X",10,23],["MARS-F LPVO",25,25],["2PRO 1.25X",10,27],["A-P2 1.75X",10,29],["PAS-35 3.00X",25,32],["RO-S 1.25X",10,35],["SDO 3.50X",10,37],["1P87 1.50X",10,39],["SF-G2 5.00X",10,40]]),
  ...group("top-accessory", [["5 MW RED",10,5],["5 MW GREEN",10,12],["50 MW GREEN",20,19],["50 MW BLUE",20,26],["120 MW BLUE",30,33]]),
  ...group("underbarrel", [["PTT GRIP POD",20,0],["FOLDING VERTICAL",10,1],["ALLOY VERTICAL",20,3],["RIBBED VERTICAL",20,6],["FOLDING STUBBY",20,9],["6H64 VERTICAL",25,13],["ADJUSTABLE ANGLED",15,15],["SLIM ANGLED",25,18],["RIBBED STUBBY",30,21],["CANTED STUBBY",30,23],["FULL ANGLED",25,25],["QD GRIP POD",30,28],["CLASSIC GRIP POD",30,31],["CLASSIC VERTICAL",35,34],["STIPPLED STUBBY",35,36],["LOW-PROFILE STUBBY",45,39]]),
];

const m433Attachments: SourceBackedAttachmentDraft[] = [
  ...group("ammunition", [["FMJ",5,0],["TUNGSTEN CORE",5,16],["HOLLOW POINT",20,25],["FRANGIBLE",20,34],["POLYMER CASE",10,39]]),
  ...group("barrel", [["14.5\" STANDARD",15,0],["16.5\" RIFLE",10,20],["16.5\" FLUTED",20,29]]),
  ...withConflictSources("m433", group("barrel", [["18.9\" PROTOTYPE",null,5]])),
  ...group("ergonomics", [["MAGWELL FLARE",10,13],["MATCH TRIGGER",15,31]]),
  ...group("magazine", [["30RND MAGAZINE",5,0],["30RND FAST MAG",10,11],["20RND FAST MAG",5,14],["20RND MAGAZINE",5,19],["40RND FAST MAG",30,24],["36RND MAGAZINE",15,31],["40RND MAGAZINE",25,36]]),
  ...group("muzzle", [["HYBRID SUPPRESSOR (L)",30,0],["HYBRID SUPPRESSOR (K)",50,0],["HYBRID SUPPRESSOR (S)",40,0],["FLASH HIDER",10,0],["LINEAR COMP",10,6],["STANDARD SUPPRESSOR",20,8],["CQB SUPPRESSOR",30,18],["DOUBLE-PORT BRAKE",10,20],["LONG SUPPRESSOR",25,25],["COMPENSATED BRAKE",20,30],["LIGHTENED SUPPRESSOR",30,35]]),
  ...group("optic-accessory", [["CANTED IRON SIGHTS",5,15],["CANTED REFLEX",10,27]]),
  ...group("right-accessory", [["TACLIGHT - HIP",15,0],["TACLIGHT - AIMED",5,0],["FLASHLIGHT",10,3]]),
  ...group("scope", [["IRON SIGHTS",5,0],["SU-123 1.50X",10,0],["2PRO 1.25X",10,1],["OSA-7 1.00X",10,2],["1P87 1.50X",10,3],["R-MR 1.00X",10,5],["CCO 2.00X",10,7],["DVO 5.00X",null,10],["SDO 3.50X",10,10],["CQ RDS 1.25X",10,11],["3VZR 1.75X",10,12],["MINI FLEX 1.00X",10,12],["BAKER 3.00X",10,13],["R4T 2.00X",10,15],["DVO LPVO",25,19],["RO-M 1.75X",10,21],["ST PRISM 5.00X",10,22],["ROX 1.50X",10,23],["BF-2M 2.50X",10,24],["MARS-F LPVO",25,26],["PVQ-31 4.00X",10,27],["RO-S 1.25X",10,29],["MC-CO LPVO",25,32],["LDS 4.50X",10,34],["PAS-35 3.00X",25,36],["A-P2 1.75X",10,37],["SF-G2 5.00X",10,38],["GRIM 1.50X",25,40]]),
  ...group("top-accessory", [["50 MW VIOLET",10,0],["5 MW GREEN",10,2],["5 MW RED",10,6],["50 MW GREEN",20,17],["50 MW BLUE",20,33],["120 MW BLUE",30,37]]),
  ...group("underbarrel", [["UNDERSLUNG MOUNT",10,0],["CLASSIC VERTICAL",35,0],["FOLDING VERTICAL",10,1],["ALLOY VERTICAL",20,4],["RIBBED VERTICAL",20,7],["6H64 VERTICAL",25,9],["FOLDING STUBBY",20,14],["RIBBED STUBBY",30,16],["CANTED STUBBY",30,17],["FULL ANGLED",25,22],["STIPPLED STUBBY",35,23],["PTT GRIP POD",20,26],["ADJUSTABLE ANGLED",15,28],["LOW-PROFILE STUBBY",45,30],["BIPOD",10,32],["SLIM ANGLED",25,33],["QD GRIP POD",30,35],["CLASSIC GRIP POD",30,39]]),
];

const nvo228eAttachments: SourceBackedAttachmentDraft[] = [
  ...group("ammunition", [["FMJ",5,0],["HOLLOW POINT",20,15],["POLYMER CASE",10,20],["FRANGIBLE",20,27],["TUNGSTEN CORE",5,35]]),
  ...group("barrel", [["409MM FACTORY",10,0],["409MM CUT",15,20],["409MM FLUTED",20,30]]),
  ...withConflictSources("nvo-228e", group("barrel", [["458MM CUSTOM",null,10]])),
  ...group("ergonomics", [["MATCH TRIGGER",15,21]]),
  ...group("left-accessory", [["TACLIGHT - HIP",15,0],["TACLIGHT - AIMED",5,0],["FLASHLIGHT",10,5]]),
  ...group("magazine", [["30RND MAGAZINE",5,0],["30RND FAST MAG",10,3],["20RND FAST MAG",5,10],["40RND FAST MAG",30,18],["36RND MAGAZINE",15,25],["20RND MAGAZINE",5,30],["40RND MAGAZINE",25,40]]),
  ...group("muzzle", [["HYBRID SUPPRESSOR (L)",30,0],["HYBRID SUPPRESSOR (K)",50,0],["HYBRID SUPPRESSOR (S)",40,0],["FLASH HIDER",10,0],["SINGLE-PORT BRAKE",5,4],["LINEAR COMP",10,7],["DOUBLE-PORT BRAKE",10,11],["STANDARD SUPPRESSOR",20,23],["CQB SUPPRESSOR",30,28],["LONG SUPPRESSOR",25,29],["LIGHTENED SUPPRESSOR",30,36],["COMPENSATED BRAKE",20,38]]),
  ...group("optic-accessory", [["CANTED IRON SIGHTS",5,8],["CANTED REFLEX",10,17]]),
  ...group("right-accessory", [["50 MW VIOLET",10,0],["5 MW RED",10,3],["5 MW GREEN",10,6],["50 MW GREEN",20,22],["120 MW BLUE",30,32],["50 MW BLUE",20,39]]),
  ...group("scope", [["IRON SIGHTS",5,0],["CCO 2.00X",10,0],["SU-123 1.50X",10,1],["MINI FLEX 1.00X",10,2],["2PRO 1.25X",10,3],["R-MR 1.00X",10,4],["1P87 1.50X",10,5],["OSA-7 1.00X",10,6],["R4T 2.00X",10,8],["CQ RDS 1.25X",10,9],["DVO 5.00X",10,10],["3VZR 1.75X",10,12],["LDS 4.50X",10,13],["RO-S 1.25X",10,14],["DVO LPVO",25,15],["BAKER 3.00X",10,17],["ST PRISM 5.00X",10,18],["SDO 3.50X",10,19],["ROX 1.50X",10,23],["PVQ-31 4.00X",10,24],["BF-2M 2.50X",10,26],["RO-M 1.75X",10,27],["GRIM 1.50X",25,31],["MC-CO LPVO",25,32],["SF-G2 5.00X",10,33],["A-P2 1.75X",10,35],["MARS-F LPVO",25,36],["PAS-35 3.00X",25,37]]),
  ...group("underbarrel", [["FOLDING VERTICAL",10,2],["ALLOY VERTICAL",20,9],["SLIM ANGLED",25,11],["RIBBED VERTICAL",20,14],["6H64 VERTICAL",25,16],["CLASSIC VERTICAL",35,21],["FOLDING STUBBY",20,22],["FULL ANGLED",25,24],["RIBBED STUBBY",30,25],["CANTED STUBBY",30,28],["BIPOD",10,33],["LOW-PROFILE STUBBY",45,34],["STIPPLED STUBBY",35,34],["PTT GRIP POD",20,37],["QD GRIP POD",30,38],["CLASSIC GRIP POD",30,40]]),
];

const tr7Attachments: SourceBackedAttachmentDraft[] = [
  ...group("ammunition", [["FMJ",5,0],["TUNGSTEN CORE",5,13],["FRANGIBLE",20,14],["HOLLOW POINT",20,22],["POLYMER CASE",10,32]]),
  ...group("barrel", [["17\" FACTORY",10,0],["20\" LONG",15,7],["432MM FLUTED",20,25],["17\" CUT",15,40]]),
  ...group("ergonomics", [["IMPROVED MAG CATCH",5,23],["MATCH TRIGGER",15,25]]),
  ...group("magazine", [["20RND MAGAZINE",5,0],["20RND FAST MAG",10,10],["15RND MAGAZINE",5,12],["10RND FAST MAG",5,17],["25RND MAGAZINE",20,26],["30RND MAGAZINE",40,30],["25RND FAST MAG",25,35]]),
  ...group("muzzle", [["HYBRID SUPPRESSOR (S)",40,0],["HYBRID SUPPRESSOR (L)",30,0],["DOUBLE-PORT BRAKE",10,0],["HYBRID SUPPRESSOR (K)",50,0],["FLASH HIDER",10,4],["STANDARD SUPPRESSOR",20,14],["LINEAR COMP",10,19],["SINGLE-PORT BRAKE",5,23],["CQB SUPPRESSOR",30,24],["LONG SUPPRESSOR",25,29],["COMPENSATED BRAKE",20,31],["LIGHTENED SUPPRESSOR",30,34]]),
  ...group("optic-accessory", [["CANTED IRON SIGHTS",5,16],["CANTED REFLEX",10,36]]),
  ...group("right-accessory", [["TACLIGHT - AIMED",5,0],["TACLIGHT - HIP",15,0],["FLASHLIGHT",10,2]]),
  ...group("scope", [["IRON SIGHTS",5,0],["2PRO 1.25X",10,0],["OSA-7 1.00X",10,1],["MINI FLEX 1.00X",10,2],["3VZR 1.75X",10,4],["1P87 1.50X",10,6],["PVQ-31 4.00X",10,8],["R-MR 1.00X",10,9],["SU-123 1.50X",10,12],["RO-M 1.75X",10,13],["CCO 2.00X",10,15],["R4T 2.00X",10,16],["CQ RDS 1.25X",10,17],["DVO LPVO",25,18],["BAKER 3.00X",10,20],["RO-S 1.25X",10,21],["ROX 1.50X",10,26],["MARS-F LPVO",25,27],["SDO 3.50X",10,28],["PAS-35 3.00X",25,29],["A-P2 1.75X",10,30],["ST PRISM 5.00X",10,31],["BF-2M 2.50X",10,34],["SF-G2 5.00X",10,37],["MC-CO LPVO",25,38],["LDS 4.50X",10,39],["GRIM 1.50X",25,40]]),
  ...group("top-accessory", [["50 MW VIOLET",10,0],["5 MW RED",10,6],["5 MW GREEN",10,11],["50 MW GREEN",20,18],["50 MW BLUE",20,22],["120 MW BLUE",30,33]]),
  ...group("underbarrel", [["FOLDING VERTICAL",10,1],["ALLOY VERTICAL",20,3],["RIBBED VERTICAL",20,5],["6H64 VERTICAL",25,9],["FOLDING STUBBY",20,11],["RIBBED STUBBY",30,15],["CLASSIC VERTICAL",35,19],["PTT GRIP POD",20,21],["LOW-PROFILE STUBBY",45,24],["QD GRIP POD",30,28],["BIPOD",10,32],["CLASSIC GRIP POD",30,35],["CANTED STUBBY",30,37],["STIPPLED STUBBY",35,39]]),
];

const records = buildSourceBackedWeaponBatch([
  {
    id: "m4a1", name: "M4A1", categoryId: "carbines", careerUnlockLevel: 2,
    slots: slotsFor(m4a1Attachments), attachments: m4a1Attachments,
    sources: sourcesFor("m4a1", "M4A1"), defaultAttachmentSourceIds: ["rnkd-m4a1-2026-09-10"],
    baseStatEvidence: statEvidence("rnkd-m4a1-2026-09-10", { damage:26,rpm:900,velocity:472,magazine:30,reloadMs:2200,adsMs:200,headshot:1.4,mobility:60,hipfire:54,precision:25,control:36 }),
  },
  {
    id: "ak-205", name: "AK-205", categoryId: "carbines", careerUnlockLevel: 22,
    slots: slotsFor(ak205Attachments), attachments: ak205Attachments,
    sources: sourcesFor("ak-205", "AK-205"), defaultAttachmentSourceIds: ["rnkd-ak-205-2026-09-10"],
    baseStatEvidence: statEvidence("rnkd-ak-205-2026-09-10", { damage:20,rpm:720,velocity:708,magazine:30,reloadMs:2484,adsMs:200,headshot:1.4,mobility:60,hipfire:47,precision:88,control:57 }),
  },
  {
    id: "qbz-192", name: "QBZ-192", categoryId: "carbines",
    slots: slotsFor(qbz192Attachments), attachments: qbz192Attachments,
    sources: sourcesFor("qbz-192", "QBZ-192"), defaultAttachmentSourceIds: ["rnkd-qbz-192-2026-09-10"],
    baseStatEvidence: [
      ...statEvidence("rnkd-qbz-192-2026-09-10", { damage:26,rpm:771,velocity:608,magazine:30,reloadMs:2567,adsMs:200,headshot:1.4,mobility:56,hipfire:47,precision:33,control:44 }),
      { metricId: "unlock.careerLevel", observations: [
        { value: 1, unit: "rank", sourceId: "rnkd-qbz-192-2026-09-10" },
        { value: 15, unit: "rank", sourceId: "battlefieldmeta-qbz-192-2026-09-10" },
      ] },
    ],
  },
  {
    id: "m433", name: "M433", categoryId: "assault-rifles", careerUnlockLevel: 1,
    slots: slotsFor(m433Attachments), attachments: m433Attachments,
    sources: sourcesFor("m433", "M433"), defaultAttachmentSourceIds: ["rnkd-m433-2026-09-10"],
    baseStatEvidence: statEvidence("rnkd-m433-2026-09-10", { damage:26,rpm:830,velocity:504,magazine:30,reloadMs:2384,adsMs:250,headshot:1.4,mobility:46,hipfire:47,precision:22,control:53 }),
  },
  {
    id: "nvo-228e", name: "NVO-228E", categoryId: "assault-rifles", careerUnlockLevel: 5,
    slots: slotsFor(nvo228eAttachments), attachments: nvo228eAttachments,
    sources: sourcesFor("nvo-228e", "NVO-228E"), defaultAttachmentSourceIds: ["rnkd-nvo-228e-2026-09-10"],
    baseStatEvidence: statEvidence("rnkd-nvo-228e-2026-09-10", { damage:35,rpm:654,velocity:626,magazine:30,reloadMs:2500,adsMs:250,headshot:1.4,mobility:52,hipfire:40,precision:25,control:41 }),
  },
  {
    id: "tr-7", name: "TR-7", categoryId: "assault-rifles", careerUnlockLevel: 50,
    slots: slotsFor(tr7Attachments), attachments: tr7Attachments,
    sources: sourcesFor("tr-7", "TR-7"), defaultAttachmentSourceIds: ["rnkd-tr-7-2026-09-10"],
    baseStatEvidence: statEvidence("rnkd-tr-7-2026-09-10", { damage:35,rpm:720,velocity:604,magazine:20,reloadMs:2400,adsMs:250,headshot:1.4,mobility:52,hipfire:40,precision:17,control:28 }),
  },
]);

export const [
  m4a1WeaponRecord,
  ak205WeaponRecord,
  qbz192WeaponRecord,
  m433WeaponRecord,
  nvo228eWeaponRecord,
  tr7WeaponRecord,
] = records as readonly WeaponDataRecord[];

export const automaticRifleWeaponRecords = records;
