import { create } from "zustand";
import api from "../api/axios";

interface LowStockItem {
    id: string;
    name: string;
    stock: number;
}

interface NotificationState {
    lowStockItems: LowStockItem[];
    lastFetched: number | null;
    loading: boolean;
    fetchLowStock: () => Promise<void>;
    clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
    lowStockItems: [],
    lastFetched: null,
    loading: false,

    fetchLowStock: async () => {
        // Avoid fetching too frequently (e.g., within 30 seconds)
        const now = Date.now();
        const last = get().lastFetched;
        if (last && now - last < 30000 && get().lowStockItems.length > 0) {
            return;
        }

        set({ loading: true });
        try {
            // 1. Fetch all products
            const productsRes = await api.get<any[]>("/products");
            const products = productsRes.data;

            if (products.length === 0) {
                set({ lowStockItems: [], lastFetched: now, loading: false });
                return;
            }

            // 2. Batch fetch stock for all products
            const productIds = products.map((p) => p.id);
            const stockRes = await api.post<any[]>("/inventory/stocks", productIds);
            const stocks = stockRes.data;

            // 3. Map stocks back to products and filter for low stock
            const lowStock = stocks
                .filter((s) => s.quantity < 5)
                .map((s) => {
                    const product = products.find((p) => p.id === s.productId);
                    return {
                        id: s.productId,
                        name: product ? product.name : "Unknown Product",
                        stock: s.quantity,
                    };
                });

            set({ lowStockItems: lowStock, lastFetched: now, loading: false });
        } catch (err) {
            console.error("Failed to fetch notifications:", err);
            set({ loading: false });
            // Keep existing data on error to avoid flickering to 0
        }
    },

    clearNotifications: () => {
        set({ lowStockItems: [], lastFetched: null });
    },
}));
