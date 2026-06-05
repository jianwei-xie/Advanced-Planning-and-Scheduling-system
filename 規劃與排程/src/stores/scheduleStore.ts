import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ScheduleResult } from '../types';

interface ScheduleState {
  scheduleResults: ScheduleResult[];
  setScheduleResults: (results: ScheduleResult[]) => void;
  clearScheduleResults: () => void;
  getResultsByLine: (lineId: string) => ScheduleResult[];
  getResultsByOrder: (orderId: string) => ScheduleResult[];
}

export const useScheduleStore = create<ScheduleState>()(
  persist(
    (set, get) => ({
      scheduleResults: [],

      setScheduleResults: (results) =>
        set(() => ({
          scheduleResults: results,
        })),

      clearScheduleResults: () =>
        set(() => ({
          scheduleResults: [],
        })),

      getResultsByLine: (lineId) =>
        get().scheduleResults.filter((result) => result.productionLineId === lineId),

      getResultsByOrder: (orderId) =>
        get().scheduleResults.filter((result) => result.orderId === orderId),
    }),
    {
      name: 'schedule-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
