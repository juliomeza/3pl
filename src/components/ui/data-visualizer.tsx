'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TableIcon, BarChart3, PieChart as PieChartIcon, TrendingUp } from 'lucide-react';

type ViewType = 'table' | 'bar' | 'pie' | 'line';

interface DataVisualizerProps {
  data: any[] | null;
  viewType?: ViewType;
}

// Color palette for charts - Subtle glass-style palette using brand hues
const COLORS = [
  'rgba(99, 102, 241, 0.7)',   // Indigo 500 @70%
  'rgba(14, 165, 233, 0.7)',   // Sky 500 @70%
  'rgba(16, 185, 129, 0.7)',   // Emerald 500 @70%
  'rgba(236, 72, 153, 0.7)',   // Fuchsia 500 @70%
  'rgba(245, 158, 11, 0.7)',   // Amber 500 @70%
  'rgba(168, 85, 247, 0.7)',   // Violet 500 @70%
  'rgba(59, 130, 246, 0.7)',   // Blue 500 @70%
  'rgba(20, 184, 166, 0.7)',   // Teal 500 @70%
];

const STROKES = [
  'rgb(99, 102, 241)',
  'rgb(14, 165, 233)',
  'rgb(16, 185, 129)',
  'rgb(236, 72, 153)',
  'rgb(245, 158, 11)',
  'rgb(168, 85, 247)',
  'rgb(59, 130, 246)',
  'rgb(20, 184, 166)',
];

export function DataVisualizer({ data, viewType: externalViewType }: DataVisualizerProps) {
  const [lastInteractedData, setLastInteractedData] = useState<any>(null);

  // Function to transform column names from snake_case to readable format
  const formatColumnName = (columnName: string): string => {
    return columnName
      .split('_') // Split by underscores
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize first letter of each word
      .join(' '); // Join with spaces
  };

  // Custom tooltip formatter for charts
  const formatTooltipLabel = (label: any, name: string) => {
    return `${formatColumnName(name)}: ${label}`;
  };

  // Use external viewType if provided, otherwise default to 'table'
  const viewType = externalViewType || 'table';

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
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <p className="text-center">Your data visualizations will appear here once you start asking questions about your logistics data.</p>
        </div>
      );
    }

    if (Array.isArray(data) && data.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
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
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>No valid numeric data for bar chart visualization.</p>
            </div>
          );
        }

        return (
          <ResponsiveContainer width="100%" height="100%">
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
                formatter={(value, name) => [value, formatColumnName(String(name))]}
                labelFormatter={(label) => `${formatColumnName(keyColumn)}: ${label}`}
              />
              <defs>
                <linearGradient id="glassBar" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={STROKES[0]} stopOpacity={0.85} />
                  <stop offset="100%" stopColor={STROKES[0]} stopOpacity={0.35} />
                </linearGradient>
              </defs>
              <Bar 
                dataKey={valueColumn} 
                fill="url(#glassBar)"
                radius={[6, 6, 0, 0]}
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
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>No valid data for pie chart visualization.</p>
            </div>
          );
        }

        return (
          <ResponsiveContainer width="100%" height="100%">
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
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke={STROKES[index % STROKES.length]} strokeWidth={1} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#FFFFFF', 
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                formatter={(value, name) => [value, formatColumnName(String(name))]}
              />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'line':
        // Validate we have numeric data for line chart
        const hasNumericData = chartData.some(item => Number(item[valueColumn]) > 0);
        
        if (!hasNumericData) {
          return (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>No valid numeric data for line chart visualization.</p>
            </div>
          );
        }

        return (
          <ResponsiveContainer width="100%" height="100%">
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
                formatter={(value, name) => [value, formatColumnName(String(name))]}
                labelFormatter={(label) => `${formatColumnName(keyColumn)}: ${label}`}
              />
              <defs>
                <linearGradient id="glassLine" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={STROKES[2]} stopOpacity={0.95} />
                  <stop offset="100%" stopColor={STROKES[2]} stopOpacity={0.45} />
                </linearGradient>
              </defs>
              <Line 
                type="monotone" 
                dataKey={valueColumn} 
                stroke={STROKES[2]}
                strokeWidth={3}
                dot={{ fill: STROKES[2], strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: STROKES[2] }}
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
                    {formatColumnName(key)}
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
    <div className="h-full flex flex-col">
      {/* Chart/Table Display */}
      <div className="flex-1 min-h-0">
        {renderChart()}
      </div>

      {/* Data Summary - Only show when there's data */}
      {hasValidData && data && (
        <div className="text-xs text-muted-foreground border-t pt-2 mt-4">
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
