import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"

type MasterySelectorProps = {
  value: number
  max: number
  onChange: (value: number) => void
}

export function MasterySelector({ value, max, onChange }: MasterySelectorProps) {
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
