/**
 * 物料需求计算模块
 * 
 * 基于排程结果计算物料需求，包括：
 * - 根据排程任务计算物料的需求时间和数量
 * - 库存不足检测（与安全库存比较）
 * - 补货建议生成
 */

import type { ScheduleResult, MaterialRequirement, MaterialRequirementStatus } from '../types';

/**
 * 工序-物料映射配置
 * 
 * 定义每个工序对应的物料编码和单位产品消耗量
 * 格式：工序名称 -> { 物料编码, 单位消耗量 }
 */
const PROCESS_MATERIAL_MAP: Record<string, { code: string; consumptionPerUnit: number }> = {
  '下料': { code: 'MAT001', consumptionPerUnit: 1 },      // 每单位产品消耗1个单位物料
  '冲压': { code: 'MAT001', consumptionPerUnit: 0.5 },    // 每单位产品消耗0.5个单位物料
  '焊接': { code: 'MAT004', consumptionPerUnit: 0.2 },    // 每单位产品消耗0.2个单位物料
  '喷涂': { code: 'MAT003', consumptionPerUnit: 0.3 },     // 每单位产品消耗0.3个单位物料
  '组装': { code: 'MAT006', consumptionPerUnit: 2 },       // 每单位产品消耗2个单位物料
  '包装': { code: 'MAT005', consumptionPerUnit: 1 },      // 每单位产品消耗1个单位物料
  '折弯': { code: 'MAT002', consumptionPerUnit: 0.8 },     // 每单位产品消耗0.8个单位物料
  '烘干': { code: 'MAT003', consumptionPerUnit: 0.1 },     // 每单位产品消耗0.1个单位物料
};

/**
 * 根据工序名称获取对应的物料编码
 * 
 * @param processName - 工序名称
 * @returns 物料编码，如果工序不存在则返回 undefined
 */
function getMaterialCodeForProcess(processName: string): string | undefined {
  return PROCESS_MATERIAL_MAP[processName]?.code;
}

/**
 * 根据工序名称获取单位消耗量
 * 
 * @param processName - 工序名称
 * @returns 单位消耗量，如果工序不存在则返回 0
 */
function getConsumptionForProcess(processName: string): number {
  return PROCESS_MATERIAL_MAP[processName]?.consumptionPerUnit ?? 0;
}

/**
 * 根据当前库存和安全库存确定库存状态
 * 
 * 状态判定规则：
 * - critical: 当前库存 < 安全库存 * 0.5（严重不足）
 * - low: 当前库存 < 安全库存（偏低）
 * - sufficient: 当前库存 >= 安全库存（充足）
 * 
 * @param currentStock - 当前库存
 * @param safetyStock - 安全库存
 * @returns 库存状态
 */
function determineStatus(currentStock: number, safetyStock: number): MaterialRequirementStatus {
  if (currentStock < safetyStock * 0.5) {
    return 'critical';
  } else if (currentStock < safetyStock) {
    return 'low';
  }
  return 'sufficient';
}

/**
 * 计算单个排程任务的物料需求量
 * 
 * 根据任务的数量和工序的单位消耗量计算总需求
 * 
 * @param task - 排程任务
 * @param consumptionPerUnit - 单位产品消耗量
 * @returns 物料需求数量
 */
function calculateRequiredQuantity(task: ScheduleResult, consumptionPerUnit: number): number {
  return task.quantity * consumptionPerUnit;
}

/**
 * 根据物料编码查找物料信息
 * 
 * @param materialCode - 物料编码
 * @param materials - 物料列表
 * @returns 物料信息，如果未找到则返回 undefined
 */
function findMaterialByCode(
  materialCode: string,
  materials: MaterialRequirement[]
): MaterialRequirement | undefined {
  return materials.find(m => m.materialCode === materialCode);
}

/**
 * 生成唯一ID
 * 
 * @returns 唯一标识符
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 计算物料需求
 * 
 * 基于排程结果，计算每个任务的物料需求时间和数量，
 * 并结合当前库存情况确定库存状态
 * 
 * 算法流程：
 * 1. 遍历每个排程任务
 * 2. 根据工序名称查找对应的物料编码和消耗量
 * 3. 计算物料需求数量 = 任务数量 × 单位消耗量
 * 4. 获取物料的当前库存和安全库存
 * 5. 确定库存状态
 * 
 * @param scheduleResults - 排程结果列表
 * @param materials - 物料需求列表（包含库存信息）
 * @returns 物料需求列表
 * 
 * @example
 * ```typescript
 * const scheduleResults = [{
 *   id: 'task1',
 *   orderId: 'order1',
 *   productId: 'product1',
 *   productionLineId: 'line1',
 *   processName: '下料',
 *   startTime: '2024-01-01T08:00:00',
 *   endTime: '2024-01-01T12:00:00',
 *   quantity: 100,
 *   isForecast: false
 * }];
 * 
 * const materials = [{
 *   id: 'mat1',
 *   materialName: '钢材',
 *   materialCode: 'MAT001',
 *   requiredDate: '',
 *   quantity: 0,
 *   currentStock: 50,
 *   safetyStock: 100,
 *   replenishmentZone: [80, 120],
 *   status: 'sufficient'
 * }];
 * 
 * const requirements = calculateMaterialRequirements(scheduleResults, materials);
 * ```
 */
export function calculateMaterialRequirements(
  scheduleResults: ScheduleResult[],
  materials: MaterialRequirement[]
): MaterialRequirement[] {
  const requirements: MaterialRequirement[] = [];

  // 遍历每个排程任务
  for (const task of scheduleResults) {
    // 根据工序名称获取对应的物料编码
    const materialCode = getMaterialCodeForProcess(task.processName);
    
    if (!materialCode) {
      // 如果工序没有对应的物料映射，跳过该任务
      continue;
    }

    // 查找物料信息
    const material = findMaterialByCode(materialCode, materials);
    
    if (!material) {
      // 如果物料信息不存在，跳过该任务
      continue;
    }

    // 获取单位消耗量
    const consumptionPerUnit = getConsumptionForProcess(task.processName);
    
    // 计算物料需求数量
    const requiredQuantity = calculateRequiredQuantity(task, consumptionPerUnit);

    // 确定库存状态
    const status = determineStatus(material.currentStock, material.safetyStock);

    // 创建物料需求记录
    const requirement: MaterialRequirement = {
      id: generateId(),
      materialName: material.materialName,
      materialCode: material.materialCode,
      requiredDate: task.startTime,
      quantity: requiredQuantity,
      currentStock: material.currentStock,
      safetyStock: material.safetyStock,
      replenishmentZone: material.replenishmentZone,
      status: status
    };

    requirements.push(requirement);
  }

  return requirements;
}

/**
 * 生成补货建议
 * 
 * 从物料需求列表中筛选出需要补货的物料（状态为 low 或 critical）
 * 并生成补货建议
 * 
 * 筛选条件：
 * - 库存状态为 'low'（库存偏低）
 * - 库存状态为 'critical'（库存严重不足）
 * 
 * @param materialRequirements - 物料需求列表
 * @returns 需要补货的物料列表
 * 
 * @example
 * ```typescript
 * const requirements = [{
 *   id: 'req1',
 *   materialName: '钢材',
 *   materialCode: 'MAT001',
 *   requiredDate: '2024-01-01T08:00:00',
 *   quantity: 100,
 *   currentStock: 30,
 *   safetyStock: 100,
 *   replenishmentZone: [80, 120],
 *   status: 'critical'
 * }];
 * 
 * const suggestions = getReplenishmentSuggestions(requirements);
 * // 返回状态为 critical 或 low 的物料
 * ```
 */
export function getReplenishmentSuggestions(
  materialRequirements: MaterialRequirement[]
): MaterialRequirement[] {
  // 筛选出库存不足的物料（状态为 low 或 critical）
  return materialRequirements.filter(requirement => {
    return requirement.status === 'low' || requirement.status === 'critical';
  });
}
