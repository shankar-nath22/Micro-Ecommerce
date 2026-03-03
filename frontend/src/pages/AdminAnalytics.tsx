import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import api from "../api/axios";
import { useUserStore } from "../store/userStore";
import { Product } from "../types/product";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar
} from "recharts";
import { TrendingUp, Package, DollarSign, Activity } from "lucide-react";
import toast from "react-hot-toast";
import "./AdminAnalytics.css";

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

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4'];

export default function AdminAnalytics() {
    const role = useUserStore((state) => state.role);
    const [orders, setOrders] = useState<Order[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [ordersRes, productsRes] = await Promise.all([
                    api.get("/orders/all"),
                    api.get("/products")
                ]);
                setOrders(ordersRes.data || []);
                setProducts(productsRes.data || []);
            } catch (error) {
                console.error("Failed to fetch analytics data", error);
                toast.error("Failed to load dashboard data");
            } finally {
                setLoading(false);
            }
        };

        if (role === "ADMIN") {
            fetchDashboardData();
        }
    }, [role]);

    if (role !== "ADMIN") {
        return <Navigate to="/products" replace />;
    }

    if (loading) {
        return (
            <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <div className="loader-spinner"></div>
            </div>
        );
    }

    // --- Data Aggregation ---

    // 1. Total Revenue & Active Orders
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const totalProducts = products.length;
    const activeOrders = orders.filter(o => !["DELIVERED", "CANCELLED"].includes(o.status)).length;

    // Low Stock Count
    const lowStockThreshold = 10;
    const lowStockCount = products.filter(p => p.stock < lowStockThreshold).length;

    // 2. Sales Over Time (Group by Date)
    const salesByDateMap: Record<string, number> = {};
    orders.forEach(order => {
        const date = new Date(order.createdAt).toISOString().split('T')[0];
        salesByDateMap[date] = (salesByDateMap[date] || 0) + order.total;
    });

    const salesOverTimeData = Object.keys(salesByDateMap).sort().map(date => ({
        date,
        revenue: salesByDateMap[date]
    }));

    // 3. Sales By Category
    // We need to map OrderItems back to their Product category
    const salesByCategoryMap: Record<string, number> = {};
    const productCategoryMap = products.reduce((acc, p) => {
        acc[p.id] = p.category || "Uncategorized";
        return acc;
    }, {} as Record<string, string>);

    orders.forEach(order => {
        order.items.forEach(item => {
            const cat = productCategoryMap[item.productId] || "Uncategorized";
            salesByCategoryMap[cat] = (salesByCategoryMap[cat] || 0) + (item.price * item.quantity);
        });
    });

    const categoryData = Object.keys(salesByCategoryMap).map(cat => ({
        name: cat,
        value: salesByCategoryMap[cat]
    })).sort((a, b) => b.value - a.value); // Sort largest slices first

    // 4. Top 5 Lowest Stock Items
    const lowestStockData = [...products]
        .sort((a, b) => a.stock - b.stock)
        .slice(0, 5)
        .map(p => ({
            name: p.name.length > 15 ? p.name.substring(0, 15) + "..." : p.name,
            stock: p.stock
        }));

    return (
        <div className="analytics-page fade-in">
            <div className="analytics-container">
                <div className="analytics-header">
                    <h1 className="analytics-title">Analytics Dashboard</h1>
                    <p className="analytics-subtitle">Real-time store metrics and performance data</p>
                </div>

                {/* KPI Cards */}
                <div className="kpi-grid">
                    <div className="kpi-card premium-card glass-morphism">
                        <div className="kpi-icon-wrapper revenue">
                            <DollarSign size={24} />
                        </div>
                        <div className="kpi-details">
                            <span className="kpi-label">Total Revenue</span>
                            <span className="kpi-value">₹{totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        </div>
                    </div>

                    <div className="kpi-card premium-card glass-morphism">
                        <div className="kpi-icon-wrapper orders">
                            <Activity size={24} />
                        </div>
                        <div className="kpi-details">
                            <span className="kpi-label">Active Orders</span>
                            <span className="kpi-value">{activeOrders}</span>
                        </div>
                    </div>

                    <div className="kpi-card premium-card glass-morphism">
                        <div className="kpi-icon-wrapper products">
                            <Package size={24} />
                        </div>
                        <div className="kpi-details">
                            <span className="kpi-label">Total Products</span>
                            <span className="kpi-value">{totalProducts}</span>
                        </div>
                    </div>

                    <div className="kpi-card premium-card glass-morphism">
                        <div className="kpi-icon-wrapper stock">
                            <TrendingUp size={24} />
                        </div>
                        <div className="kpi-details">
                            <span className="kpi-label">Low Stock Items</span>
                            <span className="kpi-value attention">{lowStockCount}</span>
                        </div>
                    </div>
                </div>

                {/* Charts Grid */}
                <div className="charts-grid">
                    {/* Revenue Over Time Line Chart */}
                    <div className="chart-card premium-card glass-morphism span-2">
                        <h3 className="chart-title">Revenue Over Time</h3>
                        <div className="chart-wrapper">
                            {salesOverTimeData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={salesOverTimeData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                                        <XAxis dataKey="date" stroke="var(--text-dim)" fontSize={12} tickMargin={10} />
                                        <YAxis stroke="var(--text-dim)" fontSize={12} tickFormatter={(value) => `₹${value}`} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
                                            itemStyle={{ color: 'var(--primary-color)', fontWeight: 600 }}
                                            formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Revenue']}
                                        />
                                        <Line type="monotone" dataKey="revenue" stroke="var(--primary-color)" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6, stroke: 'var(--secondary-color)', strokeWidth: 2 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="empty-chart">No sales data available yet</div>
                            )}
                        </div>
                    </div>

                    {/* Sales By Category Pie Chart */}
                    <div className="chart-card premium-card glass-morphism">
                        <h3 className="chart-title">Sales by Category</h3>
                        <div className="chart-wrapper">
                            {categoryData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={categoryData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={5}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {categoryData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                                            itemStyle={{ color: 'var(--text-primary)' }}
                                            formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Sales']}
                                        />
                                        <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px', color: 'var(--text-secondary)' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="empty-chart">No category data available</div>
                            )}
                        </div>
                    </div>

                    {/* Lowest Stock Bar Chart */}
                    <div className="chart-card premium-card glass-morphism">
                        <h3 className="chart-title">Lowest Stock Items</h3>
                        <div className="chart-wrapper">
                            {lowestStockData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={lowestStockData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal={false} />
                                        <XAxis type="number" stroke="var(--text-dim)" fontSize={12} />
                                        <YAxis dataKey="name" type="category" stroke="var(--text-secondary)" fontSize={11} width={100} tickMargin={5} />
                                        <Tooltip
                                            cursor={{ fill: 'var(--surface-accent)' }}
                                            contentStyle={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                                            formatter={(value) => [`${value} units`, 'Stock']}
                                        />
                                        <Bar dataKey="stock" radius={[0, 4, 4, 0]}>
                                            {lowestStockData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.stock === 0 ? '#ef4444' : entry.stock < 10 ? '#f59e0b' : 'var(--primary-color)'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="empty-chart">No product data available</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
