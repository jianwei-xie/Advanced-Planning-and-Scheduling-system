import React, { useState } from 'react';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { Card } from '../common/Card';
import { FormInput } from '../common/FormInput';
import { FormSelect } from '../common/FormSelect';
import { 
  useOrderStore, 
  useProductionLineStore, 
  useProductStore, 
  useSettingsStore,
  useScheduleStore,
  useReplenishmentStore
} from '../../stores';
import { runScheduling, calculateMaterialRequirements } from '../../algorithms';
import { 
  exportScheduleResults, 
  exportMaterialRequirements, 
  exportOrders, 
  exportProductionLines 
} from '../../utils/excelExporter';
import type { Order, OrderStatus } from '../../types';

interface QuickActionsProps {
  onSchedulingComplete?: () => void;
}

export function QuickActions({ onSchedulingComplete }: QuickActionsProps) {
  const [showAddOrderModal, setShowAddOrderModal] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [schedulingMessage, setSchedulingMessage] = useState('');
  
  // 新订单表单状态
  const [newOrder, setNewOrder] = useState({
    productId: '',
    quantity: 1,
    dueDate: '',
    priority: 3 as 1 | 2 | 3 | 4 | 5,
  });

  const { orders, addOrder, updateOrderStatus, getOrdersByStatus } = useOrderStore();
  const { productionLines } = useProductionLineStore();
  const { products, getProductById } = useProductStore();
  const { settings } = useSettingsStore();
  const { scheduleResults, setScheduleResults } = useScheduleStore();
  const { materialRequirements, setMaterialRequirements } = useReplenishmentStore();

  // 生成订单ID
  const generateOrderId = () => {
    const maxId = orders.reduce((max, order) => {
      const num = parseInt(order.id.replace('ORD', ''), 10);
      return num > max ? num : max;
    }, 0);
    return `ORD${String(maxId + 1).padStart(3, '0')}`;
  };

  // 添加订单
  const handleAddOrder = () => {
    if (!newOrder.productId || !newOrder.dueDate || newOrder.quantity <= 0) {
      alert('请填写所有必填字段');
      return;
    }

    const order: Order = {
      id: generateOrderId(),
      productId: newOrder.productId,
      quantity: newOrder.quantity,
      dueDate: newOrder.dueDate,
      priority: newOrder.priority,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    addOrder(order);
    
    // 重置表单
    setNewOrder({
      productId: '',
      quantity: 1,
      dueDate: '',
      priority: 3,
    });
    setShowAddOrderModal(false);
  };

  // 一键排程
  const handleScheduling = async () => {
    setIsScheduling(true);
    setSchedulingMessage('正在执行排程算法...');

    try {
      // 获取待排程订单
      const pendingOrders = getOrdersByStatus('pending');
      
      if (pendingOrders.length === 0) {
        setSchedulingMessage('没有待排程的订单');
        setTimeout(() => setSchedulingMessage(''), 2000);
        setIsScheduling(false);
        return;
      }

      // 运行排程算法
      const results = runScheduling(
        pendingOrders,
        productionLines,
        products,
        settings
      );

      // 更新排程结果
      setScheduleResults(results);

      // 计算物料需求
      const materialReqs = calculateMaterialRequirements(results, materialRequirements);
      setMaterialRequirements(materialReqs);

      // 更新订单状态
      pendingOrders.forEach(order => {
        updateOrderStatus(order.id, 'scheduled');
      });

      setSchedulingMessage(`排程完成！共排定 ${results.length} 个任务`);
      
      if (onSchedulingComplete) {
        onSchedulingComplete();
      }
    } catch (error) {
      console.error('排程失败:', error);
      setSchedulingMessage('排程失败，请重试');
    }

    setTimeout(() => {
      setSchedulingMessage('');
      setIsScheduling(false);
    }, 2000);
  };

  // 导出数据
  const handleExport = (type: 'schedule' | 'material' | 'orders' | 'lines') => {
    setShowExportMenu(false);

    switch (type) {
      case 'schedule':
        exportScheduleResults(scheduleResults, orders, products, productionLines);
        break;
      case 'material':
        exportMaterialRequirements(materialRequirements);
        break;
      case 'orders':
        exportOrders(orders, products);
        break;
      case 'lines':
        exportProductionLines(productionLines);
        break;
    }
  };

  // 获取产品选项
  const productOptions = products.map(p => ({
    value: p.id,
    label: p.name,
  }));

  // 获取优先级选项
  const priorityOptions = [
    { value: '1', label: '1 - 紧急' },
    { value: '2', label: '2 - 高' },
    { value: '3', label: '3 - 中' },
    { value: '4', label: '4 - 低' },
    { value: '5', label: '5 - 最低' },
  ];

  // 获取今天的日期（YYYY-MM-DD格式）
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <div className="space-y-4">
      {/* 快速操作按钮 */}
      <Card>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">快速操作</h3>
        <div className="space-y-2">
          <Button 
            variant="primary" 
            size="md" 
            className="w-full justify-center"
            onClick={() => setShowAddOrderModal(true)}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            添加订单
          </Button>
          
          <Button 
            variant="secondary" 
            size="md" 
            className="w-full justify-center"
            onClick={handleScheduling}
            disabled={isScheduling}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {isScheduling ? '排程中...' : '一键排程'}
          </Button>
          
          <div className="relative">
            <Button 
              variant="secondary" 
              size="md" 
              className="w-full justify-center"
              onClick={() => setShowExportMenu(!showExportMenu)}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              导出数据
            </Button>
            
            {showExportMenu && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-10 overflow-hidden">
                <button
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
                  onClick={() => handleExport('schedule')}
                >
                  排程结果
                </button>
                <button
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
                  onClick={() => handleExport('material')}
                >
                  物料需求
                </button>
                <button
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
                  onClick={() => handleExport('orders')}
                >
                  订单数据
                </button>
                <button
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
                  onClick={() => handleExport('lines')}
                >
                  产线数据
                </button>
              </div>
            )}
          </div>
        </div>

        {schedulingMessage && (
          <div className={`mt-3 p-2 rounded text-sm ${
            schedulingMessage.includes('失败') || schedulingMessage.includes('没有')
              ? 'bg-yellow-50 text-yellow-700'
              : 'bg-green-50 text-green-700'
          }`}>
            {schedulingMessage}
          </div>
        )}
      </Card>

      {/* 添加订单弹窗 */}
      <Modal
        isOpen={showAddOrderModal}
        onClose={() => setShowAddOrderModal(false)}
        title="添加新订单"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAddOrderModal(false)}>
              取消
            </Button>
            <Button variant="primary" onClick={handleAddOrder}>
              添加
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormSelect
            label="产品"
            value={newOrder.productId}
            onChange={(e) => setNewOrder({ ...newOrder, productId: e.target.value })}
            options={productOptions}
            placeholder="请选择产品"
          />
          
          <FormInput
            label="数量"
            type="number"
            value={newOrder.quantity}
            onChange={(e) => setNewOrder({ ...newOrder, quantity: parseInt(e.target.value, 10) || 0 })}
            min={1}
          />
          
          <FormInput
            label="交期"
            type="date"
            value={newOrder.dueDate}
            onChange={(e) => setNewOrder({ ...newOrder, dueDate: e.target.value })}
            min={getTodayDate()}
          />
          
          <FormSelect
            label="优先级"
            value={newOrder.priority}
            onChange={(e) => setNewOrder({ ...newOrder, priority: parseInt(e.target.value, 10) as 1 | 2 | 3 | 4 | 5 })}
            options={priorityOptions}
          />
        </div>
      </Modal>
    </div>
  );
}