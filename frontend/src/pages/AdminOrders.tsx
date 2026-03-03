import { useState, useEffect } from "react";
import api from "../api/axios";
import { Package, Truck, CheckCircle, Clock, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import "./AdminOrders.css";

interface OrderItem {
    id: number;
    productId: string;
    productName: string;
    quantity: number;
    price: number;
}

interface Order {
    id: number;
    userId: string;
    items: OrderItem[];
    total: number;
    status: string;
    createdAt: string;
}

const statusOptions = [
    { value: "PENDING", label: "Pending", icon: Clock, classKey: "pending" },
    { value: "PROCESSING", label: "Processing", icon: Package, classKey: "processing" },
    { value: "SHIPPED", label: "Shipped", icon: Truck, classKey: "shipped" },
    { value: "DELIVERED", label: "Delivered", icon: CheckCircle, classKey: "delivered" },
    { value: "CANCELLED", label: "Cancelled", icon: XCircle, classKey: "cancelled" },
];

export default function AdminOrders() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    // Use string instead of null for currently updating order ID
    const [updatingId, setUpdatingId] = useState<string>("");

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
            const res = await api.get("/orders/all");
            setOrders(res.data || []);
        } catch (err) {
            toast.error("Failed to load orders");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (orderId: number, currentStatus: string, newStatus: string) => {
        if (currentStatus === newStatus) return;

        setUpdatingId(orderId.toString());
        try {
            await api.put(`/orders/${orderId}/status`, { status: newStatus });
            toast.success("Order status updated");
            setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to update status");
        } finally {
            setUpdatingId(""); // Reset to empty string
        }
    };

    if (loading) {
        return (
            <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <div className="loader-spinner"></div>
            </div>
        );
    }

    return (
        <div className="admin-orders-page fade-in">
            <div className="admin-orders-container">
                <div className="admin-page-header">
                    <h1 className="admin-page-title">Manage Orders</h1>
                    <p className="admin-page-subtitle">View and update customer order statuses</p>
                </div>

                {orders.length === 0 ? (
                    <div className="admin-empty-state premium-card glass-morphism">
                        <Package className="admin-empty-icon" />
                        <h2>No Orders Found</h2>
                        <p>There are currently no orders in the system.</p>
                    </div>
                ) : (
                    <div className="admin-orders-list">
                        {orders.map((order) => {
                            const statusOpt = statusOptions.find(o => o.value === order.status) || statusOptions[0];
                            const StatusIcon = statusOpt.icon;
                            const statusClass = `status-${statusOpt.classKey}`;

                            return (
                                <div key={order.id} className="admin-order-card premium-card glass-morphism">
                                    <div className="admin-order-card-header">
                                        <div className="admin-order-info">
                                            <div className="admin-order-id-group">
                                                <span className="admin-order-id">Order #ord-{order.id}</span>
                                                <span className="admin-user-pill">
                                                    User: {order.userId}
                                                </span>
                                            </div>
                                            <div className="admin-order-date">
                                                {new Date(order.createdAt).toLocaleDateString("en-US", {
                                                    year: "numeric",
                                                    month: "long",
                                                    day: "numeric",
                                                    hour: "2-digit",
                                                    minute: "2-digit"
                                                })}
                                            </div>
                                        </div>

                                        <div className="admin-order-actions">
                                            <div className={`status-select-wrapper ${statusClass}`}>
                                                <StatusIcon size={18} />
                                                <select
                                                    value={order.status}
                                                    onChange={(e) => handleUpdateStatus(order.id, order.status, e.target.value)}
                                                    disabled={updatingId === order.id.toString()}
                                                    className="status-select"
                                                >
                                                    {statusOptions.map(opt => (
                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                    ))}
                                                </select>
                                                {updatingId === order.id.toString() && (
                                                    <div className="admin-spinner-small"></div>
                                                )}
                                            </div>
                                            <div className="admin-order-total">
                                                ₹{order.total.toLocaleString()}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="admin-order-items">
                                        {order.items.map((item) => (
                                            <div key={item.id} className="admin-item-row">
                                                <div className="admin-item-details">
                                                    <div className="admin-item-qty-badge">
                                                        {item.quantity}x
                                                    </div>
                                                    <span className="admin-item-name">{item.productName}</span>
                                                </div>
                                                <span className="admin-item-price">₹{(item.price * item.quantity).toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
