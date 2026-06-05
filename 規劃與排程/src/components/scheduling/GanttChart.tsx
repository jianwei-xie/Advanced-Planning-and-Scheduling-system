import React, { useState, useMemo, useCallback } from 'react';
import { View, Task, Gantt } from 'gantt-task-react';
import { addDays, startOfDay, endOfDay, parseISO, format } from 'date-fns';
import { useScheduleStore } from '../../stores/scheduleStore';
import { useProductionLineStore } from '../../stores/productionLineStore';
import { useProductStore } from '../../stores/productStore';
import { useSettingsStore } from '../../stores/settingsStore';
import type { ScheduleResult } from '../../types';
import { GanttTimeline } from './GanttTimeline';
import { PRODUCT_COLORS, getTaskStyles } from './GanttTask';
import { isInForecastPeriod } from '../../utils/dateUtils';

type ViewMode = 'day' | 'week';

interface GanttChartProps {
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  onTaskDrag?: (taskId: string, newStart: Date, newEnd: Date) => void;
}

export const GanttChart: React.FC<GanttChartProps> = ({
  viewMode: initialViewMode = 'day',
  onViewModeChange,
  onTaskDrag,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // 从 store 获取数据
  const scheduleResults = useScheduleStore((state) => state.scheduleResults);
  const setScheduleResults = useScheduleStore((state) => state.setScheduleResults);
  const productionLines = useProductionLineStore((state) => state.productionLines);
  const products = useProductStore((state) => state.products);
  const settings = useSettingsStore((state) => state.settings);

  // 创建产品颜色映射
  const productColors = useMemo(() => {
    const colorMap = new Map<string, string>();
    products.forEach((product, index) => {
      colorMap.set(product.id, PRODUCT_COLORS[index % PRODUCT_COLORS.length]);
    });
    return colorMap;
  }, [products]);

  // 转换 ScheduleResult 为 Gantt Task
  const tasks = useMemo((): Task[] => {
    if (scheduleResults.length === 0) return [];

    const today = startOfDay(new Date());
    const taskMap = new Map<string, Task>();

    scheduleResults.forEach((result) => {
      const startDate = parseISO(result.startTime);
      const endDate = parseISO(result.endTime);
      const product = products.find((p) => p.id === result.productId);
      const line = productionLines.find((l) => l.id === result.productionLineId);

      const taskId = `${result.id}`;
      const taskName = product ? `${product.name}-${result.processName}` : result.processName;

      // 判断是否为预测区域
      const isForecast = isInForecastPeriod(startDate, today) || result.isForecast;

      // 获取颜色
      const backgroundColor = productColors.get(result.productId) || PRODUCT_COLORS[0];

      taskMap.set(taskId, {
        start: startDate,
        end: endDate,
        name: taskName,
        id: taskId,
        progress: 100,
        isDisabled: false,
        styles: {
          backgroundColor: isForecast ? `${backgroundColor}99` : backgroundColor,
          backgroundSelectedColor: '#1E40AF',
          progressColor: '#ffffff40',
          progressSelectedColor: '#ffffff60',
        },
        // 自定义属性
        productId: result.productId,
        orderId: result.orderId,
        productionLineId: result.productionLineId,
        isForecast,
      } as Task);
    });

    return Array.from(taskMap.values());
  }, [scheduleResults, products, productionLines, productColors]);

  // 按产线分组显示
  const tasksByLine = useMemo(() => {
    const grouped = new Map<string, Task[]>();

    productionLines.forEach((line) => {
      const lineTasks = tasks.filter((task) => {
        const lineId = (task as any).productionLineId;
        return lineId === line.id;
      });

      if (lineTasks.length > 0) {
        grouped.set(line.id, lineTasks);
      }
    });

    return grouped;
  }, [productionLines, tasks]);

  // 计算时间范围
  const dateRange = useMemo(() => {
    if (tasks.length === 0) {
      const today = new Date();
      return {
        start: startOfDay(today),
        end: addDays(startOfDay(today), 10),
      };
    }

    const starts = tasks.map((t) => t.start.getTime());
    const ends = tasks.map((t) => t.end.getTime());

    return {
      start: startOfDay(new Date(Math.min(...starts))),
      end: endOfDay(new Date(Math.max(...ends))),
    };
  }, [tasks]);

  // 处理视图切换
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    onViewModeChange?.(mode);
  };

  // 处理任务拖拽
  const handleTaskDrag = useCallback(
    (task: Task, startDate: Date) => {
      const resultId = task.id;
      const result = scheduleResults.find((r) => r.id === resultId);

      if (!result) return;

      // 计算新的结束时间（保持原有工期）
      const originalDuration =
        parseISO(result.endTime).getTime() - parseISO(result.startTime).getTime();
      const newEndDate = new Date(startDate.getTime() + originalDuration);

      // 更新 scheduleStore
      const updatedResults = scheduleResults.map((r) => {
        if (r.id === resultId) {
          return {
            ...r,
            startTime: startDate.toISOString(),
            endTime: newEndDate.toISOString(),
          };
        }

        // 重新计算后续工序
        if (
          r.orderId === result.orderId &&
          r.productionLineId === result.productionLineId
        ) {
          const rStart = parseISO(r.startTime);
          if (rStart > parseISO(result.endTime)) {
            // 需要顺延
            const offset =
              newEndDate.getTime() - parseISO(result.endTime).getTime();
            return {
              ...r,
              startTime: new Date(rStart.getTime() + offset).toISOString(),
              endTime: new Date(
                parseISO(r.endTime).getTime() + offset
              ).toISOString(),
            };
          }
        }

        return r;
      });

      setScheduleResults(updatedResults);
      onTaskDrag?.(resultId, startDate, newEndDate);
    },
    [scheduleResults, setScheduleResults, onTaskDrag]
  );

  // 处理任务点击
  const handleTaskSelect = (task: Task) => {
    setSelectedTaskId(task.id === selectedTaskId ? null : task.id);
  };

  // 渲染空状态
  if (scheduleResults.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center rounded-lg border border-gray-200 bg-gray-50">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">暂无排程数据</h3>
          <p className="mt-1 text-sm text-gray-500">
            请先执行排程算法生成排程结果
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      {/* 头部工具栏 */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <h2 className="text-lg font-semibold text-gray-900">排程甘特图</h2>

        <div className="flex items-center gap-2">
          {/* 视图切换 */}
          <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
            <button
              onClick={() => handleViewModeChange('day')}
              className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
                viewMode === 'day'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              日视图
            </button>
            <button
              onClick={() => handleViewModeChange('week')}
              className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
                viewMode === 'week'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              周视图
            </button>
          </div>

          {/* 图例 */}
          <div className="flex items-center gap-2 ml-4">
            <span className="text-xs text-gray-500">产品颜色：</span>
            {products.slice(0, 5).map((product, index) => (
              <div key={product.id} className="flex items-center gap-1">
                <div
                  className="h-3 w-3 rounded"
                  style={{ backgroundColor: PRODUCT_COLORS[index % PRODUCT_COLORS.length] }}
                />
                <span className="text-xs text-gray-600">{product.name}</span>
              </div>
            ))}
          </div>

          {/* 预测区域标识 */}
          <div className="flex items-center gap-2 ml-4">
            <div className="h-3 w-3 rounded opacity-60" style={{ backgroundColor: '#3B82F6' }} />
            <span className="text-xs text-gray-500">预测区域</span>
          </div>
        </div>
      </div>

      {/* 时间轴 */}
      <GanttTimeline
        startDate={dateRange.start}
        endDate={dateRange.end}
        viewMode={viewMode}
        settings={settings}
      />

      {/* 甘特图内容 */}
      <div className="overflow-auto" style={{ maxHeight: '600px' }}>
        <Gantt
          tasks={tasks}
          viewMode={viewMode === 'day' ? View.Day : View.Week}
          onTaskDrag={handleTaskDrag}
          onTaskSelect={handleTaskSelect}
          listCellWidth={viewMode === 'day' ? '160px' : '120px'}
          rowHeight={50}
          headerHeight={0}
          ganttHeight={productionLines.length * 50}
          todayColor="#FEE2E2"
          showTodayLabel={true}
          fontSize="12px"
          locale="zh-CN"
        />
      </div>

      {/* 选中任务详情 */}
      {selectedTaskId && (
        <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
          {(() => {
            const task = tasks.find((t) => t.id === selectedTaskId);
            if (!task) return null;

            const result = scheduleResults.find((r) => r.id === selectedTaskId);
            const product = result ? products.find((p) => p.id === result.productId) : null;
            const line = result
              ? productionLines.find((l) => l.id === result.productionLineId)
              : null;

            return (
              <div className="flex items-center gap-6 text-sm">
                <div>
                  <span className="text-gray-500">任务：</span>
                  <span className="font-medium">{task.name}</span>
                </div>
                {product && (
                  <div>
                    <span className="text-gray-500">产品：</span>
                    <span className="font-medium">{product.name}</span>
                  </div>
                )}
                {line && (
                  <div>
                    <span className="text-gray-500">产线：</span>
                    <span className="font-medium">{line.name}</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-500">开始时间：</span>
                  <span className="font-medium">
                    {format(task.start, 'yyyy-MM-dd HH:mm')}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">结束时间：</span>
                  <span className="font-medium">
                    {format(task.end, 'yyyy-MM-dd HH:mm')}
                  </span>
                </div>
                {(task as any).isForecast && (
                  <span className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                    预测数据
                  </span>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default GanttChart;