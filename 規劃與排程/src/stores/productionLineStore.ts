import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ProductionLine } from '../types';

interface ProductionLineState {
  productionLines: ProductionLine[];
  addLine: (line: ProductionLine) => void;
  updateLine: (id: string, updates: Partial<ProductionLine>) => void;
  deleteLine: (id: string) => void;
  getLineById: (id: string) => ProductionLine | undefined;
}

const getInitialData = (): ProductionLine[] => {
  const today = new Date();
  const addDays = (days: number) => {
    const date = new Date(today);
    date.setDate(date.getDate() + days);
    return date.toISOString();
  };

  return [
    {
      id: 'PL001',
      name: '冲压线A',
      capabilities: ['下料', '冲压', '折弯'],
      status: 'active',
      loadCapacity: 8,
      createdAt: addDays(-30),
    },
    {
      id: 'PL002',
      name: '冲压线B',
      capabilities: ['下料', '冲压'],
      status: 'active',
      loadCapacity: 8,
      createdAt: addDays(-30),
    },
    {
      id: 'PL003',
      name: '焊接线',
      capabilities: ['点焊', '弧焊', '铆接'],
      status: 'active',
      loadCapacity: 8,
      createdAt: addDays(-30),
    },
    {
      id: 'PL004',
      name: '喷涂线',
      capabilities: ['喷涂', '烘干'],
      status: 'active',
      loadCapacity: 8,
      createdAt: addDays(-30),
    },
    {
      id: 'PL005',
      name: '组装线',
      capabilities: ['组装', '包装'],
      status: 'active',
      loadCapacity: 8,
      createdAt: addDays(-30),
    },
  ];
};

export const useProductionLineStore = create<ProductionLineState>()(
  persist(
    (set, get) => ({
      productionLines: getInitialData(),

      addLine: (line) =>
        set((state) => ({
          productionLines: [...state.productionLines, line],
        })),

      updateLine: (id, updates) =>
        set((state) => ({
          productionLines: state.productionLines.map((line) =>
            line.id === id ? { ...line, ...updates } : line
          ),
        })),

      deleteLine: (id) =>
        set((state) => ({
          productionLines: state.productionLines.filter((line) => line.id !== id),
        })),

      getLineById: (id) => get().productionLines.find((line) => line.id === id),
    }),
    {
      name: 'production-line-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state && state.productionLines.length === 0) {
          state.productionLines = getInitialData();
        }
      },
    }
  )
);
