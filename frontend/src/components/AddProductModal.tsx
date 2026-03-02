import { useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import "./EditProductModal.css"; // Reuse modal styles

interface AddProductModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export default function AddProductModal({ onClose, onSuccess }: AddProductModalProps) {
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [description, setDescription] = useState("");
    const [imageUrls, setImageUrls] = useState<string[]>([""]);
    const [stock, setStock] = useState("10");
    const [category, setCategory] = useState("Electronics");
    const [adding, setAdding] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setAdding(true);

        try {
            const parsedStock = Number(stock) || 0;

            // 1. Create Product
            const res = await api.post("/products", {
                name,
                price: parseFloat(price) || 0,
                description,
                imageUrls: imageUrls.filter(url => url.trim() !== ""),
                stock: parsedStock,
                category,
            });

            const productId = res.data.id;

            // 2. Set Initial Stock in Inventory Service
            await api.post("/inventory/stock", {
                productId: productId,
                quantity: parsedStock
            });

            toast.success("Product added successfully!");
            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            toast.error("Failed to add product");
        } finally {
            setAdding(false);
        }
    };

    // Close on backdrop click
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) onClose();
    };

    return (
        <div className="modal-backdrop" onClick={handleBackdropClick}>
            <div className="modal-content">
                <div className="modal-header">
                    <h2 className="modal-title">Add New Product</h2>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>

                <form className="modal-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Product Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Premium Smartwatch"
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
                                placeholder="29990"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Initial Stock</label>
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
                            placeholder="Enter product details..."
                            rows={3}
                            required
                        />
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
                        <button type="submit" className="submit-btn" disabled={adding}>
                            {adding ? "Adding Product..." : "Add Product"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
