export type Attachment = {
  id: string
  slotId: string
  cost: number
  unlock: { type: string; level?: number; label: string }
}

export type Weapon = {
  id: string
  categoryId: string
  budget: number
  slots: { id: string; maxEquipped: number }[]
  attachments: Attachment[]
}

export type ProgressionStep = {
  candidateId: string
  mastery: number
  importance: "RECOMMENDED" | "MAJOR" | "META"
  attachmentIds: string[]
  previousAttachmentIds: string[]
  removedAttachmentIds: string[]
  addedAttachmentIds: string[]
  totalCost: number
  primaryScoreBefore: number
  primaryScoreAfter: number
  primaryScoreGain: number
  metricsAfter: Record<string, number | null | undefined>
  nextMastery?: number
}

export type ProgressionResult = {
  progression: {
    weaponId: string
    metaMastery: number
    relevantMasteries: number[]
    metaBuild: {
      attachmentIds: string[]
      totalCost: number
      primaryScore: number
      resolvedMetrics?: Record<string, number | null | undefined>
    }
    steps: ProgressionStep[]
    reachedMeta: boolean
  }
}

export type MetricsResult = {
  weaponId: string
  attachmentIds: string[]
  totalCost: number
  resolvedTechnical: Record<string, number | null>
  metrics: Record<string, { value: number | null; evidence: string }>
}

export type DemoRequest = {
  weapon: Weapon
  primaryProfile: unknown
  normalizationRules: unknown
  maxSearchNodes?: number
}

const ATTACHMENT_LABELS: Record<string, string> = {
  "quick-grip": "Empunhadura rápida",
  laser: "Laser tático",
  "cosmetic-charm": "Charm cosmético",
  "rapid-barrel": "Cano de alta cadência",
  "heavy-ammo-conversion": "Conversão de munição pesada",
  "extended-mag": "Carregador estendido",
}

const SLOT_LABELS: Record<string, string> = {
  barrel: "Cano",
  underbarrel: "Acessório inferior",
  "top-accessory": "Acessório superior",
}

export const METRICS = [
  { id: "ttk.10m", label: "TTK a 10 m", unit: "ms" },
  { id: "handling.adsTime", label: "Tempo de ADS", unit: "ms" },
  { id: "fire.rpm", label: "Cadência", unit: "rpm" },
  { id: "recoil.ads.amount", label: "Recuo em ADS", unit: "índice" },
  { id: "magazine.capacity", label: "Capacidade", unit: "projéteis" },
  { id: "ballistics.velocity", label: "Velocidade", unit: "m/s" },
] as const

export function attachmentLabel(id: string) {
  return ATTACHMENT_LABELS[id] ?? id
}

export function slotLabel(id: string) {
  return SLOT_LABELS[id] ?? id
}

export function formatMetric(value: number | null | undefined, metricId: string) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—"
  if (metricId === "recoil.ads.amount") return value.toFixed(2)
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}
