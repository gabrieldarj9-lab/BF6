/**
 * Source-owned UI primitives following the shadcn/ui composition model:
 * small semantic components, tokens owned by the product, no visual dependency
 * on a generic component theme.
 */
function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

function StatusBadge(props: { children?: any; tone?: "neutral" | "accent" | "positive" }) {
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
