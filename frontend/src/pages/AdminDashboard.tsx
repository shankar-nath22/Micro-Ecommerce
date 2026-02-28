import { useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import { useUserStore } from "../store/userStore";
import { Navigate } from "react-router-dom";
import "./AdminDashboard.css";

export default function AdminDashboard() {
    const role = useUserStore((state) => state.role);
    console.log("Current user role in AdminDashboard:", role);

    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [description, setDescription] = useState("");
    const [stock, setStock] = useState("10"); // Default stock
    const [loading, setLoading] = useState(false);

    if (role !== "ADMIN") {
        console.log("Not an admin, redirecting...");
        return <Navigate to="/products" replace />;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Create Product
            const res = await api.post("/products", {
                name,
                price: parseFloat(price),
                description,
                stock: parseInt(stock, 10), // Send to product DB too just in case
            });

            const productId = res.data.id;

            // 2. Set Initial Stock in Inventory Service
            await api.post("/inventory/stock", {
                productId: productId,
                quantity: parseInt(stock, 10)
            });

            toast.success("Product and Inventory added successfully!");
            setName("");
            setPrice("");
            setDescription("");
            setStock("10");
        } catch (err) {
            console.error(err);
            toast.error("Failed to add product");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-root">
            <div className="admin-container">
                <h1 className="admin-title">Admin Dashboard</h1>

                <div className="admin-card premium-card glass-morphism">
                    <h2 className="card-subtitle">Add New Product</h2>
                    <form className="admin-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Product Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter product name"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Price (₹)</label>
                            <input
                                type="number"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                placeholder="29990"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Initial Stock Quantity</label>
                            <input
                                type="number"
                                value={stock}
                                onChange={(e) => setStock(e.target.value)}
                                placeholder="10"
                                required
                                min="0"
                            />
                        </div>

                        <div className="form-group">
                            <label>Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Enter product description"
                                rows={4}
                                required
                            />
                        </div>

                        <button className="admin-submit" type="submit" disabled={loading}>
                            {loading ? "Adding Product..." : "Add Product"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
