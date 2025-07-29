
'use client';

import { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DataVisualizer } from '@/components/ui/data-visualizer';
import { 
  Package, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Truck, 
  MapPin, 
  DollarSign,
  Calendar,
  ChevronDown,
  ChevronRight,
  Eye,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

// Mock data for visualization - will be replaced with real data later
const mockShipmentTrends = [
  { month_name: 'January', shipment_count: 45 },
  { month_name: 'February', shipment_count: 52 },
  { month_name: 'March', shipment_count: 48 },
  { month_name: 'April', shipment_count: 61 },
  { month_name: 'May', shipment_count: 55 },
  { month_name: 'June', shipment_count: 67 },
  { month_name: 'July', shipment_count: 73 }
];

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

const mockTopDestinations = [
  { destination: 'Los Angeles, CA', shipment_count: 23, percentage: 18.5 },
  { destination: 'Houston, TX', shipment_count: 19, percentage: 15.3 },
  { destination: 'Chicago, IL', shipment_count: 16, percentage: 12.9 },
  { destination: 'Phoenix, AZ', shipment_count: 14, percentage: 11.3 },
  { destination: 'Dallas, TX', shipment_count: 12, percentage: 9.7 }
];

// Mock active shipments data
const mockActiveShipments = [
  {
    order_number: 'ORD-2025-001',
    customer_name: 'Acme Corp',
    status: 'In Transit',
    pickup_date: '2025-07-25',
    estimated_delivery: '2025-07-30',
    destination: 'Los Angeles, CA'
  },
  {
    order_number: 'ORD-2025-002', 
    customer_name: 'Tech Solutions Inc',
    status: 'Picked Up',
    pickup_date: '2025-07-28',
    estimated_delivery: '2025-08-01',
    destination: 'Houston, TX'
  },
  {
    order_number: 'ORD-2025-003',
    customer_name: 'Global Trading Co',
    status: 'Processing',
    pickup_date: '2025-07-29',
    estimated_delivery: '2025-08-02',
    destination: 'Chicago, IL'
  },
  {
    order_number: 'ORD-2025-004',
    customer_name: 'Manufacturing Plus',
    status: 'Ready for Pickup',
    pickup_date: '2025-07-30',
    estimated_delivery: '2025-08-03',
    destination: 'Phoenix, AZ'
  }
];

function ClientDashboardPage() {
  const { user, clientInfo, clientInfoLoading } = useAuth();
  const [activeShipmentsOpen, setActiveShipmentsOpen] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Transit':
        return 'bg-blue-100 text-blue-800';
      case 'Picked Up':
        return 'bg-green-100 text-green-800';
      case 'Processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'Ready for Pickup':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Truck className="h-6 w-6 text-blue-600" />
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
                <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Package className="h-6 w-6 text-orange-600" />
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
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
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
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Active Shipments Collapsible Section */}
          <div className="border border-border rounded-lg">
            <Collapsible open={activeShipmentsOpen} onOpenChange={setActiveShipmentsOpen}>
              <CollapsibleTrigger asChild>
                <div className="cursor-pointer hover:bg-muted/50 transition-colors p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Truck className="h-5 w-5 text-blue-600" />
                      <h3 className="text-lg font-semibold">Active Shipments in Transit</h3>
                      <Badge variant="secondary">{mockActiveShipments.length}</Badge>
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
                  <div className="space-y-4">
                    {mockActiveShipments.map((shipment, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div>
                              <p className="font-semibold">{shipment.order_number}</p>
                              <p className="text-sm text-muted-foreground">{shipment.customer_name}</p>
                            </div>
                            <Badge className={getStatusColor(shipment.status)}>
                              {shipment.status}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>Pickup: {shipment.pickup_date}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>ETA: {shipment.estimated_delivery}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-3 w-3" />
                              <span>{shipment.destination}</span>
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
                  <span>Shipment Trends</span>
                </h3>
              </div>
              <div className="px-6 pb-6">
                <div className="h-80">
                  <DataVisualizer data={mockShipmentTrends} viewType="line" />
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
                  <span>Top Shipping Destinations</span>
                </h3>
              </div>
              <div className="px-6 pb-6">
                <div className="h-80">
                  <DataVisualizer data={mockTopDestinations} viewType="table" />
                </div>
              </div>
            </div>
          </div>
      </div>
  );
}

export default ClientDashboardPage;
