// 产线状态
export type ProductionLineStatus = 'active' | 'maintenance';

// 产线数据
export interface ProductionLine {
  id: string;
  name: string;
  capabilities: string[];
  status: ProductionLineStatus;
  loadCapacity: number;
  createdAt: string;
}

// 工序
export interface Process {
  sequence: number;
  name: string;
  requiredCapability: string;
  standardHours: number;
}

// 产品数据
export interface Product {
  id: string;
  name: string;
  processes: Process[];
  createdAt: string;
}

// 订单状态
export type OrderStatus = 'pending' | 'scheduled' | 'completed';

// 订单数据
export interface Order {
  id: string;
  productId: string;
  quantity: number;
  dueDate: string;
  priority: 1 | 2 | 3 | 4 | 5;
  status: OrderStatus;
  createdAt: string;
}

// 排程结果数据
export interface ScheduleResult {
  id: string;
  orderId: string;
  productId: string;
  productionLineId: string;
  processName: string;
  startTime: string;
  endTime: string;
  quantity: number;
  isForecast: boolean;
}

// 物料需求状态
export type MaterialRequirementStatus = 'sufficient' | 'low' | 'critical';

// 物料需求数据
export interface MaterialRequirement {
  id: string;
  materialName: string;
  materialCode: string;
  requiredDate: string;
  quantity: number;
  currentStock: number;
  safetyStock: number;
  replenishmentZone: [number, number];
  status: MaterialRequirementStatus;
}

// 系统设置
export interface SystemSettings {
  workingHoursStart: number;
  workingHoursEnd: number;
  weights: {
    makespan: number;
    priority: number;
    loadBalance: number;
    delivery: number;
  };
  forecastDays: number;
  actualDays: number;
}
