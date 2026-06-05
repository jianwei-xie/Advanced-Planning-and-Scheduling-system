import React from 'react';
import type { Task, GanttTask as GanttTaskType } from 'gantt-task-react';
import type { Product } from '../../types';

// 产品颜色映射
export const PRODUCT_COLORS = [
  '#3B82F6', // 蓝色
  '#10B981', // 绿色
  '#F59E0B', // 橙色
  '#EF4444', // 红色
  '#8B5CF6', // 紫色
  '#EC4899', // 粉色
  '#06B6D4', // 青色
  '#84CC16', // 亮绿
  '#F97316', // 深橙
  '#6366F1', // 靛蓝
];

interface GanttTaskProps {
  task: GanttTaskType;
  productColors: Map<string, string>;
  onDragTask?: (task: Task, startDate: Date) => void;
}

export const GanttTask: React.FC<GanttTaskProps> = ({
  task,
  productColors,
}) => {
  // 获取产品的颜色
  const getTaskColor = (taskName: string): string => {
    // 从产品ID获取颜色
    const productId = (task as any).productId;
    if (productId && productColors.has(productId)) {
      return productColors.get(productId)!;
    }

    // 如果没有映射到产品，使用任务名称的哈希
    const colorIndex =
      taskName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) %
      PRODUCT_COLORS.length;
    return PRODUCT_COLORS[colorIndex];
  };

  const backgroundColor = task.styles?.backgroundColor || getTaskColor(task.name);
  const isForecast = (task as any).isForecast;

  return (
    <div
      className={`rounded px-2 py-1 text-xs font-medium text-white transition-all ${
        task.isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-move hover:shadow-md'
      }`}
      style={{
        backgroundColor,
        opacity: isForecast ? 0.6 : 1,
        minWidth: '60px',
      }}
    >
      <div className="truncate">{task.name}</div>
      {task.progress !== undefined && task.progress > 0 && (
        <div className="mt-1 h-1 w-full rounded bg-white/30">
          <div
            className="h-full rounded bg-white"
            style={{ width: `${task.progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

// 获取任务样式
export const getTaskStyles = (
  task: GanttTaskType,
  productColors: Map<string, string>
): GanttTaskType['styles'] => {
  const productId = (task as any).productId;
  const isForecast = (task as any).isForecast;

  let backgroundColor = task.styles?.backgroundColor;

  if (!backgroundColor) {
    if (productId && productColors.has(productId)) {
      backgroundColor = productColors.get(productId)!;
    } else {
      const colorIndex =
        task.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) %
        PRODUCT_COLORS.length;
      backgroundColor = PRODUCT_COLORS[colorIndex];
    }
  }

  return {
    backgroundColor: isForecast ? `${backgroundColor}99` : backgroundColor,
    backgroundSelectedColor: '#1E40AF',
    progressColor: '#ffffff40',
    progressSelectedColor: '#ffffff60',
    ...task.styles,
  };
};

export default GanttTask;