'use client';

import { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useActiveOrders } from '@/hooks/use-active-orders';
import { useShipmentTrends, useTopDestinations, useDeliveryPerformance } from '@/hooks/use-dashboard-charts';
import { useDashboardMetrics } from '@/hooks/use-dashboard-metrics';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
    switch (status.toLowerCase()) {
      case 'draft':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      case 'submitted':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'created':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'picking':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'shipped':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'in_transit':
      case 'in transit':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      // Legacy status support
      case 'picked_up':
      case 'picked up':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'ready_for_pickup':
      case 'ready for pickup':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'pending':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
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
      <div className="space-y-8">
        {/* Quick Status Cards with Employee-scale numbers */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 border border-border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Shipments</p>
                <p className="text-3xl font-bold">1,284</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <ArrowUpRight className="w-3 h-3 mr-1" />
                  +12% from last month
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 border border-border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Orders</p>
                <p className="text-3xl font-bold">172</p>
                <p className="text-xs text-red-600 flex items-center mt-1">
                  <ArrowDownRight className="w-3 h-3 mr-1" />
                  -5% from last month
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 border border-border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">This Month's Volume</p>
                <p className="text-3xl font-bold">5,254</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <ArrowUpRight className="w-3 h-3 mr-1" />
                  +18% vs last month
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 border border-border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Delivery Time</p>
                <p className="text-3xl font-bold">3</p>
                <p className="text-xs text-muted-foreground mt-1">days</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-card p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-2">
                {role === 'employee' ? 'Employee Dashboard' : 'Client Dashboard'}
              </h2>
              <p className="text-muted-foreground">
                {role === 'employee' 
                  ? 'Enterprise-level logistics dashboard with full system access.' 
                  : 'Your personalized logistics dashboard.'
                }
              </p>
          </div>
        </div>
      </div>
    );
  }

  return (
      <div className="space-y-8">
          {/* Quick Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 border border-border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Shipments</p>
                  {metricsLoading ? <Skeleton className="h-8 w-20 mt-1" /> : <p className="text-3xl font-bold">{displayMetrics.activeShipments}</p>}
                  {metricsLoading ? <Skeleton className="h-4 w-24 mt-1" /> : (
                    <p className="text-xs text-green-600 flex items-center mt-1">
                      <ArrowUpRight className="w-3 h-3 mr-1" />
                      +12% from last month
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border border-border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Orders</p>
                  {metricsLoading ? <Skeleton className="h-8 w-20 mt-1" /> : <p className="text-3xl font-bold">{displayMetrics.pendingOrders}</p>}
                  {metricsLoading ? <Skeleton className="h-4 w-24 mt-1" /> : (
                    <p className="text-xs text-red-600 flex items-center mt-1">
                      <ArrowDownRight className="w-3 h-3 mr-1" />
                      -5% from last month
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border border-border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">This Month's Volume</p>
                  {metricsLoading ? <Skeleton className="h-8 w-20 mt-1" /> : <p className="text-3xl font-bold">{displayMetrics.thisMonthVolume}</p>}
                  {metricsLoading ? <Skeleton className="h-4 w-24 mt-1" /> : (
                    <p className="text-xs text-green-600 flex items-center mt-1">
                      <ArrowUpRight className="w-3 h-3 mr-1" />
                      +18% vs last month
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border border-border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg. Delivery Time</p>
                  {metricsLoading ? <Skeleton className="h-8 w-20 mt-1" /> : <p className="text-3xl font-bold">{displayMetrics.averageDeliveryTime}</p>}
                  <p className="text-xs text-muted-foreground mt-1">days</p>
                </div>
              </div>
            </div>
          </div>

          {/* Active Orders Collapsible Section */}
          <div className="border border-border rounded-lg">
            <Collapsible open={activeShipmentsOpen} onOpenChange={setActiveShipmentsOpen}>
              <CollapsibleTrigger asChild>
                <div className="cursor-pointer hover:bg-muted/50 transition-colors p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Truck className="h-5 w-5 text-gray-800" />
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
                        <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
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
                      <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        {role === 'employee' ? 'No active orders in the system' : 'No active orders found'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activeOrders.map((order, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <div>
                                <p className="font-semibold">{order.order_number}</p>
                                <p className="text-sm text-muted-foreground">
                                  Customer: {order.recipient_name || 'Not specified'}
                                </p>
                              </div>
                              <Badge className={getStatusColor(order.display_status)}>
                                {order.display_status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-3 w-3" />
                                <span>Pickup: {formatDate(order.order_fulfillment_date)}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>ETA: {formatDate(order.estimated_delivery_date)}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <MapPin className="h-3 w-3" />
                                <span>{formatDestination(order.recipient_city, order.recipient_state)}</span>
                              </div>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Data Visualization Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Shipment Trends */}
            <div className="border border-border rounded-lg">
              <div className="p-6 pb-2">
                <h3 className="text-lg font-semibold flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-gray-800" />
                  <span>Outbound Sales Trends (Last 6 Months)</span>
                </h3>
              </div>
              <div className="px-6 pb-6">
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
              </div>
            </div>

            {/* Delivery Performance */}
            <div className="border border-border rounded-lg">
              <div className="p-6 pb-2">
                <h3 className="text-lg font-semibold flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-gray-800" />
                  <span>Delivery Performance</span>
                </h3>
              </div>
              <div className="px-6 pb-6">
                <div className="h-80">
                   <DataVisualizer data={mockDeliveryPerformance} viewType="bar" />
                </div>
              </div>
            </div>

            {/* Cost Analysis */}
            <div className="border border-border rounded-lg">
              <div className="p-6 pb-2">
                <h3 className="text-lg font-semibold flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-gray-800" />
                  <span>Cost Analysis by Service Type</span>
                </h3>
              </div>
              <div className="px-6 pb-6">
                <div className="h-80">
                  <DataVisualizer data={mockCostAnalysis} viewType="pie" />
                </div>
              </div>
            </div>

            {/* Top Destinations */}
            <div className="border border-border rounded-lg">
              <div className="p-6 pb-2">
                <h3 className="text-lg font-semibold flex items-center space-x-2">
                  <MapPin className="h-5 w-5 text-gray-800" />
                  <span>Top Shipping Destinations (Last 90 Days)</span>
                </h3>
              </div>
              <div className="px-6 pb-6">
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
              </div>
            </div>
          </div>
      </div>
  );
}