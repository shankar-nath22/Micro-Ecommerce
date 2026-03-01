import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUserStore } from "../store/userStore";
import "./ProductDetails.css";

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    imageUrl?: string;
    imageUrls?: string[];
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
    const userRole = useUserStore((state) => state.role);

    const [product, setProduct] = useState<Product | null>(null);
    const [stockLevel, setStockLevel] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
    const [isZooming, setIsZooming] = useState(false);

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

    if (loading) return <div className="details-loading">Loading product...</div>;
    if (error || !product) return <div className="details-error">{error || "Product not found"}</div>;

    const isOutOfStock = stockLevel === 0;
    const isLowStock = stockLevel !== null && stockLevel > 0 && stockLevel <= 5;

    return (
        <div className="product-details-page">
            <div className="details-container">
                {!product.isActive && (
                    <div className="inactive-banner">
                        <svg className="icon" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                        <span>Item Unavailable: This product is no longer active.</span>
                    </div>
                )}

                <div className="details-content-card">
                    <div className="details-layout">
                        {/* LEFT COLUMN: Image Gallery */}
                        <div className="details-image-section">
                            <div
                                className="main-image-container"
                                onMouseMove={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const x = ((e.clientX - rect.left) / rect.width) * 100;
                                    const y = ((e.clientY - rect.top) / rect.height) * 100;
                                    setZoomPos({ x, y });
                                }}
                                onMouseEnter={() => setIsZooming(true)}
                                onMouseLeave={() => setIsZooming(false)}
                            >
                                {product.imageUrls && product.imageUrls.length > 0 ? (
                                    <>
                                        <img
                                            src={product.imageUrls[activeImageIndex]}
                                            alt={product.name}
                                            className={`product-image ${isZooming ? 'zoomed' : ''}`}
                                            style={isZooming ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` } : {}}
                                        />

                                        {/* Carousel Arrows */}
                                        {product.imageUrls.length > 1 && (
                                            <>
                                                <button
                                                    className="carousel-arrow prev"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveImageIndex((prev) => (prev === 0 ? product.imageUrls!.length - 1 : prev - 1));
                                                    }}
                                                    aria-label="Previous image"
                                                >
                                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                                                </button>
                                                <button
                                                    className="carousel-arrow next"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveImageIndex((prev) => (prev === product.imageUrls!.length - 1 ? 0 : prev + 1));
                                                    }}
                                                    aria-label="Next image"
                                                >
                                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                                </button>
                                            </>
                                        )}

                                        {isZooming && (
                                            <div className="zoom-hint">Roll over to zoom</div>
                                        )}
                                    </>
                                ) : product.imageUrl ? (
                                    <img src={product.imageUrl} alt={product.name} className="product-image" />
                                ) : (
                                    <div className="no-image-placeholder">
                                        <svg className="icon placeholder-icon" width="80" height="80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                        <span>Image Not Available</span>
                                    </div>
                                )}
                            </div>

                            {/* Thumbnail list */}
                            {product.imageUrls && product.imageUrls.length > 1 && (
                                <div className="thumbnail-gallery">
                                    {product.imageUrls.map((url, index) => (
                                        <div
                                            key={index}
                                            className={`thumbnail-item ${activeImageIndex === index ? 'active' : ''}`}
                                            onClick={() => setActiveImageIndex(index)}
                                        >
                                            <img src={url} alt={`${product.name} thumb ${index + 1}`} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* RIGHT COLUMN: Details */}
                        <div className="details-info-section">
                            <div className="brand-tag">MicroEcom Exclusive</div>
                            <h1 className="product-title">{product.name}</h1>

                            <div className="price-container">
                                <span className="product-price">₹{product.price.toLocaleString("en-IN")}</span>
                            </div>

                            <hr className="divider" />

                            <div className="description-block">
                                <h3>
                                    <svg className="icon" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7"></path></svg>
                                    Product Description
                                </h3>
                                <p className="product-desc-text">
                                    {product.description || "No description provided for this item."}
                                </p>
                            </div>

                            {/* Stock Readiness */}
                            {product.isActive && (
                                <div className="availability-block">
                                    <h3 className="availability-label">Availability</h3>
                                    <div className="stock-status-container">
                                        {isOutOfStock && (
                                            <div className="status-badge out-of-stock">
                                                <svg className="icon" width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>
                                                Sold Out
                                            </div>
                                        )}
                                        {isLowStock && (
                                            <div className="status-badge low-stock">
                                                <svg className="icon" width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>
                                                Hurry! Only {stockLevel} remaining
                                            </div>
                                        )}
                                        {stockLevel !== null && stockLevel > 5 && (
                                            <div className="status-badge in-stock">
                                                <svg className="icon" width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                                                In Stock
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Cart Actions */}
                            <div className="actions-block">
                                {product.isActive && userRole !== "ADMIN" && (
                                    <button
                                        className={`add-to-cart-btn ${isOutOfStock ? 'disabled' : ''}`}
                                        onClick={handleAddToCart}
                                        disabled={isOutOfStock}
                                    >
                                        <svg className="btn-icon" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                                        {isOutOfStock ? "Unavailable" : "Add to Cart"}
                                    </button>
                                )}

                                {userRole === "ADMIN" && (
                                    <div className="admin-warning-badge">
                                        <svg className="icon" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                        <span>Admins cannot purchase items directly.</span>
                                    </div>
                                )}

                                {success && (
                                    <div className="success-toast fade-in">
                                        <svg className="icon" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                        {success}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
