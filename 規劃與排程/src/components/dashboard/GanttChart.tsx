import React, { useMemo } from 'react';
import { addDays, differenceInDays, parseISO, startOfDay, format } from 'date-fns';
import { GanttTimeline } from '../scheduling/GanttTimeline';
import { useScheduleStore, useProductionLineStore, useOrderStore, useProductStore, useSettingsStore } from '../../stores';
import type { ScheduleResult, ProductionLine } from '../../types';

export function GanttChart() {
  const { scheduleResults } = useScheduleStore();
  const { productionLines } = useProductionLineStore();
  const { orders } = useOrderStore();
  const { products } = useProductStore();
  const { settings } = useSettingsStore();

  // 计算日期范围：未来10天
  const dateRange = useMemo(() => {
    const today = startOfDay(new Date());
    const startDate = today;
    const endDate = addDays(today, 10);
    return { startDate, endDate };
  }, []);

  // 按产线分组排程结果
  const scheduleByLine = useMemo(() => {
    const grouped = new Map<string, ScheduleResult[]>();
    
    for (const line of productionLines) {
      const lineSchedules = scheduleResults.filter(s => s.productionLineId === line.id);
      grouped.set(line.id, lineSchedules);
    }
    
    return grouped;
  }, [scheduleResults, productionLines]);

  // 计算任务条的位置和宽度
  const getTaskStyle = (task: ScheduleResult) => {
    const startDate = parseISO(task.startTime);
    const endDate = parseISO(task.endTime);
    const dayWidth = 160; // 每日宽度（像素）
    
    const startDayDiff = differenceInDays(startDate, dateRange.startDate);
    const durationDays = differenceInDays(endDate, startDate);
    
    const left = Math.max(0, startDayDiff) * dayWidth;
    const width = Math.max(durationDays, 0.5) * dayWidth;
    
    return {
      left: `${left}px`,
      width: `${width}px`,
      backgroundColor: task.isForecast ? '#93c5fd' : '#3b82f6',
    };
  };

  // 获取订单信息
  const getOrderInfo = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    const product = order ? products.find(p => p.id === order.productId) : null;
    return { order, product };
  };

  if (scheduleResults.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow h-full flex flex-col">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">甘特图展示</h3>
        </div>
        <GanttTimeline
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          viewMode="day"
          settings={settings}
        />
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="mt-2 text-sm">暂无排程数据</p>
            <p className="text-xs text-gray-400">点击"一键排程"生成甘特图</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow h-full flex flex-col">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">甘特图展示</h3>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-blue-500"></span>
            <span>实际排程</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-blue-300"></span>
            <span>预测排程</span>
          </div>
        </div>
      </div>
      
      <GanttTimeline
        startDate={dateRange.startDate}
        endDate={dateRange.endDate}
        viewMode="day"
        settings={settings}
      />
      
      <div className="flex-1 overflow-auto">
        {productionLines.filter(line => line.status === 'active').map((line) => (
          <div key={line.id} className="flex border-b border-gray-100 hover:bg-gray-50">
            <div className="w-48 shrink-0 px-2 py-2 border-r border-gray-200">
              <span className="text-sm font-medium text-gray-700">{line.name}</span>
            </div>
            <div className="relative flex-1 h-12" style={{ minWidth: '1600px' }}>
              {scheduleByLine.get(line.id)?.map((task) => {
                const { order, product } = getOrderInfo(task.orderId);
                return (
                  <div
                    key={task.id}
                    className="absolute top-1 h-10 rounded text-white text-xs flex items-center px-2 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                    style={getTaskStyle(task)}
                    title={`${product?.name || task.productId} - ${task.processName}`}
                  >
                    <span className="truncate">
                      {product?.name || task.productId} / {task.processName}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}