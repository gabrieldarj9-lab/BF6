import { useEffect, useMemo, useState } from "react"
import {
  Activity,
  ArrowRight,
  Check,
  CircleDot,
  Crosshair,
  Info,
  Wifi,
  WifiOff,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Slider } from "@/components/ui/slider"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type ApiEnvelope<T> = { data: T }
type ApiErrorEnvelope = { error?: { code?: string; message?: string } }

type Attachment = {
  id: string
  slotId: string
  cost: number
  unlock: { type: string; level?: number; label: string }
}

type Weapon = {
  id: string
  categoryId: string
  budget: number
  slots: { id: string; maxEquipped: number }[]
  attachments: Attachment[]
}

type ProgressionStep = {
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

type ProgressionResult = {
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

type MetricsResult = {
  weaponId: string
  attachmentIds: string[]
  totalCost: number
  resolvedTechnical: Record<string, number | null>
  metrics: Record<string, { value: number | null; evidence: string }>
}

type DemoRequest = {
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

const METRICS = [
  { id: "ttk.10m", label: "TTK a 10 m", unit: "ms" },
  { id: "handling.adsTime", label: "Tempo de ADS", unit: "ms" },
  { id: "fire.rpm", label: "Cadência", unit: "rpm" },
  { id: "recoil.ads.amount", label: "Recuo em ADS", unit: "índice" },
  { id: "magazine.capacity", label: "Capacidade", unit: "projéteis" },
  { id: "ballistics.velocity", label: "Velocidade", unit: "m/s" },
]

const NAV_ITEMS = [
  ["Fuzis de assalto", "01"],
  ["Carabinas", "—"],
  ["SMGs", "—"],
  ["LMGs", "—"],
  ["DMRs", "—"],
  ["Snipers", "—"],
  ["Escopetas", "—"],
  ["Secundárias", "—"],
] as const

function attachmentLabel(id: string) {
  return ATTACHMENT_LABELS[id] ?? id
}

function slotLabel(id: string) {
  return SLOT_LABELS[id] ?? id
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init)
  const body = (await response.json()) as ApiEnvelope<T> & ApiErrorEnvelope
  if (!response.ok) throw new Error(body.error?.message ?? `HTTP ${response.status}`)
  return body.data
}

function loadDemoRequest() {
  return fetchJson<DemoRequest>("/v1/demo-request")
}

function generateProgression(request: DemoRequest) {
  return fetchJson<ProgressionResult>("/v1/progression", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(request),
  })
}

function queryMetrics(weapon: Weapon, attachmentIds: string[]) {
  return fetchJson<MetricsResult>("/v1/metrics", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      weapon,
      attachmentIds,
      metricIds: METRICS.map((metric) => metric.id),
    }),
  })
}

function formatMetric(value: number | null | undefined, metricId: string) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—"
  if (metricId === "recoil.ads.amount") return value.toFixed(2)
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

function ImportanceBadge({ importance }: { importance: ProgressionStep["importance"] | "BASE" }) {
  if (importance === "META") {
    return <Badge>Meta</Badge>
  }
  if (importance === "MAJOR") {
    return <Badge variant="secondary">Upgrade principal</Badge>
  }
  if (importance === "RECOMMENDED") {
    return <Badge variant="outline">Recomendada</Badge>
  }
  return <Badge variant="outline">Base</Badge>
}

function Topbar({ apiState }: { apiState: "connecting" | "online" | "error" }) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="flex h-14 items-center gap-4 px-4 lg:px-6">
        <a href="/" className="flex items-center gap-2 font-semibold tracking-tight" aria-label="BF6 Builds">
          <span className="grid size-8 place-items-center rounded-md border bg-card font-data text-xs font-bold text-primary">B6</span>
          <span>BF6 <span className="text-muted-foreground">/ BUILDS</span></span>
        </a>
        <Separator orientation="vertical" className="hidden h-5 md:block" />
        <span className="hidden text-sm text-muted-foreground md:block">Recomendação por maestria</span>
        <div className="ml-auto flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5 font-normal">
            {apiState === "online" ? <Wifi className="size-3.5 text-[var(--bf-positive)]" /> : apiState === "error" ? <WifiOff className="size-3.5 text-destructive" /> : <Activity className="size-3.5 animate-pulse" />}
            {apiState === "online" ? "API online" : apiState === "error" ? "API indisponível" : "Conectando"}
          </Badge>
          <Button variant="ghost" size="sm" asChild>
            <a href="/design-system">Design System</a>
          </Button>
        </div>
      </div>
    </header>
  )
}

function Sidebar() {
  return (
    <aside className="border-b bg-sidebar lg:min-h-[calc(100vh-3.5rem)] lg:border-r lg:border-b-0">
      <div className="sticky top-14 p-3 lg:p-4">
        <p className="mb-2 hidden px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground lg:block">Classes de arma</p>
        <nav className="flex gap-1 overflow-x-auto lg:flex-col" aria-label="Classes de arma">
          {NAV_ITEMS.map(([label, count], index) => (
            <Button
              key={label}
              variant={index === 0 ? "secondary" : "ghost"}
              className="h-9 shrink-0 justify-between gap-4 lg:w-full"
              disabled={index !== 0}
              aria-current={index === 0 ? "page" : undefined}
            >
              <span>{label}</span>
              <span className="font-data text-xs text-muted-foreground">{count}</span>
            </Button>
          ))}
        </nav>
      </div>
    </aside>
  )
}

function MasteryControl({ value, max, onChange }: { value: number; max: number; onChange: (value: number) => void }) {
  return (
    <Card className="gap-4 py-4 shadow-none">
      <CardHeader className="px-4">
        <CardTitle className="text-sm">Sua maestria</CardTitle>
        <CardAction className="font-data text-lg font-semibold">M{value}<span className="text-xs font-normal text-muted-foreground"> / M{max}</span></CardAction>
      </CardHeader>
      <CardContent className="px-4">
        <Slider
          aria-label="Maestria da arma"
          min={1}
          max={max}
          step={1}
          value={[value]}
          onValueChange={(values) => onChange(values[0] ?? 1)}
        />
        <div className="mt-2 flex justify-between font-data text-[11px] text-muted-foreground">
          <span>M1</span><span>M{max}</span>
        </div>
      </CardContent>
    </Card>
  )
}

function BuildCard({ weapon, step }: { weapon: Weapon; step: ProgressionStep | null }) {
  const attachmentIds = step?.attachmentIds ?? []
  const cost = step?.totalCost ?? 0
  const score = step?.primaryScoreAfter ?? 44
  const attachmentById = new Map(weapon.attachments.map((item) => [item.id, item]))
  const bySlot = new Map<string, string>()

  attachmentIds.forEach((id) => {
    const item = attachmentById.get(id)
    if (item) bySlot.set(item.slotId, id)
  })

  return (
    <Card className="gap-0 overflow-hidden py-0 shadow-none">
      <CardHeader className="border-b py-5">
        <div>
          <CardTitle>Build recomendada agora</CardTitle>
          <CardDescription>Configuração calculada para a maestria selecionada.</CardDescription>
        </div>
        <CardAction><ImportanceBadge importance={step?.importance ?? "BASE"} /></CardAction>
      </CardHeader>

      <div className="grid border-b sm:grid-cols-3">
        <div className="p-5 sm:border-r">
          <p className="text-xs text-muted-foreground">Pontos usados</p>
          <p className="mt-1 font-data text-2xl font-semibold">{cost}<span className="text-sm font-normal text-muted-foreground"> / {weapon.budget}</span></p>
        </div>
        <div className="border-t p-5 sm:border-t-0 sm:border-r">
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">Score da prioridade</p>
            <span className="font-data text-sm font-semibold">{score}/100</span>
          </div>
          <Progress value={Math.max(0, Math.min(100, score))} className="mt-3" />
        </div>
        <div className="border-t p-5 sm:border-t-0">
          <p className="text-xs text-muted-foreground">Acessórios ativos</p>
          <p className="mt-1 font-data text-2xl font-semibold">{attachmentIds.length}</p>
        </div>
      </div>

      <CardContent className="p-0">
        <div className="divide-y">
          {weapon.slots.map((slot) => {
            const attachmentId = bySlot.get(slot.id)
            const attachment = attachmentId ? attachmentById.get(attachmentId) : undefined
            return (
              <div key={slot.id} className="grid min-h-16 items-center gap-3 px-5 py-3 sm:grid-cols-[150px_1fr_auto]">
                <span className="font-data text-[11px] uppercase tracking-wide text-muted-foreground">{slotLabel(slot.id)}</span>
                <div>
                  {attachmentId ? (
                    <>
                      <p className="text-sm font-medium">{attachmentLabel(attachmentId)}</p>
                      <p className="mt-0.5 font-data text-[11px] text-muted-foreground">{attachmentId}</p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Sem acessório recomendado</p>
                  )}
                </div>
                <span className="font-data text-xs text-muted-foreground">{attachment ? `${attachment.cost} pts` : "—"}</span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function MetricsCard({ metrics, loading }: { metrics: MetricsResult | null; loading: boolean }) {
  return (
    <Card className="gap-0 overflow-hidden py-0 shadow-none">
      <CardHeader className="border-b py-5">
        <div>
          <CardTitle className="flex items-center gap-2">
            Métricas efetivas
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon-xs" aria-label="Sobre as métricas"><Info /></Button>
              </TooltipTrigger>
              <TooltipContent>Valores resolvidos pela configuração atual.</TooltipContent>
            </Tooltip>
          </CardTitle>
          <CardDescription>Resolver + métricas derivadas</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="divide-y p-0">
        {METRICS.map((metric) => {
          const derived = metrics?.metrics[metric.id]
          const technical = metrics?.resolvedTechnical[metric.id]
          const value = derived?.value ?? technical
          return (
            <div key={metric.id} className="flex min-h-16 items-center justify-between gap-4 px-5 py-3">
              <div>
                <p className="text-sm font-medium">{metric.label}</p>
                <p className="mt-0.5 font-data text-[10px] text-muted-foreground">{metric.id}</p>
              </div>
              {loading ? <Skeleton className="h-6 w-16" /> : (
                <div className="text-right">
                  <p className="font-data text-base font-semibold tabular-nums">{formatMetric(value, metric.id)}</p>
                  <p className="text-[10px] uppercase text-muted-foreground">{metric.unit}</p>
                </div>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

function ProgressionCard({ steps, mastery }: { steps: ProgressionStep[]; mastery: number }) {
  return (
    <Card className="gap-0 overflow-hidden py-0 shadow-none">
      <CardHeader className="border-b py-5">
        <div>
          <CardTitle>Progressão recomendada</CardTitle>
          <CardDescription>O engine recalcula globalmente a cada marco relevante.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-5">
        <div className="grid gap-3 md:grid-cols-3">
          {steps.map((step) => {
            const reached = mastery >= step.mastery
            const current = reached && !steps.some((other) => other.mastery > step.mastery && other.mastery <= mastery)
            const label = step.importance === "META" ? "Meta final" : step.importance === "MAJOR" ? "Upgrade principal" : "Primeira recomendação"
            return (
              <div key={step.mastery} className={`relative rounded-lg border p-4 ${current ? "border-primary bg-primary/5" : reached ? "bg-muted/30" : "opacity-60"}`}>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <Badge variant={current ? "default" : "outline"}>M{step.mastery}</Badge>
                  {reached ? <Check className="size-4 text-[var(--bf-positive)]" /> : <CircleDot className="size-4 text-muted-foreground" />}
                </div>
                <p className="text-sm font-semibold">{label}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {step.addedAttachmentIds.length ? `Entra: ${step.addedAttachmentIds.map(attachmentLabel).join(", ")}` : "Sem novas peças"}
                </p>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function ChangeCard({ step }: { step: ProgressionStep | null }) {
  const rows: Array<{ kind: "add" | "remove"; id: string }> = []
  step?.removedAttachmentIds.forEach((id) => rows.push({ kind: "remove", id }))
  step?.addedAttachmentIds.forEach((id) => rows.push({ kind: "add", id }))

  return (
    <Card className="gap-0 overflow-hidden py-0 shadow-none">
      <CardHeader className="border-b py-5">
        <CardTitle>Mudança neste marco</CardTitle>
        <CardAction>{step ? <Badge variant="outline">M{step.mastery}</Badge> : null}</CardAction>
      </CardHeader>
      <CardContent className="divide-y p-0">
        {rows.length ? rows.map((row, index) => (
          <div key={`${row.kind}-${row.id}-${index}`} className="flex items-center gap-3 px-5 py-4 text-sm">
            <span className={`grid size-6 place-items-center rounded-md border font-data ${row.kind === "add" ? "text-[var(--bf-positive)]" : "text-destructive"}`}>{row.kind === "add" ? "+" : "−"}</span>
            <span><strong>{row.kind === "add" ? "Entra" : "Sai"}:</strong> {attachmentLabel(row.id)}</span>
          </div>
        )) : (
          <div className="px-5 py-4 text-sm text-muted-foreground">A build base ainda é a referência neste nível.</div>
        )}
      </CardContent>
    </Card>
  )
}

function EngineCard({ progression, step }: { progression: ProgressionResult; step: ProgressionStep | null }) {
  const p = progression.progression
  return (
    <Card className="gap-0 overflow-hidden py-0 shadow-none">
      <CardHeader className="border-b py-5">
        <CardTitle>Leitura do engine</CardTitle>
        <CardAction><Badge variant="outline" className="text-[var(--bf-positive)]">Meta resolvida</Badge></CardAction>
      </CardHeader>
      <CardContent className="divide-y p-0 text-sm">
        <div className="flex gap-3 px-5 py-4"><Crosshair className="mt-0.5 size-4 shrink-0 text-muted-foreground" /><span><strong>Meta:</strong> M{p.metaMastery} · {p.metaBuild.attachmentIds.map(attachmentLabel).join(", ")}</span></div>
        <div className="flex gap-3 px-5 py-4"><Activity className="mt-0.5 size-4 shrink-0 text-muted-foreground" /><span><strong>Ganho atual:</strong> {step ? `+${step.primaryScoreGain.toFixed(1)} pontos de score` : "baseline"}</span></div>
        <div className="flex gap-3 px-5 py-4"><ArrowRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" /><span><strong>Próximo marco:</strong> {step?.nextMastery ? `M${step.nextMastery}` : step?.importance === "META" ? "meta atingida" : `M${p.steps[0]?.mastery ?? p.metaMastery}`}</span></div>
      </CardContent>
    </Card>
  )
}

export function App() {
  const [apiState, setApiState] = useState<"connecting" | "online" | "error">("connecting")
  const [request, setRequest] = useState<DemoRequest | null>(null)
  const [progression, setProgression] = useState<ProgressionResult | null>(null)
  const [metrics, setMetrics] = useState<MetricsResult | null>(null)
  const [metricsLoading, setMetricsLoading] = useState(false)
  const [mastery, setMastery] = useState(1)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true
    void (async () => {
      try {
        const demo = await loadDemoRequest()
        const result = await generateProgression(demo)
        if (!active) return
        setRequest(demo)
        setProgression(result)
        setMastery(1)
        setApiState("online")
      } catch (err) {
        if (!active) return
        setApiState("error")
        setError(err instanceof Error ? err.message : "Não foi possível carregar o engine.")
      }
    })()
    return () => { active = false }
  }, [])

  const activeStep = useMemo(() => {
    if (!progression) return null
    const available = progression.progression.steps.filter((step) => step.mastery <= mastery)
    return available.length ? available[available.length - 1] : null
  }, [progression, mastery])

  useEffect(() => {
    if (!request) return
    let active = true
    setMetricsLoading(true)
    queryMetrics(request.weapon, activeStep?.attachmentIds ?? [])
      .then((result) => {
        if (!active) return
        setMetrics(result)
        setApiState("online")
      })
      .catch((err) => {
        if (!active) return
        setApiState("error")
        setError(err instanceof Error ? err.message : "Falha ao consultar métricas.")
      })
      .finally(() => { if (active) setMetricsLoading(false) })
    return () => { active = false }
  }, [request, activeStep?.candidateId])

  const maxMastery = progression ? Math.max(progression.progression.metaMastery, ...progression.progression.relevantMasteries) : 10

  return (
    <div className="min-h-screen bg-background text-foreground">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground">Ir para o conteúdo</a>
      <Topbar apiState={apiState} />
      <div className="grid lg:grid-cols-[232px_minmax(0,1fr)]">
        <Sidebar />
        <main id="main-content" className="min-w-0">
          <div className="mx-auto max-w-[1512px] p-4 pb-16 sm:p-6 lg:p-8">
            <div className="grid gap-6 border-b pb-6 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-end">
              <div>
                <p className="font-data text-xs uppercase tracking-[0.14em] text-muted-foreground">Fuzil de assalto · protótipo funcional</p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Fixture Rifle</h1>
                  <Badge variant="outline" className="border-primary/50 text-primary">Curta distância</Badge>
                </div>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Fixture sintética para validar a experiência de recomendação antes da entrada do catálogo real do Battlefield 6.</p>
              </div>
              <MasteryControl value={mastery} max={maxMastery} onChange={setMastery} />
            </div>

            {error ? (
              <Alert variant="destructive" className="mt-6">
                <WifiOff />
                <AlertTitle>Erro de integração</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            {!request || !progression ? (
              <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,.8fr)]">
                <Skeleton className="h-[420px] w-full rounded-xl" />
                <Skeleton className="h-[420px] w-full rounded-xl" />
              </div>
            ) : (
              <>
                <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,.8fr)]">
                  <BuildCard weapon={request.weapon} step={activeStep} />
                  <MetricsCard metrics={metrics} loading={metricsLoading} />
                </div>
                <div className="mt-4"><ProgressionCard steps={progression.progression.steps} mastery={mastery} /></div>
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <ChangeCard step={activeStep} />
                  <EngineCard progression={progression} step={activeStep} />
                </div>
                <Alert className="mt-4">
                  <Info />
                  <AlertTitle>Dados de demonstração</AlertTitle>
                  <AlertDescription>Os números vêm da fixture de integração e não representam uma arma real do Battlefield 6.</AlertDescription>
                </Alert>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
