"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const orderData = [
  { status: "Delivered", count: 275, color: "bg-chart-4/70 border-chart-4" },
  { status: "In Transit", count: 120, color: "bg-chart-5/70 border-chart-5" },
  { status: "Processing", count: 80, color: "bg-chart-2/70 border-chart-2" },
  { status: "Delayed", count: 30, color: "bg-chart-1/70 border-chart-1" },
]

export function OrderTrackingTable() {
  return (
    <div className="rounded-lg border">
        <Table>
        <TableHeader>
            <TableRow>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Orders</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {orderData.map((order) => (
            <TableRow key={order.status}>
                <TableCell>
                <div className="flex items-center gap-2">
                    <span className={cn("w-3 h-3 rounded-full border-2", order.color)} />
                    <span className="font-medium">{order.status}</span>
                </div>
                </TableCell>
                <TableCell className="text-right font-mono">{order.count}</TableCell>
            </TableRow>
            ))}
        </TableBody>
        </Table>
    </div>
  )
}
