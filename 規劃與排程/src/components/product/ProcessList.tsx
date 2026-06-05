import type { Process } from '../../types';

interface ProcessListProps {
  processes: Process[];
  maxDisplay?: number;
}

export function ProcessList({ processes, maxDisplay = 3 }: ProcessListProps) {
  if (processes.length === 0) {
    return <span className="text-gray-400">暂无工序</span>;
  }

  const displayProcesses = processes.slice(0, maxDisplay);
  const remainingCount = processes.length - maxDisplay;

  return (
    <div className="flex flex-wrap gap-1">
      {displayProcesses.map((process, index) => (
        <span key={process.sequence} className="inline-flex items-center">
          <span className="text-gray-700">
            {process.name}
            <span className="text-gray-400 text-xs">({process.standardHours}h)</span>
          </span>
          {index < displayProcesses.length - 1 && (
            <span className="mx-1 text-gray-400">→</span>
          )}
        </span>
      ))}
      {remainingCount > 0 && (
        <span className="text-gray-500 text-sm">...(+{remainingCount})</span>
      )}
    </div>
  );
}
