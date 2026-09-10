/**
 * Source-owned UI primitives following the shadcn/ui composition model:
 * small semantic components, tokens owned by the product, no visual dependency
 * on a generic component theme.
 */
function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

type IconName = "search" | "close" | "chevron-down" | "check" | "info" | "warning" | "plus" | "settings" | "arrow-right" | "refresh";

function Icon(props: { name: IconName; size?: number; label?: string }) {
  const size = props.size ?? 16;
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": props.label ? undefined : true, role: props.label ? "img" : undefined, "aria-label": props.label } as any;
  const paths: Record<IconName, any> = {
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-3.4-3.4"/></>,
    close: <><path d="M6 6l12 12M18 6 6 18"/></>,
    "chevron-down": <path d="m7 10 5 5 5-5"/>,
    check: <path d="m5 12 4 4L19 6"/>,
    info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></>,
    warning: <><path d="M12 3 2.8 20h18.4L12 3Z"/><path d="M12 9v4M12 17h.01"/></>,
    plus: <path d="M12 5v14M5 12h14"/>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1A7 7 0 0 0 15 6l-.3-2.6h-4L10.4 6A7 7 0 0 0 8.5 7L6 6.1 4 9.5 6 11a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.5-1A7 7 0 0 0 10.4 18l.3 2.6h4L15 18a7 7 0 0 0 1.5-1l2.4 1 2-3.4-2-1.5c.1-.4.1-.7.1-1.1Z"/></>,
    "arrow-right": <><path d="M5 12h14M14 7l5 5-5 5"/></>,
    refresh: <><path d="M20 7v5h-5"/><path d="M19 12a7 7 0 1 0-2 5"/></>,
  };
  return <svg {...common}>{paths[props.name]}</svg>;
}

type BadgeTone = "neutral" | "info" | "accent" | "positive" | "warning" | "negative";
function StatusBadge(props: { children?: any; tone?: BadgeTone }) {
  return <span className="status-badge" data-tone={props.tone ?? "neutral"}>{props.children}</span>;
}

function Surface(props: { title: string; action?: any; className?: string; children?: any }) {
  return (
    <section className={cn("surface border border-bf-border bg-bf-surface", props.className)}>
      <header className="surface-header">
        <h2 className="surface-title">{props.title}</h2>
        {props.action ?? null}
      </header>
      {props.children}
    </section>
  );
}

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
function Button(props: { children?: any; variant?: ButtonVariant; size?: "sm" | "md" | "icon"; disabled?: boolean; loading?: boolean; icon?: IconName; type?: "button" | "submit"; onClick?: () => void; ariaLabel?: string }) {
  const size = props.size ?? "md";
  return (
    <button
      className="ui-button"
      data-variant={props.variant ?? "primary"}
      data-size={size}
      type={props.type ?? "button"}
      disabled={props.disabled || props.loading}
      aria-busy={props.loading ? true : undefined}
      aria-label={props.ariaLabel}
      onClick={props.onClick}
    >
      {props.loading ? <span className="ui-spinner" aria-hidden="true"/> : props.icon ? <Icon name={props.icon} size={size === "icon" ? 17 : 15}/> : null}
      {size !== "icon" ? <span>{props.children}</span> : null}
    </button>
  );
}

function TextField(props: { label: string; placeholder?: string; helper?: string; error?: string; disabled?: boolean; defaultValue?: string; icon?: IconName; type?: string }) {
  const id = `field-${String(props.label).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const describedBy = props.error ? `${id}-error` : props.helper ? `${id}-helper` : undefined;
  return (
    <div className="ui-field" data-error={props.error ? "true" : "false"}>
      <label htmlFor={id}>{props.label}</label>
      <div className="ui-input-wrap">
        {props.icon ? <span className="ui-input-icon"><Icon name={props.icon}/></span> : null}
        <input id={id} type={props.type ?? "text"} placeholder={props.placeholder} defaultValue={props.defaultValue} disabled={props.disabled} aria-invalid={props.error ? true : undefined} aria-describedby={describedBy}/>
      </div>
      {props.error ? <div className="ui-field-message error" id={`${id}-error`}>{props.error}</div> : props.helper ? <div className="ui-field-message" id={`${id}-helper`}>{props.helper}</div> : null}
    </div>
  );
}

function SearchField(props: { value: string; onChange: (value: string) => void; placeholder?: string; label?: string }) {
  const id = "ds-search-field";
  return (
    <div className="ui-field ui-search-field">
      <label htmlFor={id}>{props.label ?? "Buscar"}</label>
      <div className="ui-input-wrap">
        <span className="ui-input-icon"><Icon name="search"/></span>
        <input id={id} value={props.value} onChange={(event: any) => props.onChange(event.target.value)} placeholder={props.placeholder ?? "Buscar"}/>
        {props.value ? <button className="ui-input-action" type="button" aria-label="Limpar busca" onClick={() => props.onChange("")}><Icon name="close" size={14}/></button> : null}
      </div>
    </div>
  );
}

function SelectField(props: { label: string; options: Array<{ value: string; label: string }>; defaultValue?: string; disabled?: boolean; helper?: string }) {
  const id = `select-${String(props.label).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <div className="ui-field">
      <label htmlFor={id}>{props.label}</label>
      <div className="ui-select-wrap">
        <select id={id} defaultValue={props.defaultValue} disabled={props.disabled}>
          {props.options.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
        </select>
        <span className="ui-select-icon"><Icon name="chevron-down" size={14}/></span>
      </div>
      {props.helper ? <div className="ui-field-message">{props.helper}</div> : null}
    </div>
  );
}

function Tabs(props: { items: Array<{ id: string; label: string; disabled?: boolean; content: any }>; defaultId?: string }) {
  const initial = props.defaultId ?? props.items.find((item) => !item.disabled)?.id ?? props.items[0]?.id ?? "";
  const [active, setActive] = React.useState(initial);
  const activeItem = props.items.find((item) => item.id === active) ?? props.items[0];
  return (
    <div className="ui-tabs">
      <div className="ui-tablist" role="tablist" aria-label="Exemplo de abas">
        {props.items.map((item) => <button key={item.id} type="button" role="tab" aria-selected={active === item.id} aria-controls={`panel-${item.id}`} disabled={item.disabled} onClick={() => setActive(item.id)}>{item.label}</button>)}
      </div>
      {activeItem ? <div className="ui-tabpanel" role="tabpanel" id={`panel-${activeItem.id}`}>{activeItem.content}</div> : null}
    </div>
  );
}

function Card(props: { title: string; body?: string; badge?: any; selected?: boolean; interactive?: boolean; disabled?: boolean; media?: any; footer?: any }) {
  const content = <>
    {props.media ? <div className="ui-card-media">{props.media}</div> : null}
    <div className="ui-card-body">
      <div className="ui-card-top"><strong>{props.title}</strong>{props.badge ?? null}</div>
      {props.body ? <p>{props.body}</p> : null}
      {props.footer ? <div className="ui-card-footer">{props.footer}</div> : null}
    </div>
  </>;
  return props.interactive ? <button type="button" className="ui-card interactive" data-selected={props.selected ? "true" : "false"} disabled={props.disabled}>{content}</button> : <article className="ui-card" data-selected={props.selected ? "true" : "false"} aria-disabled={props.disabled ? true : undefined}>{content}</article>;
}

function Tooltip(props: { label: string; children: any }) {
  return <span className="ui-tooltip"><span className="ui-tooltip-trigger" tabIndex={0}>{props.children}</span><span className="ui-tooltip-content" role="tooltip">{props.label}</span></span>;
}

function ProgressBar(props: { value: number; label?: string }) {
  const value = Math.max(0, Math.min(100, props.value));
  return <div className="ui-progress-block"><div className="ui-progress-meta"><span>{props.label ?? "Progresso"}</span><strong>{value}%</strong></div><div className="ui-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}><span style={{ width: `${value}%` }}/></div></div>;
}

function Feedback(props: { tone: "info" | "positive" | "warning" | "negative"; title: string; children?: any }) {
  const icon: IconName = props.tone === "warning" || props.tone === "negative" ? "warning" : props.tone === "positive" ? "check" : "info";
  return <div className="ui-feedback" data-tone={props.tone} role={props.tone === "negative" ? "alert" : "status"}><Icon name={icon}/><div><strong>{props.title}</strong>{props.children ? <p>{props.children}</p> : null}</div></div>;
}

function Skeleton(props: { width?: string; height?: string; radius?: string }) {
  return <span className="ui-skeleton" aria-hidden="true" style={{ width: props.width ?? "100%", height: props.height ?? "12px", borderRadius: props.radius }}/ >;
}

function EmptyState(props: { title: string; description: string; action?: any }) {
  return <div className="ui-empty"><Icon name="info" size={20}/><strong>{props.title}</strong><p>{props.description}</p>{props.action ? <div>{props.action}</div> : null}</div>;
}
