const { useEffect, useMemo, useState } = React;

const h = React.createElement;

type ApiEnvelope<T> = { data: T };
type ApiErrorEnvelope = { error?: { code?: string; message?: string } };

type Attachment = {
  id: string;
  slotId: string;
  cost: number;
  unlock: { type: string; level?: number; label: string };
};

type Weapon = {
  id: string;
  categoryId: string;
  budget: number;
  slots: { id: string; maxEquipped: number }[];
  attachments: Attachment[];
};

type ProgressionStep = {
  candidateId: string;
  mastery: number;
  importance: "RECOMMENDED" | "MAJOR" | "META";
  attachmentIds: string[];
  previousAttachmentIds: string[];
  removedAttachmentIds: string[];
  addedAttachmentIds: string[];
  totalCost: number;
  primaryScoreBefore: number;
  primaryScoreAfter: number;
  primaryScoreGain: number;
  metricsAfter: Record<string, number | null | undefined>;
  nextMastery?: number;
};

type ProgressionResult = {
  progression: {
    weaponId: string;
    metaMastery: number;
    relevantMasteries: number[];
    metaBuild: {
      attachmentIds: string[];
      totalCost: number;
      primaryScore: number;
      resolvedMetrics?: Record<string, number | null | undefined>;
    };
    steps: ProgressionStep[];
    reachedMeta: boolean;
  };
};

type MetricsResult = {
  weaponId: string;
  attachmentIds: string[];
  totalCost: number;
  resolvedTechnical: Record<string, number | null>;
  metrics: Record<string, { value: number | null; evidence: string }>;
};

type DemoRequest = {
  weapon: Weapon;
  primaryProfile: unknown;
  normalizationRules: unknown;
  maxSearchNodes?: number;
};

const ATTACHMENT_LABELS: Record<string, string> = {
  "quick-grip": "Empunhadura rápida",
  "laser": "Laser tático",
  "cosmetic-charm": "Charm cosmético",
  "rapid-barrel": "Cano de alta cadência",
  "heavy-ammo-conversion": "Conversão de munição pesada",
  "extended-mag": "Carregador estendido",
};

const SLOT_LABELS: Record<string, string> = {
  barrel: "Cano",
  underbarrel: "Acessório inferior",
  "top-accessory": "Acessório superior",
};

const METRICS = [
  { id: "ttk.10m", label: "TTK a 10 m", unit: "ms", lower: true },
  { id: "handling.adsTime", label: "Tempo de ADS", unit: "ms", lower: true },
  { id: "fire.rpm", label: "Cadência", unit: "rpm", lower: false },
  { id: "recoil.ads.amount", label: "Recuo em ADS", unit: "índice", lower: true },
  { id: "magazine.capacity", label: "Capacidade", unit: "projéteis", lower: false },
  { id: "ballistics.velocity", label: "Velocidade", unit: "m/s", lower: false },
];

const NAV_ITEMS = [
  ["Fuzis de assalto", "01"], ["Carabinas", "--"], ["SMGs", "--"], ["LMGs", "--"],
  ["DMRs", "--"], ["Snipers", "--"], ["Escopetas", "--"], ["Secundárias", "--"],
];

function attachmentLabel(id: string) {
  return ATTACHMENT_LABELS[id] ?? id;
}

function slotLabel(id: string) {
  return SLOT_LABELS[id] ?? id;
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const body = await response.json() as ApiEnvelope<T> & ApiErrorEnvelope;
  if (!response.ok) {
    throw new Error(body.error?.message ?? `HTTP ${response.status}`);
  }
  return body.data;
}

async function loadDemoRequest(): Promise<DemoRequest> {
  return fetchJson<DemoRequest>("/v1/demo-request");
}

async function generateProgression(request: DemoRequest): Promise<ProgressionResult> {
  return fetchJson<ProgressionResult>("/v1/progression", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(request),
  });
}

async function queryMetrics(weapon: Weapon, attachmentIds: string[]): Promise<MetricsResult> {
  return fetchJson<MetricsResult>("/v1/metrics", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      weapon,
      attachmentIds,
      metricIds: METRICS.map((metric) => metric.id),
    }),
  });
}

function Topbar(props: { apiState: string }) {
  const stateLabel = props.apiState === "online" ? "API online" : props.apiState === "error" ? "API indisponível" : "Conectando";
  return (
    <header className="topbar">
      <div className="brand" aria-label="BF6 Builds">
        <div className="brand-mark" aria-hidden="true">B6</div>
        <div className="brand-wordmark">BF6 <span>/ BUILDS</span></div>
      </div>
      <div className="topbar-context">Sistema de recomendação por maestria</div>
      <div className="topbar-status">
        <span className="connection" data-state={props.apiState} aria-live="polite">
          <span className="connection-dot" aria-hidden="true"></span>{stateLabel}
        </span>
        <span className="version-tag">V1 · UI 0.1</span>
      </div>
    </header>
  );
}

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="nav-label">Classes de arma</div>
      <nav className="weapon-nav" aria-label="Classes de arma">
        {NAV_ITEMS.map(([label, count], index) => (
          <button key={label} type="button" data-active={index === 0 ? "true" : "false"} aria-current={index === 0 ? "page" : undefined} aria-disabled={index !== 0}>
            <span>{label}</span><span className="nav-count">{count}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-foot">
        V1 visual conectada à fixture técnica. Dados reais de Battlefield entram na camada de catálogo, sem alterar o Design System.
      </div>
    </aside>
  );
}

function MasteryControl(props: { value: number; max: number; onChange: (value: number) => void }) {
  return (
    <div className="mastery-control">
      <div className="mastery-header">
        <label className="mastery-label" htmlFor="mastery">Sua maestria</label>
        <div className="mastery-value">M{props.value} <span>/ M{props.max}</span></div>
      </div>
      <input id="mastery" type="range" min="1" max={props.max} step="1" value={props.value} onChange={(event: any) => props.onChange(Number(event.target.value))} />
      <div className="mastery-scale" aria-hidden="true"><span>M1</span><span>M{props.max}</span></div>
    </div>
  );
}

function BuildSurface(props: { weapon: Weapon; step: ProgressionStep | null; baseMetrics: MetricsResult | null }) {
  const attachmentIds = props.step?.attachmentIds ?? [];
  const cost = props.step?.totalCost ?? 0;
  const score = props.step?.primaryScoreAfter ?? 44;
  const attachmentById = new Map(props.weapon.attachments.map((item) => [item.id, item]));
  const bySlot = new Map<string, string>();
  attachmentIds.forEach((id) => {
    const item = attachmentById.get(id);
    if (item) bySlot.set(item.slotId, id);
  });
  const importance = props.step?.importance ?? "BASE";
  const tone = importance === "META" ? "positive" : importance === "MAJOR" ? "accent" : "neutral";

  return (
    <Surface title="Build recomendada" action={<StatusBadge tone={tone as any}>{importance}</StatusBadge>}>
      <div className="build-summary">
        <div className="build-stat"><span className="build-stat-label">Pontos usados</span><span className="build-stat-value">{cost}<small> / {props.weapon.budget}</small></span></div>
        <div className="build-stat"><span className="build-stat-label">Score da prioridade</span><span className="build-stat-value">{score}<small> / 100</small></span><div className="score-bar" aria-label={`Score ${score} de 100`}><span style={{ width: `${Math.max(0, Math.min(100, score))}%` }}></span></div></div>
        <div className="build-stat"><span className="build-stat-label">Acessórios</span><span className="build-stat-value">{attachmentIds.length}<small> ativos</small></span></div>
      </div>
      <div className="attachment-list">
        {props.weapon.slots.map((slot) => {
          const attachmentId = bySlot.get(slot.id);
          const attachment = attachmentId ? attachmentById.get(attachmentId) : undefined;
          return (
            <div className="attachment-row" key={slot.id}>
              <div className="slot-name">{slotLabel(slot.id)}</div>
              <div>{attachmentId ? <><span className="attachment-name">{attachmentLabel(attachmentId)}</span><span className="attachment-id">{attachmentId}</span></> : <span className="empty-attachment">Sem acessório recomendado</span>}</div>
              <div className="attachment-cost">{attachment ? `${attachment.cost} pts` : "—"}</div>
            </div>
          );
        })}
      </div>
    </Surface>
  );
}

function formatMetric(value: number | null | undefined, metricId: string) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  if (metricId === "recoil.ads.amount") return value.toFixed(2);
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function MetricsSurface(props: { metrics: MetricsResult | null; loading: boolean }) {
  return (
    <Surface title="Métricas efetivas" className="metrics-surface" action={<span className="section-kicker">resolver + derived</span>}>
      <div className="metric-list" aria-live="polite">
        {METRICS.map((metric) => {
          const derived = props.metrics?.metrics[metric.id];
          const technical = props.metrics?.resolvedTechnical[metric.id];
          const value = derived?.value ?? technical;
          return (
            <div className="metric-row" key={metric.id}>
              <div><div className="metric-label">{metric.label}</div><div className="metric-meta">{metric.id}</div></div>
              <div className="metric-value">{props.loading ? "…" : formatMetric(value, metric.id)}<small>{metric.unit}</small></div>
            </div>
          );
        })}
      </div>
    </Surface>
  );
}

function ProgressionSurface(props: { steps: ProgressionStep[]; mastery: number }) {
  return (
    <Surface title="Progressão recomendada" className="progression" action={<span className="section-kicker">recalculo global</span>}>
      <div className="progression-body">
        <div className="timeline">
          {props.steps.map((step) => {
            const reached = props.mastery >= step.mastery;
            const current = reached && !props.steps.some((other) => other.mastery > step.mastery && other.mastery <= props.mastery);
            const label = step.importance === "META" ? "Meta final" : step.importance === "MAJOR" ? "Upgrade principal" : "Primeira recomendação";
            const changeText = step.addedAttachmentIds.length ? `Entra: ${step.addedAttachmentIds.map(attachmentLabel).join(", ")}` : "Sem novas peças";
            return (
              <div className="timeline-step" key={step.mastery} data-reached={reached ? "true" : "false"} data-current={current ? "true" : "false"}>
                <span className="timeline-dot" aria-hidden="true"></span>
                <div className="timeline-mastery">M{step.mastery} · {step.importance}</div>
                <div className="timeline-name">{label}</div>
                <div className="timeline-change">{changeText}</div>
              </div>
            );
          })}
        </div>
      </div>
    </Surface>
  );
}

function ChangeSurface(props: { step: ProgressionStep | null }) {
  const rows: { kind: string; id: string }[] = [];
  props.step?.removedAttachmentIds.forEach((id) => rows.push({ kind: "remove", id }));
  props.step?.addedAttachmentIds.forEach((id) => rows.push({ kind: "add", id }));
  return (
    <Surface title="Mudança neste marco" action={props.step ? <span className="section-kicker">M{props.step.mastery}</span> : null}>
      <div className="change-list">
        {rows.length ? rows.map((row, index) => (
          <div className="change-row" key={`${row.kind}-${row.id}-${index}`}>
            <div className="change-sign" data-kind={row.kind}>{row.kind === "add" ? "+" : "−"}</div>
            <div className="change-copy"><strong>{row.kind === "add" ? "Entra" : "Sai"}:</strong> {attachmentLabel(row.id)}</div>
          </div>
        )) : <div className="change-row"><div className="change-sign">·</div><div className="change-copy">A build base ainda é a referência neste nível.</div></div>}
      </div>
    </Surface>
  );
}

function SystemSurface(props: { progression: ProgressionResult; step: ProgressionStep | null }) {
  const p = props.progression.progression;
  return (
    <Surface title="Leitura do engine" action={<StatusBadge tone={p.reachedMeta ? "positive" : "neutral"}>{p.reachedMeta ? "Meta resolvida" : "Em cálculo"}</StatusBadge>}>
      <div className="change-list">
        <div className="change-row"><div className="change-sign">#</div><div className="change-copy"><strong>Meta:</strong> M{p.metaMastery} · {p.metaBuild.attachmentIds.map(attachmentLabel).join(", ")}</div></div>
        <div className="change-row"><div className="change-sign">Δ</div><div className="change-copy"><strong>Ganho no marco atual:</strong> {props.step ? `+${props.step.primaryScoreGain.toFixed(1)} pontos de score` : "baseline"}</div></div>
        <div className="change-row"><div className="change-sign">→</div><div className="change-copy"><strong>Próximo marco:</strong> {props.step?.nextMastery ? `M${props.step.nextMastery}` : props.step?.importance === "META" ? "meta atingida" : `M${p.steps[0]?.mastery ?? p.metaMastery}`}</div></div>
      </div>
    </Surface>
  );
}

function App() {
  const [apiState, setApiState] = useState("connecting");
  const [request, setRequest] = useState(null as DemoRequest | null);
  const [progression, setProgression] = useState(null as ProgressionResult | null);
  const [metrics, setMetrics] = useState(null as MetricsResult | null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [mastery, setMastery] = useState(1);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const demo = await loadDemoRequest();
        const result = await generateProgression(demo);
        if (!active) return;
        setRequest(demo);
        setProgression(result);
        setMastery(1);
        setApiState("online");
      } catch (err: any) {
        if (!active) return;
        setApiState("error");
        setError(err?.message ?? "Não foi possível carregar o engine.");
      }
    })();
    return () => { active = false; };
  }, []);

  const activeStep = useMemo(() => {
    if (!progression) return null;
    const available = progression.progression.steps.filter((step: ProgressionStep) => step.mastery <= mastery);
    return available.length ? available[available.length - 1] : null;
  }, [progression, mastery]);

  useEffect(() => {
    if (!request) return;
    let active = true;
    setMetricsLoading(true);
    queryMetrics(request.weapon, activeStep?.attachmentIds ?? [])
      .then((result) => { if (active) { setMetrics(result); setApiState("online"); } })
      .catch((err: any) => { if (active) { setApiState("error"); setError(err?.message ?? "Falha ao consultar métricas."); } })
      .finally(() => { if (active) setMetricsLoading(false); });
    return () => { active = false; };
  }, [request, activeStep?.candidateId]);

  const maxMastery = progression ? Math.max(progression.progression.metaMastery, ...progression.progression.relevantMasteries) : 10;

  return (
    <div className="app-shell min-h-screen bg-bf-bg">
      <Topbar apiState={apiState} />
      <div className="workspace">
        <Sidebar />
        <main className="main" id="main-content">
          <div className="content">
            <div className="weapon-heading">
              <div>
                <div className="eyebrow">Fuzil de assalto · protótipo funcional</div>
                <div className="weapon-title-row"><h1>Fixture Rifle</h1><span className="weapon-class">Curta distância</span></div>
                <p className="weapon-subtitle">Tela representativa da V1. A interface usa a fixture sintética do engine para validar navegação, hierarquia, progressão e leitura de métricas antes da entrada do catálogo real do jogo.</p>
              </div>
              <MasteryControl value={mastery} max={maxMastery} onChange={setMastery} />
            </div>

            {error ? <div className="notice error-panel" role="alert" style={{ marginTop: 18 }}><strong>Erro de integração.</strong> {error}</div> : null}

            {!request || !progression ? (
              <div className="surface loading-panel" style={{ marginTop: 18 }}><div><div>Carregando progressão do engine…</div><div className="loading-line"></div></div></div>
            ) : (
              <>
                <div className="data-grid">
                  <BuildSurface weapon={request.weapon} step={activeStep} baseMetrics={metrics} />
                  <MetricsSurface metrics={metrics} loading={metricsLoading} />
                </div>
                <ProgressionSurface steps={progression.progression.steps} mastery={mastery} />
                <div className="detail-grid">
                  <ChangeSurface step={activeStep} />
                  <SystemSurface progression={progression} step={activeStep} />
                </div>
                <div className="notice" style={{ marginTop: 18 }}><strong>Sobre os dados:</strong> os números desta tela vêm da fixture de integração e existem para validar o produto. Eles não representam uma arma real do Battlefield 6.</div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Missing #root element.");
ReactDOM.createRoot(rootElement).render(<App />);
