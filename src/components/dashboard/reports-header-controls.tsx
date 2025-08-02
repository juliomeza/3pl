'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  FileText, 
  Package, 
  Truck, 
  BarChart3, 
  Settings,
  ChevronRight,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

// Import the same report categories (you might want to move this to a separate file later)
const reportCategories = {
  inventory: {
    title: 'Inventory & Materials',
    icon: Package,
    color: 'bg-blue-500',
    reports: [
      {
        id: 'materials',
        title: 'Materials Report',
        description: 'Comprehensive list of all materials with details and specifications',
        table: 'wms_materials',
        status: 'available',
        lastUpdated: '2 hours ago'
      },
      {
        id: 'inventory-levels',
        title: 'Inventory Levels',
        description: 'Current stock levels and availability across all locations',
        table: 'wms_inventory',
        status: 'available',
        lastUpdated: '1 hour ago'
      },
      {
        id: 'locations',
        title: 'Storage Locations',
        description: 'Warehouse locations and zone assignments',
        table: 'wms_locations',
        status: 'available',
        lastUpdated: '4 hours ago'
      }
    ]
  },
  operations: {
    title: 'Operations & Movements',
    icon: Truck,
    color: 'bg-green-500',
    reports: [
      {
        id: 'receipts',
        title: 'Receipts Report',
        description: 'Inbound receipts and receiving activities',
        table: 'wms_receipts',
        status: 'available',
        lastUpdated: '30 minutes ago'
      },
      {
        id: 'shipments',
        title: 'Shipments Report',
        description: 'Outbound shipments and dispatch records',
        table: 'wms_shipments',
        status: 'available',
        lastUpdated: '45 minutes ago'
      },
      {
        id: 'transfers',
        title: 'Transfers Report',
        description: 'Internal transfers and stock movements',
        table: 'wms_transfers',
        status: 'available',
        lastUpdated: '2 hours ago'
      },
      {
        id: 'picks',
        title: 'Picking Activities',
        description: 'Pick operations and fulfillment details',
        table: 'wms_picks',
        status: 'available',
        lastUpdated: '1 hour ago'
      }
    ]
  },
  analytics: {
    title: 'Analytics & Performance',
    icon: BarChart3,
    color: 'bg-purple-500',
    reports: [
      {
        id: 'transactions',
        title: 'Transaction History',
        description: 'Complete transaction log and audit trail',
        table: 'wms_transactions',
        status: 'available',
        lastUpdated: '15 minutes ago'
      },
      {
        id: 'performance',
        title: 'Performance Metrics',
        description: 'KPIs and operational performance indicators',
        table: 'wms_performance',
        status: 'available',
        lastUpdated: '3 hours ago'
      },
      {
        id: 'cycles',
        title: 'Cycle Counts',
        description: 'Cycle counting activities and accuracy reports',
        table: 'wms_cycles',
        status: 'available',
        lastUpdated: '6 hours ago'
      }
    ]
  },
  configuration: {
    title: 'Configuration & Setup',
    icon: Settings,
    color: 'bg-orange-500',
    reports: [
      {
        id: 'zones',
        title: 'Zone Configuration',
        description: 'Warehouse zones and area definitions',
        table: 'wms_zones',
        status: 'available',
        lastUpdated: '1 day ago'
      },
      {
        id: 'items',
        title: 'Item Master',
        description: 'Master item data and product information',
        table: 'wms_items',
        status: 'available',
        lastUpdated: '4 hours ago'
      },
      {
        id: 'configs',
        title: 'System Configuration',
        description: 'WMS system settings and parameters',
        table: 'wms_configs',
        status: 'available',
        lastUpdated: '2 days ago'
      }
    ]
  }
};

interface ReportsHeaderControlsProps {
  selectedReportId: string;
  onReportSelect: (reportId: string) => void;
}

export function ReportsHeaderControls({ selectedReportId, onReportSelect }: ReportsHeaderControlsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>('inventory');

  // Get all reports as flat array for search
  const getAllReports = () => {
    let allReports: any[] = [];
    Object.entries(reportCategories).forEach(([categoryKey, category]) => {
      category.reports.forEach(report => {
        allReports.push({
          ...report,
          category: categoryKey,
          categoryTitle: category.title,
          categoryIcon: category.icon,
          categoryColor: category.color
        });
      });
    });
    return allReports;
  };

  // Filter reports for dropdown
  const getFilteredReports = () => {
    const allReports = getAllReports();
    if (searchTerm) {
      return allReports.filter(report =>
        report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return allReports;
  };

  // Get current selected report
  const getSelectedReport = () => {
    const allReports = getAllReports();
    return allReports.find(report => report.id === selectedReportId) || allReports[0];
  };

  // Group filtered reports by category for dropdown display
  const getGroupedReports = () => {
    const filteredReports = getFilteredReports();
    const grouped: any = {};
    
    filteredReports.forEach(report => {
      if (!grouped[report.category]) {
        grouped[report.category] = {
          ...reportCategories[report.category as keyof typeof reportCategories],
          reports: []
        };
      }
      grouped[report.category].reports.push(report);
    });
    
    return grouped;
  };

  const handleCategoryToggle = (categoryKey: string) => {
    setExpandedCategory(expandedCategory === categoryKey ? null : categoryKey);
  };

  const selectedReport = getSelectedReport();
  const groupedReports = getGroupedReports();

  return (
    <div className="flex items-center">
      {/* Reports Dropdown Menu - Shows Current Selected Report */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-3 min-w-[300px] justify-between h-auto p-3">
            <div className="flex items-center gap-3">
              <div className={`p-1.5 rounded-lg ${selectedReport.categoryColor} text-white`}>
                <selectedReport.categoryIcon className="w-3.5 h-3.5" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-sm">{selectedReport.title}</h3>
                <p className="text-xs text-muted-foreground truncate max-w-[200px]">{selectedReport.description}</p>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-80 max-h-96 overflow-y-auto" align="start">
          {/* Search inside dropdown */}
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-8"
              />
            </div>
          </div>

          {/* Reports grouped by category - Collapsible */}
          {Object.entries(groupedReports).map(([categoryKey, category]) => {
            const IconComponent = (category as any).icon;
            const isExpanded = expandedCategory === categoryKey;
            const categoryReports = ((category as any).reports as any[]);
            
            return (
              <div key={categoryKey}>
                {/* Category Header - Clickable to toggle */}
                <button
                  onClick={() => handleCategoryToggle(categoryKey)}
                  className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className={`p-1 rounded ${(category as any).color} text-white`}>
                      <IconComponent className="w-3 h-3" />
                    </div>
                    <span className="text-sm font-semibold text-left">{(category as any).title}</span>
                    <Badge variant="outline" className="text-xs ml-2">
                      {categoryReports.length}
                    </Badge>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  )}
                </button>
                
                {/* Collapsible Reports List */}
                {isExpanded && (
                  <div className="border-l-2 border-gray-100 ml-6 pl-2">
                    {categoryReports.map((report: any) => (
                      <DropdownMenuItem
                        key={report.id}
                        onClick={() => onReportSelect(report.id)}
                        className="p-3 cursor-pointer ml-0"
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium text-sm truncate ${
                              selectedReportId === report.id ? 'text-blue-600' : 'text-gray-900'
                            }`}>
                              {report.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                              {report.description}
                            </p>
                          </div>
                          {selectedReportId === report.id && (
                            <ChevronRight className="w-4 h-4 text-blue-600 ml-2" />
                          )}
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </div>
                )}
                
                <DropdownMenuSeparator />
              </div>
            );
          })}

          {/* Empty State for Search */}
          {Object.keys(groupedReports).length === 0 && (
            <div className="text-center py-8">
              <FileText className="w-8 h-8 mx-auto text-gray-400 mb-2" />
              <p className="text-xs text-gray-500">No reports found</p>
              <p className="text-xs text-gray-400">Try a different search term</p>
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
