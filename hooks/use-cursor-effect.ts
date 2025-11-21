import { create } from 'zustand';

export type CursorEffectType = 'default' | 'hero' | 'features' | 'stats' | 'cta';

interface CursorEffectState {
  effect: CursorEffectType;
  setEffect: (effect: CursorEffectType) => void;
}

export const useCursorEffect = create<CursorEffectState>((set) => ({
  effect: 'default',
  setEffect: (effect) => set({ effect }),
}));
