import type { SessionId } from '@forge/contracts';
import { create } from 'zustand';

// Ticked blocks per session, in memory only: decision A keeps no per-session rows on the
// server, and ticks only exist to pace the user through one workout.
interface ChecklistState {
  ticked: Partial<Record<SessionId, number[]>>;
  toggle: (sessionId: SessionId, blockIndex: number) => void;
  clear: (sessionId: SessionId) => void;
  reset: () => void;
}

export const NO_TICKS: readonly number[] = [];

export const useChecklist = create<ChecklistState>()((set) => ({
  ticked: {},
  toggle: (sessionId, blockIndex) =>
    set((state) => {
      const current = state.ticked[sessionId] ?? [];
      const next = current.includes(blockIndex)
        ? current.filter((index) => index !== blockIndex)
        : [...current, blockIndex];
      return { ticked: { ...state.ticked, [sessionId]: next } };
    }),
  clear: (sessionId) => set((state) => ({ ticked: { ...state.ticked, [sessionId]: [] } })),
  reset: () => set({ ticked: {} }),
}));
