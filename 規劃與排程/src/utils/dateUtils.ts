import { format, addDays, isWeekend, parseISO, differenceInHours, setHours, setMinutes, isBefore, isAfter, startOfDay, endOfDay, eachDayOfInterval, isSameDay } from 'date-fns';
import type { SystemSettings } from '../types';

// 工作时间配置（可从设置中获取）
const DEFAULT_WORK_START = 8;
const DEFAULT_WORK_END = 18;

// 判断是否为工作日
export function isWorkday(date: Date): boolean {
  return !isWeekend(date);
}

// 获取下一个工作日
export function getNextWorkday(date: Date): Date {
  let nextDay = addDays(date, 1);
  while (!isWorkday(nextDay)) {
    nextDay = addDays(nextDay, 1);
  }
  return nextDay;
}

// 按工作日递增日期
export function addWorkdays(date: Date, days: number): Date {
  let result = new Date(date);
  let addedDays = 0;

  while (addedDays < days) {
    result = addDays(result, 1);
    if (isWorkday(result)) {
      addedDays++;
    }
  }

  return result;
}

// 格式化日期为友好格式
export function formatDateFriendly(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  const monthDay = format(d, 'MM-dd');
  const weekDay = getWeekDayName(d);
  return `${monthDay} ${weekDay}`;
}

// 格式化日期为完整格式
export function formatDateFull(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  const dateStr = format(d, 'yyyy-MM-dd');
  const weekDay = getWeekDayName(d);
  const timeStr = format(d, 'HH:mm');
  return `${dateStr} ${weekDay} ${timeStr}`;
}

// 获取星期几的中文名称
function getWeekDayName(date: Date): string {
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return weekDays[date.getDay()];
}

// 判断是否在未来5天内
export function isWithinFiveDays(date: Date, currentDate: Date): boolean {
  const diffTime = date.getTime() - currentDate.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= 5;
}

// 判断是否在第6-10天（预测区间）
export function isInForecastPeriod(date: Date, currentDate: Date): boolean {
  const diffTime = date.getTime() - currentDate.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return diffDays > 5 && diffDays <= 10;
}

// 计算工序完工时间
export function calculateEndTime(
  startTime: Date,
  standardHours: number,
  quantity: number,
  settings: SystemSettings
): Date {
  const totalHours = standardHours * quantity;
  const { workingHoursStart, workingHoursEnd } = settings;
  const workDayHours = workingHoursEnd - workingHoursStart;

  // 计算所需的工作天数
  const fullWorkDays = Math.floor(totalHours / workDayHours);
  const remainingHours = totalHours % workDayHours;

  let result = new Date(startTime);

  // 添加完整的工作天数
  for (let i = 0; i < fullWorkDays; i++) {
    result = addWorkdays(result, 1);
  }

  // 设置开始时间为工作开始时间
  result = setHours(result, workingHoursStart);
  result = setMinutes(result, 0);

  // 如果有剩余小时数，需要继续计算
  if (remainingHours > 0) {
    const endHour = workingHoursStart + remainingHours;
    if (endHour > workingHoursEnd) {
      // 超过当天工作时间，需要到第二天
      result = addWorkdays(result, 1);
      result = setHours(result, workingHoursStart + (remainingHours - workDayHours));
    } else {
      result = setHours(result, Math.floor(endHour));
    }
    result = setMinutes(result, 0);
  }

  return result;
}

// 获取日期范围内的工作小时数
export function getWorkingHoursBetween(
  start: Date,
  end: Date,
  settings: SystemSettings
): number {
  const { workingHoursStart, workingHoursEnd } = settings;
  const workDayHours = workingHoursEnd - workingHoursStart;

  const startDay = startOfDay(start);
  const endDay = endOfDay(end);

  const days = eachDayOfInterval({ start: startDay, end: endDay });

  let totalHours = 0;

  for (const day of days) {
    if (isWorkday(day)) {
      const dayStart = setHours(day, workingHoursStart);
      const dayEnd = setHours(day, workingHoursEnd);

      // 计算重叠部分
      const effectiveStart = isBefore(start, dayStart) ? dayStart : start;
      const effectiveEnd = isAfter(end, dayEnd) ? dayEnd : end;

      if (isBefore(effectiveStart, effectiveEnd) || isSameDay(effectiveStart, effectiveEnd)) {
        const hours = differenceInHours(effectiveEnd, effectiveStart);
        totalHours += Math.max(0, hours);
      }
    }
  }

  return totalHours;
}
