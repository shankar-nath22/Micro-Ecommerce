import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useWishlistStore } from "../store/wishlistStore";
import { useCartStore } from "../store/cartStore";
import { Heart, ShoppingCart, Trash2, ArrowLeft, Package } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/axios";
import "./Wishlist.css";

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    imageUrl?: string;
}

export default function Wishlist() {
    const { wishlist, removeFromWishlist } = useWishlistStore();
    const { fetchCart } = useCartStore();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchWishlistProducts();
    }, [wishlist]);

    const fetchWishlistProducts = async () => {
        if (wishlist.length === 0) {
            setProducts([]);
            setLoading(false);
            return;
        }

        try {
            // In a real app, we'd have a bulk fetch endpoint. 
            // Here we'll fetch individually or use the existing list if we had it.
            const productPromises = wishlist.map(item => api.get(`/products/${item.productId}`));
            const responses = await Promise.all(productPromises);
            setProducts(responses.map(res => res.data));
        } catch (err) {
            console.error("Failed to fetch wishlist products", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = async (product: Product) => {
        try {
            await api.post("/cart/add", { productId: product.id, quantity: 1 });
            useCartStore.getState().fetchCart();
            toast.success(`${product.name} added to cart!`);
        } catch (err) {
            toast.error("Failed to add to cart");
        }
    };

    if (loading) {
        return (
            <div className="wishlist-loading">
                <div className="loader"></div>
            </div>
        );
    }

    return (
        <div className="wishlist-page">
            <div className="wishlist-container">
                <div className="wishlist-header">
                    <Link to="/products" className="back-link">
                        <ArrowLeft size={20} />
                        <span>Continue Shopping</span>
                    </Link>
                    <h1 className="wishlist-title">My Wishlist</h1>
                </div>

                {products.length === 0 ? (
                    <div className="empty-wishlist glass-morphism">
                        <Heart size={64} className="empty-icon" />
                        <h2>Your wishlist is empty</h2>
                        <p>Save items you love here to find them later!</p>
                        <Link to="/products" className="browse-btn">Browse Products</Link>
                    </div>
                ) : (
                    <div className="wishlist-grid">
                        {products.map(product => (
                            <div key={product.id} className="wishlist-card glass-morphism">
                                <Link to={`/products/${product.id}`} className="card-image-wrapper">
                                    {product.imageUrl ? (
                                        <img src={product.imageUrl} alt={product.name} className="product-image" />
                                    ) : (
                                        <div className="image-placeholder">{product.name[0]}</div>
                                    )}
                                </Link>
                                <div className="card-content">
                                    <div className="card-info">
                                        <h3 className="product-name">{product.name}</h3>
                                        <p className="product-price">₹{product.price}</p>
                                    </div>
                                    <div className="card-actions">
                                        <button
                                            className="action-btn cart-btn"
                                            onClick={() => handleAddToCart(product)}
                                            title="Add to Cart"
                                        >
                                            <ShoppingCart size={18} />
                                            <span>Add to Cart</span>
                                        </button>
                                        <button
                                            className="action-btn remove-btn"
                                            onClick={() => removeFromWishlist(product.id)}
                                            title="Remove from Wishlist"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
