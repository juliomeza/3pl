'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Database,
  Download,
  Eye
} from 'lucide-react';
import { useHeaderControls as useClientHeaderControls } from '@/app/client/layout';
import { useHeaderControls as useEmployeeHeaderControls } from '@/app/employee/layout';
import { ReportsHeaderControls } from '@/components/dashboard/reports-header-controls';
import { MaterialsTable } from '@/components/dashboard/materials-table';
import { useAuth } from '@/context/auth-context';

interface SharedReportsPageProps {
  role: 'client' | 'employee';
}

export default function SharedReportsPage({ role }: SharedReportsPageProps) {
  const [selectedReportId, setSelectedReportId] = useState('materials'); // Default to materials report
  const [showRealData, setShowRealData] = useState(false); // Track if showing real or sample data
  
  // Always call hooks, but use results conditionally
  const clientHeaderControls = useClientHeaderControls();
  const employeeHeaderControls = useEmployeeHeaderControls();
  const { setLeftContent, setRightContent } = role === 'client' ? clientHeaderControls : employeeHeaderControls;
  
  const { clientInfo } = useAuth();

  // Determine owner ID based on role - get from clientInfo for client role
  const effectiveOwnerId = role === 'client' ? (clientInfo?.owner_id || null) : null;

  const handleViewReport = () => {
    setShowRealData(true);
    // TODO: This will trigger the real data fetch in the MaterialsTable component
  };

  // Reset to sample data when report changes
  useEffect(() => {
    setShowRealData(false);
  }, [selectedReportId]);

  // Set header controls when component mounts
  useEffect(() => {
    setLeftContent(
      <ReportsHeaderControls 
        selectedReportId={selectedReportId}
        onReportSelect={setSelectedReportId}
      />
    );

    setRightContent(null);
    
    // Clear header controls when component unmounts
    return () => {
      setLeftContent(null);
      setRightContent(null);
    };
  }, [selectedReportId, setLeftContent, setRightContent]);

  // Get current selected report (simplified version)
  const getSelectedReport = () => {
    // This is a simplified version - the full logic is in ReportsHeaderControls
    const allReports = [
      {
        id: 'materials',
        title: 'Materials Report',
        description: 'Comprehensive list of all materials with details and specifications',
        table: 'wms_materials'
      },
      {
        id: 'inventory-levels',
        title: 'Inventory Levels',
        description: 'Current stock levels and availability across all locations',
        table: 'wms_inventory'
      },
      {
        id: 'receipts',
        title: 'Receipts Report',
        description: 'Inbound receipts and receiving activities',
        table: 'wms_receipts'
      },
      {
        id: 'shipments',
        title: 'Shipments Report',
        description: 'Outbound shipments and dispatch records',
        table: 'wms_shipments'
      },
      {
        id: 'transfers',
        title: 'Transfers Report',
        description: 'Internal transfers and stock movements',
        table: 'wms_transfers'
      },
      {
        id: 'picks',
        title: 'Picking Activities',
        description: 'Pick operations and fulfillment details',
        table: 'wms_picks'
      },
      {
        id: 'transactions',
        title: 'Transaction History',
        description: 'Complete transaction log and audit trail',
        table: 'wms_transactions'
      },
      {
        id: 'performance',
        title: 'Performance Metrics',
        description: 'KPIs and operational performance indicators',
        table: 'wms_performance'
      },
      {
        id: 'cycles',
        title: 'Cycle Counts',
        description: 'Cycle counting activities and accuracy reports',
        table: 'wms_cycles'
      },
      {
        id: 'zones',
        title: 'Zone Configuration',
        description: 'Warehouse zones and area definitions',
        table: 'wms_zones'
      },
      {
        id: 'items',
        title: 'Item Master',
        description: 'Master item data and product information',
        table: 'wms_items'
      },
      {
        id: 'configs',
        title: 'System Configuration',
        description: 'WMS system settings and parameters',
        table: 'wms_configs'
      },
      {
        id: 'locations',
        title: 'Storage Locations',
        description: 'Warehouse locations and zone assignments',
        table: 'wms_locations'
      }
    ];
    return allReports.find(report => report.id === selectedReportId) || allReports[0];
  };

  const selectedReport = getSelectedReport();

  // Role-based access control for reports
  const getAccessMessage = () => {
    if (role === 'employee') {
      return 'Full system access - All reports available';
    }
    return `Client access - ${clientInfo?.name || 'Your organization'} data only`;
  };

  const getReportImplementationMessage = () => {
    if (role === 'employee') {
      return 'Enterprise report implementation in progress...';
    }
    return 'Report implementation in progress...';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Action Bar - View and Export buttons */}
      <div className="p-6 border-b">
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {getAccessMessage()}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="default" size="sm" onClick={handleViewReport}>
              <Eye className="w-4 h-4 mr-2" />
              View
            </Button>
          </div>
        </div>
      </div>

      {/* Full-Width Report Content */}
      <div className="flex-1 p-6 bg-gray-50/50 overflow-auto">
        <Card className="h-full">
          <CardContent className="p-6">
            {selectedReportId === 'materials' ? (
              <MaterialsTable 
                isRealData={showRealData} 
                ownerId={effectiveOwnerId}
              />
            ) : (
              // Placeholder for other reports
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Database className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{selectedReport.title}</h3>
                  <p className="text-muted-foreground mb-4">
                    {getReportImplementationMessage()}
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    Data source: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{selectedReport.table}</code>
                  </p>
                  {role === 'employee' && (
                    <p className="text-xs text-blue-600 mb-4">
                      🔧 Employee access: Full database visibility across all clients
                    </p>
                  )}
                  {role === 'client' && (
                    <p className="text-xs text-green-600 mb-4">
                      🔒 Secure: Data filtered to your organization only
                    </p>
                  )}
                  <div className="flex gap-2 justify-center">
                    <Button variant="outline">
                      Configure Report
                    </Button>
                    <Button>
                      View Sample Data
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}