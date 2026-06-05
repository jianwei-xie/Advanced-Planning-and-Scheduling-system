import type { MaterialRequirementStatus } from '../../types';

interface StockIndicatorProps {
  currentStock: number;
  safetyStock: number;
  status: MaterialRequirementStatus;
}

const statusColors: Record<MaterialRequirementStatus, { bar: string; bg: string }> = {
  sufficient: { bar: 'bg-green-500', bg: 'bg-green-100' },
  low: { bar: 'bg-yellow-500', bg: 'bg-yellow-100' },
  critical: { bar: 'bg-red-500', bg: 'bg-red-100' },
};

export function StockIndicator({ currentStock, safetyStock, status }: StockIndicatorProps) {
  const maxValue = Math.max(currentStock, safetyStock * 2);
  const percentage = Math.min((currentStock / maxValue) * 100, 100);
  const { bar, bg } = statusColors[status];

  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className={`flex-1 h-2 rounded-full ${bg}`}>
        <div
          className={`h-2 rounded-full ${bar} transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs text-gray-600 w-16">{currentStock}</span>
    </div>
  );
}
