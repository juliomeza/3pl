'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useActiveOrders } from '@/hooks/use-active-orders';
import { useShipmentTrends, useTopDestinations, useDeliveryPerformance } from '@/hooks/use-dashboard-charts';
import { useDashboardMetrics } from '@/hooks/use-dashboard-metrics';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DataVisualizer } from '@/components/ui/data-visualizer';
import { 
  ArrowUpRight,
  ArrowDownRight,
  Truck, 
  MapPin, 
  Calendar,
  ChevronDown,
  ChevronRight,
  Eye,
  Clock,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { PencilLine } from 'lucide-react';

interface SharedDashboardPageProps {
  role: 'client' | 'employee';
}

const mockCostAnalysis = [
  { service_type: 'Express', total_cost: 12500 },
  { service_type: 'Standard', total_cost: 8900 },
  { service_type: 'Economy', total_cost: 5400 },
  { service_type: 'Overnight', total_cost: 3200 }
];

const mockDeliveryPerformance = [
    { status: 'On Time', count: 850 },
    { status: 'Early', count: 230 },
    { status: 'Delayed', count: 75 },
];

export default function SharedDashboardPage({ role }: SharedDashboardPageProps) {
  const { user, clientInfo } = useAuth();
  const [activeShipmentsOpen, setActiveShipmentsOpen] = useState(false);
  const router = useRouter();
  
  // Determine owner_id based on role
  const ownerId = role === 'client' ? (clientInfo?.owner_id || null) : null;
  
  // Fetch data with role-based filtering
  const { activeOrders, loading: ordersLoading, error: ordersError } = useActiveOrders(ownerId);
  const { data: shipmentTrends, loading: trendsLoading, error: trendsError } = useShipmentTrends(ownerId, 'last6months');
  const { data: topDestinations, loading: destinationsLoading, error: destinationsError } = useTopDestinations(ownerId);
  const { data: deliveryPerformance, loading: performanceLoading, error: performanceError } = useDeliveryPerformance(ownerId);
  const { metrics, loading: metricsLoading, error: metricsError } = useDashboardMetrics(ownerId);

  const displayMetrics = {
    activeShipments: metricsLoading ? '' : metrics.activeShipments || (role === 'employee' ? 1284 : 284),
    pendingOrders: metricsLoading ? '' : metrics.pendingOrders || (role === 'employee' ? 172 : 72),
    thisMonthVolume: metricsLoading ? '' : metrics.thisMonthVolume || (role === 'employee' ? 5254 : 1254),
    averageDeliveryTime: metricsLoading ? '' : metrics.averageDeliveryTime || 3
  };

  const getStatusColor = (status: string) => {
    // Harmonized palette: neutral (portal), blue/indigo (WMS), red (error)
    // Style pattern: subtle tint bg + readable text + soft border
    switch (status.toLowerCase()) {
      // Portal (neutral)
      case 'draft':
        return 'bg-foreground/5 text-muted-foreground border-foreground/15 dark:bg-foreground/5 dark:text-foreground/70 dark:border-foreground/15';
      case 'submitted':
        return 'bg-slate-500/10 text-slate-700 border-slate-500/20 dark:bg-slate-400/10 dark:text-slate-300 dark:border-slate-400/20';

      // Error
      case 'failed':
        return 'bg-rose-500/10 text-rose-700 border-rose-500/20 dark:bg-rose-400/10 dark:text-rose-300 dark:border-rose-400/20';

      // WMS (operational)
      case 'created':
        return 'bg-blue-500/10 text-blue-700 border-blue-500/20 dark:bg-blue-400/10 dark:text-blue-300 dark:border-blue-400/20';
      case 'picking':
        return 'bg-indigo-500/10 text-indigo-700 border-indigo-500/20 dark:bg-indigo-400/10 dark:text-indigo-300 dark:border-indigo-400/20';
      case 'shipped':
        return 'bg-violet-500/10 text-violet-800 border-violet-500/20 dark:bg-violet-400/10 dark:text-violet-200 dark:border-violet-400/20';
      case 'in_transit':
      case 'in transit':
        return 'bg-sky-500/10 text-sky-700 border-sky-500/20 dark:bg-sky-400/10 dark:text-sky-300 dark:border-sky-400/20';

      // Legacy mapping approximations
      case 'picked_up':
      case 'picked up':
        return 'bg-blue-500/10 text-blue-700 border-blue-500/20 dark:bg-blue-400/10 dark:text-blue-300 dark:border-blue-400/20';
      case 'processing':
        return 'bg-blue-500/10 text-blue-700 border-blue-500/20 dark:bg-blue-400/10 dark:text-blue-300 dark:border-blue-400/20';
      case 'ready_for_pickup':
      case 'ready for pickup':
        return 'bg-indigo-500/10 text-indigo-700 border-indigo-500/20 dark:bg-indigo-400/10 dark:text-indigo-300 dark:border-indigo-400/20';
      case 'pending':
        return 'bg-foreground/5 text-muted-foreground border-foreground/15 dark:bg-foreground/5 dark:text-foreground/70 dark:border-foreground/15';
      default:
        return 'bg-foreground/5 text-muted-foreground border-foreground/15 dark:bg-foreground/5 dark:text-foreground/70 dark:border-foreground/15';
    }
  };

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'Not set';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const formatDestination = (city?: string, state?: string): string => {
    if (city && state) return `${city}, ${state}`;
    if (city) return city;
    if (state) return state;
    return 'Not specified';
  };

  // Show loading or placeholder for employee when no data yet
  if (role === 'employee' && metricsLoading && activeOrders.length === 0) {
    return (
      <div className="relative space-y-8">
        {/* Quick Status Cards with Employee-scale numbers */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="overflow-hidden">
            <CardHeader className="p-0">
              <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400" />
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Shipments</p>
                    <p className="text-3xl font-bold">1,284</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center mt-1">
                      <ArrowUpRight className="w-3 h-3 mr-1" />
                      +12% from last month
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="p-0">
              <div className="h-1 w-full bg-gradient-to-r from-rose-500 via-orange-400 to-amber-400" />
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pending Orders</p>
                    <p className="text-3xl font-bold">172</p>
                    <p className="text-xs text-rose-600 dark:text-rose-400 flex items-center mt-1">
                      <ArrowDownRight className="w-3 h-3 mr-1" />
                      -5% from last month
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="p-0">
              <div className="h-1 w-full bg-gradient-to-r from-violet-500 via-fuchsia-400 to-pink-400" />
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">This Month's Volume</p>
                    <p className="text-3xl font-bold">5,254</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center mt-1">
                      <ArrowUpRight className="w-3 h-3 mr-1" />
                      +18% vs last month
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="p-0">
              <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-slate-400 to-zinc-300 dark:from-indigo-400 dark:via-slate-600 dark:to-zinc-700" />
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg. Delivery Time</p>
                    <p className="text-3xl font-bold">3</p>
                    <p className="text-xs text-muted-foreground mt-1">days</p>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">
                {role === 'employee' ? 'Employee Dashboard' : 'Client Dashboard'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-muted-foreground">
              {role === 'employee' 
                ? 'Enterprise-level logistics dashboard with full system access.' 
                : 'Your personalized logistics dashboard.'}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
      <div className="relative space-y-8">
          {/* Quick Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="overflow-hidden">
              <CardHeader className="p-0">
                <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400" />
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Active Shipments</p>
                      {metricsLoading ? <Skeleton className="h-8 w-20 mt-1" /> : <p className="text-3xl font-bold">{displayMetrics.activeShipments}</p>}
                      {metricsLoading ? <Skeleton className="h-4 w-24 mt-1" /> : (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center mt-1">
                          <ArrowUpRight className="w-3 h-3 mr-1" />
                          +12% from last month
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="p-0">
                <div className="h-1 w-full bg-gradient-to-r from-rose-500 via-orange-400 to-amber-400" />
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Pending Orders</p>
                      {metricsLoading ? <Skeleton className="h-8 w-20 mt-1" /> : <p className="text-3xl font-bold">{displayMetrics.pendingOrders}</p>}
                      {metricsLoading ? <Skeleton className="h-4 w-24 mt-1" /> : (
                        <p className="text-xs text-rose-600 dark:text-rose-400 flex items-center mt-1">
                          <ArrowDownRight className="w-3 h-3 mr-1" />
                          -5% from last month
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="p-0">
                <div className="h-1 w-full bg-gradient-to-r from-violet-500 via-fuchsia-400 to-pink-400" />
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">This Month's Volume</p>
                      {metricsLoading ? <Skeleton className="h-8 w-20 mt-1" /> : <p className="text-3xl font-bold">{displayMetrics.thisMonthVolume}</p>}
                      {metricsLoading ? <Skeleton className="h-4 w-24 mt-1" /> : (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center mt-1">
                          <ArrowUpRight className="w-3 h-3 mr-1" />
                          +18% vs last month
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="p-0">
                <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-slate-400 to-zinc-300 dark:from-indigo-400 dark:via-slate-600 dark:to-zinc-700" />
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Avg. Delivery Time</p>
                      {metricsLoading ? <Skeleton className="h-8 w-20 mt-1" /> : <p className="text-3xl font-bold">{displayMetrics.averageDeliveryTime}</p>}
                      <p className="text-xs text-muted-foreground mt-1">days</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>

          {/* Active Orders Collapsible Section */}
          <Card>
            <Collapsible open={activeShipmentsOpen} onOpenChange={setActiveShipmentsOpen}>
              <CollapsibleTrigger asChild>
                <div className="cursor-pointer hover:bg-muted/50 transition-colors p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="h-7 w-7 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                        <Truck className="h-4 w-4" />
                      </div>
                      <h3 className="text-lg font-semibold">Active Orders</h3>
                      {ordersLoading ? (
                        <Skeleton className="h-5 w-6" />
                      ) : (
                        <Badge variant="secondary">{activeOrders.length}</Badge>
                      )}
                    </div>
                    {activeShipmentsOpen ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="pt-0 px-6 pb-6">
                  {ordersLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center justify-between p-4 border rounded-lg bg-card/50">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <div>
                                <Skeleton className="h-4 w-24 mb-2" />
                                <Skeleton className="h-3 w-32" />
                              </div>
                              <Skeleton className="h-6 w-16" />
                            </div>
                            <div className="flex items-center space-x-4 mt-2">
                              <Skeleton className="h-3 w-20" />
                              <Skeleton className="h-3 w-20" />
                              <Skeleton className="h-3 w-24" />
                            </div>
                          </div>
                          <Skeleton className="h-8 w-24" />
                        </div>
                      ))}
                    </div>
                  ) : ordersError ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Error loading active orders: {ordersError}</p>
                    </div>
                  ) : activeOrders.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="h-12 w-12 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mx-auto mb-4 flex items-center justify-center">
                        <Truck className="h-6 w-6" />
                      </div>
                      <p className="text-muted-foreground">
                        {role === 'employee' ? 'No active orders in the system' : 'No active orders found'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activeOrders.map((order, index) => (
                        <div
                          key={index}
                          className="p-4 border rounded-lg hover:bg-muted/30 transition-colors bg-card/50"
                        >
                          <div className="flex flex-col gap-1 w-full">
                            {/* Row 1: Order • Customer • Destination  |  Status + (View) */}
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    // Placeholder navigation for future view details
                                    if (role === 'client') router.push(`/client/orders?view=${encodeURIComponent(order.order_number)}`);
                                  }}
                                  className="font-semibold shrink-0 text-primary hover:underline"
                                >
                                  {order.order_number}
                                </button>

                                {/* Wide screens: inline meta to reduce line count */}
                                <div className="hidden md:flex items-center text-sm text-muted-foreground gap-2 min-w-0">
                                  <span className="truncate max-w-[26rem]">
                                    Customer: {order.recipient_name || 'Not specified'}
                                  </span>
                                  <span className="text-muted-foreground/60">•</span>
                                  <span className="flex items-center gap-1 min-w-0">
                                    <MapPin className="h-3 w-3" />
                                    <span className="truncate max-w-[14rem]">
                                      {formatDestination(order.recipient_city, order.recipient_state)}
                                    </span>
                                  </span>
                                  {(order.carrier || order.service_type) && (
                                    <>
                                      <span className="text-muted-foreground/60">•</span>
                                      <Badge variant="outline" className="h-5 px-2 py-0 text-[11px] font-medium rounded-full">
                                        {(order.carrier || '').toString()}
                                        {order.service_type ? ` • ${order.service_type}` : ''}
                                      </Badge>
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {/* Edit icon only for client + portal source + draft/failed */}
                                {role === 'client' && order.source_table === 'portal' && ['draft','failed'].includes(String(order.display_status).toLowerCase()) && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-amber-700 hover:text-amber-800 hover:bg-amber-50"
                                    onClick={() => router.push(`/client/orders?edit=${encodeURIComponent(order.order_number)}`)}
                                    title="Edit order"
                                  >
                                    <PencilLine className="h-4 w-4" />
                                  </Button>
                                )}
                                <Badge
                                  variant="outline"
                                  className={`${getStatusColor(order.display_status)} cursor-default select-none`}
                                >
                                  {order.display_status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="hidden md:inline-flex h-8 w-8"
                                  onClick={() => { if (role === 'client') router.push(`/client/orders?view=${encodeURIComponent(order.order_number)}`); }}
                                  title="View details"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            {/* Row 2: Pickup • ETA  |  (View on mobile) */}
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                              <div className="flex items-center gap-4">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>Pickup: {formatDate(order.order_fulfillment_date)}</span>
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>ETA: {formatDate(order.estimated_delivery_date)}</span>
                                </span>

                                {/* Small screens: show destination and customer on row 2 */}
                                <span className="md:hidden flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  <span>{formatDestination(order.recipient_city, order.recipient_state)}</span>
                                </span>
                                <span className="md:hidden block">
                                  Customer: {order.recipient_name || 'Not specified'}
                                </span>
                                {((order.carrier || order.service_type) && (
                                  <span className="md:hidden inline-flex">
                                    <Badge variant="outline" className="h-5 px-2 py-0 text-[11px] font-medium rounded-full">
                                      {(order.carrier || '').toString()}
                                      {order.service_type ? ` • ${order.service_type}` : ''}
                                    </Badge>
                                  </span>
                                ))}
                              </div>
                              <div className="flex items-center gap-1">
                                {role === 'client' && order.source_table === 'portal' && ['draft','failed'].includes(String(order.display_status).toLowerCase()) && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="md:hidden h-8 w-8 text-amber-700"
                                    onClick={() => router.push(`/client/orders?edit=${encodeURIComponent(order.order_number)}`)}
                                    title="Edit order"
                                  >
                                    <PencilLine className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="md:hidden h-8 w-8"
                                  onClick={() => { if (role === 'client') router.push(`/client/orders?view=${encodeURIComponent(order.order_number)}`); }}
                                  title="View details"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </Card>

          {/* Data Visualization Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Shipment Trends */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="h-7 w-7 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 inline-flex items-center justify-center">
                    <TrendingUp className="h-4 w-4" />
                  </span>
                  Outbound Sales Trends (Last 6 Months)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {trendsLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Skeleton className="w-full h-full" />
                    </div>
                  ) : trendsError ? (
                    <div className="flex items-center justify-center h-full text-red-600">
                      Error: {trendsError}
                    </div>
                  ) : (
                    <DataVisualizer data={shipmentTrends} viewType="line" />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Delivery Performance */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="h-7 w-7 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 inline-flex items-center justify-center">
                    <Clock className="h-4 w-4" />
                  </span>
                  Delivery Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <DataVisualizer data={mockDeliveryPerformance} viewType="bar" />
                </div>
              </CardContent>
            </Card>

            {/* Cost Analysis */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="h-7 w-7 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 inline-flex items-center justify-center">
                    <DollarSign className="h-4 w-4" />
                  </span>
                  Cost Analysis by Service Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <DataVisualizer data={mockCostAnalysis} viewType="pie" />
                </div>
              </CardContent>
            </Card>

            {/* Top Destinations */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="h-7 w-7 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 inline-flex items-center justify-center">
                    <MapPin className="h-4 w-4" />
                  </span>
                  Top Shipping Destinations (Last 90 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {destinationsLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Skeleton className="w-full h-full" />
                    </div>
                  ) : destinationsError ? (
                    <div className="flex items-center justify-center h-full text-red-600">
                      Error: {destinationsError}
                    </div>
                  ) : (
                    <DataVisualizer data={topDestinations} viewType="table" />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
      </div>
  );
}