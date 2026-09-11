import { inspectWeaponEngineReadiness } from "./engine-materialization";
import { SOURCE_BACKED_WEAPONS } from "./source-backed-weapons";
import type { WeaponAttachmentRecord, WeaponAttachmentSlotId, WeaponDataRecord } from "./types";

export interface PublicCatalogAttachment {
  id: string;
  name: string;
  slotId: WeaponAttachmentSlotId;
  slotLabel: string;
  costPoints: number | null;
  unlock: WeaponAttachmentRecord["unlock"];
}

export interface PublicCatalogWeapon {
  id: string;
  name: string;
  classId: string;
  usageProfile: string;
  description: string;
  thumbnail: { src: string | null; alt: string };
  budgetPoints: number;
  careerUnlockLevel?: number;
  mastery: {
    minRank: number;
    maxRank: number;
    milestones: Array<{ rank: number; tier: "Bronze" | "Prata" | "Ouro" | "Platina" | "Elite" }>;
  };
  dataStatus: "source-backed";
  engineReady: boolean;
  engineDiagnostics: readonly string[];
  accessories: PublicCatalogAttachment[];
}

export interface PublicWeaponCatalog {
  classes: Array<{ id: string; label: string; shortLabel: string }>;
  weapons: PublicCatalogWeapon[];
}

const SLOT_LABELS: Record<WeaponAttachmentSlotId, string> = {
  scope: "Mira",
  "optic-accessory": "Acessório de mira",
  muzzle: "Boca",
  barrel: "Cano",
  underbarrel: "Inferior",
  magazine: "Carregador",
  ammunition: "Munição",
  ergonomics: "Ergonomia",
  "top-accessory": "Acessório superior",
  "left-accessory": "Acessório esquerdo",
  "right-accessory": "Acessório direito",
};

const CLASS_PRESENTATION: Record<string, { label: string; shortLabel: string }> = {
  "assault-rifles": { label: "Fuzis de assalto", shortLabel: "Fuzis" },
  carbines: { label: "Carabinas", shortLabel: "Carabinas" },
  dmrs: { label: "DMRs", shortLabel: "DMRs" },
  smgs: { label: "SMGs", shortLabel: "SMGs" },
  lmgs: { label: "LMGs", shortLabel: "LMGs" },
  snipers: { label: "Snipers", shortLabel: "Snipers" },
  shotguns: { label: "Escopetas", shortLabel: "Escopetas" },
  secondaries: { label: "Secundárias", shortLabel: "Secundárias" },
};

function classIdFor(weapon: WeaponDataRecord): string {
  switch (weapon.categoryId) {
    case "dmr": return "dmrs";
    case "assault-rifles": return "assault-rifles";
    case "carbines": return "carbines";
    case "smt": return "smgs";
    case "ml": return "lmgs";
    case "sniper-rifles": return "snipers";
    case "shotguns": return "shotguns";
    case "secondary": return "secondaries";
  }
}

const PRESENTATION_BY_ID: Record<string, { usageProfile: string; description: string }> = {
  "svk-86": {
    usageProfile: "Precisão · alto impacto",
    description: "DMR semiautomática de alto impacto. O catálogo de acessórios, custos e desbloqueios já usa dados source-backed; os efeitos técnicos ainda estão em validação antes de alimentar o engine.",
  },
  svdm: {
    usageProfile: "Precisão · longo alcance",
    description: "DMR semiautomática orientada a tiros cadenciados em média e longa distância. A arma já usa catálogo source-backed; custos conflitantes e efeitos técnicos continuam bloqueados até reconciliação.",
  },
  m4a1: {
    usageProfile: "Curta distância · alta cadência",
    description: "Carabina automática de alta cadência para curta e média distância. Inventário, custos e desbloqueios de maestria já vêm do catálogo source-backed.",
  },
  "ak-205": {
    usageProfile: "Longo alcance · controle",
    description: "Carabina automática orientada a estabilidade e precisão sustentada. O catálogo real já substitui o mock; efeitos técnicos permanecem em validação.",
  },
  "qbz-192": {
    usageProfile: "Longo alcance · versátil",
    description: "Carabina automática equilibrada para média e longa distância. O nível de desbloqueio de carreira permanece em conflito entre fontes e não é inventado.",
  },
  m433: {
    usageProfile: "Curta distância · agressivo",
    description: "Fuzil de assalto de alta cadência para curta e média distância. Acessórios e progressão de maestria usam o registro source-backed.",
  },
  "nvo-228e": {
    usageProfile: "Longo alcance · alto impacto",
    description: "Fuzil de assalto de dano elevado para média distância. O nome e a classe foram corrigidos durante a migração source-backed.",
  },
  "tr-7": {
    usageProfile: "Curta distância · alto impacto",
    description: "Fuzil de assalto automático de alto impacto. O catálogo real já cobre o inventário principal de acessórios e seus desbloqueios de maestria.",
  },
};

function presentationFor(weapon: WeaponDataRecord) {
  return PRESENTATION_BY_ID[weapon.id] ?? {
    usageProfile: "Em validação",
    description: "Dados source-backed em validação.",
  };
}

function toPublicWeapon(weapon: WeaponDataRecord): PublicCatalogWeapon {
  const readiness = inspectWeaponEngineReadiness(weapon);
  const presentation = presentationFor(weapon);
  return {
    id: weapon.id,
    name: weapon.name,
    classId: classIdFor(weapon),
    ...presentation,
    thumbnail: {
      src: null,
      alt: `Thumbnail de ${weapon.name}`,
    },
    budgetPoints: weapon.budget,
    careerUnlockLevel: weapon.careerUnlockLevel,
    mastery: {
      minRank: Math.max(1, weapon.mastery.minRank),
      maxRank: weapon.mastery.maxRank,
      milestones: [
        { rank: 10, tier: "Bronze" },
        { rank: 20, tier: "Prata" },
        { rank: 30, tier: "Ouro" },
        { rank: 40, tier: "Platina" },
        { rank: 50, tier: "Elite" },
      ],
    },
    dataStatus: "source-backed",
    engineReady: readiness.ready,
    engineDiagnostics: readiness.diagnostics,
    accessories: weapon.attachments.map((attachment) => ({
      id: attachment.id,
      name: attachment.name,
      slotId: attachment.slotId,
      slotLabel: SLOT_LABELS[attachment.slotId],
      costPoints: attachment.costPoints,
      unlock: attachment.unlock,
    })),
  };
}

export function getPublicWeaponCatalog(): PublicWeaponCatalog {
  const weapons = SOURCE_BACKED_WEAPONS.map(toPublicWeapon);
  const classIds = [...new Set(weapons.map((weapon) => weapon.classId))];

  return {
    classes: classIds.map((id) => ({
      id,
      ...(CLASS_PRESENTATION[id] ?? { label: id, shortLabel: id }),
    })),
    weapons,
  };
}
