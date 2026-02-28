import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";
import { useUserStore } from "../store/userStore";
import { Navigate } from "react-router-dom";
import "./AdminDashboard.css"; // Reuse existing styles

export default function EditProduct() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const role = useUserStore((state) => state.role);

    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [description, setDescription] = useState("");
    const [stock, setStock] = useState("0");
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        if (id) {
            fetchProduct();
        }
    }, [id]);

    const fetchProduct = async () => {
        try {
            const res = await api.get(`/products/${id}`);
            setName(res.data.name);
            setPrice(res.data.price.toString());
            setDescription(res.data.description);

            // Fetch inventory stock
            try {
                const stockRes = await api.get(`/inventory/stock/${id}`);
                setStock(stockRes.data.quantity.toString());
            } catch (stockErr: any) {
                if (stockErr.response?.status === 404) {
                    setStock("0");
                } else {
                    console.error("Error fetching stock", stockErr);
                }
            }

        } catch (err) {
            console.error(err);
            toast.error("Failed to load product");
            navigate("/products");
        } finally {
            setLoading(false);
        }
    };

    if (role !== "ADMIN") {
        return <Navigate to="/products" replace />;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUpdating(true);

        try {
            // Update product
            await api.put(`/products/${id}`, {
                name,
                price: parseFloat(price),
                description,
                stock: parseInt(stock, 10),
            });

            // Update inventory
            await api.post("/inventory/stock", {
                productId: id,
                quantity: parseInt(stock, 10)
            });

            toast.success("Product and Inventory updated successfully!");
            navigate("/products");
        } catch (err) {
            console.error(err);
            toast.error("Failed to update product");
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return <div className="admin-root"><div className="admin-container">Loading...</div></div>;
    }

    return (
        <div className="admin-root">
            <div className="admin-container">
                <h1 className="admin-title">Edit Product</h1>

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
                            <label>Stock Quantity</label>
                            <input
                                type="number"
                                value={stock}
                                onChange={(e) => setStock(e.target.value)}
                                placeholder="0"
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

                        <button className="admin-submit" type="submit" disabled={updating}>
                            {updating ? "Updating..." : "Update Product"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
