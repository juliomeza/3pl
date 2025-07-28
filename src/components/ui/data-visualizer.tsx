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

// Color palette for charts
const COLORS = [
  '#0A183C', // Primary dark blue
  '#1E40AF', // Blue
  '#3B82F6', // Light blue
  '#60A5FA', // Lighter blue
  '#93C5FD', // Very light blue
  '#DBEAFE', // Lightest blue
  '#F3F4F6', // Gray accent
  '#6B7280', // Medium gray
  '#9CA3AF', // Light gray
  '#D1D5DB'  // Very light gray
];

export function DataVisualizer({ data }: DataVisualizerProps) {
  const [viewType, setViewType] = useState<ViewType>('table');

  // Check if we have valid data for charts
  const hasValidData = data && Array.isArray(data) && data.length > 0;
  const columns = hasValidData ? Object.keys(data[0]) : [];
  
  const isNumericColumn = (key: string) => {
    if (!hasValidData || !data) return false;
    return data.some(row => typeof row[key] === 'number' && !isNaN(row[key]));
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
    if (columns.length === 2 && data.length <= 10) return 'pie';
    if (hasDateColumn) return 'line';
    if (columns.length <= 4 && data.length <= 20) return 'bar';
    return 'table';
  };

  // Get the key column (usually the first non-numeric column)
  const getKeyColumn = () => {
    if (!hasValidData) return '';
    return columns.find(col => !isNumericColumn(col)) || columns[0];
  };

  // Get the value column (usually the first numeric column)
  const getValueColumn = () => {
    if (!hasValidData) return '';
    return columns.find(col => isNumericColumn(col)) || columns[1];
  };

  const keyColumn = getKeyColumn();
  const valueColumn = getValueColumn();
  const recommendedType = getRecommendedChartType();

  // Check if chart types should be disabled
  const canShowPieChart = hasValidData && columns.length >= 2 && isNumericColumn(valueColumn);
  const canShowBarChart = hasValidData && columns.length >= 2 && isNumericColumn(valueColumn);
  const canShowLineChart = hasValidData && columns.length >= 2 && isNumericColumn(valueColumn);

  // Prepare data for charts
  const prepareChartData = () => {
    if (!hasValidData || !data) return [];
    
    return data.map(row => {
      const chartRow: any = {};
      columns.forEach(col => {
        chartRow[col] = row[col];
        // For display purposes, convert month numbers to names if needed
        if (col === 'month' && typeof row[col] === 'number' && row['month_name']) {
          chartRow[col] = row['month_name'];
        }
      });
      return chartRow;
    });
  };

  const chartData = prepareChartData();

  const renderChart = () => {
    if (!hasValidData || !data) {
      return (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <p>The data table corresponding to your query will appear here.</p>
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
                fill="#0A183C"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie':
        const pieData = chartData.slice(0, 10).map((item, index) => ({
          name: String(item[keyColumn]),
          value: Number(item[valueColumn]) || 0,
          fill: COLORS[index % COLORS.length]
        }));

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
    <div className="space-y-4">
      {/* View Type Controls - Always visible */}
      <div className="flex flex-wrap gap-2 p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <Button
          variant={viewType === 'table' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewType('table')}
          className="flex items-center gap-2"
        >
          <TableIcon className="w-4 h-4" />
          Table
          {hasValidData && recommendedType === 'table' && (
            <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full">
              Recommended
            </span>
          )}
        </Button>

        <Button
          variant={viewType === 'bar' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewType('bar')}
          className="flex items-center gap-2"
        >
          <BarChart3 className="w-4 h-4" />
          Bar
          {hasValidData && recommendedType === 'bar' && (
            <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full">
              Recommended
            </span>
          )}
        </Button>

        <Button
          variant={viewType === 'pie' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewType('pie')}
          className="flex items-center gap-2"
        >
          <PieChartIcon className="w-4 h-4" />
          Pie
          {hasValidData && recommendedType === 'pie' && (
            <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full">
              Recommended
            </span>
          )}
        </Button>

        <Button
          variant={viewType === 'line' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewType('line')}
          className="flex items-center gap-2"
        >
          <TrendingUp className="w-4 h-4" />
          Line
          {hasValidData && recommendedType === 'line' && (
            <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full">
              Recommended
            </span>
          )}
        </Button>
      </div>

      {/* Chart/Table Display */}
      <div className="min-h-[400px]">
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
