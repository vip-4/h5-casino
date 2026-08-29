import { create } from 'zustand';

type GameState = {
  balance: number;
  isSpinning: boolean;
  reels: string[];
  lastWin: number;
  jackpot: number;
  setBalance: (b: number) => void;
  setSpinning: (s: boolean) => void;
  setReels: (r: string[]) => void;
  setJackpot: (j: number) => void;
};

export const useGameStore = create<GameState>()((set, get) => ({
  balance: 0,
  isSpinning: false,
  reels: ['🍒', '🍋', '🍇'],
  lastWin: 0,
  jackpot: 0,
  setBalance: (b) => set({ balance: b }),
  setSpinning: (s) => set({ isSpinning: s }),
  setReels: (r) => set({ reels: r }),
  setJackpot: (j) => set({ jackpot: j })
}));