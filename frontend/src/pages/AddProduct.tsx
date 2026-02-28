import { useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import { useUserStore } from "../store/userStore";
import { Navigate, useNavigate } from "react-router-dom";
import "./AdminDashboard.css"; // Reuse existing styles

export default function AddProduct() {
    const role = useUserStore((state) => state.role);
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [description, setDescription] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [stock, setStock] = useState("10"); // Default stock
    const [loading, setLoading] = useState(false);

    if (role !== "ADMIN") {
        return <Navigate to="/products" replace />;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const parsedStock = Number(stock) || 0;

            // 1. Create Product
            const res = await api.post("/products", {
                name,
                price: parseFloat(price) || 0,
                description,
                imageUrl,
                stock: parsedStock, // Send to product DB too just in case
            });

            const productId = res.data.id;

            // 2. Set Initial Stock in Inventory Service
            await api.post("/inventory/stock", {
                productId: productId,
                quantity: parsedStock
            });

            toast.success("Product and Inventory added successfully!");
            navigate("/admin");
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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px" }}>
                    <h1 className="admin-title" style={{ marginBottom: 0 }}>Add New Product</h1>
                    <button
                        className="admin-submit"
                        style={{ marginTop: 0, padding: "8px 16px", fontSize: "1rem" }}
                        onClick={() => navigate("/admin")}
                    >
                        Back to Inventory
                    </button>
                </div>

                <div className="admin-card premium-card glass-morphism">
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
                            <label>Image URL</label>
                            <input
                                type="url"
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                placeholder="https://example.com/image.jpg"
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
