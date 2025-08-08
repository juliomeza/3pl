'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Info, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { getMaterialsData } from '@/app/actions';

// Define ColumnHeader outside of the main component to prevent re-creation
const ColumnHeader = React.memo(({ 
  field, 
  label, 
  filters, 
  sortField, 
  sortDirection, 
  onFilterChange, 
  onSort, 
  getSortIcon 
}: {
  field: SortField;
  label: string;
  filters: ColumnFilters;
  sortField: SortField | null;
  sortDirection: SortDirection;
  onFilterChange: (field: keyof ColumnFilters, value: string) => void;
  onSort: (field: SortField) => void;
  getSortIcon: (field: SortField) => React.ReactNode;
}) => {
  const isActive = sortField === field;
  
  return (
    <div className="space-y-2">
      <div 
        className={`flex items-center gap-1 cursor-pointer transition-colors ${
          isActive 
            ? 'text-blue-700 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300' 
            : 'text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400'
        }`}
        onClick={() => onSort(field)}
      >
        <span className={`text-sm ${
          isActive ? 'font-bold' : 'font-semibold'
        }`}>{label}</span>
        <div className={`transition-colors ${
          isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
        }`}>
          {getSortIcon(field)}
        </div>
      </div>
      <Input
        placeholder="Search"
        value={filters[field]}
        onChange={(e) => onFilterChange(field, e.target.value)}
        className={`h-8 text-xs border-0 focus:border-0 focus:ring-0 focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent ${
          filters[field] ? 'text-blue-700 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
        }`}
      />
    </div>
  );
});

interface MaterialsTableProps {
  isRealData: boolean;
  ownerId?: number | null;
}

interface MaterialData {
  lookupCode: string;
  statusId: number;
  materialGroupId: string | number; // Can be string or number depending on data source
  name: string;
  description: string;
}

type SortField = keyof MaterialData;
type SortDirection = 'asc' | 'desc' | null;

interface ColumnFilters {
  lookupCode: string;
  statusId: string;
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
      return <Badge variant="default" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">Active</Badge>;
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
  
  // Filter and sort states
  const [filters, setFilters] = useState<ColumnFilters>({
    lookupCode: '',
    statusId: '',
    materialGroupId: '',
    name: '',
    description: ''
  });
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Handle filter changes with useCallback to prevent re-renders
  const handleFilterChange = useCallback((field: keyof ColumnFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Handle sort with useCallback
  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      // Cycle through: asc -> desc -> none
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortField(null);
        setSortDirection(null);
      } else {
        setSortDirection('asc');
      }
    } else {
      // New field selected, start with ascending
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField, sortDirection]);

  // Get sort icon
  const getSortIcon = useCallback((field: SortField) => {
    // Icons inherit color from the parent container so dark mode styles apply correctly
    if (sortField !== field) {
      return <ChevronsUpDown className="w-4 h-4" />;
    }
    if (sortDirection === 'asc') {
      return <ChevronUp className="w-4 h-4" />;
    }
    if (sortDirection === 'desc') {
      return <ChevronDown className="w-4 h-4" />;
    }
    return <ChevronsUpDown className="w-4 h-4" />;
  }, [sortField, sortDirection]);

  // Fetch real data when isRealData changes to true
  // Filtered and sorted data
  const processedData = useMemo(() => {
    let filtered = isRealData ? realData : sampleMaterials;

    // Apply filters
    filtered = filtered.filter((item: MaterialData) => {
      const lookupCode = String(item.lookupCode || '').toLowerCase();
      const statusId = String(item.statusId || '').toLowerCase();
      const materialGroupId = String(item.materialGroupId || '').toLowerCase();
      const name = String(item.name || '').toLowerCase();
      const description = String(item.description || '').toLowerCase();

      return (
        lookupCode.includes(filters.lookupCode.toLowerCase()) &&
        statusId.includes(filters.statusId.toLowerCase()) &&
        materialGroupId.includes(filters.materialGroupId.toLowerCase()) &&
        name.includes(filters.name.toLowerCase()) &&
        description.includes(filters.description.toLowerCase())
      );
    });

    // Apply sorting
    if (sortField && sortDirection) {
      filtered.sort((a: MaterialData, b: MaterialData) => {
        let aValue: string;
        let bValue: string;
        
        // Convert all values to strings for consistent sorting
        aValue = String(a[sortField] || '');
        bValue = String(b[sortField] || '');
        
        if (sortDirection === 'asc') {
          return aValue.localeCompare(bValue);
        } else {
          return bValue.localeCompare(aValue);
        }
      });
    }

    return filtered;
  }, [isRealData, realData, filters, sortField, sortDirection]);

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

  return (
    <div className="relative">

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading materials data...</div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Alert className="mb-4 border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/30">
          <AlertDescription className="text-red-800 dark:text-red-300">
            Error loading data: {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Materials Table */}
      {!loading && !error && (
        <div className="rounded-md bg-transparent">
      {/* Fixed Header */}
      <div className="bg-muted/30">
            <Table className="bg-transparent [&_thead]:border-b-0 [&_thead_tr]:border-b-0">
              <TableHeader className="border-b-0">
                <TableRow className="border-b border-border/60 bg-muted/40 hover:bg-muted/50 dark:border-border/30">
                  <TableHead className="w-[160px] border-r-0 text-foreground">
                    <ColumnHeader 
                      field="lookupCode" 
                      label="Lookup Code" 
                      filters={filters}
                      sortField={sortField}
                      sortDirection={sortDirection}
                      onFilterChange={handleFilterChange}
                      onSort={handleSort}
                      getSortIcon={getSortIcon}
                    />
                  </TableHead>
                  <TableHead className="w-[120px] border-r-0 text-foreground">
                    <ColumnHeader 
                      field="statusId" 
                      label="Status" 
                      filters={filters}
                      sortField={sortField}
                      sortDirection={sortDirection}
                      onFilterChange={handleFilterChange}
                      onSort={handleSort}
                      getSortIcon={getSortIcon}
                    />
                  </TableHead>
                  <TableHead className="w-[160px] border-r-0 text-foreground">
                    <ColumnHeader 
                      field="materialGroupId" 
                      label="Material Group" 
                      filters={filters}
                      sortField={sortField}
                      sortDirection={sortDirection}
                      onFilterChange={handleFilterChange}
                      onSort={handleSort}
                      getSortIcon={getSortIcon}
                    />
                  </TableHead>
                  <TableHead className="w-[240px] border-r-0 text-foreground">
                    <ColumnHeader 
                      field="name" 
                      label="Name" 
                      filters={filters}
                      sortField={sortField}
                      sortDirection={sortDirection}
                      onFilterChange={handleFilterChange}
                      onSort={handleSort}
                      getSortIcon={getSortIcon}
                    />
                  </TableHead>
                  <TableHead className="border-r-0 text-foreground">
                    <ColumnHeader 
                      field="description" 
                      label="Description" 
                      filters={filters}
                      sortField={sortField}
                      sortDirection={sortDirection}
                      onFilterChange={handleFilterChange}
                      onSort={handleSort}
                      getSortIcon={getSortIcon}
                    />
                  </TableHead>
                </TableRow>
              </TableHeader>
            </Table>
          </div>

          {/* Scrollable Body */}
          <div className="max-h-[calc(100vh-400px)] overflow-auto custom-scrollbar">
            <Table className="bg-transparent">
              <TableBody className="bg-transparent">
                {processedData.map((material, index) => (
                  <TableRow key={index} className={`border-b-0 hover:bg-yellow-100 dark:hover:bg-yellow-900/20 ${index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-transparent'} ${!isRealData ? 'opacity-75' : ''}`}>
                    <TableCell className="font-medium border-r-0 w-[160px]">{material.lookupCode}</TableCell>
                    <TableCell className="border-r-0 w-[120px]">{getStatusBadge(material.statusId)}</TableCell>
                    <TableCell className="border-r-0 w-[160px]">{material.materialGroupId}</TableCell>
                    <TableCell className="border-r-0 w-[240px]">{material.name}</TableCell>
                    <TableCell className="max-w-xs truncate border-r-0" title={material.description}>
                      {material.description}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Sample Data Overlay Effect */}
      {!isRealData && (
            <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/3 transform -translate-x-1/2 -translate-y-1/2 rotate-[22.5deg] text-blue-200 dark:text-blue-900 text-8xl font-bold opacity-40 dark:opacity-30 select-none">
                SAMPLE DATA
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && processedData.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No materials data available.
        </div>
      )}
    </div>
  );
}
