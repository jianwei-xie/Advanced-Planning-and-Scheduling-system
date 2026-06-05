import type { Order, ProductionLine, Product, ScheduleResult, SystemSettings } from '../types';

/**
 * FJSP（柔性作业车间调度）排程算法
 * 
 * 硬约束：
 * 1. 工序能力约束：每道工序只能分配给具备该工序能力的产线
 * 2. 工序顺序约束：同一产品的工序必须严格按顺序执行
 * 3. 资源独占约束：同一产线同一时间只能加工一个工序
 * 4. 工序连续性约束：工序一旦开工不可中断
 * 5. 时间窗口约束：仅对未来5天进行实际排程，第6-10天仅做预测
 * 
 * 优化目标（带权重可调）：
 * 1. 最小化最大完工时间 (Makespan)
 * 2. 优先完成高优先级订单
 * 3. 均衡各产线负荷
 * 4. 最小化订单拖期
 */

// ==================== 类型定义 ====================

/** 产线调度状态 */
interface ProductionLineScheduleState {
  lineId: string;
  nextAvailableTime: Date;  // 产线下一次可用时间
  currentLoad: number;       // 当前负荷（已排程工时）
}

/** 订单排程上下文 */
interface OrderSchedulingContext {
  order: Order;
  product: Product;
  availableDate: Date;      // 订单可用开始时间（受前置工序影响）
  scheduledTasks: ScheduleResult[];
  lineStates: Map<string, ProductionLineScheduleState>;
}

// ==================== 工具函数 ====================

/**
 * 解析日期字符串为 Date 对象
 */
function parseDate(dateStr: string): Date {
  return new Date(dateStr);
}

/**
 * 判断两个日期是否为同一工作日
 */
function isSameWorkday(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

/**
 * 获取下一个工作日（跳过非工作时间）
 * @param date 当前日期
 * @param workStart 工作开始时间（小时）
 * @param workEnd 工作结束时间（小时）
 */
function getNextWorkday(date: Date, workStart: number, workEnd: number): Date {
  const result = new Date(date);
  result.setHours(workStart, 0, 0, 0);
  
  // 如果当前时间已超过工作结束时间，转到下一个工作日
  if (date.getHours() >= workEnd) {
    result.setDate(result.getDate() + 1);
  }
  
  return result;
}

/**
 * 计算工序实际加工时长
 * @param standardHours 标准工时
 * @param quantity 订单数量
 */
function calculateProcessDuration(standardHours: number, quantity: number): number {
  return standardHours * quantity;
}

/**
 * 计算工序结束时间（考虑工作时间段）
 * @param startTime 开始时间
 * @param durationMinutes 持续时长（分钟）
 * @param workStart 工作开始时间（小时）
 * @param workEnd 工作结束时间（小时）
 */
function calculateEndTime(
  startTime: Date, 
  durationMinutes: number,
  workStart: number,
  workEnd: number
): Date {
  const endTime = new Date(startTime);
  const msPerDay = 24 * 60 * 60 * 1000;
  const workMsPerDay = (workEnd - workStart) * 60 * 60 * 1000;
  
  // 计算总工作时长（毫秒）
  let remainingMs = durationMinutes * 60 * 1000;
  
  // 如果开始时间不在工作时间内，调整到下一个工作日开始
  const startHour = startTime.getHours();
  if (startHour < workStart) {
    endTime.setHours(workStart, 0, 0, 0);
    remainingMs = durationMinutes * 60 * 1000;
  } else if (startHour >= workEnd) {
    endTime.setDate(endTime.getDate() + 1);
    endTime.setHours(workStart, 0, 0, 0);
    remainingMs = durationMinutes * 60 * 1000;
  }
  
  // 计算需要跨越的工作日数
  const currentWorkEnd = new Date(endTime);
  currentWorkEnd.setHours(workEnd, 0, 0, 0);
  const workRemainingToday = currentWorkEnd.getTime() - endTime.getTime();
  
  if (remainingMs <= workRemainingToday) {
    // 当天可以完成
    endTime.setTime(endTime.getTime() + remainingMs);
  } else {
    // 需要跨越到其他工作日
    remainingMs -= workRemainingToday;
    const fullWorkDays = Math.floor(remainingMs / workMsPerDay);
    remainingMs = remainingMs % workMsPerDay;
    
    endTime.setDate(endTime.getDate() + 1 + fullWorkDays);
    endTime.setHours(workStart, 0, 0, 0);
    endTime.setTime(endTime.getTime() + remainingMs);
  }
  
  return endTime;
}

/**
 * 判断时间是否在未来N天内
 * @param targetTime 目标时间
 * @param currentDate 当前时间
 * @param days 天数
 */
function isWithinDays(targetTime: Date, currentDate: Date, days: number): boolean {
  const msPerDay = 24 * 60 * 60 * 1000;
  const diffMs = targetTime.getTime() - currentDate.getTime();
  return diffMs >= 0 && diffMs <= days * msPerDay;
}

/**
 * 获取日期字符串（格式：YYYY-MM-DD）
 */
function getDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * 生成唯一ID
 */
function generateId(): string {
  return `sch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ==================== 核心算法函数 ====================

/**
 * 选择最佳产线
 * 选择标准：最早可用时间 + 当前负荷权重
 * 
 * @param capableLines 具备该工序能力的产线列表
 * @param availableDate 订单可用日期
 * @param lineStates 产线调度状态映射
 * @param weights 权重设置
 */
function selectBestLine(
  capableLines: ProductionLine[],
  availableDate: Date,
  lineStates: Map<string, ProductionLineScheduleState>,
  weights: SystemSettings['weights']
): ProductionLine | null {
  if (capableLines.length === 0) return null;
  
  // 计算每条产线的评分：最早可用时间 + 当前负荷 * 负荷权重系数
  // 负荷权重系数用于平衡各产线负荷
  const loadWeightFactor = 0.1 * (weights.loadBalance / 10);
  
  let bestLine: ProductionLine | null = null;
  let bestScore = Infinity;
  
  for (const line of capableLines) {
    const state = lineStates.get(line.id);
    if (!state) continue;
    
    // 计算该产线从 availableDate 开始的最早可用时间
    let earliestStart = state.nextAvailableTime;
    if (earliestStart < availableDate) {
      earliestStart = availableDate;
    }
    
    // 评分公式：最早可用时间 + 当前负荷 * 负荷权重
    const score = earliestStart.getTime() + (state.currentLoad * loadWeightFactor * 60 * 60 * 1000);
    
    if (score < bestScore) {
      bestScore = score;
      bestLine = line;
    }
  }
  
  return bestLine;
}

/**
 * 按优先级和交期排序订单
 * 优先级数值越小优先级越高，交期越早越优先
 * 
 * @param orders 订单列表
 */
function sortOrders(orders: Order[]): Order[] {
  return [...orders].sort((a, b) => {
    // 首先按优先级排序（1 最高）
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    // 优先级相同则按交期排序
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });
}

/**
 * 调度单个订单的所有工序
 * 
 * @param context 订单调度上下文
 * @param productionLines 所有产线
 * @param settings 系统设置
 */
function scheduleOrderProcesses(
  context: OrderSchedulingContext,
  productionLines: ProductionLine[],
  settings: SystemSettings
): void {
  const { order, product, availableDate, scheduledTasks, lineStates } = context;
  const { workingHoursStart, workingHoursEnd, weights, actualDays } = settings;
  
  // 工序必须严格按 sequence 顺序执行
  const sortedProcesses = [...product.processes].sort((a, b) => a.sequence - b.sequence);
  
  // 当前工序可开始时间（受前置工序影响）
  let currentAvailableDate = new Date(availableDate);
  
  for (const process of sortedProcesses) {
    // ========== 步骤1：找到具备该工序能力的产线 ==========
    // 硬约束1：工序能力约束
    const capableLines = productionLines.filter(line =>
      line.capabilities.includes(process.requiredCapability) &&
      line.status === 'active'
    );
    
    if (capableLines.length === 0) {
      // 没有产线具备该能力，记录警告（实际生产中可能需要特殊处理）
      console.warn(`警告：没有产线具备工序 [${process.name}] 的能力`);
      continue;
    }
    
    // ========== 步骤2：选择最佳产线 ==========
    // 优化目标3：考虑负荷均衡
    const selectedLine = selectBestLine(capableLines, currentAvailableDate, lineStates, weights);
    
    if (!selectedLine) {
      console.warn(`警告：无法为工序 [${process.name}] 选择产线`);
      continue;
    }
    
    // ========== 步骤3：计算工序时间窗口 ==========
    // 硬约束3：资源独占约束
    const lineState = lineStates.get(selectedLine.id)!;
    
    // 开始时间为订单可用时间和产线可用时间的最大值
    const startTime = currentAvailableDate > lineState.nextAvailableTime
      ? new Date(currentAvailableDate)
      : new Date(lineState.nextAvailableTime);
    
    // 计算工序持续时长（标准工时 × 数量）
    const durationMinutes = calculateProcessDuration(process.standardHours, order.quantity);
    
    // 计算结束时间（考虑工作时间段）
    const endTime = calculateEndTime(startTime, durationMinutes, workingHoursStart, workingHoursEnd);
    
    // ========== 步骤4：判断是否在实际排程窗口内 ==========
    // 硬约束5：时间窗口约束（实际排程 vs 预测）
    const currentDate = new Date();
    const isForecast = !isWithinDays(endTime, currentDate, actualDays);
    
    // ========== 步骤5：创建排程结果 ==========
    const task: ScheduleResult = {
      id: generateId(),
      orderId: order.id,
      productId: order.productId,
      productionLineId: selectedLine.id,
      processName: process.name,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      quantity: order.quantity,
      isForecast
    };
    
    scheduledTasks.push(task);
    
    // ========== 步骤6：更新产线状态 ==========
    // 更新产线的下一次可用时间和当前负荷
    lineState.nextAvailableTime = endTime;
    lineState.currentLoad += durationMinutes / 60; // 转换为小时
    
    // ========== 步骤7：更新订单后续工序的可用时间 ==========
    // 硬约束2：工序顺序约束
    currentAvailableDate = new Date(endTime);
  }
}

// ==================== 主调度函数 ====================

/**
 * FJSP 排程算法主入口
 * 
 * @param orders 待排程订单列表
 * @param productionLines 产线列表
 * @param products 产品列表
 * @param settings 系统设置
 * @returns 排程结果列表
 */
export function runScheduling(
  orders: Order[],
  productionLines: ProductionLine[],
  products: Product[],
  settings: SystemSettings
): ScheduleResult[] {
  // ========== 阶段准备 ==========
  const currentDate = new Date();
  const scheduledTasks: ScheduleResult[] = [];
  
  // 初始化产线调度状态
  const lineStates = new Map<string, ProductionLineScheduleState>();
  for (const line of productionLines) {
    lineStates.set(line.id, {
      lineId: line.id,
      nextAvailableTime: currentDate, // 初始可用时间为当前时间
      currentLoad: 0 // 初始负荷为0
    });
  }
  
  // ========== 步骤1：按优先级和交期排序订单 ==========
  // 优化目标2：优先完成高优先级订单
  const sortedOrders = sortOrders(orders);
  
  // ========== 步骤2：遍历每个订单进行排程 ==========
  for (const order of sortedOrders) {
    // 跳过已完成的订单
    if (order.status === 'completed') continue;
    
    // 查找订单对应的产品
    const product = products.find(p => p.id === order.productId);
    if (!product) {
      console.warn(`警告：找不到订单 ${order.id} 对应的产品`);
      continue;
    }
    
    // 构建订单调度上下文
    const context: OrderSchedulingContext = {
      order,
      product,
      availableDate: currentDate, // 订单从当前时间开始可用
      scheduledTasks,
      lineStates
    };
    
    // 调度该订单的所有工序
    scheduleOrderProcesses(context, productionLines, settings);
  }
  
  // ========== 后处理：计算并记录关键指标 ==========
  // 这些指标可用于评估排程效果和进一步优化
  
  // 计算Makespan（最大完工时间）
  let makespan = 0;
  for (const task of scheduledTasks) {
    const endTime = new Date(task.endTime).getTime();
    if (endTime > makespan) {
      makespan = endTime;
    }
  }
  
  // 计算各产线负荷
  const lineLoads = new Map<string, number>();
  for (const task of scheduledTasks) {
    const current = lineLoads.get(task.productionLineId) || 0;
    const duration = (new Date(task.endTime).getTime() - new Date(task.startTime).getTime())) / (60 * 60 * 1000);
    lineLoads.set(task.productionLineId, current + duration);
  }
  
  // 按时间排序最终结果
  scheduledTasks.sort((a, b) => 
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );
  
  // 记录排程统计信息（可在调试时查看）
  console.log('=== FJSP排程完成 ===');
  console.log(`总排程任务数: ${scheduledTasks.length}`);
  console.log(`实际排程任务数: ${scheduledTasks.filter(t => !t.isForecast).length}`);
  console.log(`预测任务数: ${scheduledTasks.filter(t => t.isForecast).length}`);
  console.log(`Makespan: ${new Date(makespan).toISOString()}`);
  console.log('各产线负荷:', Object.fromEntries(lineLoads));
  
  return scheduledTasks;
}

// ==================== 辅助函数（供外部调用） ====================

/**
 * 获取产线负荷信息
 */
export function getLineLoadInfo(
  scheduledTasks: ScheduleResult[],
  productionLines: ProductionLine[]
): Map<string, { totalHours: number; taskCount: number }> {
  const loadInfo = new Map<string, { totalHours: number; taskCount: number }>();
  
  // 初始化
  for (const line of productionLines) {
    loadInfo.set(line.id, { totalHours: 0, taskCount: 0 });
  }
  
  // 统计
  for (const task of scheduledTasks) {
    const info = loadInfo.get(task.productionLineId);
    if (info) {
      const duration = (new Date(task.endTime).getTime() - new Date(task.startTime).getTime()) / (60 * 60 * 1000);
      info.totalHours += duration;
      info.taskCount += 1;
    }
  }
  
  return loadInfo;
}

/**
 * 计算订单拖期情况
 */
export function getOrderTardiness(
  scheduledTasks: ScheduleResult[],
  orders: Order[]
): Map<string, { dueDate: string; actualEndTime: string; tardinessHours: number }> {
  const tardinessMap = new Map<string, { dueDate: string; actualEndTime: string; tardinessHours: number }>();
  
  // 找出每个订单的最后完工时间
  for (const order of orders) {
    const orderTasks = scheduledTasks.filter(t => t.orderId === order.id);
    if (orderTasks.length === 0) continue;
    
    // 找出该订单的最晚结束时间
    let maxEndTime = '';
    for (const task of orderTasks) {
      if (task.endTime > maxEndTime) {
        maxEndTime = task.endTime;
      }
    }
    
    // 计算拖期
    const dueDate = new Date(order.dueDate);
    const actualEnd = new Date(maxEndTime);
    const diffMs = actualEnd.getTime() - dueDate.getTime();
    const tardinessHours = diffMs > 0 ? diffMs / (60 * 60 * 1000) : 0;
    
    tardinessMap.set(order.id, {
      dueDate: order.dueDate,
      actualEndTime: maxEndTime,
      tardinessHours
    });
  }
  
  return tardinessMap;
}
