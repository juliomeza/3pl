
"use client"

import { Bar, BarChart, Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ComposedChart } from "recharts"
import {
  ChartContainer,
  ChartTooltipContent,
  ChartTooltip,
} from "@/components/ui/chart"

const chartData = [
  { month: "January", shipments: 186, turnover: 1.2 },
  { month: "February", shipments: 305, turnover: 1.5 },
  { month: "March", shipments: 237, turnover: 1.3 },
  { month: "April", shipments: 273, turnover: 1.6 },
  { month: "May", shipments: 209, turnover: 1.4 },
  { month: "June", shipments: 214, turnover: 1.5 },
]

const chartConfig = {
  shipments: {
    label: "Shipments",
    color: "hsl(var(--chart-1))",
  },
  turnover: {
    label: "Turnover Rate",
    color: "hsl(var(--chart-5))",
  },
}

export function LogisticsOverviewChart() {
  return (
    <ChartContainer config={chartConfig} className="w-full">
      <ComposedChart 
        data={chartData}
        margin={{
          top: 10,
          right: 10,
          left: -20,
          bottom: 0,
        }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => value.slice(0, 3)}
          interval={0}
        />
        <YAxis yAxisId="left" orientation="left" stroke="hsl(var(--foreground))" />
        <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--chart-5))" />
        <Tooltip content={<ChartTooltipContent />} />
        <Legend />
        <Bar dataKey="shipments" yAxisId="left" fill="var(--color-shipments)" radius={4} fillOpacity={0.7} />
        <Line type="monotone" dataKey="turnover" yAxisId="right" stroke="var(--color-turnover)" strokeWidth={2} dot={false} strokeOpacity={0.8} />
      </ComposedChart>
    </ChartContainer>
  )
}
