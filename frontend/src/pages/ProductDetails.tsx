import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUserStore } from "../store/userStore";
import { useCartStore } from "../store/cartStore";
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
    const fetchCart = useCartStore((state) => state.fetchCart);

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

            fetchCart(); // Sync global cart
            setSuccess("Added to cart!");
            setTimeout(() => setSuccess(""), 3000);
        } catch (err: any) {
            setError(err.message);
        }
    };

    if (loading) return <div className="details-loading">Loading product...</div>;
    if (error || !product) return <div className="details-error">{error || "Product not found"}</div>;

    const isOutOfStock = stockLevel === 0;
    const allImages = product.imageUrls && product.imageUrls.length > 0
        ? product.imageUrls
        : [product.imageUrl || ''];

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isZooming) return;
        const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
        const x = ((e.pageX - left - window.scrollX) / width) * 100;
        const y = ((e.pageY - top - window.scrollY) / height) * 100;
        setZoomPos({ x, y });
    };

    const rotateImage = (direction: 'next' | 'prev') => {
        if (direction === 'next') {
            setActiveImageIndex((prev) => (prev + 1) % allImages.length);
        } else {
            setActiveImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
        }
    };

    return (
        <div className="product-details-container">
            <div className="details-card premium-card glass-morphism">
                <div className="details-grid">
                    <div className="image-gallery">
                        <div
                            className="main-image-container"
                            onMouseEnter={() => setIsZooming(true)}
                            onMouseLeave={() => setIsZooming(false)}
                            onMouseMove={handleMouseMove}
                        >
                            <img
                                src={allImages[activeImageIndex]}
                                alt={product.name}
                                className={`main-image ${isZooming ? "zoomed" : ""}`}
                                style={isZooming ? {
                                    transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                                    transform: 'scale(2)'
                                } : {}}
                            />

                            {allImages.length > 1 && (
                                <>
                                    <button className="carousel-arrow prev" onClick={(e) => { e.stopPropagation(); rotateImage('prev'); }}>
                                        <span>‹</span>
                                    </button>
                                    <button className="carousel-arrow next" onClick={(e) => { e.stopPropagation(); rotateImage('next'); }}>
                                        <span>›</span>
                                    </button>
                                </>
                            )}
                        </div>

                        {allImages.length > 1 && (
                            <div className="thumbnail-list">
                                {allImages.map((url, index) => (
                                    <div
                                        key={index}
                                        className={`thumbnail ${activeImageIndex === index ? "active" : ""}`}
                                        onClick={() => setActiveImageIndex(index)}
                                    >
                                        <img src={url} alt={`${product.name} ${index + 1}`} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="details-info">
                        <div className="badge-row">
                            <span className={`stock-badge ${isOutOfStock ? "out" : ""}`}>
                                {isOutOfStock ? "Out of Stock" : `In Stock: ${stockLevel}`}
                            </span>
                        </div>

                        <h1 className="details-title">{product.name}</h1>
                        <p className="details-price">₹{product.price.toLocaleString()}</p>
                        <div className="details-divider"></div>

                        <div className="details-description">
                            <h3>About this product</h3>
                            <p>{product.description}</p>
                        </div>

                        <div className="details-actions">
                            {userRole !== "ADMIN" && (
                                <button
                                    className={`details-add-btn ${isOutOfStock ? "disabled" : ""}`}
                                    onClick={handleAddToCart}
                                    disabled={isOutOfStock}
                                >
                                    {isOutOfStock ? "Out of Stock" : "Add to Cart"}
                                </button>
                            )}
                            {success && <div className="success-msg animate-fade-in">{success}</div>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
