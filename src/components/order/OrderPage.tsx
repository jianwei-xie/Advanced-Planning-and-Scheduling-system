import { useState, useMemo } from 'react';
import { useOrderStore } from '../../stores/orderStore';
import { useProductStore } from '../../stores/productStore';
import { Order, OrderStatus } from '../../types';
import { Button, Card } from '../common';
import { OrderTable } from './OrderTable';
import { OrderForm, OrderFormData } from './OrderForm';
import { Modal } from '../common';

type FilterStatus = 'all' | OrderStatus;

export function OrderPage() {
  const { orders, addOrder, updateOrder, deleteOrder } = useOrderStore();
  const { products } = useProductStore();

  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Order | null>(null);

  const productMap = useMemo(() => {
    return products.reduce((acc, product) => {
      acc[product.id] = product.name;
      return acc;
    }, {} as Record<string, string>);
  }, [products]);

  const filteredOrders = useMemo(() => {
    if (filterStatus === 'all') return orders;
    return orders.filter((order) => order.status === filterStatus);
  }, [orders, filterStatus]);

  const handleAddClick = () => {
    setEditingOrder(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (order: Order) => {
    setEditingOrder(order);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (order: Order) => {
    setDeleteConfirm(order);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirm) {
      deleteOrder(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  const handleFormSubmit = (data: OrderFormData) => {
    if (editingOrder) {
      updateOrder(editingOrder.id, data);
    } else {
      const newOrder: Order = {
        id: `ORD${String(orders.length + 1).padStart(3, '0')}`,
        productId: data.productId,
        quantity: data.quantity,
        dueDate: data.dueDate,
        priority: data.priority,
        status: data.status,
        createdAt: new Date().toISOString(),
      };
      addOrder(newOrder);
    }
    setIsFormOpen(false);
    setEditingOrder(null);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingOrder(null);
  };

  const ordersWithProductName = useMemo(() => {
    return filteredOrders.map((order) => ({
      ...order,
      productName: productMap[order.productId] || order.productId,
    }));
  }, [filteredOrders, productMap]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">订单管理</h1>
        <Button onClick={handleAddClick}>添加订单</Button>
      </div>

      <Card>
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 mr-2">状态筛选:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">全部</option>
            <option value="pending">待排程</option>
            <option value="scheduled">已排程</option>
            <option value="completed">已完成</option>
          </select>
        </div>

        <OrderTable
          orders={ordersWithProductName}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
        />
      </Card>

      <OrderForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        initialData={editingOrder}
      />

      <Modal
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        title="确认删除"
      >
        <p className="text-gray-700 mb-4">
          确定要删除订单 <span className="font-semibold">{deleteConfirm?.id}</span> 吗？
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setDeleteConfirm(null)}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleConfirmDelete}
            className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
          >
            删除
          </button>
        </div>
      </Modal>
    </div>
  );
}