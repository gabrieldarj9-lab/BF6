export type WeaponThumbnail = {
  src: string | null
  alt: string
}

export type WeaponAccessoryPreview = {
  id: string
  slotId: string
  slotLabel: string
  name: string
}

export type WeaponAttachmentSlotId =
  | "scope"
  | "optic-accessory"
  | "muzzle"
  | "barrel"
  | "underbarrel"
  | "magazine"
  | "ammunition"
  | "ergonomics"
  | "top-accessory"
  | "right-accessory"

export type WeaponAttachmentSlot = {
  id: WeaponAttachmentSlotId
  label: string
  description: string
}

export type WeaponAttachmentLoadoutItem = {
  id: string
  slotId: WeaponAttachmentSlotId
  slotLabel: string
  name: string
  costPoints: number
  isMock: boolean
}

export type WeaponAttachmentLoadout = {
  maxPoints: number
  usedPoints: number
  items: WeaponAttachmentLoadoutItem[]
}

export type WeaponMasteryTier = "Bronze" | "Prata" | "Ouro" | "Platina" | "Elite"

export type WeaponMasteryMilestone = {
  rank: number
  tier: WeaponMasteryTier
}

export type WeaponMasteryProgression = {
  minRank: number
  maxRank: number
  milestones: WeaponMasteryMilestone[]
}

export type CatalogWeaponClass = {
  id: string
  label: string
  shortLabel: string
}

export type CatalogWeapon = {
  id: string
  name: string
  classId: string
  usageProfile: string
  description: string
  thumbnail: WeaponThumbnail
  accessories: WeaponAccessoryPreview[]
  mastery: WeaponMasteryProgression
}

export type WeaponCatalog = {
  classes: CatalogWeaponClass[]
  weapons: CatalogWeapon[]
}

export function getCatalogClass(catalog: WeaponCatalog, classId: string) {
  return catalog.classes.find((item) => item.id === classId)
}

export function getCatalogWeapon(catalog: WeaponCatalog, weaponId: string) {
  return catalog.weapons.find((item) => item.id === weaponId)
}

export function getWeaponsForClass(catalog: WeaponCatalog, classId: string) {
  return catalog.weapons.filter((weapon) => weapon.classId === classId)
}
