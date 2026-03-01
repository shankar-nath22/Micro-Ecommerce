import { useLocation, Link } from "react-router-dom";
import { useCartStore } from "../store/cartStore";
import { useUserStore } from "../store/userStore";
import { ShoppingBag, ChevronRight } from "lucide-react";
import "./CartSticker.css";

export default function CartSticker() {
    const location = useLocation();
    const { totalCount, totalAmount } = useCartStore();
    const userRole = useUserStore((state) => state.role);
    const token = useUserStore((state) => state.token);

    // Don't show on cart, login, signup, or profile pages, or for admins
    const hiddenPaths = ["/cart", "/", "/signup", "/admin", "/profile"];
    const isHidden = hiddenPaths.includes(location.pathname) || userRole === "ADMIN" || !token;

    if (isHidden || totalCount === 0) return null;

    return (
        <div className="cart-sticker-root">
            <Link to="/cart" className="cart-sticker-content glass-morphism">
                <div className="cart-sticker-left">
                    <div className="cart-sticker-badge">
                        <ShoppingBag size={18} />
                        <span className="count-pill">{totalCount}</span>
                    </div>
                    <div className="cart-sticker-info">
                        <span className="info-label">{totalCount} Item{totalCount > 1 ? 's' : ''}</span>
                        <span className="info-price">₹{totalAmount.toLocaleString()}</span>
                    </div>
                </div>

                <div className="cart-sticker-right">
                    <span className="view-cart-text">View Cart</span>
                    <ChevronRight size={20} />
                </div>
            </Link>
        </div>
    );
}
