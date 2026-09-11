import { Check, ChevronDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  getWeaponsForClass,
  type WeaponCatalog,
} from "@/features/catalog/model"

type WeaponNavigationProps = {
  catalog: WeaponCatalog
  selectedClassId: string
  selectedWeaponId: string
  onSelectClass: (classId: string) => void
  onSelectWeapon: (weaponId: string) => void
}

export function WeaponNavigation({
  catalog,
  selectedClassId,
  selectedWeaponId,
  onSelectClass,
  onSelectWeapon,
}: WeaponNavigationProps) {
  const selectedClass = catalog.classes.find((item) => item.id === selectedClassId) ?? catalog.classes[0]

  if (!selectedClass) return null

  const selectedClassWeapons = getWeaponsForClass(catalog, selectedClass.id)

  return (
    <aside className="border-b bg-sidebar lg:min-h-[calc(100vh-3.5rem)] lg:border-r lg:border-b-0">
      <div className="lg:sticky lg:top-14">
        <div className="border-b p-3 lg:hidden">
          <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Classes</p>
          <nav className="flex gap-1 overflow-x-auto pb-1" aria-label="Classes de arma">
            {catalog.classes.map((item) => (
              <Button
                key={item.id}
                type="button"
                variant={item.id === selectedClassId ? "secondary" : "ghost"}
                size="sm"
                className="shrink-0"
                aria-pressed={item.id === selectedClassId}
                onClick={() => onSelectClass(item.id)}
              >
                {item.shortLabel}
              </Button>
            ))}
          </nav>
        </div>

        <div className="p-3 lg:hidden">
          <div className="mb-2 flex items-center justify-between px-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Armas</p>
            <span className="font-data text-[11px] text-muted-foreground">{selectedClassWeapons.length}</span>
          </div>
          <nav className="flex gap-1 overflow-x-auto pb-1" aria-label={`Armas em ${selectedClass.label}`}>
            {selectedClassWeapons.map((weapon) => {
              const active = weapon.id === selectedWeaponId
              return (
                <Button
                  key={weapon.id}
                  type="button"
                  variant={active ? "secondary" : "ghost"}
                  size="sm"
                  className="shrink-0 gap-2"
                  aria-current={active ? "page" : undefined}
                  onClick={() => onSelectWeapon(weapon.id)}
                >
                  {active ? <Check className="size-3.5 text-primary" /> : null}
                  {weapon.name}
                </Button>
              )
            })}
          </nav>
        </div>

        <div className="hidden p-4 lg:block">
          <p className="mb-2 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Classes de arma</p>
          <nav className="space-y-1" aria-label="Classes e armas">
            {catalog.classes.map((item) => {
              const classActive = item.id === selectedClassId
              const classWeapons = getWeaponsForClass(catalog, item.id)

              return (
                <div key={item.id}>
                  <Button
                    type="button"
                    variant={classActive ? "secondary" : "ghost"}
                    className="h-9 w-full justify-between"
                    aria-expanded={classActive}
                    onClick={() => onSelectClass(item.id)}
                  >
                    <span>{item.label}</span>
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="font-data">{String(classWeapons.length).padStart(2, "0")}</span>
                      <ChevronDown className={`size-3.5 transition-transform ${classActive ? "rotate-180" : ""}`} />
                    </span>
                  </Button>

                  {classActive ? (
                    <div className="mt-1 border-l pl-2" role="group" aria-label={`Armas em ${item.label}`}>
                      {classWeapons.map((weapon) => {
                        const active = weapon.id === selectedWeaponId
                        return (
                          <Button
                            key={weapon.id}
                            type="button"
                            variant="ghost"
                            size="sm"
                            className={`mb-0.5 h-8 w-full justify-between pl-3 ${active ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}
                            aria-current={active ? "page" : undefined}
                            onClick={() => onSelectWeapon(weapon.id)}
                          >
                            <span className="flex min-w-0 items-center gap-2">
                              <span className={`size-1.5 shrink-0 rounded-full ${active ? "bg-primary" : "bg-border"}`} />
                              <span className="truncate">{weapon.name}</span>
                            </span>
                            <span className="ml-2 truncate text-[11px] text-muted-foreground">{weapon.usageProfile}</span>
                          </Button>
                        )
                      })}
                    </div>
                  ) : null}
                </div>
              )
            })}
          </nav>

          <div className="mt-4 border-t px-2 pt-4">
            <p className="text-[11px] leading-4 text-muted-foreground">Catálogo mockado para validar navegação e apresentação. Build e métricas continuam desacopladas na fixture do engine.</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
