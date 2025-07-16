
"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"

const chartData = [
  { date: "2024-01", onTime: 240, delayed: 20 },
  { date: "2024-02", onTime: 280, delayed: 25 },
  { date: "2024-03", onTime: 220, delayed: 35 },
  { date: "2024-04", onTime: 310, delayed: 15 },
  { date: "2024-05", onTime: 290, delayed: 30 },
  { date: "2024-06", onTime: 350, delayed: 18 },
]

const chartConfig = {
  onTime: {
    label: "On-Time",
    color: "hsl(var(--chart-4))",
  },
  delayed: {
    label: "Delayed",
    color: "hsl(var(--chart-1))",
  },
}

export function ShipmentManagementChart() {
  return (
    <ChartContainer config={chartConfig} className="w-full">
      <AreaChart
        accessibilityLayer
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
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          interval={0}
          tickFormatter={(value) => value.slice(-2)}
        />
        <YAxis />
        <Tooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Area
          dataKey="onTime"
          type="natural"
          fill="var(--color-onTime)"
          fillOpacity={0.6}
          stroke="var(--color-onTime)"
          stackId="a"
        />
        <Area
          dataKey="delayed"
          type="natural"
          fill="var(--color-delayed)"
          fillOpacity={0.6}
          stroke="var(--color-delayed)"
          stackId="a"
        />
      </AreaChart>
    </ChartContainer>
  )
}
