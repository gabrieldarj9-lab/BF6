import type { ReactNode } from "react"

import { Badge } from "@/components/ui/badge"
import { buildMockAttachmentLoadout } from "@/features/catalog/mock-attachment-system"
import type {
  CatalogAttachment,
  CatalogWeapon,
  CatalogWeaponClass,
  WeaponAttachmentLoadoutItem,
  WeaponAttachmentSlotId,
} from "@/features/catalog/model"

type WeaponHeaderProps = {
  weapon: CatalogWeapon
  weaponClass: CatalogWeaponClass
  controls?: ReactNode
}

const DEFAULT_WEAPON_THUMBNAIL = "/weapons/weapon-placeholder.svg"

function AttachmentValue({ accessory }: { accessory: WeaponAttachmentLoadoutItem }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-sm font-medium" title={accessory.name}>{accessory.name}</p>
        <span className="shrink-0 font-data text-[10px] tabular-nums text-muted-foreground">{accessory.costPoints} pts</span>
      </div>
      <p className="mt-0.5 font-data text-[10px] uppercase tracking-wide text-muted-foreground">{accessory.slotLabel}</p>
    </div>
  )
}

function CatalogAttachmentValue({ accessory }: { accessory: CatalogAttachment }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-sm font-medium" title={accessory.name}>{accessory.name}</p>
        <span className="shrink-0 font-data text-[10px] tabular-nums text-muted-foreground">
          {accessory.costPoints === null ? "—" : `${accessory.costPoints} pts`}
        </span>
      </div>
      <p className="mt-0.5 truncate font-data text-[10px] uppercase tracking-wide text-muted-foreground" title={accessory.unlock.label}>
        {accessory.slotLabel} · {accessory.unlock.label}
      </p>
    </div>
  )
}

function firstBySlots(inventory: CatalogAttachment[], slotIds: WeaponAttachmentSlotId[]) {
  return inventory.find((accessory) => slotIds.includes(accessory.slotId))
}

function SourceBackedAccessories({ weapon }: { weapon: CatalogWeapon }) {
  const inventory = weapon.attachmentInventory ?? []
  const scope = firstBySlots(inventory, ["scope"])
  const ergonomics = firstBySlots(inventory, ["underbarrel", "ergonomics"])
  const lasers = inventory.filter((accessory) =>
    accessory.slotId === "top-accessory" && /MW|LASER/i.test(accessory.name),
  ).slice(0, 2)
  const otherAccessories = ["muzzle", "barrel", "magazine", "ammunition", "left-accessory"]
    .map((slotId) => firstBySlots(inventory, [slotId as WeaponAttachmentSlotId]))
    .filter((accessory): accessory is CatalogAttachment => Boolean(accessory))

  return (
    <>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium">Catálogo de acessórios</p>
            <Badge variant="outline" className="border-[var(--bf-positive)]/30 text-[var(--bf-positive)]">Dados reais</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {inventory.length} acessórios catalogados. A build ainda não é calculada até os efeitos técnicos serem validados.
          </p>
        </div>
        <Badge variant="secondary" className="font-data tabular-nums">até {weapon.budgetPoints ?? 100} pts</Badge>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3" aria-label="Acessórios reais em destaque">
        <div className="min-w-0 rounded-lg border bg-card/40 px-3 py-2.5">
          <p className="mb-2 font-data text-[10px] uppercase tracking-[0.12em] text-primary">Mira</p>
          {scope ? <CatalogAttachmentValue accessory={scope} /> : <p className="text-xs text-muted-foreground">Sem dado</p>}
        </div>
        <div className="min-w-0 rounded-lg border bg-card/40 px-3 py-2.5">
          <p className="mb-2 font-data text-[10px] uppercase tracking-[0.12em] text-primary">Ergonomia</p>
          {ergonomics ? <CatalogAttachmentValue accessory={ergonomics} /> : <p className="text-xs text-muted-foreground">Sem dado</p>}
        </div>
        <div className="min-w-0 rounded-lg border bg-card/40 px-3 py-2.5">
          <p className="mb-2 font-data text-[10px] uppercase tracking-[0.12em] text-primary">Laser</p>
          <div className="divide-y">
            {lasers.length ? lasers.map((accessory, index) => (
              <div key={accessory.id} className={index ? "pt-2" : lasers.length > 1 ? "pb-2" : ""}>
                <CatalogAttachmentValue accessory={accessory} />
              </div>
            )) : <p className="text-xs text-muted-foreground">Sem dado</p>}
          </div>
        </div>
      </div>

      <div className="mt-2 rounded-lg border bg-muted/15 px-3 py-2.5" aria-label="Demais acessórios reais">
        <p className="mb-2 font-data text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Demais</p>
        <div className="grid gap-x-4 gap-y-2 sm:grid-cols-2 xl:grid-cols-3">
          {otherAccessories.map((accessory) => (
            <div key={accessory.id} className="min-w-0 border-l pl-2.5">
              <CatalogAttachmentValue accessory={accessory} />
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

function MockAccessories({ weapon }: { weapon: CatalogWeapon }) {
  const attachmentLoadout = buildMockAttachmentLoadout(weapon)
  const bySlot = new Map(attachmentLoadout.items.map((item) => [item.slotId, item]))
  const scope = bySlot.get("scope")
  const ergonomics = bySlot.get("ergonomics")
  const lasers = [bySlot.get("top-accessory"), bySlot.get("right-accessory")].filter(
    (item): item is WeaponAttachmentLoadoutItem => Boolean(item),
  )
  const otherAccessories = attachmentLoadout.items.filter((item) =>
    ["muzzle", "barrel", "underbarrel", "magazine", "ammunition"].includes(item.slotId),
  )

  return (
    <>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">Acessórios</p>
          <p className="text-xs text-muted-foreground">Configuração mockada para validar o sistema de 100 pontos.</p>
        </div>
        <Badge variant="secondary" className="font-data tabular-nums">
          {attachmentLoadout.usedPoints}/{attachmentLoadout.maxPoints} pts
        </Badge>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3" aria-label="Acessórios em destaque">
        <div className="min-w-0 rounded-lg border bg-card/40 px-3 py-2.5">
          <p className="mb-2 font-data text-[10px] uppercase tracking-[0.12em] text-primary">Mira</p>
          {scope ? <AttachmentValue accessory={scope} /> : <p className="text-xs text-muted-foreground">Sem mira</p>}
        </div>
        <div className="min-w-0 rounded-lg border bg-card/40 px-3 py-2.5">
          <p className="mb-2 font-data text-[10px] uppercase tracking-[0.12em] text-primary">Ergonomia</p>
          {ergonomics ? <AttachmentValue accessory={ergonomics} /> : <p className="text-xs text-muted-foreground">Sem ergonomia</p>}
        </div>
        <div className="min-w-0 rounded-lg border bg-card/40 px-3 py-2.5">
          <p className="mb-2 font-data text-[10px] uppercase tracking-[0.12em] text-primary">Laser</p>
          <div className="divide-y">
            {lasers.map((accessory, index) => (
              <div key={accessory.id} className={index ? "pt-2" : "pb-2"}>
                <AttachmentValue accessory={accessory} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-2 rounded-lg border bg-muted/15 px-3 py-2.5" aria-label="Demais acessórios">
        <p className="mb-2 font-data text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Demais</p>
        <div className="grid gap-x-4 gap-y-2 sm:grid-cols-2 xl:grid-cols-3">
          {otherAccessories.map((accessory) => (
            <div key={accessory.id} className="min-w-0 border-l pl-2.5">
              <AttachmentValue accessory={accessory} />
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

export function WeaponHeader({ weapon, weaponClass, controls }: WeaponHeaderProps) {
  const thumbnailSrc = weapon.thumbnail.src ?? DEFAULT_WEAPON_THUMBNAIL
  const isSourceBacked = weapon.dataStatus === "source-backed"

  return (
    <section className="grid gap-6 border-b pb-6 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start" aria-labelledby="weapon-title">
      <div className="grid min-w-0 gap-5 md:grid-cols-[260px_minmax(0,1fr)] md:items-start">
        <div className="aspect-[16/10] overflow-hidden rounded-xl border bg-muted/30">
          <img src={thumbnailSrc} alt={weapon.thumbnail.alt} className="h-full w-full object-contain p-3" />
        </div>

        <div className="min-w-0">
          <p className="font-data text-xs uppercase tracking-[0.14em] text-muted-foreground">{weaponClass.label}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 id="weapon-title" className="min-w-0 text-3xl font-bold tracking-tight sm:text-4xl">{weapon.name}</h1>
            <Badge variant="outline" className="border-primary/40 text-primary">{weapon.usageProfile}</Badge>
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{weapon.description}</p>
          {isSourceBacked ? <SourceBackedAccessories weapon={weapon} /> : <MockAccessories weapon={weapon} />}
        </div>
      </div>

      {controls ? <div className="xl:pt-0">{controls}</div> : null}
    </section>
  )
}
