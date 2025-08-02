'use client';

import { Button } from '@/components/ui/button';
import { RotateCcw, TableIcon, BarChart3, PieChart as PieChartIcon, TrendingUp } from 'lucide-react';

type ViewType = 'table' | 'bar' | 'pie' | 'line';

interface VisualizationControlsProps {
  viewType: ViewType;
  onViewTypeChange: (viewType: ViewType) => void;
}

interface NewChatControlProps {
  onNewChat: () => void;
}

export function VisualizationControls({ viewType, onViewTypeChange }: VisualizationControlsProps) {
  return (
    <div className="flex items-center gap-1">
      <Button
        variant={viewType === 'table' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onViewTypeChange('table')}
        className="flex items-center gap-1 text-xs"
      >
        <TableIcon className="w-3 h-3" />
        Table
      </Button>

      <Button
        variant={viewType === 'bar' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onViewTypeChange('bar')}
        className="flex items-center gap-1 text-xs"
      >
        <BarChart3 className="w-3 h-3" />
        Bar
      </Button>

      <Button
        variant={viewType === 'pie' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onViewTypeChange('pie')}
        className="flex items-center gap-1 text-xs"
      >
        <PieChartIcon className="w-3 h-3" />
        Pie
      </Button>

      <Button
        variant={viewType === 'line' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onViewTypeChange('line')}
        className="flex items-center gap-1 text-xs"
      >
        <TrendingUp className="w-3 h-3" />
        Line
      </Button>
    </div>
  );
}

export function NewChatControl({ onNewChat }: NewChatControlProps) {
  return (
    <Button
      onClick={onNewChat}
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
    >
      <RotateCcw className="w-4 h-4" />
      New Chat
    </Button>
  );
}
