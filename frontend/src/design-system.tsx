import { useState } from "react"
import {
  AlertCircle,
  ArrowRight,
  Check,
  ChevronDown,
  CircleHelp,
  Copy,
  Info,
  Menu,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const SECTIONS = [
  ["badges", "Badges"],
  ["borders", "Borders & Radius"],
  ["buttons", "Buttons"],
  ["cards", "Cards"],
  ["colors", "Colors"],
  ["composition", "Composition"],
  ["empty", "Empty States"],
  ["feedback", "Feedback"],
  ["icons", "Icons"],
  ["inputs", "Inputs"],
  ["loading", "Loading"],
  ["overlays", "Overlays"],
  ["overview", "Overview"],
  ["search", "Search"],
  ["selects", "Selects"],
  ["spacing", "Spacing"],
  ["states", "States"],
  ["surfaces", "Surfaces"],
  ["tables", "Tables"],
  ["tabs", "Tabs"],
  ["tooltips", "Tooltips"],
  ["typography", "Typography"],
] as const

const COLORS = [
  ["Background", "--background"],
  ["Surface", "--card"],
  ["Surface Elevated", "--popover"],
  ["Border", "--border"],
  ["Text Primary", "--foreground"],
  ["Text Secondary", "--bf-text-secondary"],
  ["Text Muted", "--bf-text-muted"],
  ["Accent", "--primary"],
  ["Positive", "--bf-positive"],
  ["Warning", "--bf-warning"],
  ["Negative", "--destructive"],
  ["Disabled", "--bf-disabled"],
] as const

const SPACING = [
  ["1", "4 px", "w-1"],
  ["2", "8 px", "w-2"],
  ["3", "12 px", "w-3"],
  ["4", "16 px", "w-4"],
  ["5", "20 px", "w-5"],
  ["6", "24 px", "w-6"],
  ["8", "32 px", "w-8"],
  ["10", "40 px", "w-10"],
  ["12", "48 px", "w-12"],
] as const

function Section({ id, title, description, children }: { id: string; title: string; description: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 border-t py-10 first:border-t-0 first:pt-0">
      <div className="mb-6 max-w-3xl">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  )
}

function Example({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`mb-4 rounded-lg border bg-card ${className}`}>
      <div className="border-b px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</div>
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  )
}

function ColorSwatch({ label, token }: { label: string; token: string }) {
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="h-20 border-b" style={{ background: `var(${token})` }} />
      <div className="space-y-1 p-3">
        <p className="text-sm font-medium">{label}</p>
        <code className="block text-[11px] text-muted-foreground">{token}</code>
      </div>
    </div>
  )
}

function Field({ label, helper, error, ...props }: React.ComponentProps<typeof Input> & { label: string; helper?: string; error?: string }) {
  const id = `showcase-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} aria-invalid={Boolean(error)} {...props} />
      {error ? <p className="text-xs text-destructive">{error}</p> : helper ? <p className="text-xs text-muted-foreground">{helper}</p> : null}
    </div>
  )
}

function SearchExample() {
  const [value, setValue] = useState("M4A1")
  return (
    <div className="grid max-w-md gap-2">
      <Label htmlFor="showcase-search">Buscar</Label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input id="showcase-search" value={value} onChange={(event) => setValue(event.target.value)} placeholder="Buscar arma" className="pl-9 pr-9" />
        {value ? (
          <Button type="button" variant="ghost" size="icon-xs" className="absolute right-1.5 top-1/2 -translate-y-1/2" aria-label="Limpar busca" onClick={() => setValue("")}>
            <X />
          </Button>
        ) : null}
      </div>
    </div>
  )
}

export function DesignSystemPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <a href="#overview" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground">Ir para o conteúdo</a>

      <header className="sticky top-0 z-50 border-b bg-background">
        <div className="flex h-14 items-center gap-3 px-4 lg:px-6">
          <Button variant="ghost" size="sm" asChild><a href="/">← Produto</a></Button>
          <Separator orientation="vertical" className="h-5" />
          <span className="text-sm font-semibold">BF6 / Design System</span>
          <div className="ml-auto"><Badge variant="outline">Work in progress</Badge></div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1600px] lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="border-b bg-background lg:min-h-[calc(100vh-3.5rem)] lg:border-r lg:border-b-0">
          <nav className="flex gap-1 overflow-x-auto p-3 lg:sticky lg:top-14 lg:block lg:p-4" aria-label="Índice do Design System">
            <p className="mb-2 hidden px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground lg:block">Índice</p>
            {SECTIONS.map(([id, label]) => (
              <Button key={id} variant="ghost" size="sm" className="shrink-0 justify-start lg:mb-0.5 lg:w-full" asChild>
                <a href={`#${id}`}>{label}</a>
              </Button>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
          <div className="mx-auto max-w-6xl">
            <Section id="overview" title="BF6 Builds Design System" description="Documentação visual viva dos tokens e componentes reais usados pelo frontend. Os componentes desta página vêm de frontend/src/components/ui e foram gerados pelo CLI oficial do shadcn/ui.">
              <div className="flex flex-wrap gap-2">
                <Badge>shadcn/ui</Badge>
                <Badge variant="secondary">New York</Badge>
                <Badge variant="outline">Radix UI</Badge>
                <Badge variant="outline">Tailwind CSS v4</Badge>
                <Badge variant="outline">Lucide</Badge>
              </div>
            </Section>

            <Section id="colors" title="Colors" description="Paleta semântica consumida pelos componentes shadcn e aliases específicos do BF6. Não há cores extras criadas apenas para o showcase.">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {COLORS.map(([label, token]) => <ColorSwatch key={token} label={label} token={token} />)}
              </div>
            </Section>

            <Section id="typography" title="Typography" description="A escala usa as utilities tipográficas reais do Tailwind aplicadas no produto. Sans para conteúdo, mono para dados e identificadores.">
              <Example title="Type scale">
                <div className="divide-y">
                  {[
                    ["Display", "text-4xl / 36 px · 700", <span className="text-4xl font-bold tracking-tight">M4A1</span>],
                    ["Heading", "text-2xl / 24 px · 600", <span className="text-2xl font-semibold tracking-tight">Build recomendada</span>],
                    ["Title", "text-base / 16 px · 600", <span className="text-base font-semibold">Controle de recuo</span>],
                    ["Body", "text-sm / 14 px · 400", <span className="text-sm">Configuração fictícia para avaliar legibilidade.</span>],
                    ["Label", "text-sm / 14 px · 500", <span className="text-sm font-medium">Sua maestria</span>],
                    ["Caption", "text-xs / 12 px · 400", <span className="text-xs text-muted-foreground">Resolver + derived</span>],
                    ["Data / Numeric", "mono · text-xl · tabular", <span className="font-data text-xl font-semibold">742.5</span>],
                  ].map(([name, meta, sample]) => (
                    <div key={String(name)} className="grid gap-3 py-4 md:grid-cols-[160px_1fr_220px] md:items-center">
                      <span className="text-xs font-medium text-muted-foreground">{name}</span>
                      <div>{sample}</div>
                      <code className="text-[11px] text-muted-foreground">{meta}</code>
                    </div>
                  ))}
                </div>
              </Example>
            </Section>

            <Section id="spacing" title="Spacing" description="Escala utilizada pelo Tailwind no projeto. A representação gráfica usa as próprias utilities de largura correspondentes.">
              <Example title="Spacing scale">
                <div className="space-y-3">
                  {SPACING.map(([name, value, widthClass]) => (
                    <div key={name} className="grid grid-cols-[48px_64px_1fr] items-center gap-3">
                      <code className="text-xs">{name}</code>
                      <span className="text-xs text-muted-foreground">{value}</span>
                      <div className={`h-3 ${widthClass} bg-primary`} />
                    </div>
                  ))}
                </div>
              </Example>
            </Section>

            <Section id="surfaces" title="Surfaces" description="Os níveis reais são background, card e popover. Selected usa o mesmo accent/primary do sistema, sem um quarto sistema paralelo de superfícies.">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-lg border bg-background p-5"><strong className="text-sm">Background</strong><p className="mt-2 text-xs text-muted-foreground">Plano principal.</p></div>
                <div className="rounded-lg border bg-card p-5"><strong className="text-sm">Card / Surface</strong><p className="mt-2 text-xs text-muted-foreground">Agrupamento padrão.</p></div>
                <div className="rounded-lg border bg-popover p-5 shadow-md"><strong className="text-sm">Popover / Elevated</strong><p className="mt-2 text-xs text-muted-foreground">Conteúdo flutuante.</p></div>
                <div className="rounded-lg border border-primary bg-primary/5 p-5"><strong className="text-sm">Selected</strong><p className="mt-2 text-xs text-muted-foreground">Accent + superfície existente.</p></div>
              </div>
            </Section>

            <Section id="borders" title="Borders & Radius" description="Bordas usam border/input/ring do tema. Radius parte de --radius e alimenta as utilities usadas pelos componentes shadcn.">
              <Example title="Radius">
                <div className="grid gap-3 sm:grid-cols-4">
                  <div className="rounded-sm border p-5 text-sm">rounded-sm</div>
                  <div className="rounded-md border p-5 text-sm">rounded-md</div>
                  <div className="rounded-lg border p-5 text-sm">rounded-lg</div>
                  <div className="rounded-xl border p-5 text-sm">rounded-xl</div>
                </div>
              </Example>
              <Example title="Border & ring"><div className="flex flex-wrap gap-3"><div className="rounded-md border p-4 text-sm">Border</div><div className="rounded-md border border-input p-4 text-sm">Input border</div><Button variant="outline">Focus com Tab</Button></div></Example>
            </Section>

            <Section id="icons" title="Icons" description="Lucide é a única família de ícones do frontend. Os próprios componentes shadcn também importam Lucide quando precisam de affordances internas.">
              <Example title="Representative icons">
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-10">
                  {[
                    ["Search", Search], ["X", X], ["Chevron", ChevronDown], ["Check", Check], ["Info", Info],
                    ["Alert", AlertCircle], ["Plus", Plus], ["Settings", Settings], ["Arrow", ArrowRight], ["Refresh", RefreshCw],
                  ].map(([name, Icon]) => (
                    <div key={String(name)} className="grid place-items-center gap-2 rounded-lg border p-3 text-center">
                      {typeof Icon !== "string" ? <Icon className="size-5" /> : null}
                      <code className="text-[10px] text-muted-foreground">{String(name)}</code>
                    </div>
                  ))}
                </div>
              </Example>
            </Section>

            <Section id="buttons" title="Buttons" description="Variantes e tamanhos diretamente do Button gerado pelo shadcn. Hover, focus e active são estados reais; use mouse e teclado.">
              <Example title="Variants"><div className="flex flex-wrap gap-2"><Button>Default</Button><Button variant="secondary">Secondary</Button><Button variant="outline">Outline</Button><Button variant="ghost">Ghost</Button><Button variant="destructive">Destructive</Button><Button variant="link">Link</Button></div></Example>
              <Example title="Sizes & icons"><div className="flex flex-wrap items-center gap-2"><Button size="xs">XS</Button><Button size="sm">Small</Button><Button>Default</Button><Button size="lg">Large</Button><Button><Plus />Adicionar</Button><Button variant="outline" size="icon" aria-label="Configurações"><Settings /></Button></div></Example>
              <Example title="Disabled"><div className="flex flex-wrap gap-2"><Button disabled>Disabled</Button><Button variant="outline" disabled><RefreshCw />Carregando</Button></div></Example>
            </Section>

            <Section id="inputs" title="Inputs" description="Input e Label são os componentes reais do registry. Error usa aria-invalid, que o componente shadcn já estiliza no primitive.">
              <div className="grid gap-4 md:grid-cols-2">
                <Example title="Default"><Field label="Nome" placeholder="Digite um nome" helper="Helper text curto." /></Example>
                <Example title="Filled"><Field label="Maestria" defaultValue="12" /></Example>
                <Example title="Error"><Field label="Valor" defaultValue="999" error="Valor fora do intervalo." /></Example>
                <Example title="Disabled"><Field label="Bloqueado" defaultValue="Indisponível" disabled /></Example>
              </div>
            </Section>

            <Section id="search" title="Search" description="Busca é uma composição de Input + Button + Lucide; não existe um segundo primitive de input criado só para ela.">
              <Example title="Interactive search"><SearchExample /></Example>
            </Section>

            <Section id="selects" title="Selects" description="Select usa o componente shadcn sobre Radix UI. O menu abaixo é interativo e mantém foco/teclado do primitive original.">
              <Example title="Select states">
                <div className="flex flex-wrap gap-4">
                  <Select defaultValue="assault"><SelectTrigger className="w-[220px]"><SelectValue placeholder="Classe" /></SelectTrigger><SelectContent><SelectItem value="assault">Fuzil de assalto</SelectItem><SelectItem value="smg">SMG</SelectItem><SelectItem value="dmr">DMR</SelectItem></SelectContent></Select>
                  <Select disabled><SelectTrigger className="w-[220px]"><SelectValue placeholder="Disabled" /></SelectTrigger><SelectContent><SelectItem value="x">Opção</SelectItem></SelectContent></Select>
                </div>
              </Example>
            </Section>

            <Section id="tabs" title="Tabs" description="Tabs usa o componente shadcn/Radix sem uma implementação local paralela.">
              <Example title="Interactive tabs">
                <Tabs defaultValue="build" className="max-w-xl">
                  <TabsList><TabsTrigger value="build">Build</TabsTrigger><TabsTrigger value="metrics">Métricas</TabsTrigger><TabsTrigger value="locked" disabled>Bloqueado</TabsTrigger></TabsList>
                  <TabsContent value="build" className="pt-3 text-sm text-muted-foreground">Conteúdo fictício da build.</TabsContent>
                  <TabsContent value="metrics" className="pt-3 text-sm text-muted-foreground">Conteúdo fictício de métricas.</TabsContent>
                </Tabs>
              </Example>
            </Section>

            <Section id="badges" title="Badges" description="Variantes oficiais do Badge. Estados semânticos adicionais reutilizam os tokens BF6 sem criar um novo componente.">
              <Example title="Variants"><div className="flex flex-wrap gap-2"><Badge>Default</Badge><Badge variant="secondary">Secondary</Badge><Badge variant="outline">Outline</Badge><Badge variant="ghost">Ghost</Badge><Badge variant="destructive">Destructive</Badge><Badge variant="outline" className="text-[var(--bf-positive)]">Positive</Badge><Badge variant="outline" className="text-[var(--bf-warning)]">Warning</Badge></div></Example>
            </Section>

            <Section id="cards" title="Cards" description="Card, CardHeader, CardContent, CardFooter e CardAction são exatamente os primitives do shadcn instalados no projeto.">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <Card><CardHeader><CardTitle>Basic Card</CardTitle><CardDescription>Conteúdo simples.</CardDescription></CardHeader><CardContent><p className="text-sm">Informação curta e objetiva.</p></CardContent></Card>
                <Card className="border-primary"><CardHeader><CardTitle>Selected Card</CardTitle><CardDescription>Seleção usa border-primary.</CardDescription></CardHeader><CardContent><Badge>Selecionado</Badge></CardContent></Card>
                <Card><div className="mx-6 h-24 rounded-md border bg-muted" /><CardHeader><CardTitle>Card with media</CardTitle><CardDescription>Placeholder, não uma imagem decorativa.</CardDescription></CardHeader><CardFooter><Button variant="outline" size="sm">Ação</Button></CardFooter></Card>
                <Card className="opacity-50" aria-disabled="true"><CardHeader><CardTitle>Disabled Card</CardTitle><CardDescription>Estado indisponível.</CardDescription></CardHeader></Card>
              </div>
            </Section>

            <Section id="tables" title="Tables" description="Tabela compacta usando os primitives Table do shadcn. Hover e selected vêm das classes do componente.">
              <Example title="Compact data table">
                <div className="overflow-hidden rounded-md border">
                  <Table>
                    <TableHeader><TableRow><TableHead>Arma</TableHead><TableHead>Classe</TableHead><TableHead className="text-right">Score</TableHead><TableHead className="w-12"><span className="sr-only">Ações</span></TableHead></TableRow></TableHeader>
                    <TableBody>
                      <TableRow><TableCell className="font-medium">M4A1</TableCell><TableCell>Assault</TableCell><TableCell className="text-right font-data">86.4</TableCell><TableCell><Button variant="ghost" size="icon-xs" aria-label="Mais ações"><MoreHorizontal /></Button></TableCell></TableRow>
                      <TableRow data-state="selected"><TableCell className="font-medium">KORD</TableCell><TableCell>LMG</TableCell><TableCell className="text-right font-data">81.2</TableCell><TableCell><Button variant="ghost" size="icon-xs" aria-label="Mais ações"><MoreHorizontal /></Button></TableCell></TableRow>
                      <TableRow><TableCell className="font-medium">SVDM</TableCell><TableCell>DMR</TableCell><TableCell className="text-right font-data">78.9</TableCell><TableCell><Button variant="ghost" size="icon-xs" aria-label="Mais ações"><MoreHorizontal /></Button></TableCell></TableRow>
                    </TableBody>
                  </Table>
                </div>
              </Example>
            </Section>

            <Section id="tooltips" title="Tooltips" description="Tooltip é o componente shadcn/Radix, disponível por hover e foco de teclado.">
              <Example title="Tooltip examples"><div className="flex flex-wrap gap-3"><Tooltip><TooltipTrigger asChild><Button variant="outline">Passe o mouse</Button></TooltipTrigger><TooltipContent>Tooltip simples</TooltipContent></Tooltip><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" aria-label="Ajuda"><CircleHelp /></Button></TooltipTrigger><TooltipContent>Explicação um pouco maior sobre este controle.</TooltipContent></Tooltip></div></Example>
            </Section>

            <Section id="overlays" title="Overlays" description="Dialog, Sheet, Popover e Dropdown Menu já existem no shadcn e são mostrados sem versões customizadas concorrentes.">
              <Example title="Interactive overlays">
                <div className="flex flex-wrap gap-2">
                  <Dialog><DialogTrigger asChild><Button variant="outline">Dialog</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Dialog de exemplo</DialogTitle><DialogDescription>Conteúdo fictício para avaliar espaçamento, foco e overlay.</DialogDescription></DialogHeader><DialogFooter><Button>Confirmar</Button></DialogFooter></DialogContent></Dialog>
                  <Sheet><SheetTrigger asChild><Button variant="outline"><Menu />Sheet</Button></SheetTrigger><SheetContent><SheetHeader><SheetTitle>Painel lateral</SheetTitle><SheetDescription>Exemplo do Sheet oficial do shadcn.</SheetDescription></SheetHeader></SheetContent></Sheet>
                  <Popover><PopoverTrigger asChild><Button variant="outline">Popover</Button></PopoverTrigger><PopoverContent className="w-72"><p className="text-sm font-medium">Popover</p><p className="mt-1 text-xs text-muted-foreground">Informação contextual curta.</p></PopoverContent></Popover>
                  <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline">Dropdown <ChevronDown /></Button></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuLabel>Ações</DropdownMenuLabel><DropdownMenuSeparator /><DropdownMenuItem><Copy />Copiar</DropdownMenuItem><DropdownMenuItem><Settings />Configurar</DropdownMenuItem><DropdownMenuItem variant="destructive"><Trash2 />Excluir</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
                </div>
              </Example>
            </Section>

            <Section id="feedback" title="Feedback" description="Alert é o primitive único. Variações semânticas usam os tokens existentes, não um segundo padrão de banner.">
              <div className="grid gap-3 md:grid-cols-2">
                <Alert><Info /><AlertTitle>Informação</AlertTitle><AlertDescription>Mensagem contextual neutra.</AlertDescription></Alert>
                <Alert style={{ borderColor: "var(--bf-positive)" }}><Check style={{ color: "var(--bf-positive)" }} /><AlertTitle>Sucesso</AlertTitle><AlertDescription>A operação fictícia foi concluída.</AlertDescription></Alert>
                <Alert style={{ borderColor: "var(--bf-warning)" }}><ShieldAlert style={{ color: "var(--bf-warning)" }} /><AlertTitle>Atenção</AlertTitle><AlertDescription>Revise esta configuração.</AlertDescription></Alert>
                <Alert variant="destructive"><AlertCircle /><AlertTitle>Erro</AlertTitle><AlertDescription>Não foi possível concluir a ação.</AlertDescription></Alert>
              </div>
            </Section>

            <Section id="loading" title="Loading" description="Skeleton é o padrão principal para preservar aproximadamente o layout final durante carregamento.">
              <div className="grid gap-4 md:grid-cols-2">
                <Card><CardHeader><Skeleton className="h-5 w-40" /><Skeleton className="h-4 w-64 max-w-full" /></CardHeader><CardContent className="space-y-3"><Skeleton className="h-24 w-full" /><Skeleton className="h-9 w-28" /></CardContent></Card>
                <div className="overflow-hidden rounded-lg border"><div className="flex gap-4 border-b p-4"><Skeleton className="h-4 flex-1" /><Skeleton className="h-4 w-20" /></div><div className="flex gap-4 border-b p-4"><Skeleton className="h-4 flex-1" /><Skeleton className="h-4 w-20" /></div><div className="flex gap-4 p-4"><Skeleton className="h-4 flex-1" /><Skeleton className="h-4 w-20" /></div></div>
              </div>
            </Section>

            <Section id="empty" title="Empty States" description="Estado vazio simples composto apenas com Card, Button e Lucide; não há ilustração ou componente paralelo desnecessário.">
              <Card className="max-w-lg items-center text-center"><CardHeader><div className="mx-auto mb-2 grid size-10 place-items-center rounded-lg border bg-muted"><Search className="size-4" /></div><CardTitle>Nenhum resultado</CardTitle><CardDescription>Ajuste os filtros ou limpe a busca para continuar.</CardDescription></CardHeader><CardFooter><Button variant="outline" size="sm">Limpar filtros</Button></CardFooter></Card>
            </Section>

            <Section id="states" title="States" description="Comparação rápida entre estados reais. Hover/focus/active devem ser testados diretamente com mouse e Tab; selected é representado pela mesma semântica usada no produto.">
              <Example title="State matrix">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="grid gap-2"><span className="text-xs text-muted-foreground">Default / Hover / Focus / Active</span><Button variant="outline">Interaja</Button></div>
                  <div className="grid gap-2"><span className="text-xs text-muted-foreground">Selected</span><Button>Selecionado</Button></div>
                  <div className="grid gap-2"><span className="text-xs text-muted-foreground">Disabled</span><Button disabled>Desabilitado</Button></div>
                  <div className="grid gap-2"><span className="text-xs text-muted-foreground">Input</span><Input placeholder="Clique ou use Tab" /></div>
                  <div className="grid gap-2"><span className="text-xs text-muted-foreground">Card selected</span><Card className="border-primary py-4"><CardContent className="px-4 text-sm">Selected surface</CardContent></Card></div>
                </div>
              </Example>
            </Section>

            <Section id="composition" title="Composition" description="Pequenas composições para verificar como componentes oficiais funcionam juntos sem representar funcionalidades reais do produto.">
              <Example title="Toolbar">
                <div className="flex flex-col gap-2 md:flex-row">
                  <div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Buscar" /></div>
                  <Select defaultValue="all"><SelectTrigger className="w-full md:w-[180px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todas as classes</SelectItem><SelectItem value="assault">Assault</SelectItem></SelectContent></Select>
                  <Button><Plus />Adicionar</Button>
                </div>
              </Example>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card><CardHeader><div><CardTitle>Content card</CardTitle><CardDescription>Composição de thumbnail, badge, dados e ação.</CardDescription></div><CardAction><Badge>Meta</Badge></CardAction></CardHeader><CardContent><div className="mb-4 h-28 rounded-md border bg-muted" /><div className="grid grid-cols-2 gap-3 text-sm"><div><p className="text-xs text-muted-foreground">Score</p><p className="font-data text-xl font-semibold">86.4</p></div><div><p className="text-xs text-muted-foreground">Custo</p><p className="font-data text-xl font-semibold">60</p></div></div></CardContent><CardFooter><Button variant="outline" size="sm">Ver detalhes <ArrowRight /></Button></CardFooter></Card>
                <Card><CardHeader><CardTitle>Data panel</CardTitle><CardDescription>Heading, valor, progresso e tabela.</CardDescription></CardHeader><CardContent className="space-y-5"><div><div className="flex justify-between"><span className="text-sm">Precisão</span><span className="font-data text-sm">72%</span></div><Progress value={72} className="mt-2" /></div><div className="overflow-hidden rounded-md border"><Table><TableBody><TableRow><TableCell>TTK</TableCell><TableCell className="text-right font-data">250 ms</TableCell></TableRow><TableRow><TableCell>RPM</TableCell><TableCell className="text-right font-data">720</TableCell></TableRow></TableBody></Table></div></CardContent></Card>
              </div>
            </Section>
          </div>
        </main>
      </div>
    </div>
  )
}