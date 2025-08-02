
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Database,
  Filter,
  Download,
  Eye
} from 'lucide-react';
import { useHeaderControls } from '../layout';
import { ReportsHeaderControls } from '@/components/dashboard/reports-header-controls';
import { MaterialsTable } from '@/components/dashboard/materials-table';
import { useClientInfo } from '@/hooks/use-client-info';

export default function ClientReportsPage() {
  const [selectedReportId, setSelectedReportId] = useState('materials'); // Default to materials report
  const [showRealData, setShowRealData] = useState(false); // Track if showing real or sample data
  const { setLeftContent, setRightContent } = useHeaderControls();
  const { ownerId } = useClientInfo();

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
      }
      // Add other reports as needed
    ];
    return allReports.find(report => report.id === selectedReportId) || allReports[0];
  };

  const selectedReport = getSelectedReport();

  return (
    <div className="flex flex-col h-full">
      {/* Action Bar - View and Export buttons */}
      <div className="p-6 border-b">
        <div className="flex justify-end gap-3">
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

      {/* Full-Width Report Content */}
      <div className="flex-1 p-6 bg-gray-50/50 overflow-auto">
        <Card className="h-full">
          <CardContent className="p-6">
            {selectedReportId === 'materials' ? (
              <MaterialsTable 
                isRealData={showRealData} 
                ownerId={ownerId}
              />
            ) : (
              // Placeholder for other reports
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Database className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{selectedReport.title}</h3>
                  <p className="text-muted-foreground mb-4">
                    Report implementation in progress...
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    Data source: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{selectedReport.table}</code>
                  </p>
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
