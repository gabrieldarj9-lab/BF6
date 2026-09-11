import { useEffect, useMemo, useState } from "react"
import {
  Activity,
  ArrowRight,
  Crosshair,
  Info,
  Wifi,
  WifiOff,
} from "lucide-react"

import { BuildSummary } from "@/components/bf6/build-summary"
import { MasterySelector } from "@/components/bf6/mastery-selector"
import { MetricsPanel } from "@/components/bf6/metrics-panel"
import { ProgressionTimeline } from "@/components/bf6/progression-timeline"
import { WeaponHeader } from "@/components/bf6/weapon-header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  attachmentLabel,
  METRICS,
  type DemoRequest,
  type MetricsResult,
  type ProgressionResult,
  type ProgressionStep,
  type Weapon,
} from "@/features/builds/model"

type ApiEnvelope<T> = { data: T }
type ApiErrorEnvelope = { error?: { code?: string; message?: string } }

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
            <WeaponHeader
              eyebrow="Fuzil de assalto · protótipo funcional"
              title="Fixture Rifle"
              tag="Curta distância"
              description="Fixture sintética para validar a experiência de recomendação antes da entrada do catálogo real do Battlefield 6."
              controls={<MasterySelector value={mastery} max={maxMastery} onChange={setMastery} />}
            />

            {error ? (
              <Alert variant="destructive" className="mt-6">
                <WifiOff />
                <AlertTitle>Erro de integração</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            {!request || !progression ? (
              <div className="mt-6 grid items-start gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,.8fr)]">
                <Skeleton className="h-[420px] w-full rounded-xl" />
                <Skeleton className="h-[420px] w-full rounded-xl" />
              </div>
            ) : (
              <>
                <div className="mt-6 grid items-start gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,.8fr)]">
                  <BuildSummary weapon={request.weapon} step={activeStep} />
                  <MetricsPanel metrics={metrics} loading={metricsLoading} />
                </div>
                <div className="mt-4"><ProgressionTimeline steps={progression.progression.steps} mastery={mastery} /></div>
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
