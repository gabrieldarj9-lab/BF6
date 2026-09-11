import { Info } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  formatMetric,
  METRICS,
  type MetricsResult,
} from "@/features/builds/model"

type MetricsPanelProps = {
  metrics: MetricsResult | null
  loading: boolean
}

export function MetricsPanel({ metrics, loading }: MetricsPanelProps) {
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
