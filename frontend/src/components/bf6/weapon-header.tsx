import type { ReactNode } from "react"

import { Badge } from "@/components/ui/badge"

type WeaponHeaderProps = {
  eyebrow: string
  title: string
  tag: string
  description: string
  controls?: ReactNode
}

export function WeaponHeader({ eyebrow, title, tag, description, controls }: WeaponHeaderProps) {
  return (
    <div className="grid gap-6 border-b pb-6 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-end">
      <div>
        <p className="font-data text-xs uppercase tracking-[0.14em] text-muted-foreground">{eyebrow}</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
          <Badge variant="outline" className="border-primary/50 text-primary">{tag}</Badge>
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {controls ? <div>{controls}</div> : null}
    </div>
  )
}
