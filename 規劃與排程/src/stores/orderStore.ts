import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Order, OrderStatus } from '../types';

interface OrderState {
  orders: Order[];
  addOrder: (order: Order) => void;
  updateOrder: (id: string, updates: Partial<Order>) => void;
  deleteOrder: (id: string) => void;
  getOrderById: (id: string) => Order | undefined;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  getOrdersByStatus: (status: OrderStatus) => Order[];
}

const getInitialData = (): Order[] => {
  const today = new Date();
  const addDays = (days: number) => {
    const date = new Date(today);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  };

  return [
    { id: 'ORD001', productId: 'P001', quantity: 100, dueDate: addDays(3), priority: 1, status: 'pending', createdAt: new Date().toISOString() },
    { id: 'ORD002', productId: 'P002', quantity: 200, dueDate: addDays(5), priority: 2, status: 'pending', createdAt: new Date().toISOString() },
    { id: 'ORD003', productId: 'P003', quantity: 150, dueDate: addDays(2), priority: 1, status: 'pending', createdAt: new Date().toISOString() },
    { id: 'ORD004', productId: 'P001', quantity: 80, dueDate: addDays(7), priority: 3, status: 'pending', createdAt: new Date().toISOString() },
    { id: 'ORD005', productId: 'P002', quantity: 120, dueDate: addDays(4), priority: 2, status: 'pending', createdAt: new Date().toISOString() },
    { id: 'ORD006', productId: 'P003', quantity: 90, dueDate: addDays(6), priority: 3, status: 'pending', createdAt: new Date().toISOString() },
    { id: 'ORD007', productId: 'P001', quantity: 60, dueDate: addDays(1), priority: 1, status: 'pending', createdAt: new Date().toISOString() },
    { id: 'ORD008', productId: 'P002', quantity: 180, dueDate: addDays(8), priority: 4, status: 'pending', createdAt: new Date().toISOString() },
  ];
};

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      orders: getInitialData(),

      addOrder: (order) =>
        set((state) => ({
          orders: [...state.orders, order],
        })),

      updateOrder: (id, updates) =>
        set((state) => ({
          orders: state.orders.map((order) =>
            order.id === id ? { ...order, ...updates } : order
          ),
        })),

      deleteOrder: (id) =>
        set((state) => ({
          orders: state.orders.filter((order) => order.id !== id),
        })),

      getOrderById: (id) => get().orders.find((order) => order.id === id),

      updateOrderStatus: (id, status) =>
        set((state) => ({
          orders: state.orders.map((order) =>
            order.id === id ? { ...order, status } : order
          ),
        })),

      getOrdersByStatus: (status) =>
        get().orders.filter((order) => order.status === status),
    }),
    {
      name: 'order-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state && state.orders.length === 0) {
          state.orders = getInitialData();
        }
      },
    }
  )
);
