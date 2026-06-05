import React, { useMemo } from 'react';
import { Card } from '../common/Card';
import { useProductionLineStore, useScheduleStore } from '../../stores';
import { parseISO, differenceInHours } from 'date-fns';

export function LineLoadOverview() {
  const { productionLines } = useProductionLineStore();
  const { scheduleResults } = useScheduleStore();

  // 计算各产线负荷
  const lineLoads = useMemo(() => {
    const loads = productionLines.map((line) => {
      const lineTasks = scheduleResults.filter((t) => t.productionLineId === line.id);
      
      // 计算总工时
      const totalHours = lineTasks.reduce((sum, task) => {
        const start = parseISO(task.startTime);
        const end = parseISO(task.endTime);
        return sum + differenceInHours(end, start);
      }, 0);

      // 计算负荷百分比（基于日产能8小时 * 10天 = 80小时为100%）
      const maxCapacity = line.loadCapacity * 10; // 10天总产能
      const loadPercentage = maxCapacity > 0 ? Math.min(Math.round((totalHours / maxCapacity) * 100), 100) : 0;

      return {
        id: line.id,
        name: line.name,
        loadPercentage,
        totalHours,
        taskCount: lineTasks.length,
        isWarning: loadPercentage >= 90,
      };
    });

    return loads;
  }, [productionLines, scheduleResults]);

  return (
    <Card>
      <h3 className="text-sm font-semibold text-gray-700 mb-3">产线负荷看板</h3>
      <div className="space-y-3">
        {lineLoads.map((line) => (
          <div key={line.id} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className={`${line.isWarning ? 'text-orange-600' : 'text-gray-700'}`}>
                {line.name}
              </span>
              <span className={`font-medium ${line.isWarning ? 'text-orange-600' : 'text-gray-900'}`}>
                {line.loadPercentage}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  line.isWarning ? 'bg-orange-500' : 'bg-blue-500'
                }`}
                style={{ width: `${line.loadPercentage}%` }}
              />
            </div>
            <div className="text-xs text-gray-400">
              {line.totalHours.toFixed(1)}h / {line.loadCapacity * 10}h · {line.taskCount}个任务
            </div>
          </div>
        ))}
      </div>
      
      {lineLoads.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-4">暂无产线数据</p>
      )}
    </Card>
  );
}