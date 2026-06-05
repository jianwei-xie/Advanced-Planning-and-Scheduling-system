import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Product } from '../types';

interface ProductState {
  products: Product[];
  addProduct: (product: Product) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  getProductById: (id: string) => Product | undefined;
}

const getInitialData = (): Product[] => {
  const today = new Date();
  const addDays = (days: number) => {
    const date = new Date(today);
    date.setDate(date.getDate() + days);
    return date.toISOString();
  };

  return [
    {
      id: 'P001',
      name: '产品A',
      processes: [
        { sequence: 1, name: '下料', requiredCapability: '下料', standardHours: 0.5 },
        { sequence: 2, name: '冲压', requiredCapability: '冲压', standardHours: 1 },
        { sequence: 3, name: '喷涂', requiredCapability: '喷涂', standardHours: 0.8 },
        { sequence: 4, name: '组装', requiredCapability: '组装', standardHours: 0.5 },
      ],
      createdAt: addDays(-30),
    },
    {
      id: 'P002',
      name: '产品B',
      processes: [
        { sequence: 1, name: '下料', requiredCapability: '下料', standardHours: 0.4 },
        { sequence: 2, name: '折弯', requiredCapability: '折弯', standardHours: 0.8 },
        { sequence: 3, name: '焊接', requiredCapability: '焊接', standardHours: 1.2 },
        { sequence: 4, name: '组装', requiredCapability: '组装', standardHours: 0.6 },
      ],
      createdAt: addDays(-30),
    },
    {
      id: 'P003',
      name: '产品C',
      processes: [
        { sequence: 1, name: '冲压', requiredCapability: '冲压', standardHours: 1 },
        { sequence: 2, name: '焊接', requiredCapability: '焊接', standardHours: 1 },
        { sequence: 3, name: '喷涂', requiredCapability: '喷涂', standardHours: 0.6 },
        { sequence: 4, name: '包装', requiredCapability: '包装', standardHours: 0.3 },
      ],
      createdAt: addDays(-30),
    },
  ];
};

export const useProductStore = create<ProductState>()(
  persist(
    (set, get) => ({
      products: getInitialData(),

      addProduct: (product) =>
        set((state) => ({
          products: [...state.products, product],
        })),

      updateProduct: (id, updates) =>
        set((state) => ({
          products: state.products.map((product) =>
            product.id === id ? { ...product, ...updates } : product
          ),
        })),

      deleteProduct: (id) =>
        set((state) => ({
          products: state.products.filter((product) => product.id !== id),
        })),

      getProductById: (id) => get().products.find((product) => product.id === id),
    }),
    {
      name: 'product-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state && state.products.length === 0) {
          state.products = getInitialData();
        }
      },
    }
  )
);
