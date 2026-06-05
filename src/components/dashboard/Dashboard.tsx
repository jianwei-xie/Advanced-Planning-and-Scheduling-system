import React, { useState } from 'react';
import { QuickActions } from './QuickActions';
import { LineLoadOverview } from './LineLoadOverview';
import { TodayOverview } from './TodayOverview';
import { GanttChart } from './GanttChart';
import { useScheduleStore } from '../../stores';

export function Dashboard() {
  const [refreshKey, setRefreshKey] = useState(0);
  const { scheduleResults } = useScheduleStore();

  const handleSchedulingComplete = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="p-6 h-full bg-gray-50">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">生产计划与排程系统</h1>
        <p className="text-sm text-gray-500 mt-1">Dashboard - 实时监控与快速操作</p>
      </div>

      <div className="flex gap-6 h-[calc(100vh-140px)]">
        {/* 左侧栏 */}
        <div className="w-72 shrink-0 space-y-4 overflow-y-auto">
          {/* 快速操作区 */}
          <QuickActions onSchedulingComplete={handleSchedulingComplete} />

          {/* 今日概览 */}
          <TodayOverview />

          {/* 产线负荷看板 */}
          <LineLoadOverview />
        </div>

        {/* 右侧甘特图展示区 */}
        <div className="flex-1 min-w-0">
          <GanttChart key={refreshKey} />
        </div>
      </div>
    </div>
  );
}