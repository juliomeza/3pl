"use client"

import { Bar, BarChart, Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ComposedChart } from "recharts"
import {
  ChartContainer,
  ChartTooltipContent,
  ChartTooltip,
} from "@/components/ui/chart"

const chartData = [
  { month: "January", shipments: 186, inventory: 80, turnover: 1.2 },
  { month: "February", shipments: 305, inventory: 90, turnover: 1.5 },
  { month: "March", shipments: 237, inventory: 70, turnover: 1.3 },
  { month: "April", shipments: 273, inventory: 85, turnover: 1.6 },
  { month: "May", shipments: 209, inventory: 65, turnover: 1.4 },
  { month: "June", shipments: 214, inventory: 75, turnover: 1.5 },
]

const chartConfig = {
  shipments: {
    label: "Shipments",
    color: "hsl(var(--primary))",
  },
  inventory: {
    label: "Inventory",
    color: "hsl(var(--secondary))",
  },
  turnover: {
    label: "Turnover Rate",
    color: "hsl(var(--accent))",
  },
}

export function LogisticsOverviewChart() {
  return (
    <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
      <ComposedChart data={chartData}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => value.slice(0, 3)}
        />
        <YAxis yAxisId="left" orientation="left" stroke="hsl(var(--foreground))" />
        <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--accent))" />
        <Tooltip content={<ChartTooltipContent />} />
        <Legend />
        <Bar dataKey="shipments" yAxisId="left" fill="var(--color-shipments)" radius={4} />
        <Line type="monotone" dataKey="turnover" yAxisId="right" stroke="var(--color-turnover)" strokeWidth={2} dot={false} />
      </ComposedChart>
    </ChartContainer>
  )
}
