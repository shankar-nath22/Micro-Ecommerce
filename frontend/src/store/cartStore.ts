import { create } from "zustand";

type CartMap = Record<string, number>;

interface CartState {
  cart: CartMap;
  setCart: (c: CartMap) => void;
}

export const useCartStore = create<CartState>((set) => ({
  cart: {},
  setCart: (c) => set({ cart: c }),
}));
