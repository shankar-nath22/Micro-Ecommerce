import { create } from 'zustand';

interface ModalState {
    isEditModalOpen: boolean;
    editingProductId: string | null;
    openEditModal: (productId: string) => void;
    closeEditModal: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
    isEditModalOpen: false,
    editingProductId: null,

    openEditModal: (productId: string) => set({
        isEditModalOpen: true,
        editingProductId: productId
    }),

    closeEditModal: () => set({
        isEditModalOpen: false,
        editingProductId: null
    })
}));
