import type { ReactNode } from "react"
import { ImageIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type {
  CatalogWeapon,
  CatalogWeaponClass,
} from "@/features/catalog/model"

type WeaponHeaderProps = {
  weapon: CatalogWeapon
  weaponClass: CatalogWeaponClass
  controls?: ReactNode
}

export function WeaponHeader({ weapon, weaponClass, controls }: WeaponHeaderProps) {
  return (
    <section className="grid gap-6 border-b pb-6 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start" aria-labelledby="weapon-title">
      <div className="grid min-w-0 gap-5 md:grid-cols-[260px_minmax(0,1fr)] md:items-start">
        <div className="aspect-[16/10] overflow-hidden rounded-xl border bg-muted/30">
          {weapon.thumbnail.src ? (
            <img
              src={weapon.thumbnail.src}
              alt={weapon.thumbnail.alt}
              className="h-full w-full object-contain p-4"
            />
          ) : (
            <div className="grid h-full place-items-center p-5 text-center text-muted-foreground">
              <div>
                <div className="mx-auto grid size-10 place-items-center rounded-lg border bg-background/60">
                  <ImageIcon className="size-4" aria-hidden="true" />
                </div>
                <p className="mt-3 text-xs">Thumbnail indisponível</p>
              </div>
            </div>
          )}
        </div>

        <div className="min-w-0">
          <p className="font-data text-xs uppercase tracking-[0.14em] text-muted-foreground">{weaponClass.label}</p>

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 id="weapon-title" className="min-w-0 text-3xl font-bold tracking-tight sm:text-4xl">{weapon.name}</h1>
            <Badge variant="outline" className="border-primary/40 text-primary">{weapon.usageProfile}</Badge>
          </div>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{weapon.description}</p>

          {weapon.accessories.length ? (
            <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-3" aria-label="Acessórios de referência">
              {weapon.accessories.map((accessory) => (
                <div key={accessory.id} className="min-w-0 rounded-lg border bg-card/40 px-3 py-2.5">
                  <p className="font-data text-[10px] uppercase tracking-wide text-muted-foreground">{accessory.slotLabel}</p>
                  <p className="mt-1 truncate text-sm font-medium" title={accessory.name}>{accessory.name}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {controls ? <div className="xl:pt-0">{controls}</div> : null}
    </section>
  )
}
