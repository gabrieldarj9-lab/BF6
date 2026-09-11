import type {
  CatalogWeapon,
  WeaponAttachmentLoadout,
  WeaponAttachmentLoadoutItem,
  WeaponAttachmentSlot,
  WeaponAttachmentSlotId,
  WeaponAccessoryPreview,
} from "@/features/catalog/model"

type MockLoadoutSlotId = Exclude<WeaponAttachmentSlotId, "optic-accessory" | "left-accessory">

export const WEAPON_ATTACHMENT_SLOTS: WeaponAttachmentSlot[] = [
  { id: "scope", label: "Mira", description: "Óptica principal e nível de zoom." },
  { id: "optic-accessory", label: "Acessório de mira", description: "Acessórios complementares da óptica, como miras inclinadas ou piggyback." },
  { id: "muzzle", label: "Boca", description: "Controle de recuo, assinatura sonora e clarão do disparo." },
  { id: "barrel", label: "Cano", description: "Comportamento de manejo, velocidade e precisão em diferentes distâncias." },
  { id: "underbarrel", label: "Inferior", description: "Empunhaduras, bipés e acessórios de controle." },
  { id: "magazine", label: "Carregador", description: "Capacidade e características de recarga." },
  { id: "ammunition", label: "Munição", description: "Tipo de projétil, dano e penetração." },
  { id: "ergonomics", label: "Ergonomia", description: "Aprimoramentos de manejo, recarga e resposta da arma." },
  { id: "top-accessory", label: "Acessório superior", description: "Lasers e outros acessórios montados no trilho superior." },
  { id: "left-accessory", label: "Acessório esquerdo", description: "Lanternas e acessórios laterais quando suportados pela arma." },
  { id: "right-accessory", label: "Acessório direito", description: "Lasers e lanternas montados no lado direito." },
]

export const MOCK_MAX_ATTACHMENT_POINTS = 100

const SLOT_COSTS: Record<MockLoadoutSlotId, number> = {
  scope: 10,
  muzzle: 20,
  barrel: 10,
  underbarrel: 20,
  magazine: 10,
  ammunition: 5,
  ergonomics: 5,
  "top-accessory": 10,
  "right-accessory": 10,
}

const DEFAULT_NAMES: Record<MockLoadoutSlotId, string> = {
  scope: "RO-M 1.75X",
  muzzle: "Flash Comp",
  barrel: "Cano padrão",
  underbarrel: "Empunhadura vertical",
  magazine: "Carregador padrão",
  ammunition: "FMJ",
  ergonomics: "Improved Mag Catch",
  "top-accessory": "50 MW Green",
  "right-accessory": "5 MW Red",
}

const LOADOUT_SLOT_ORDER: MockLoadoutSlotId[] = [
  "scope",
  "muzzle",
  "barrel",
  "underbarrel",
  "magazine",
  "ammunition",
  "ergonomics",
  "top-accessory",
  "right-accessory",
]

function normalizeLegacySlot(accessory: WeaponAccessoryPreview): MockLoadoutSlotId | null {
  switch (accessory.slotId) {
    case "optic":
    case "sight":
    case "scope":
      return "scope"
    case "muzzle":
      return "muzzle"
    case "barrel":
      return "barrel"
    case "underbarrel":
      return "underbarrel"
    case "magazine":
      return "magazine"
    case "ammunition":
      return "ammunition"
    case "stock":
    case "grip":
    case "ergonomics":
      return "ergonomics"
    case "laser":
    case "top-accessory":
      return "top-accessory"
    case "right-accessory":
      return "right-accessory"
    default:
      return null
  }
}

function slotLabel(slotId: WeaponAttachmentSlotId) {
  return WEAPON_ATTACHMENT_SLOTS.find((slot) => slot.id === slotId)?.label ?? slotId
}

export function buildMockAttachmentLoadout(weapon: CatalogWeapon): WeaponAttachmentLoadout {
  const preferredBySlot = new Map<MockLoadoutSlotId, WeaponAccessoryPreview>()

  for (const accessory of weapon.accessories) {
    const slotId = normalizeLegacySlot(accessory)
    if (slotId && !preferredBySlot.has(slotId)) preferredBySlot.set(slotId, accessory)
  }

  const items: WeaponAttachmentLoadoutItem[] = LOADOUT_SLOT_ORDER.map((slotId) => {
    const preferred = preferredBySlot.get(slotId)
    return {
      id: preferred?.id ?? `${weapon.id}-${slotId}-mock`,
      slotId,
      slotLabel: slotLabel(slotId),
      name: preferred?.name ?? DEFAULT_NAMES[slotId],
      costPoints: SLOT_COSTS[slotId],
      isMock: true,
    }
  })

  return {
    maxPoints: MOCK_MAX_ATTACHMENT_POINTS,
    usedPoints: items.reduce((total, item) => total + item.costPoints, 0),
    items,
  }
}
