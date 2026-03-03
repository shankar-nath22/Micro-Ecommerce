import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useUserStore } from '../store/userStore';
import { useNotificationStore } from '../store/notificationStore';

const NOTIFICATION_SERVICE_URL = import.meta.env.VITE_NOTIFICATION_URL || 'http://localhost:8087';

export const useNotifications = () => {
    const userRole = useUserStore((state) => state.role);
    const addLowStockItem = useNotificationStore((state) => state.addLowStockItem);

    useEffect(() => {
        if (userRole !== 'ADMIN') return;

        const socket = io(NOTIFICATION_SERVICE_URL);

        socket.on('connect', () => {
            console.log('🔌 Admin connected to Notification WebSocket');
        });

        socket.on('notification', (data) => {
            console.log('🔔 Admin notification:', data);

            if (data.type === 'LOW_STOCK') {
                // Add to persistent notification store instead of showing a toast
                addLowStockItem({
                    id: data.productId,
                    name: data.productName || 'Unknown Product',
                    stock: data.currentStock
                });
            }
        });

        socket.on('disconnect', () => {
            console.log('🔌 Disconnected from Notification WebSocket');
        });

        return () => {
            socket.disconnect();
        };
    }, []);
};
