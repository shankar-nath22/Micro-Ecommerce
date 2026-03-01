import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../api/axios';

interface WishlistItem {
    productId: string;
    createdAt: string;
}

interface WishlistState {
    wishlist: WishlistItem[];
    fetchWishlist: () => Promise<void>;
    addToWishlist: (productId: string) => Promise<void>;
    removeFromWishlist: (productId: string) => Promise<void>;
    isInWishlist: (productId: string) => boolean;
}

export const useWishlistStore = create<WishlistState>()(
    persist(
        (set, get) => ({
            wishlist: [],
            fetchWishlist: async () => {
                try {
                    const res = await api.get('/wishlist');
                    set({ wishlist: res.data });
                } catch (err) {
                    console.error('Failed to fetch wishlist', err);
                }
            },
            addToWishlist: async (productId) => {
                try {
                    await api.post('/wishlist/add', { productId });
                    await get().fetchWishlist();
                } catch (err) {
                    console.error('Failed to add to wishlist', err);
                    throw err;
                }
            },
            removeFromWishlist: async (productId) => {
                try {
                    await api.delete(`/wishlist/remove/${productId}`);
                    await get().fetchWishlist();
                } catch (err) {
                    console.error('Failed to remove from wishlist', err);
                    throw err;
                }
            },
            isInWishlist: (productId) => {
                return get().wishlist.some(item => item.productId === String(productId));
            }
        }),
        {
            name: 'wishlist-storage',
        }
    )
);
