import React from 'react';
import { Card } from '../common/Card';
import { useOrderStore } from '../../stores';

export function TodayOverview() {
  const { orders, getOrdersByStatus } = useOrderStore();

  const pendingCount = getOrdersByStatus('pending').length;
  const scheduledCount = getOrdersByStatus('scheduled').length;
  const completedCount = getOrdersByStatus('completed').length;
  const totalOrders = orders.length;

  return (
    <Card>
      <h3 className="text-sm font-semibold text-gray-700 mb-3">今日概览</h3>
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-3 bg-yellow-50 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
          <div className="text-xs text-yellow-700 mt-1">待排程</div>
        </div>
        
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{scheduledCount}</div>
          <div className="text-xs text-blue-700 mt-1">进行中</div>
        </div>
        
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{completedCount}</div>
          <div className="text-xs text-green-700 mt-1">已完成</div>
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">订单总数</span>
          <span className="font-medium text-gray-900">{totalOrders}</span>
        </div>
      </div>
    </Card>
  );
}