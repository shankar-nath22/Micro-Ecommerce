import { create } from "zustand";
import api from "../api/axios";
import { Product } from "../types/product";

type CartMap = Record<string, number>;

interface CartState {
  cart: CartMap;
  totalCount: number;
  totalAmount: number;
  loading: boolean;
  setCart: (c: CartMap) => void;
  fetchCart: () => Promise<void>;
}

export const useCartStore = create<CartState>((set) => ({
  cart: {},
  totalCount: 0,
  totalAmount: 0,
  loading: false,
  setCart: (c) => set({ cart: c }),
  fetchCart: async () => {
    try {
      set({ loading: true });
      // Fetch both cart and products to calculate totals
      const [cartRes, prodRes] = await Promise.all([
        api.get<CartMap>("/cart"),
        api.get<Product[]>("/products")
      ]);

      const cartData = cartRes.data || {};
      const products = prodRes.data || [];

      const prodMap = new Map(products.map(p => [String(p.id), p]));

      let count = 0;
      let amount = 0;

      Object.entries(cartData).forEach(([id, qty]) => {
        const prod = prodMap.get(id);
        if (prod) {
          count += qty;
          amount += (qty * prod.price);
        }
      });

      set({
        cart: cartData,
        totalCount: count,
        totalAmount: amount,
        loading: false
      });
    } catch (err) {
      console.error("Cart sync failed:", err);
      set({ loading: false });
    }
  }
}));
