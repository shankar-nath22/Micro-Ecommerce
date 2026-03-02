import { useState, useEffect } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import "./EditProductModal.css";

interface EditProductModalProps {
    productId: string;
    onClose: () => void;
    onSuccess: () => void;
}

export default function EditProductModal({ productId, onClose, onSuccess }: EditProductModalProps) {
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [description, setDescription] = useState("");
    const [imageUrls, setImageUrls] = useState<string[]>([""]);
    const [stock, setStock] = useState("0");
    const [category, setCategory] = useState("");
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        if (productId) {
            fetchProduct();
        }
    }, [productId]);

    const fetchProduct = async () => {
        try {
            const res = await api.get(`/products/${productId}`);
            setName(res.data.name);
            setPrice(res.data.price.toString());
            setDescription(res.data.description);
            setCategory(res.data.category || "Electronics");
            if (res.data.imageUrls && res.data.imageUrls.length > 0) {
                setImageUrls(res.data.imageUrls);
            } else if (res.data.imageUrl) {
                setImageUrls([res.data.imageUrl]);
            } else {
                setImageUrls([""]);
            }

            // Fetch inventory stock
            try {
                const stockRes = await api.get(`/inventory/stock/${productId}`);
                setStock(stockRes.data.quantity.toString());
            } catch (stockErr: any) {
                const backupStock = res.data.stock != null ? res.data.stock.toString() : "0";
                setStock(backupStock);
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to load product");
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUpdating(true);

        try {
            const parsedStock = Number(stock) || 0;

            // Update product
            await api.put(`/products/${productId}`, {
                name,
                price: parseFloat(price) || 0,
                description,
                imageUrls: imageUrls.filter(url => url.trim() !== ""),
                stock: parsedStock,
                category,
            });

            // Update inventory
            await api.post("/inventory/stock", {
                productId: productId,
                quantity: parsedStock
            });

            toast.success("Product updated successfully!");
            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            toast.error("Failed to update product");
        } finally {
            setUpdating(false);
        }
    };

    // Close on backdrop click
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) onClose();
    };

    if (loading) {
        return (
            <div className="modal-backdrop">
                <div className="modal-content" style={{ textAlign: 'center', padding: '60px' }}>
                    <h2 style={{ color: 'var(--text-secondary)' }}>Loading product details...</h2>
                </div>
            </div>
        );
    }

    return (
        <div className="modal-backdrop" onClick={handleBackdropClick}>
            <div className="modal-content">
                <div className="modal-header">
                    <h2 className="modal-title">Edit Product</h2>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>

                <form className="modal-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Product Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Product Images</label>
                        {imageUrls.map((url, index) => (
                            <div key={index} className="multi-input-row">
                                <input
                                    type="text"
                                    value={url}
                                    onChange={(e) => {
                                        const newUrls = [...imageUrls];
                                        newUrls[index] = e.target.value;
                                        setImageUrls(newUrls);
                                    }}
                                    placeholder="Enter image URL or paste base64..."
                                />
                                {imageUrls.length > 1 && (
                                    <button
                                        type="button"
                                        className="remove-input-btn"
                                        onClick={() => setImageUrls(imageUrls.filter((_, i) => i !== index))}
                                    >
                                        &times;
                                    </button>
                                )}
                            </div>
                        ))}
                        <button
                            type="button"
                            className="add-input-btn"
                            onClick={() => setImageUrls([...imageUrls, ""])}
                        >
                            + Add Another Image
                        </button>
                    </div>

                    <div className="modal-grid">
                        <div className="form-group">
                            <label>Price (₹)</label>
                            <input
                                type="number"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Stock Quantity</label>
                            <input
                                type="number"
                                value={stock}
                                onChange={(e) => setStock(e.target.value)}
                                required
                                min="0"
                            />
                        </div>

                        <div className="form-group">
                            <label>Category</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="modal-select"
                                required
                            >
                                <option value="Electronics">Electronics</option>
                                <option value="Fashion">Fashion</option>
                                <option value="Home">Home & Living</option>
                                <option value="Beauty">Beauty & Personal Care</option>
                                <option value="Sports">Sports & Fitness</option>
                                <option value="Accessories">Accessories</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            required
                        />
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
                        <button type="submit" className="submit-btn" disabled={updating}>
                            {updating ? "Saving Changes..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
