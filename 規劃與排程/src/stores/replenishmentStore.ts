import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { MaterialRequirement } from '../types';

interface ReplenishmentState {
  materialRequirements: MaterialRequirement[];
  setMaterialRequirements: (requirements: MaterialRequirement[]) => void;
  updateRequirement: (id: string, updates: Partial<MaterialRequirement>) => void;
  getLowStockItems: () => MaterialRequirement[];
}

const getInitialData = (): MaterialRequirement[] => {
  const today = new Date();
  const addDays = (days: number) => {
    const date = new Date(today);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  };

  return [
    {
      id: 'MAT001',
      materialName: '钢板A',
      materialCode: 'MAT001',
      requiredDate: addDays(3),
      quantity: 500,
      currentStock: 500,
      safetyStock: 200,
      replenishmentZone: [300, 600],
      status: 'sufficient',
    },
    {
      id: 'MAT002',
      materialName: '钢管B',
      materialCode: 'MAT002',
      requiredDate: addDays(5),
      quantity: 400,
      currentStock: 300,
      safetyStock: 150,
      replenishmentZone: [200, 400],
      status: 'low',
    },
    {
      id: 'MAT003',
      materialName: '涂料X',
      materialCode: 'MAT003',
      requiredDate: addDays(2),
      quantity: 120,
      currentStock: 100,
      safetyStock: 50,
      replenishmentZone: [80, 150],
      status: 'sufficient',
    },
    {
      id: 'MAT004',
      materialName: '焊材Y',
      materialCode: 'MAT004',
      requiredDate: addDays(4),
      quantity: 80,
      currentStock: 80,
      safetyStock: 30,
      replenishmentZone: [50, 100],
      status: 'sufficient',
    },
    {
      id: 'MAT005',
      materialName: '包装盒',
      materialCode: 'MAT005',
      requiredDate: addDays(1),
      quantity: 250,
      currentStock: 200,
      safetyStock: 100,
      replenishmentZone: [150, 300],
      status: 'low',
    },
    {
      id: 'MAT006',
      materialName: '螺丝组',
      materialCode: 'MAT006',
      requiredDate: addDays(2),
      quantity: 1000,
      currentStock: 1000,
      safetyStock: 500,
      replenishmentZone: [800, 1200],
      status: 'sufficient',
    },
  ];
};

export const useReplenishmentStore = create<ReplenishmentState>()(
  persist(
    (set, get) => ({
      materialRequirements: getInitialData(),

      setMaterialRequirements: (requirements) =>
        set(() => ({
          materialRequirements: requirements,
        })),

      updateRequirement: (id, updates) =>
        set((state) => ({
          materialRequirements: state.materialRequirements.map((req) =>
            req.id === id ? { ...req, ...updates } : req
          ),
        })),

      getLowStockItems: () =>
        get().materialRequirements.filter(
          (req) => req.status === 'low' || req.status === 'critical'
        ),
    }),
    {
      name: 'replenishment-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state && state.materialRequirements.length === 0) {
          state.materialRequirements = getInitialData();
        }
      },
    }
  )
);
