import * as XLSX from 'xlsx';
import type {
  ScheduleResult,
  Order,
  Product,
  ProductionLine,
  MaterialRequirement,
} from '../types';

// 通用导出函数
function createAndDownloadWorkbook(
  data: any[],
  filename: string,
  sheetName: string = 'Sheet1'
): void {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();

  // 自动列宽
  const colWidths = Object.keys(data[0] || {}).map((key) => {
    let maxLen = key.length;
    data.forEach((row) => {
      const cellValue = row[key];
      if (cellValue != null) {
        const cellLen = String(cellValue).length;
        if (cellLen > maxLen) maxLen = cellLen;
      }
    });
    return { wch: Math.min(maxLen + 2, 50) };
  });
  worksheet['!cols'] = colWidths;

  // 冻结首行
  worksheet['!freeze'] = { xSplit: 0, ySplit: 1 };

  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filename);
}

// 排程结果导出
export function exportScheduleResults(
  scheduleResults: ScheduleResult[],
  orders: Order[],
  products: Product[],
  productionLines: ProductionLine[]
): void {
  const orderMap = new Map(orders.map((o) => [o.id, o]));
  const productMap = new Map(products.map((p) => [p.id, p]));
  const lineMap = new Map(productionLines.map((l) => [l.id, l]));

  const data = scheduleResults.map((result) => {
    const order = orderMap.get(result.orderId);
    const product = productMap.get(result.productId);
    const line = lineMap.get(result.productionLineId);

    return {
      工序名称: result.processName,
      订单ID: result.orderId,
      产品名称: product?.name ?? '',
      产线名称: line?.name ?? '',
      开始时间: result.startTime,
      结束时间: result.endTime,
      数量: result.quantity,
      是否预测: result.isForecast ? '是' : '否',
    };
  });

  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  createAndDownloadWorkbook(data, `排程结果_${date}.xlsx`, '排程结果');
}

// 物料需求导出
export function exportMaterialRequirements(
  materialRequirements: MaterialRequirement[]
): void {
  const data = materialRequirements.map((mr) => ({
    物料编码: mr.materialCode,
    物料名称: mr.materialName,
    需求日期: mr.requiredDate,
    需求数量: mr.quantity,
    当前库存: mr.currentStock,
    安全库存: mr.safetyStock,
    状态: mr.status === 'sufficient' ? '充足' : mr.status === 'low' ? '偏低' : '紧急',
  }));

  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  createAndDownloadWorkbook(data, `物料需求_${date}.xlsx`, '物料需求');
}

// 订单数据导出
export function exportOrders(orders: Order[], products: Product[]): void {
  const productMap = new Map(products.map((p) => [p.id, p]));

  const data = orders.map((order) => {
    const product = productMap.get(order.productId);

    return {
      订单ID: order.id,
      产品名称: product?.name ?? '',
      数量: order.quantity,
      交期: order.dueDate,
      优先级: order.priority,
      状态: order.status === 'pending' ? '待排程' : order.status === 'scheduled' ? '已排程' : '已完成',
      创建时间: order.createdAt,
    };
  });

  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  createAndDownloadWorkbook(data, `订单数据_${date}.xlsx`, '订单数据');
}

// 产线数据导出
export function exportProductionLines(productionLines: ProductionLine[]): void {
  const data = productionLines.map((line) => ({
    产线ID: line.id,
    产线名称: line.name,
    能力列表: line.capabilities.join(', '),
    状态: line.status === 'active' ? '运行中' : '维护中',
    日产能: line.loadCapacity,
    创建时间: line.createdAt,
  }));

  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  createAndDownloadWorkbook(data, `产线数据_${date}.xlsx`, '产线数据');
}
