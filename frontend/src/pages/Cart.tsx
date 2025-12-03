// src/pages/Cart.tsx
import React, { useEffect, useState } from "react";
import api from "../api/axios";
import "./Cart.css"; // small styles below
import { Product } from "../types/product"; // small type file (provided below)


type CartMap = Record<string, number>;

export default function Cart() {
  const USER_ID = localStorage.getItem("userId")!;
  const [cart, setCart] = useState<CartMap>({});
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [animateItem, setAnimateItem] = useState<string | null>(null);
  
  useEffect(() => {
    loadAll();
    // optionally poll/update on interval or subscribe
  }, []);

  async function loadAll() {
    try {
      setLoading(true);
      // 1) fetch products
      const prodRes = await api.get<Product[]>("/products");
      const prodMap: Record<string, Product> = {};
      prodRes.data.forEach((p) => (prodMap[String(p.id)] = p));
      setProducts(prodMap);

      // 2) fetch cart
      const cartRes = await api.get<CartMap>("/cart");
      setCart(cartRes.data || {});
    } catch (err) {
      console.error(err);
      setError("Failed to load cart");
    } finally {
      setLoading(false);
    }
  }

  // update quantity (local + backend)
async function updateQty(productId: string, qty: number) {
  try {
    setAnimateItem(productId);
    setTimeout(() => setAnimateItem(null), 300);
    await api.post("/cart/update", {
      // userId: USER_ID,
      productId,
      quantity: qty,
    });

    const cartRes = await api.get<CartMap>("/cart");
    setCart(cartRes.data || {});
  } catch (err) {
    console.error(err);
    setError("Failed to update cart");
  }
}


  async function clearCart() {
    try {
      await api.delete("/cart/clear");
      setCart({});
    } catch (err) {
      console.error(err);
      setError("Failed to clear cart");
    }
  }

  // compute subtotal per item and total
  const items = Object.entries(cart).map(([productId, qty]) => {
    const product = products[productId];
    const price = product ? Number(product.price) : 0;
    const name = product ? product.name : `Product ${productId}`;
    const subtotal = qty * price;
    return { productId, qty, price, name, subtotal };
  });

  const total = items.reduce((s, it) => s + it.subtotal, 0);

  if (loading) return <div className="cart-root">Loading...</div>;
  if (error) return <div className="cart-root error">{error}</div>;

  return (
    <div className="cart-root">
      <h1>Your Cart</h1>

      {items.length === 0 ? (
        <div className="empty">Your cart is empty.</div>
      ) : (
        <>
          <div className="cart-list">
            {items.map(({ productId, qty, price, name, subtotal }) => (
              <div key={productId} className="cart-item" style={{ animation: "slideIn 0.3s" }}>
                <div className="left">
                  <div className="name">{name}</div>
                  <div className="price">₹{price.toFixed(2)}</div>
                </div>

                <div className="center">
                  <button className="qty-btn" onClick={() => updateQty(productId, qty - 1)}>
                    -
                  </button>
                  <div className={`qty ${animateItem === productId ? "pop" : ""}`}>{qty}</div>
                  <button className="qty-btn" onClick={() => updateQty(productId, qty + 1)}>
                    +
                  </button>
                </div>

                <div className="right">
                  <div className="subtotal">₹{subtotal.toFixed(2)}</div>
                  <button
                    className="remove"
                    onClick={() => updateQty(productId, 0)}
                    title="Remove item"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-footer">
            <div className="total">Total: ₹{total.toFixed(2)}</div>
            <div className="actions">
              <button className="clear" onClick={clearCart}>
                Clear Cart
              </button>
              <button
                className="checkout"
                onClick={async () => {
                  try {
                    await api.post("/orders");
                    alert("Order placed!");
                    await loadAll();
                  } catch (err) {
                    console.error(err);
                    alert("Failed to place order");
                  }
                }}
              >
                Checkout
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
