import { Check, CircleDot } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  attachmentLabel,
  type ProgressionStep,
} from "@/features/builds/model"

type ProgressionTimelineProps = {
  steps: ProgressionStep[]
  mastery: number
}

export function ProgressionTimeline({ steps, mastery }: ProgressionTimelineProps) {
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
              <div
                key={step.mastery}
                className={`relative rounded-lg border p-4 transition-colors ${
                  current
                    ? "bg-accent/50 ring-1 ring-primary/20"
                    : reached
                      ? "bg-muted/30"
                      : "opacity-60"
                }`}
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <Badge
                    variant="outline"
                    className={current ? "border-primary/30 bg-primary/5 text-primary" : undefined}
                  >
                    M{step.mastery}
                  </Badge>
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
