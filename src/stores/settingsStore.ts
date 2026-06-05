import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { SystemSettings } from '../types';

interface SettingsState {
  settings: SystemSettings;
  updateSettings: (updates: Partial<SystemSettings>) => void;
  resetSettings: () => void;
}

const defaultSettings: SystemSettings = {
  workingHoursStart: 8,
  workingHoursEnd: 18,
  weights: {
    makespan: 0.3,
    priority: 0.3,
    loadBalance: 0.2,
    delivery: 0.2,
  },
  forecastDays: 5,
  actualDays: 5,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: defaultSettings,

      updateSettings: (updates) =>
        set((state) => ({
          settings: {
            ...state.settings,
            ...updates,
            weights: {
              ...state.settings.weights,
              ...(updates.weights || {}),
            },
          },
        })),

      resetSettings: () =>
        set(() => ({
          settings: defaultSettings,
        })),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
