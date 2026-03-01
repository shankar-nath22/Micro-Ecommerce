import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import "./Cart.css";
import { Product } from "../types/product";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { useCartStore } from "../store/cartStore";

export default function Cart() {
  const { cart, setCart, fetchCart } = useCartStore();
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [processing, setProcessing] = useState<boolean>(false);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    try {
      setLoading(true);
      const prodRes = await api.get<Product[]>("/products");
      const prodMap: Record<string, Product> = {};
      prodRes.data.forEach((p) => (prodMap[String(p.id)] = p));
      setProducts(prodMap);

      const cartRes = await api.get<Record<string, number>>("/cart");
      setCart(cartRes.data || {});
    } catch (err) {
      console.error(err);
      toast.error("Failed to load cart");
    } finally {
      setLoading(false);
    }
  }

  async function updateQty(productId: string, qty: number) {
    if (qty < 0) return;
    try {
      await api.post("/cart/update", {
        productId,
        quantity: qty,
      });
      fetchCart();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update quantity");
    }
  }

  async function clearCart() {
    const result = await Swal.fire({
      title: "Clear Cart?",
      text: "This will remove all items from your cart.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Clear All",
      cancelButtonText: "Cancel",
      customClass: {
        popup: 'swal-premium',
        title: 'swal-title',
        htmlContainer: 'swal-text',
        confirmButton: 'swal-confirm-btn',
        cancelButton: 'swal-cancel-btn',
        icon: 'swal-icon-warning'
      },
      buttonsStyling: false
    });

    if (result.isConfirmed) {
      try {
        await api.delete("/cart/clear");
        setCart({});
        fetchCart();
        toast.success("Cart cleared");
      } catch (err) {
        console.error(err);
        toast.error("Failed to clear cart");
      }
    }
  }

  async function handleCheckout() {
    try {
      setProcessing(true);
      await api.post("/orders");
      toast.success("Order placed successfully! 🚀");
      setCart({});
      fetchCart();
    } catch (err) {
      console.error(err);
      toast.error("Failed to place order");
    } finally {
      setProcessing(false);
    }
  }

  const items = Object.entries(cart).map(([productId, qty]) => {
    const product = products[productId];
    const price = product ? Number(product.price) : 0;
    const name = product ? product.name : `Product ${productId}`;
    const subtotal = qty * price;
    return { productId, qty, price, name, subtotal };
  });

  const total = items.reduce((s, it) => s + it.subtotal, 0);

  if (loading) {
    return (
      <div className="cart-root">
        <h1 className="cart-title">Your Cart</h1>
        <p>Loading your treasures...</p>
      </div>
    );
  }

  return (
    <div className="cart-root">
      <div className="cart-header">
        <h1 className="cart-title">Your Cart</h1>
        {items.length > 0 && (
          <button className="clear-btn-header" onClick={clearCart}>
            Clear All
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <p>Your cart is empty.</p>
          <Link to="/products" className="checkout-btn" style={{ display: 'inline-block', textAlign: 'center' }}>
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="cart-container">
          <div className="cart-list">
            {items.map(({ productId, qty, price, name, subtotal }) => (
              <div key={productId} className="cart-item premium-card">
                <div className="item-image">{name.charAt(0)}</div>

                <div className="item-details">
                  <Link to={`/products/${productId}`} className="item-name-link">
                    <div className="item-name">{name}</div>
                  </Link>
                  <div className="item-price">₹{price.toLocaleString()}</div>
                </div>

                <div className="item-controls">
                  <button className="control-btn" onClick={() => updateQty(productId, qty - 1)}>-</button>
                  <span className="qty-display">{qty}</span>
                  <button className="control-btn" onClick={() => updateQty(productId, qty + 1)}>+</button>
                </div>

                <div className="item-total">₹{subtotal.toLocaleString()}</div>
              </div>
            ))}
          </div>

          <div className="cart-summary premium-card glass-morphism">
            <h2 className="summary-title">Order Summary</h2>
            <div className="summary-row">
              <span>Subtotal</span>
              <span>₹{total.toLocaleString()}</span>
            </div>
            <div className="summary-row">
              <span>Shipping</span>
              <span style={{ color: 'var(--success)' }}>Free</span>
            </div>

            <div className="summary-total">
              <span>Total</span>
              <span>₹{total.toLocaleString()}</span>
            </div>

            <button
              className="checkout-btn"
              onClick={handleCheckout}
              disabled={processing}
            >
              {processing ? "Processing..." : "Place Order"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
