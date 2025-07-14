"use client"

import { Pie, PieChart, Cell, Tooltip } from "recharts"
import {
  ChartContainer,
  ChartTooltipContent,
  ChartTooltip,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"

const chartData = [
  { status: "Delivered", count: 275, fill: "hsl(var(--chart-4))" },
  { status: "In Transit", count: 120, fill: "hsl(var(--chart-5))" },
  { status: "Processing", count: 80, fill: "hsl(var(--chart-2))" },
  { status: "Delayed", count: 30, fill: "hsl(var(--chart-1))" },
]

const chartConfig = {
  count: {
    label: "Orders",
  },
  Delivered: {
    label: "Delivered",
    color: "hsl(var(--chart-4))",
  },
  "In Transit": {
    label: "In Transit",
    color: "hsl(var(--chart-5))",
  },
  Processing: {
    label: "Processing",
    color: "hsl(var(--chart-2))",
  },
  Delayed: {
    label: "Delayed",
    color: "hsl(var(--chart-1))",
  },
}

export function OrderTrackingChart() {
  return (
    <ChartContainer
      config={chartConfig}
      className="min-h-[300px] w-full aspect-square"
    >
      <PieChart>
        <Tooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel nameKey="status" />}
        />
        <Pie
          data={chartData}
          dataKey="count"
          nameKey="status"
          innerRadius={60}
          strokeWidth={5}
        >
            {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} fillOpacity={0.7} />
            ))}
        </Pie>
        <ChartLegend
          content={<ChartLegendContent nameKey="status" />}
          className="-translate-y-[2rem] flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
        />
      </PieChart>
    </ChartContainer>
  )
}
