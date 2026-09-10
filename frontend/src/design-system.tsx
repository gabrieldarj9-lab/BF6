const DS_SECTIONS = [
  ["overview", "Overview"],
  ["colors", "Colors"],
  ["typography", "Typography"],
  ["spacing", "Spacing"],
  ["surfaces", "Surfaces"],
  ["borders", "Borders & Radius"],
  ["icons", "Icons"],
  ["buttons", "Buttons"],
  ["inputs", "Inputs"],
  ["search", "Search"],
  ["selects", "Selects"],
  ["tabs", "Tabs"],
  ["badges", "Badges"],
  ["cards", "Cards"],
  ["tables", "Tables"],
  ["tooltips", "Tooltips"],
  ["overlays", "Overlays"],
  ["progress", "Progress"],
  ["loading", "Loading"],
  ["empty", "Empty States"],
  ["feedback", "Feedback"],
  ["states", "States"],
  ["composition", "Composition"],
] as const;

const COLOR_TOKENS = [
  ["Background", "--background"],
  ["Surface", "--surface"],
  ["Surface Elevated", "--surface-elevated"],
  ["Surface Hover", "--surface-hover"],
  ["Border", "--border"],
  ["Border Strong", "--border-strong"],
  ["Text Primary", "--text-primary"],
  ["Text Secondary", "--text-secondary"],
  ["Text Muted", "--text-muted"],
  ["Accent", "--accent"],
  ["Positive", "--positive"],
  ["Warning", "--warning"],
  ["Negative", "--negative"],
  ["Disabled", "--disabled"],
] as const;

const SPACING_TOKENS = [
  ["space-1", "--space-1"], ["space-2", "--space-2"], ["space-3", "--space-3"],
  ["space-4", "--space-4"], ["space-5", "--space-5"], ["space-6", "--space-6"],
  ["space-8", "--space-8"], ["space-10", "--space-10"], ["space-12", "--space-12"],
] as const;

const SELECT_OPTIONS = [
  { value: "assault", label: "Fuzil de assalto" },
  { value: "smg", label: "SMG" },
  { value: "dmr", label: "DMR" },
];

function tokenValue(name: string): string {
  if (typeof window === "undefined") return "";
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function DsSection(props: { id: string; title: string; description: string; children: any }) {
  return (
    <section className="ds-section" id={props.id} aria-labelledby={`${props.id}-title`}>
      <div className="ds-section-head">
        <h2 id={`${props.id}-title`}>{props.title}</h2>
        <p>{props.description}</p>
      </div>
      {props.children}
    </section>
  );
}

function DsExample(props: { title: string; children: any }) {
  return <div className="ds-example"><div className="ds-example-title">{props.title}</div>{props.children}</div>;
}

function ColorToken(props: { label: string; token: string }) {
  return (
    <div className="ds-color">
      <div className="ds-color-swatch" style={{ "--swatch": `var(${props.token})` } as any}></div>
      <div className="ds-color-meta"><strong>{props.label}</strong><code>{props.token}</code><code>{tokenValue(props.token)}</code></div>
    </div>
  );
}

function TypeSample(props: { type: string; name: string; example: string; meta: string }) {
  return (
    <div className="ds-type-sample">
      <div className="ds-type-name">{props.name}</div>
      <div className="ds-type-example" data-type={props.type}>{props.example}</div>
      <div className="ds-type-meta">{props.meta}</div>
    </div>
  );
}

function DesignSystemPage() {
  const [searchValue, setSearchValue] = React.useState("");
  const [filledSearch, setFilledSearch] = React.useState("M4A1");

  React.useEffect(() => {
    document.title = "BF6 Builds — Design System";
    return () => { document.title = "BF6 Builds — V1"; };
  }, []);

  return (
    <div className="ds-page">
      <header className="ds-topbar">
        <a href="/" aria-label="Voltar para BF6 Builds">← Produto</a>
        <div className="brand-wordmark">BF6 <span>/ DESIGN SYSTEM</span></div>
        <StatusBadge tone="warning">Work in progress</StatusBadge>
      </header>

      <div className="ds-layout">
        <nav className="ds-nav" aria-label="Seções do Design System">
          <div className="ds-nav-title">Índice</div>
          {DS_SECTIONS.map(([id, label]) => <a href={`#${id}`} key={id}>{label}</a>)}
        </nav>

        <main className="ds-main" id="main-content">
          <div className="ds-content">
            <section className="ds-overview" id="overview">
              <div className="eyebrow">Referência visual central · UI V1</div>
              <div className="ds-overview-row"><h1>BF6 Builds Design System</h1><StatusBadge tone="accent">Visual 0.2</StatusBadge></div>
              <p>Documentação viva dos tokens, primitives, componentes e padrões usados pelo projeto. Esta página não contém regras de build, dados reais ou chamadas de API.</p>
            </section>

            <DsSection id="colors" title="Colors" description="Tokens semânticos atuais. Os valores exibidos são lidos diretamente das custom properties carregadas pelo produto.">
              <DsExample title="Semantic color tokens"><div className="ds-grid four">{COLOR_TOKENS.map(([label, token]) => <ColorToken key={token} label={label} token={token}/>)}</div></DsExample>
            </DsSection>

            <DsSection id="typography" title="Typography" description="Escala tipográfica formalizada a partir da linguagem já usada pela interface: sans para conteúdo e mono para dados/metadados.">
              <DsExample title="Type scale">
                <TypeSample type="display" name="Display" example="M4A1" meta={`sans · ${tokenValue("--font-size-display")} · ${tokenValue("--font-weight-display")} · LH ${tokenValue("--line-height-display")}`}/>
                <TypeSample type="heading" name="Heading" example="Build recomendada" meta={`sans · ${tokenValue("--font-size-heading")} · ${tokenValue("--font-weight-heading")} · LH ${tokenValue("--line-height-heading")}`}/>
                <TypeSample type="title" name="Title" example="Controle de recuo" meta={`sans · ${tokenValue("--font-size-title")} · ${tokenValue("--font-weight-title")} · LH ${tokenValue("--line-height-title")}`}/>
                <TypeSample type="body" name="Body" example="Configuração fictícia para avaliar legibilidade." meta={`sans · ${tokenValue("--font-size-body")} · ${tokenValue("--font-weight-body")} · LH ${tokenValue("--line-height-body")}`}/>
                <TypeSample type="label" name="Label" example="Sua maestria" meta={`sans · ${tokenValue("--font-size-label")} · ${tokenValue("--font-weight-label")} · LH ${tokenValue("--line-height-label")}`}/>
                <TypeSample type="caption" name="Caption" example="Resolver + derived" meta={`sans · ${tokenValue("--font-size-caption")} · ${tokenValue("--font-weight-caption")} · LH ${tokenValue("--line-height-caption")}`}/>
                <TypeSample type="data" name="Data / Numeric" example="742.5" meta={`mono · ${tokenValue("--font-size-data")} · ${tokenValue("--font-weight-data")} · tabular nums`}/>
              </DsExample>
            </DsSection>

            <DsSection id="spacing" title="Spacing" description="Escala única de 4 a 48 px. A visualização ajuda a identificar valores que escapem da progressão definida.">
              <DsExample title="Spacing scale"><div className="ds-spacing-list">{SPACING_TOKENS.map(([label, token]) => <div className="ds-spacing-row" key={token}><code>{label}</code><span className="ds-token-code">{tokenValue(token)}</span><span className="ds-spacing-bar" style={{ "--spacing-width": `var(${token})` } as any}/></div>)}</div></DsExample>
            </DsSection>

            <DsSection id="surfaces" title="Surfaces" description="Profundidade é construída por contraste de superfície e borda, sem glassmorphism, blur ou sombras decorativas.">
              <DsExample title="Surface levels"><div className="ds-grid four">
                <div className="ds-surface-demo" style={{ "--demo-surface": "var(--background)" } as any}><div><strong>Background</strong><p>Plano principal da aplicação.</p></div><code>--background</code></div>
                <div className="ds-surface-demo" style={{ "--demo-surface": "var(--surface)" } as any}><div><strong>Surface</strong><p>Blocos e agrupamentos padrão.</p></div><code>--surface</code></div>
                <div className="ds-surface-demo" style={{ "--demo-surface": "var(--surface-elevated)" } as any}><div><strong>Elevated</strong><p>Controles e conteúdo em destaque.</p></div><code>--surface-elevated</code></div>
                <div className="ds-surface-demo" data-selected="true" style={{ "--demo-surface": "var(--surface-hover)" } as any}><div><strong>Selected</strong><p>Exemplo com borda de accent.</p></div><code>surface-hover + accent</code></div>
              </div></DsExample>
            </DsSection>

            <DsSection id="borders" title="Borders & Radius" description="Bordas têm 1 px; a variação vem da força da cor. Radius permanece contido em 2, 4 e 6 px.">
              <DsExample title="Border colors"><div className="ds-grid two">
                <div className="ds-border-demo" style={{ "--demo-border": "var(--border)" } as any}>--border<br/>{tokenValue("--border")}</div>
                <div className="ds-border-demo" style={{ "--demo-border": "var(--border-strong)" } as any}>--border-strong<br/>{tokenValue("--border-strong")}</div>
              </div></DsExample>
              <DsExample title="Radius"><div className="ds-grid">
                <div className="ds-border-demo" style={{ "--demo-radius": "var(--radius-sm)" } as any}>sm · {tokenValue("--radius-sm")}</div>
                <div className="ds-border-demo" style={{ "--demo-radius": "var(--radius-md)" } as any}>md · {tokenValue("--radius-md")}</div>
                <div className="ds-border-demo" style={{ "--demo-radius": "var(--radius-lg)" } as any}>lg · {tokenValue("--radius-lg")}</div>
              </div></DsExample>
            </DsSection>

            <DsSection id="icons" title="Icons" description="Família interna única de ícones lineares, 1.8 px de stroke, usada pelos primitives sem dependência visual externa.">
              <DsExample title="Icon library"><div className="ds-icon-grid">{(["search","close","chevron-down","check","info","warning","plus","settings","arrow-right","refresh"] as IconName[]).map((name) => <div className="ds-icon-item" key={name}><Icon name={name} size={18}/><code>{name}</code></div>)}</div></DsExample>
              <DsExample title="Sizes & button use"><div className="ds-row"><Icon name="settings" size={14}/><Icon name="settings" size={16}/><Icon name="settings" size={20}/><Button size="icon" variant="secondary" icon="settings" ariaLabel="Configurações"/><Button variant="secondary" icon="plus">Adicionar</Button></div></DsExample>
            </DsSection>

            <DsSection id="buttons" title="Buttons" description="Quatro variantes, tamanhos compactos e icon-only. Hover, focus e active são estados reais: interaja com os exemplos.">
              <DsExample title="Variants"><div className="ds-row"><Button>Primary</Button><Button variant="secondary">Secondary</Button><Button variant="ghost">Ghost</Button><Button variant="destructive">Destructive</Button><Button size="icon" variant="secondary" icon="settings" ariaLabel="Configurações"/></div></DsExample>
              <DsExample title="Content"><div className="ds-row"><Button icon="plus">Ícone + texto</Button><Button variant="secondary">Somente texto</Button><Button size="icon" variant="ghost" icon="refresh" ariaLabel="Atualizar"/></div></DsExample>
              <DsExample title="States"><div className="ds-control-grid"><div className="ds-control-cell"><span className="ds-control-label">Default / Hover / Focus / Active</span><Button variant="secondary">Interaja comigo</Button></div><div className="ds-control-cell"><span className="ds-control-label">Disabled</span><Button disabled>Indisponível</Button></div><div className="ds-control-cell"><span className="ds-control-label">Loading</span><Button loading>Carregando</Button></div></div></DsExample>
            </DsSection>

            <DsSection id="inputs" title="Inputs" description="Input único com label obrigatória, helper, erro, disabled e ícone opcional. Focus usa a mesma cor de accent do sistema.">
              <DsExample title="Input states"><div className="ds-control-grid">
                <TextField label="Default" placeholder="Digite um valor" helper="Texto auxiliar curto."/>
                <TextField label="Filled" defaultValue="Maestria 12" helper="Valor preenchido."/>
                <TextField label="Com ícone" icon="search" defaultValue="M4A1"/>
                <TextField label="Error" defaultValue="999" error="Valor fora do intervalo permitido."/>
                <TextField label="Disabled" defaultValue="Bloqueado" disabled/>
              </div></DsExample>
            </DsSection>

            <DsSection id="search" title="Search" description="Busca compartilha o primitive de input e adiciona ícone e ação de limpar sem criar uma linguagem visual paralela.">
              <DsExample title="Search field"><div className="ds-grid two"><SearchField value={searchValue} onChange={setSearchValue} label="Busca vazia" placeholder="Buscar arma"/><SearchField value={filledSearch} onChange={setFilledSearch} label="Busca preenchida" placeholder="Buscar arma"/></div></DsExample>
            </DsSection>

            <DsSection id="selects" title="Selects" description="A V1 possui Select nativo estilizado. Combobox pesquisável ainda não faz parte do sistema e não é simulado aqui.">
              <DsExample title="Select states"><div className="ds-control-grid"><SelectField label="Default" options={SELECT_OPTIONS}/><SelectField label="Selecionado" options={SELECT_OPTIONS} defaultValue="dmr" helper="Seleção fictícia."/><SelectField label="Disabled" options={SELECT_OPTIONS} disabled/></div></DsExample>
            </DsSection>

            <DsSection id="tabs" title="Tabs" description="Tabs horizontais com active underline. Hover e focus podem ser avaliados diretamente; disabled permanece no mesmo grupo visual.">
              <DsExample title="Interactive tabs"><Tabs items={[{ id: "build", label: "Build", content: "Painel fictício de build." },{ id: "metrics", label: "Métricas", content: "Painel fictício de métricas." },{ id: "locked", label: "Bloqueado", disabled: true, content: "" }]}/></DsExample>
            </DsSection>

            <DsSection id="badges" title="Badges" description="Uma única família de badge com tons semânticos. Accent é destaque de produto; estados de feedback usam os tons semânticos.">
              <DsExample title="Semantic tones"><div className="ds-row"><StatusBadge>Neutral</StatusBadge><StatusBadge tone="info">Info</StatusBadge><StatusBadge tone="accent">Accent</StatusBadge><StatusBadge tone="positive">Positive</StatusBadge><StatusBadge tone="warning">Warning</StatusBadge><StatusBadge tone="negative">Negative</StatusBadge></div></DsExample>
            </DsSection>

            <DsSection id="cards" title="Cards" description="Cards existem como agrupamento quando o conteúdo pede unidade. O sistema evita transformar toda informação em cards.">
              <DsExample title="Card uses"><div className="ds-grid">
                <Card title="Basic Card" body="Conteúdo curto e estático." badge={<StatusBadge>Base</StatusBadge>}/>
                <Card interactive title="Interactive Card" body="Passe o mouse e navegue por teclado." footer={<span className="ds-token-code">Ação implícita</span>}/>
                <Card interactive selected title="Selected Card" body="Estado selecionado usa accent na borda." badge={<StatusBadge tone="accent">Selected</StatusBadge>}/>
                <Card title="Card with image" body="Mídia compacta, sem dominar o conteúdo." media={<div className="ds-thumb">Thumbnail</div>}/>
                <Card title="Card without image" body="A mesma estrutura funciona sem mídia." footer={<Button variant="ghost" size="sm" icon="arrow-right">Abrir</Button>}/>
                <Card interactive disabled title="Disabled Card" body="Interação indisponível com redução de ênfase."/>
              </div></DsExample>
            </DsSection>

            <DsSection id="tables" title="Tables" description="Tabela compacta para dados densos, com alinhamento numérico tabular, hover e seleção de linha.">
              <DsExample title="Compact data table"><div className="ui-data-table-wrap"><table className="ui-data-table"><thead><tr><th>Item</th><th>Estado</th><th className="numeric">Valor</th><th className="actions">Ação</th></tr></thead><tbody>
                <tr><td>Configuração Alpha</td><td><StatusBadge tone="positive">Ativo</StatusBadge></td><td className="numeric">742.5</td><td className="actions"><Button size="icon" variant="ghost" icon="settings" ariaLabel="Configurar Alpha"/></td></tr>
                <tr data-selected="true"><td>Configuração Bravo</td><td><StatusBadge tone="accent">Selecionado</StatusBadge></td><td className="numeric">681.0</td><td className="actions"><Button size="icon" variant="ghost" icon="settings" ariaLabel="Configurar Bravo"/></td></tr>
                <tr><td>Configuração Charlie</td><td><StatusBadge tone="warning">Revisar</StatusBadge></td><td className="numeric">599.2</td><td className="actions"><Button size="icon" variant="ghost" icon="settings" ariaLabel="Configurar Charlie"/></td></tr>
              </tbody></table></div></DsExample>
              <DsExample title="Table empty state"><EmptyState title="Nenhum registro" description="A tabela mantém um estado vazio simples, sem ilustração grande."/></DsExample>
            </DsSection>

            <DsSection id="tooltips" title="Tooltips" description="Tooltip abre por hover e por foco do teclado. Conteúdo permanece curto e contextual.">
              <DsExample title="Tooltip patterns"><div className="ds-row">
                <Tooltip label="Informação contextual curta."><span className="ds-row"><Icon name="info"/>Passe ou foque</span></Tooltip>
                <Tooltip label="Configurações visuais deste item."><Button size="icon" variant="secondary" icon="settings" ariaLabel="Abrir configurações"/></Tooltip>
                <Tooltip label="Texto um pouco maior para explicar uma métrica sem tirar o usuário do contexto atual."><span className="ds-token-code">Métrica contextual ⓘ</span></Tooltip>
              </div></DsExample>
            </DsSection>

            <DsSection id="overlays" title="Overlays" description="Estado real da V1: Popover, Dropdown, Dialog, Sheet e Drawer ainda não são primitives do projeto.">
              <Feedback tone="info" title="Nenhum overlay estrutural na V1">O showcase não simula componentes que ainda não existem. Tooltip é o único overlay contextual formalizado neste estágio.</Feedback>
            </DsSection>

            <DsSection id="progress" title="Progress & Indicators" description="Indicador linear compacto para progresso determinado. O valor textual permanece visível e não depende apenas de cor.">
              <DsExample title="Progress values"><div className="ds-stack"><ProgressBar value={25} label="Inicial"/><ProgressBar value={58} label="Intermediário"/><ProgressBar value={88} label="Avançado"/></div></DsExample>
            </DsSection>

            <DsSection id="loading" title="Loading" description="Skeleton preserva aproximadamente o layout final e usa pulsação simples, sem shimmer ou gradiente decorativo.">
              <DsExample title="Skeleton patterns"><div className="ds-grid">
                <div className="ds-skeleton-card"><Skeleton height="72px"/><Skeleton width="42%"/><Skeleton width="78%"/><Skeleton width="64%"/></div>
                <div className="ds-skeleton-card"><Skeleton width="30%" height="10px"/><Skeleton height="40px"/><Skeleton width="58%" height="10px"/></div>
                <div className="ds-skeleton-table"><div><Skeleton/><Skeleton/><Skeleton/></div><div><Skeleton/><Skeleton/><Skeleton/></div><div><Skeleton/><Skeleton/><Skeleton/></div></div>
              </div></DsExample>
            </DsSection>

            <DsSection id="empty" title="Empty States" description="Estado vazio prioriza explicação curta e uma ação opcional. Sem ilustração grande ou componente de marketing.">
              <DsExample title="Empty state"><EmptyState title="Nenhum item selecionado" description="Escolha um item para visualizar os detalhes deste painel." action={<Button variant="secondary" size="sm">Selecionar item</Button>}/></DsExample>
            </DsSection>

            <DsSection id="feedback" title="Error & Feedback" description="Uma única estrutura de feedback com variação semântica por tom e borda lateral.">
              <div className="ds-grid two"><Feedback tone="info" title="Informação">Contexto adicional sem bloquear a tarefa.</Feedback><Feedback tone="positive" title="Sucesso">A alteração fictícia foi aplicada.</Feedback><Feedback tone="warning" title="Atenção">Revise este valor antes de continuar.</Feedback><Feedback tone="negative" title="Erro">Não foi possível concluir a ação fictícia.</Feedback></div>
            </DsSection>

            <DsSection id="states" title="States" description="Comparação prática dos estados. Hover, focus e active devem ser acionados diretamente; selected e disabled são propriedades persistentes.">
              <DsExample title="Button state consistency"><div className="ds-state-grid">
                <div className="ds-state-cell"><span>Default</span><Button variant="secondary" size="sm">Default</Button></div>
                <div className="ds-state-cell"><span>Hover</span><Button variant="secondary" size="sm">Passe o mouse</Button></div>
                <div className="ds-state-cell"><span>Focus</span><Button variant="secondary" size="sm">Use Tab</Button></div>
                <div className="ds-state-cell"><span>Active</span><Button variant="secondary" size="sm">Pressione</Button></div>
                <div className="ds-state-cell"><span>Selected</span><StatusBadge tone="accent">Selected</StatusBadge></div>
                <div className="ds-state-cell"><span>Disabled</span><Button disabled size="sm">Disabled</Button></div>
              </div></DsExample>
              <DsExample title="Cross-component states"><div className="ds-grid"><Card interactive title="Card hover/focus" body="Interaja diretamente com o card."/><Card interactive selected title="Card selected" body="Seleção persistente."/><TextField label="Input error" defaultValue="Inválido" error="Mensagem de erro consistente."/></div></DsExample>
            </DsSection>

            <DsSection id="composition" title="Composition" description="Pequenas composições fictícias para avaliar como os componentes reais convivem, sem representar funcionalidades do produto.">
              <DsExample title="Toolbar"><div className="ds-composition-toolbar"><SearchField value={filledSearch} onChange={setFilledSearch} label="Buscar"/><SelectField label="Categoria" options={SELECT_OPTIONS}/><Button icon="plus">Adicionar</Button></div></DsExample>
              <DsExample title="Content card"><div className="ds-grid two"><Card title="Configuração de exemplo" body="Uma composição pequena com thumbnail, status e ação." media={<div className="ds-thumb">Thumbnail</div>} badge={<StatusBadge tone="positive">Disponível</StatusBadge>} footer={<><span className="ds-number">62<small> / 100</small></span><Button variant="secondary" size="sm" icon="arrow-right">Detalhes</Button></>}/></div></DsExample>
              <DsExample title="Data panel"><div className="ds-composition-panel"><div className="ds-kpi"><span>Índice fictício</span><div className="ds-number">742.5</div></div><div className="ds-stack"><ProgressBar value={74} label="Eficiência visual"/><div className="ui-data-table-wrap"><table className="ui-data-table"><thead><tr><th>Métrica</th><th className="numeric">Valor</th></tr></thead><tbody><tr><td>Resposta</td><td className="numeric">218 ms</td></tr><tr><td>Cadência</td><td className="numeric">720 rpm</td></tr></tbody></table></div></div></div></DsExample>
            </DsSection>
          </div>
        </main>
      </div>
    </div>
  );
}
