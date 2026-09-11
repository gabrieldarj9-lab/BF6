import type {
  CatalogAttachment,
  CatalogWeapon,
  WeaponCatalog,
} from "@/features/catalog/model"

type ApiCatalogWeapon = Omit<CatalogWeapon, "accessories" | "attachmentInventory" | "dataStatus"> & {
  dataStatus: "source-backed"
  legacyMockId?: string
  accessories: CatalogAttachment[]
}

type ApiCatalogResponse = {
  classes: WeaponCatalog["classes"]
  weapons: ApiCatalogWeapon[]
}

type ApiEnvelope<T> = { data: T }

export async function loadSourceBackedCatalog(): Promise<ApiCatalogResponse> {
  const response = await fetch("/v1/catalog")
  if (!response.ok) throw new Error(`Falha ao carregar catálogo real: HTTP ${response.status}`)
  const body = (await response.json()) as ApiEnvelope<ApiCatalogResponse>
  return body.data
}

function toCatalogWeapon(weapon: ApiCatalogWeapon): CatalogWeapon {
  const { legacyMockId: _legacyMockId, ...catalogWeapon } = weapon
  return {
    ...catalogWeapon,
    dataStatus: "source-backed",
    attachmentInventory: weapon.accessories,
    accessories: weapon.accessories.slice(0, 6).map((accessory) => ({
      id: accessory.id,
      slotId: accessory.slotId,
      slotLabel: accessory.slotLabel,
      name: accessory.name,
    })),
  }
}

export function mergeSourceBackedCatalog(
  baseCatalog: WeaponCatalog,
  sourceCatalog: ApiCatalogResponse,
): WeaponCatalog {
  const sourceWeapons = sourceCatalog.weapons.map(toCatalogWeapon)
  const replacedLegacyIds = new Set(
    sourceCatalog.weapons
      .map((weapon) => weapon.legacyMockId)
      .filter((id): id is string => Boolean(id)),
  )
  const sourceIds = new Set(sourceWeapons.map((weapon) => weapon.id))

  const classesById = new Map(baseCatalog.classes.map((weaponClass) => [weaponClass.id, weaponClass]))
  for (const weaponClass of sourceCatalog.classes) classesById.set(weaponClass.id, weaponClass)

  return {
    classes: [...classesById.values()],
    weapons: [
      ...baseCatalog.weapons.filter((weapon) => !sourceIds.has(weapon.id) && !replacedLegacyIds.has(weapon.id)),
      ...sourceWeapons,
    ],
  }
}
