import { ProductionLine, Product, Order, MaterialRequirement } from '../types';

// 辅助函数：计算基于今天的日期
const getDateFromNow = (daysToAdd: number): string => {
  const date = new Date('2026-06-04');
  date.setDate(date.getDate() + daysToAdd);
  return date.toISOString().split('T')[0];
};

// 默认产线数据（5条）
export const defaultProductionLines: ProductionLine[] = [
  {
    id: 'PL001',
    name: '冲压线A',
    capabilities: ['下料', '冲压', '折弯'],
    status: 'active',
    loadCapacity: 8,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'PL002',
    name: '冲压线B',
    capabilities: ['下料', '冲压'],
    status: 'active',
    loadCapacity: 8,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'PL003',
    name: '焊接线',
    capabilities: ['点焊', '弧焊', '铆接'],
    status: 'active',
    loadCapacity: 8,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'PL004',
    name: '喷涂线',
    capabilities: ['喷涂', '烘干'],
    status: 'active',
    loadCapacity: 8,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'PL005',
    name: '组装线',
    capabilities: ['组装', '包装'],
    status: 'active',
    loadCapacity: 8,
    createdAt: new Date().toISOString(),
  },
];

// 默认产品数据（3种）
export const defaultProducts: Product[] = [
  {
    id: 'P001',
    name: '产品A',
    processes: [
      { sequence: 1, name: '下料', requiredCapability: '下料', standardHours: 0.5 },
      { sequence: 2, name: '冲压', requiredCapability: '冲压', standardHours: 1 },
      { sequence: 3, name: '喷涂', requiredCapability: '喷涂', standardHours: 0.8 },
      { sequence: 4, name: '组装', requiredCapability: '组装', standardHours: 0.5 },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'P002',
    name: '产品B',
    processes: [
      { sequence: 1, name: '下料', requiredCapability: '下料', standardHours: 0.4 },
      { sequence: 2, name: '冲压', requiredCapability: '冲压', standardHours: 0.8 },
      { sequence: 3, name: '折弯', requiredCapability: '折弯', standardHours: 0.6 },
      { sequence: 4, name: '点焊', requiredCapability: '点焊', standardHours: 1 },
      { sequence: 5, name: '组装', requiredCapability: '组装', standardHours: 0.5 },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'P003',
    name: '产品C',
    processes: [
      { sequence: 1, name: '下料', requiredCapability: '下料', standardHours: 0.3 },
      { sequence: 2, name: '弧焊', requiredCapability: '弧焊', standardHours: 1.2 },
      { sequence: 3, name: '喷涂', requiredCapability: '喷涂', standardHours: 0.7 },
      { sequence: 4, name: '烘干', requiredCapability: '烘干', standardHours: 0.5 },
      { sequence: 5, name: '包装', requiredCapability: '包装', standardHours: 0.3 },
    ],
    createdAt: new Date().toISOString(),
  },
];

// 默认订单数据（8个）- 交期基于2026-06-04
export const defaultOrders: Order[] = [
  {
    id: 'ORD001',
    productId: 'P001',
    quantity: 100,
    dueDate: getDateFromNow(5),
    priority: 1,
    status: 'pending',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ORD002',
    productId: 'P002',
    quantity: 80,
    dueDate: getDateFromNow(7),
    priority: 2,
    status: 'pending',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ORD003',
    productId: 'P003',
    quantity: 120,
    dueDate: getDateFromNow(3),
    priority: 1,
    status: 'pending',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ORD004',
    productId: 'P001',
    quantity: 60,
    dueDate: getDateFromNow(10),
    priority: 3,
    status: 'pending',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ORD005',
    productId: 'P002',
    quantity: 90,
    dueDate: getDateFromNow(5),
    priority: 2,
    status: 'pending',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ORD006',
    productId: 'P003',
    quantity: 50,
    dueDate: getDateFromNow(14),
    priority: 4,
    status: 'pending',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ORD007',
    productId: 'P001',
    quantity: 150,
    dueDate: getDateFromNow(7),
    priority: 1,
    status: 'pending',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ORD008',
    productId: 'P002',
    quantity: 70,
    dueDate: getDateFromNow(12),
    priority: 3,
    status: 'pending',
    createdAt: new Date().toISOString(),
  },
];

// 默认物料数据（6种）
export const defaultMaterials: MaterialRequirement[] = [
  {
    id: 'MAT001',
    materialName: '钢板A',
    materialCode: 'MAT001',
    currentStock: 500,
    safetyStock: 200,
    replenishmentZone: [300, 600],
    status: 'sufficient',
    requiredDate: '',
    quantity: 0,
  },
  {
    id: 'MAT002',
    materialName: '钢管B',
    materialCode: 'MAT002',
    currentStock: 180,
    safetyStock: 150,
    replenishmentZone: [200, 400],
    status: 'low',
    requiredDate: getDateFromNow(3),
    quantity: 100,
  },
  {
    id: 'MAT003',
    materialName: '铝板C',
    materialCode: 'MAT003',
    currentStock: 80,
    safetyStock: 100,
    replenishmentZone: [150, 300],
    status: 'critical',
    requiredDate: getDateFromNow(1),
    quantity: 150,
  },
  {
    id: 'MAT004',
    materialName: '铜材D',
    materialCode: 'MAT004',
    currentStock: 350,
    safetyStock: 200,
    replenishmentZone: [250, 500],
    status: 'sufficient',
    requiredDate: '',
    quantity: 0,
  },
  {
    id: 'MAT005',
    materialName: '塑料粒子E',
    materialCode: 'MAT005',
    currentStock: 120,
    safetyStock: 150,
    replenishmentZone: [200, 400],
    status: 'low',
    requiredDate: getDateFromNow(5),
    quantity: 200,
  },
  {
    id: 'MAT006',
    materialName: '紧固件F',
    materialCode: 'MAT006',
    currentStock: 800,
    safetyStock: 300,
    replenishmentZone: [400, 700],
    status: 'sufficient',
    requiredDate: '',
    quantity: 0,
  },
];

// 默认系统设置
export const defaultSettings = {
  workingHoursStart: 8,
  workingHoursEnd: 18,
  weights: {
    makespan: 0.3,
    priority: 0.3,
    loadBalance: 0.2,
    delivery: 0.2,
  },
  forecastDays: 14,
  actualDays: 7,
};
