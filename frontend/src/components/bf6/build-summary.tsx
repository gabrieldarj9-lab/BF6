import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  attachmentLabel,
  slotLabel,
  type ProgressionStep,
  type Weapon,
} from "@/features/builds/model"

function ImportanceBadge({ importance }: { importance: ProgressionStep["importance"] | "BASE" }) {
  if (importance === "META") return <Badge>Meta</Badge>
  if (importance === "MAJOR") return <Badge variant="secondary">Upgrade principal</Badge>
  if (importance === "RECOMMENDED") return <Badge variant="outline">Recomendada</Badge>
  return <Badge variant="outline">Base</Badge>
}

type BuildSummaryProps = {
  weapon: Weapon
  step: ProgressionStep | null
}

export function BuildSummary({ weapon, step }: BuildSummaryProps) {
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
