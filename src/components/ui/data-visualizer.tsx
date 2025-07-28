'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TableIcon, BarChart3, PieChart as PieChartIcon, TrendingUp } from 'lucide-react';

type ViewType = 'table' | 'bar' | 'pie' | 'line';

interface DataVisualizerProps {
  data: any[] | null;
}

// Color palette for charts - Soft Pastel Palette
const COLORS = [
  '#0A183C', // Primary dark blue (mantener como base)
  '#cdb4db', // Soft lavender
  '#ffc8dd', // Soft pink
  '#ffafcc', // Light pink
  '#bde0fe', // Light blue
  '#a2d2ff', // Soft blue
  '#E8F4FD', // Very light blue complement
  '#F3E8FF', // Very light purple complement
  '#FFF0F3', // Very light pink complement
  '#6C757D'  // Gray accent
];

export function DataVisualizer({ data }: DataVisualizerProps) {
  const [viewType, setViewType] = useState<ViewType>('table');
  const [lastInteractedData, setLastInteractedData] = useState<any>(null);

  // Check if we have valid data for charts
  const hasValidData = data && Array.isArray(data) && data.length > 0;
  const columns = hasValidData ? Object.keys(data[0]) : [];
  
  const isNumericColumn = (key: string) => {
    if (!hasValidData || !data) return false;
    return data.some(row => {
      const value = row[key];
      // Check if it's already a number
      if (typeof value === 'number' && !isNaN(value)) return true;
      // Check if it's a string that can be converted to a valid number
      if (typeof value === 'string') {
        const numValue = Number(value);
        return !isNaN(numValue) && value.trim() !== '';
      }
      return false;
    });
  };

  // Get all numeric columns
  const getNumericColumns = () => {
    if (!hasValidData) return [];
    return columns.filter(col => isNumericColumn(col));
  };

  // Get all non-numeric columns that could be labels
  const getLabelColumns = () => {
    if (!hasValidData) return [];
    return columns.filter(col => !isNumericColumn(col));
  };

  const hasDateColumn = hasValidData && columns.some(col => 
    col.toLowerCase().includes('date') || 
    col.toLowerCase().includes('month') || 
    col.toLowerCase().includes('year') ||
    col.toLowerCase().includes('week') ||
    col.toLowerCase().includes('day')
  );

  // Smart chart type suggestion
  const getRecommendedChartType = (): ViewType => {
    if (!hasValidData || !data) return 'table';
    
    // If only one row and one column (single value), always recommend table
    if (data.length === 1 && columns.length === 1) return 'table';
    
    // If only one row with multiple columns (single record), recommend table
    if (data.length === 1) return 'table';
    
    const numericColumns = getNumericColumns();
    const labelColumns = getLabelColumns();
    
    // Need at least one numeric column for charts
    if (numericColumns.length === 0) return 'table';
    
    // For multiple rows with exactly 2 columns (label + value) and <= 10 rows, pie chart is good
    if (columns.length === 2 && data.length <= 10 && numericColumns.length === 1) return 'pie';
    
    // If has date/time columns and numeric data, line chart is best
    if (hasDateColumn && numericColumns.length > 0) return 'line';
    
    // For moderate datasets with few columns, bar chart works well
    if (labelColumns.length >= 1 && numericColumns.length >= 1 && data.length <= 20 && data.length > 1) return 'bar';
    
    // Default to table for everything else
    return 'table';
  };

  // Get the key column (usually the first non-numeric column, prefer month_name over month)
  const getKeyColumn = () => {
    if (!hasValidData) return '';
    const labelColumns = getLabelColumns();
    
    // Prefer month_name, date_name, or similar readable columns (case-insensitive)
    const preferredColumn = labelColumns.find(col => {
      const lowerCol = col.toLowerCase();
      return lowerCol.includes('name') || 
             lowerCol.includes('label') ||
             lowerCol.includes('description');
    });
    
    if (preferredColumn) return preferredColumn;
    
    // Otherwise, return first non-numeric column or first column
    return labelColumns[0] || columns[0];
  };

  // Get the value column (prefer count, total, amount, or first numeric column)
  const getValueColumn = () => {
    if (!hasValidData) return '';
    const numericColumns = getNumericColumns();
    
    // Prefer count, total, amount, value, etc. (case-insensitive)
    const preferredColumn = numericColumns.find(col => {
      const lowerCol = col.toLowerCase();
      return lowerCol === 'count' ||
             lowerCol.includes('count') ||
             lowerCol.includes('total') ||
             lowerCol.includes('amount') ||
             lowerCol.includes('value') ||
             lowerCol.includes('sum');
    });
    
    if (preferredColumn) return preferredColumn;
    
    // Otherwise, return first numeric column or second column
    return numericColumns[0] || columns[1];
  };

  const keyColumn = getKeyColumn();
  const valueColumn = getValueColumn();
  const recommendedType = getRecommendedChartType();

  // Check if user has interacted with current dataset
  const hasInteractedWithCurrentData = lastInteractedData === data;

  // Check if chart types should be disabled
  const canShowPieChart = hasValidData && getNumericColumns().length >= 1 && getLabelColumns().length >= 1;
  const canShowBarChart = hasValidData && getNumericColumns().length >= 1 && getLabelColumns().length >= 1;
  const canShowLineChart = hasValidData && getNumericColumns().length >= 1 && getLabelColumns().length >= 1;

  // Prepare data for charts
  const prepareChartData = () => {
    if (!hasValidData || !data) return [];
    
    return data.map(row => {
      const chartRow: any = {};
      columns.forEach(col => {
        let value = row[col];
        
        // Convert string numbers to actual numbers for numeric columns
        if (isNumericColumn(col) && typeof value === 'string') {
          const numValue = Number(value);
          if (!isNaN(numValue)) {
            value = numValue;
          }
        }
        
        chartRow[col] = value;
      });
      
      // Special handling for month data: use month_name for display if available
      if (keyColumn === 'month_name' || (keyColumn === 'month' && row['month_name'])) {
        chartRow[keyColumn] = row['month_name'] || row[keyColumn];
      }
      
      return chartRow;
    });
  };

  const chartData = prepareChartData();

  const renderChart = () => {
    if (!hasValidData || !data) {
      return (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <p className="text-center">Your data visualizations will appear here once you start asking questions about your logistics data.</p>
        </div>
      );
    }

    if (Array.isArray(data) && data.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <p>No data found for this query.</p>
        </div>
      );
    }

    switch (viewType) {
      case 'bar':
        // Validate we have numeric data for bar chart
        const hasBarNumericData = chartData.some(item => Number(item[valueColumn]) > 0);
        
        if (!hasBarNumericData) {
          return (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <p>No valid numeric data for bar chart visualization.</p>
            </div>
          );
        }

        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey={keyColumn} 
                stroke="#6B7280"
                fontSize={12}
                angle={data.length > 6 ? -45 : 0}
                textAnchor={data.length > 6 ? 'end' : 'middle'}
                height={data.length > 6 ? 80 : 60}
              />
              <YAxis stroke="#6B7280" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#FFFFFF', 
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar 
                dataKey={valueColumn} 
                fill={COLORS[1]} // Using the soft lavender color
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie':
        const pieData = chartData.slice(0, 10).map((item, index) => ({
          name: String(item[keyColumn] || ''),
          value: Number(item[valueColumn]) || 0,
          fill: COLORS[index % COLORS.length]
        })).filter(item => item.value > 0); // Filter out zero values

        if (pieData.length === 0) {
          return (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <p>No valid data for pie chart visualization.</p>
            </div>
          );
        }

        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#FFFFFF', 
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'line':
        // Validate we have numeric data for line chart
        const hasNumericData = chartData.some(item => Number(item[valueColumn]) > 0);
        
        if (!hasNumericData) {
          return (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <p>No valid numeric data for line chart visualization.</p>
            </div>
          );
        }

        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey={keyColumn} 
                stroke="#6B7280"
                fontSize={12}
              />
              <YAxis stroke="#6B7280" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#FFFFFF', 
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Line 
                type="monotone" 
                dataKey={valueColumn} 
                stroke="#0A183C"
                strokeWidth={3}
                dot={{ fill: '#0A183C', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: '#0A183C' }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      default: // table
        return (
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map(key => (
                  <TableHead key={key} className="font-semibold">
                    {key}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row: any, rowIndex: number) => (
                <TableRow key={rowIndex}>
                  {columns.map((key, cellIndex) => (
                    <TableCell key={cellIndex}>
                      {String(row[key])}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* View Type Controls - Always visible */}
      <div className="flex flex-wrap gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <Button
          variant={viewType === 'table' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setViewType('table');
            setLastInteractedData(data);
          }}
          className="flex items-center gap-2"
        >
          <TableIcon className="w-4 h-4" />
          Table
          {hasValidData && recommendedType === 'table' && !hasInteractedWithCurrentData && viewType !== 'table' && (
            <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full">
              Recommended
            </span>
          )}
        </Button>

        <Button
          variant={viewType === 'bar' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setViewType('bar');
            setLastInteractedData(data);
          }}
          className="flex items-center gap-2"
        >
          <BarChart3 className="w-4 h-4" />
          Bar
          {hasValidData && recommendedType === 'bar' && !hasInteractedWithCurrentData && viewType !== 'bar' && (
            <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full">
              Recommended
            </span>
          )}
        </Button>

        <Button
          variant={viewType === 'pie' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setViewType('pie');
            setLastInteractedData(data);
          }}
          className="flex items-center gap-2"
        >
          <PieChartIcon className="w-4 h-4" />
          Pie
          {hasValidData && recommendedType === 'pie' && !hasInteractedWithCurrentData && viewType !== 'pie' && (
            <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full">
              Recommended
            </span>
          )}
        </Button>

        <Button
          variant={viewType === 'line' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setViewType('line');
            setLastInteractedData(data);
          }}
          className="flex items-center gap-2"
        >
          <TrendingUp className="w-4 h-4" />
          Line
          {hasValidData && recommendedType === 'line' && !hasInteractedWithCurrentData && viewType !== 'line' && (
            <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full">
              Recommended
            </span>
          )}
        </Button>
      </div>

      {/* Chart/Table Display */}
      <div className="min-h-[400px] pt-4">
        {renderChart()}
      </div>

      {/* Data Summary - Only show when there's data */}
      {hasValidData && data && (
        <div className="text-xs text-muted-foreground border-t pt-2">
          Showing {data.length} rows × {columns.length} columns
          {viewType !== 'table' && data.length > 20 && (
            <span className="ml-2 text-amber-600">
              • Large dataset: Consider filtering for better chart visualization
            </span>
          )}
        </div>
      )}
    </div>
  );
}
