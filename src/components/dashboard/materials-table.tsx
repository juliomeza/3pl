'use client';

import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { getMaterialsData } from '@/app/actions';

interface MaterialsTableProps {
  isRealData: boolean;
  ownerId?: number | null;
}

interface MaterialData {
  lookupCode: string;
  statusId: number;
  materialGroupId: string;
  name: string;
  description: string;
}

// Sample data for materials
const sampleMaterials: MaterialData[] = [
  {
    lookupCode: 'MAT-001',
    statusId: 1,
    materialGroupId: 'GRP-001',
    name: 'Material 001',
    description: 'Sample material description 001'
  },
  {
    lookupCode: 'MAT-002',
    statusId: 1,
    materialGroupId: 'GRP-002',
    name: 'Material 002',
    description: 'Sample material description 002'
  },
  {
    lookupCode: 'MAT-003',
    statusId: 2,
    materialGroupId: 'GRP-001',
    name: 'Material 003',
    description: 'Sample material description 003'
  },
  {
    lookupCode: 'MAT-004',
    statusId: 1,
    materialGroupId: 'GRP-003',
    name: 'Material 004',
    description: 'Sample material description 004'
  },
  {
    lookupCode: 'MAT-005',
    statusId: 3,
    materialGroupId: 'GRP-002',
    name: 'Material 005',
    description: 'Sample material description 005'
  },
  {
    lookupCode: 'MAT-006',
    statusId: 1,
    materialGroupId: 'GRP-001',
    name: 'Material 006',
    description: 'Sample material description 006'
  },
  {
    lookupCode: 'MAT-007',
    statusId: 2,
    materialGroupId: 'GRP-003',
    name: 'Material 007',
    description: 'Sample material description 007'
  },
  {
    lookupCode: 'MAT-008',
    statusId: 1,
    materialGroupId: 'GRP-002',
    name: 'Material 008',
    description: 'Sample material description 008'
  },
  {
    lookupCode: 'MAT-009',
    statusId: 1,
    materialGroupId: 'GRP-001',
    name: 'Material 009',
    description: 'Sample material description 009'
  },
  {
    lookupCode: 'MAT-010',
    statusId: 2,
    materialGroupId: 'GRP-003',
    name: 'Material 010',
    description: 'Sample material description 010'
  }
];

const getStatusBadge = (statusId: number) => {
  switch (statusId) {
    case 1:
      return <Badge variant="default" className="bg-green-100 text-green-700">Active</Badge>;
    case 2:
      return <Badge variant="secondary">Inactive</Badge>;
    case 3:
      return <Badge variant="destructive">Discontinued</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

export function MaterialsTable({ isRealData, ownerId }: MaterialsTableProps) {
  const [realData, setRealData] = useState<MaterialData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch real data when isRealData changes to true
  useEffect(() => {
    async function fetchRealData() {
      if (!isRealData || !ownerId) return;

      try {
        setLoading(true);
        setError(null);
        console.log('Fetching materials data for ownerId:', ownerId);
        
        const materials = await getMaterialsData(ownerId);
        console.log('Fetched materials:', materials);
        
        setRealData(materials);
      } catch (err) {
        console.error('Error fetching materials:', err);
        setError(err instanceof Error ? err.message : 'Failed to load materials data');
      } finally {
        setLoading(false);
      }
    }

    fetchRealData();
  }, [isRealData, ownerId]);

  // For now, we'll only show sample data
  // Real data fetching will be implemented when the View button is clicked
  const displayData = isRealData ? realData : sampleMaterials;

  return (
    <div className="relative">
      {/* Sample Data Watermark */}
      {!isRealData && (
        <Alert className="mb-4 border-amber-200 bg-amber-50">
          <Info className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>Sample Data Preview</strong> - This is demonstration data. Click "View" to load real materials data.
          </AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading materials data...</div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Alert className="mb-4 border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            Error loading data: {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Materials Table */}
      {!loading && !error && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lookup Code</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Material Group</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayData.map((material, index) => (
                <TableRow key={index} className={!isRealData ? 'opacity-75' : ''}>
                  <TableCell className="font-medium">{material.lookupCode}</TableCell>
                  <TableCell>{getStatusBadge(material.statusId)}</TableCell>
                  <TableCell>{material.materialGroupId}</TableCell>
                  <TableCell>{material.name}</TableCell>
                  <TableCell className="max-w-xs truncate" title={material.description}>
                    {material.description}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Sample Data Overlay Effect */}
          {!isRealData && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-45 text-gray-200 text-6xl font-bold opacity-20 select-none">
                SAMPLE DATA
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && displayData.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No materials data available.
        </div>
      )}
    </div>
  );
}
