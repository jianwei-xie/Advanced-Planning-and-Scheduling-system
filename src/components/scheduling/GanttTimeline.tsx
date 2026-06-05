import React from 'react';
import { addDays, format, parseISO, startOfDay, differenceInDays } from 'date-fns';
import type { SystemSettings } from '../../types';

interface GanttTimelineProps {
  startDate: Date;
  endDate: Date;
  viewMode: 'day' | 'week';
  settings: SystemSettings;
}

// 班次信息
const SHIFTS = [
  { name: '早班', hours: '8:00-12:00' },
  { name: '中班', hours: '13:00-18:00' },
];

export const GanttTimeline: React.FC<GanttTimelineProps> = ({
  startDate,
  endDate,
  viewMode,
  settings,
}) => {
  const { workingHoursStart, workingHoursEnd } = settings;

  // 生成日期列表
  const generateDates = () => {
    const dates: Date[] = [];
    let current = startOfDay(startDate);
    const end = startOfDay(endDate);

    while (current <= end) {
      dates.push(new Date(current));
      current = addDays(current, 1);
    }

    return dates;
  };

  const dates = generateDates();

  // 判断日期是否为预测区域（第6-10天）
  const isForecastDate = (date: Date): boolean => {
    const today = startOfDay(new Date());
    const diff = differenceInDays(date, today);
    return diff > 5 && diff <= 10;
  };

  // 获取星期几的中文名称
  const getWeekDayName = (date: Date): string => {
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return weekDays[date.getDay()];
  };

  if (viewMode === 'week') {
    // 周视图：只显示日期
    return (
      <div className="flex border-b border-gray-200 bg-gray-50">
        <div className="w-48 shrink-0 border-r border-gray-200 px-2 py-2">
          <span className="text-xs text-gray-500">产线</span>
        </div>
        <div className="flex flex-1 overflow-x-auto">
          {dates.map((date, index) => (
            <div
              key={index}
              className={`flex-shrink-0 border-r border-gray-200 px-2 py-2 text-center ${
                isForecastDate(date) ? 'bg-blue-50' : ''
              }`}
              style={{ width: '120px' }}
            >
              <div className="text-xs font-medium text-gray-900">
                {format(date, 'MM-dd')}
              </div>
              <div className="text-xs text-gray-500">{getWeekDayName(date)}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 日视图：显示日期和班次
  return (
    <div className="border-b border-gray-200 bg-gray-50">
      {/* 日期行 */}
      <div className="flex">
        <div className="w-48 shrink-0 border-r border-gray-200 px-2 py-2">
          <span className="text-xs text-gray-500">产线</span>
        </div>
        <div className="flex flex-1 overflow-x-auto">
          {dates.map((date, index) => (
            <div
              key={index}
              className={`flex-shrink-0 border-r border-gray-200 px-2 py-2 text-center ${
                isForecastDate(date) ? 'bg-blue-50' : ''
              }`}
              style={{ width: '160px' }}
            >
              <div className="text-xs font-medium text-gray-900">
                {format(date, 'MM-dd')}
              </div>
              <div className="text-xs text-gray-500">{getWeekDayName(date)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 班次行 */}
      <div className="flex">
        <div className="w-48 shrink-0 border-r border-gray-200 px-2 py-1">
          <span className="text-xs text-gray-400">班次</span>
        </div>
        <div className="flex flex-1 overflow-x-auto">
          {dates.map((date, index) => (
            <div
              key={index}
              className={`flex shrink-0 border-r border-gray-200 ${
                isForecastDate(date) ? 'bg-blue-50' : ''
              }`}
              style={{ width: '160px' }}
            >
              {SHIFTS.map((shift, shiftIndex) => (
                <div
                  key={shiftIndex}
                  className="flex-1 px-1 py-1 text-center text-xs text-gray-500"
                >
                  {shift.name}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};