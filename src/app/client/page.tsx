
'use client';

import { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useActiveOrders } from '@/hooks/use-active-orders';
import { useShipmentTrends, useTopDestinations } from '@/hooks/use-dashboard-charts';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DataVisualizer } from '@/components/ui/data-visualizer';
import { 
  Package, 
  Clock, 
  TrendingUp, 
  ArrowUpRight,
  ArrowDownRight,
  Truck, 
  MapPin, 
  DollarSign,
  Calendar,
  ChevronDown,
  ChevronRight,
  Eye,
} from 'lucide-react';

// Mock data for visualization - will be replaced with real data later
const mockDeliveryPerformance = [
  { status: 'On Time', count: 89 },
  { status: 'Delayed', count: 12 },
  { status: 'Early', count: 25 }
];

const mockCostAnalysis = [
  { service_type: 'Express', total_cost: 12500 },
  { service_type: 'Standard', total_cost: 8900 },
  { service_type: 'Economy', total_cost: 5400 },
  { service_type: 'Overnight', total_cost: 3200 }
];

function ClientDashboardPage() {
  const { clientInfo } = useAuth();
  const [activeShipmentsOpen, setActiveShipmentsOpen] = useState(false);
  
  // Fetch real data
  const { activeOrders, loading: ordersLoading, error: ordersError } = useActiveOrders(clientInfo?.owner_id || null);
  const { data: shipmentTrends, loading: trendsLoading, error: trendsError } = useShipmentTrends(clientInfo?.owner_id || null, 'last6months');
  const { data: topDestinations, loading: destinationsLoading, error: destinationsError } = useTopDestinations(clientInfo?.owner_id || null);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'in_transit':
      case 'in transit':
        return 'bg-blue-100 text-blue-800';
      case 'picked_up':
      case 'picked up':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'ready_for_pickup':
      case 'ready for pickup':
        return 'bg-purple-100 text-purple-800';
      case 'pending':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  return (
      <div className="space-y-8">
          {/* Quick Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 border border-border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Shipments</p>
                  <p className="text-2xl font-bold">24</p>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <ArrowUpRight className="w-3 h-3 mr-1" />
                    +12% from last month
                  </p>
                </div>
                <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Truck className="h-6 w-6 text-gray-800" />
                </div>
              </div>
            </div>

            <div className="p-6 border border-border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Orders</p>
                  <p className="text-2xl font-bold">8</p>
                  <p className="text-xs text-red-600 flex items-center mt-1">
                    <ArrowDownRight className="w-3 h-3 mr-1" />
                    -5% from last month
                  </p>
                </div>
                <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Package className="h-6 w-6 text-gray-800" />
                </div>
              </div>
            </div>

            <div className="p-6 border border-border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">This Month's Volume</p>
                  <p className="text-2xl font-bold">73</p>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <ArrowUpRight className="w-3 h-3 mr-1" />
                    +18% vs last month
                  </p>
                </div>
                <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-gray-800" />
                </div>
              </div>
            </div>

            <div className="p-6 border border-border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg. Delivery Time</p>
                  <p className="text-2xl font-bold">3.2</p>
                  <p className="text-xs text-muted-foreground">days</p>
                </div>
                <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-gray-800" />
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
                      <Truck className="h-5 w-5 text-blue-600" />
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
                      <p className="text-muted-foreground">No active orders found</p>
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
                              <Badge className={getStatusColor(order.delivery_status)}>
                                {order.delivery_status.replace('_', ' ')}
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
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <span>Shipment Trends (Last 6 Months)</span>
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
                  <Clock className="h-5 w-5 text-green-600" />
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
                  <DollarSign className="h-5 w-5 text-purple-600" />
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
                  <MapPin className="h-5 w-5 text-orange-600" />
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

export default ClientDashboardPage;
