import { useEffect, useState } from "react";
import api from "../api/axios";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import "./Orders.css";

interface OrderItem {
    id: number;
    productId: string;
    productName: string;
    quantity: number;
    price: number;
}

interface Order {
    id: number;
    total: number;
    status: string;
    createdAt: string;
    items: OrderItem[];
}

export default function Orders() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrders();

        const wsBaseUrl = import.meta.env.VITE_WS_BASE_URL || "ws://localhost:8080";
        const ws = new WebSocket(`${wsBaseUrl}/orders/ws`);
        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === "ORDER_STATUS_UPDATE") {
                    setOrders(prevOrders =>
                        prevOrders.map(order =>
                            order.id === data.orderId
                                ? { ...order, status: data.status }
                                : order
                        )
                    );
                }
            } catch (err) {
                console.error("Failed to parse websocket message:", err);
            }
        };

        return () => ws.close();
    }, []);

    const fetchOrders = async () => {
        try {
            const res = await api.get<Order[]>("/orders");
            setOrders(res.data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load order history");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="orders-page">
                <div className="loading-state">Loading your history...</div>
            </div>
        );
    }

    return (
        <div className="orders-page">
            <div className="orders-container">
                <div className="orders-header">
                    <h1 className="orders-title">Order History</h1>
                    <p className="orders-subtitle">Track and manage your past purchases</p>
                </div>

                {orders.length === 0 ? (
                    <div className="empty-orders premium-card glass-morphism">
                        <div className="empty-icon">📦</div>
                        <h3>No orders yet</h3>
                        <p>Your order history will appear here once you make a purchase.</p>
                    </div>
                ) : (
                    <div className="orders-list">
                        {orders.map((order) => (
                            <div key={order.id} className="order-card premium-card glass-morphism">
                                <div className="order-card-header">
                                    <div className="order-info">
                                        <span className="order-id">Order #ord-{order.id}</span>
                                        <span className="order-date">
                                            {new Date(order.createdAt).toLocaleDateString(undefined, {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                    <div className="order-total">
                                        <span className="total-label">Total Amount</span>
                                        <span className="total-value">₹{order.total.toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="order-items">
                                    {order.items && order.items.map((item) => (
                                        <div key={item.id} className="order-item-row">
                                            <div className="item-details">
                                                <Link to={`/products/${item.productId}`} className="item-name-link">
                                                    <span className="item-name">{item.productName || "Unknown Product"}</span>
                                                </Link>
                                                <span className="item-qty">Qty: {item.quantity}</span>
                                            </div>
                                            <span className="item-price">₹{(item.price * item.quantity).toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className={`order-badge status-badge-${order.status.toLowerCase()}`}>
                                    {order.status}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
