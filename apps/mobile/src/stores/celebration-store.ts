import type { SessionId } from '@forge/contracts';
import { create } from 'zustand';

// Set when a session is completed (or the plan restarted); the Plan screen plays it once,
// the next time it is on screen.
export type Celebration = { kind: 'unlock'; sessionId: SessionId } | { kind: 'planComplete' };

interface CelebrationState {
  pending: Celebration | null;
  celebrate: (celebration: Celebration) => void;
  consume: () => Celebration | null;
}

export const usePlanCelebration = create<CelebrationState>()((set, get) => ({
  pending: null,
  celebrate: (celebration) => set({ pending: celebration }),
  consume: () => {
    const { pending } = get();
    if (pending) set({ pending: null });
    return pending;
  },
}));
