import { inspectWeaponEngineReadiness } from "./engine-materialization";
import type { WeaponAttachmentRecord, WeaponAttachmentSlotId, WeaponDataRecord } from "./types";
import { svk86WeaponRecord } from "./weapons/svk-86";

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

function presentationFor(weapon: WeaponDataRecord) {
  if (weapon.id === "svk-86") {
    return {
      usageProfile: "Precisão · alto impacto",
      description: "DMR semiautomática de alto impacto. O catálogo de acessórios, custos e desbloqueios já usa dados source-backed; os efeitos técnicos ainda estão em validação antes de alimentar o engine.",
    };
  }
  return {
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
      // Algumas fontes representam os itens padrão como rank 0 internamente.
      // A superfície pública usa a jornada visível ao jogador: M1–M50.
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

export const SOURCE_BACKED_WEAPONS: readonly WeaponDataRecord[] = [svk86WeaponRecord];

export function getPublicWeaponCatalog(): PublicWeaponCatalog {
  return {
    classes: [
      { id: "dmrs", label: "DMRs", shortLabel: "DMRs" },
    ],
    weapons: SOURCE_BACKED_WEAPONS.map(toPublicWeapon),
  };
}
