import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUserStore } from "../store/userStore";
import Navbar from "../components/Navbar";

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    imageUrl: string;
    stock: number;
    isActive: boolean;
}

interface InventoryResponse {
    productId: string;
    quantity: number;
}

export default function ProductDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const token = useUserStore((state) => state.token);

    const [product, setProduct] = useState<Product | null>(null);
    const [stockLevel, setStockLevel] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        fetchProduct();
        fetchStock();
    }, [id]);

    const fetchProduct = async () => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:8080/products/${id}`);
            if (!res.ok) throw new Error("Failed to load product details");
            const data = await res.json();
            setProduct(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchStock = async () => {
        try {
            const res = await fetch(`http://localhost:8080/inventory/stock/${id}`);
            if (res.ok) {
                const data: InventoryResponse = await res.json();
                setStockLevel(data.quantity);
            } else if (res.status === 404) {
                setStockLevel(0); // If no stock record exists, assume out of stock
            }
        } catch (err) {
            console.error("Failed to fetch stock:", err);
        }
    };

    const handleAddToCart = async () => {
        if (!token) {
            navigate("/login");
            return;
        }

        try {
            const res = await fetch("http://localhost:8080/cart/add", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ productId: id, quantity: 1 }),
            });

            if (!res.ok) {
                throw new Error("Failed to add to cart");
            }

            setSuccess("Added to cart!");
            setTimeout(() => setSuccess(""), 3000);
        } catch (err: any) {
            setError(err.message);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-400">Loading product...</div>;
    if (error || !product) return <div className="p-8 text-center text-red-500">{error || "Product not found"}</div>;

    const isOutOfStock = stockLevel === 0;
    const isLowStock = stockLevel !== null && stockLevel > 0 && stockLevel <= 5;

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <Navbar />

            <div className="max-w-4xl mx-auto p-4 sm:p-8 mt-8">
                {!product.isActive && (
                    <div className="bg-red-900/50 border border-red-500 text-red-200 px-6 py-4 rounded-xl mb-6 text-center shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                        <h3 className="font-bold text-lg mb-1">Item Unavailable</h3>
                        <p>This product has been removed and is no longer available for purchase.</p>
                    </div>
                )}

                <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
                    <div className="md:w-1/2 p-8 flex items-center justify-center bg-gray-800/30">
                        {product.imageUrl ? (
                            <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="w-full h-auto object-cover rounded-xl shadow-lg transform transition-transform duration-500 hover:scale-105"
                            />
                        ) : (
                            <div className="w-full aspect-square bg-gray-700/30 rounded-xl flex items-center justify-center border border-gray-600/30">
                                <span className="text-gray-500 flex flex-col items-center">
                                    <svg className="w-12 h-12 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                    No Image
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="md:w-1/2 p-8 flex flex-col justify-center">
                        <div className="flex justify-between items-start mb-4">
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">{product.name}</h1>
                            <span className="text-3xl font-light text-primary-400">${product.price.toFixed(2)}</span>
                        </div>

                        <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                            {product.description || "No description available for this product."}
                        </p>

                        {product.isActive && (
                            <div className="mb-6">
                                {isOutOfStock && (
                                    <div className="text-red-400 font-medium bg-red-900/20 py-2 px-4 rounded-lg inline-block border border-red-500/20">
                                        ❌ Out of Stock
                                    </div>
                                )}
                                {isLowStock && (
                                    <div className="text-orange-400 font-medium bg-orange-900/20 py-2 px-4 rounded-lg inline-block border border-orange-500/20 animate-pulse">
                                        ⚠️ Hurry! Only {stockLevel} items left in stock.
                                    </div>
                                )}
                                {stockLevel !== null && stockLevel > 5 && (
                                    <div className="text-green-400 font-medium">
                                        ✓ In Stock
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="mt-auto space-y-4">
                            {product.isActive && (
                                <button
                                    onClick={handleAddToCart}
                                    disabled={isOutOfStock}
                                    className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 transform active:scale-[0.98] ${isOutOfStock
                                            ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                                            : "bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] text-white"
                                        }`}
                                >
                                    {isOutOfStock ? "Unavailable" : "Add to Cart"}
                                </button>
                            )}
                            {success && (
                                <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-center py-3 rounded-xl animate-fade-in">
                                    ✓ {success}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
