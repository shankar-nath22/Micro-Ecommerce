import { useEffect, useState } from "react";
import api from "../api/axios";

export default function Cart() {
  const [cart, setCart] = useState({});

  useEffect(() => {
    api.get("/cart/1")
      .then((res) => setCart(res.data))
      .catch(() => alert("Failed to fetch cart"));
  }, []);

  async function placeOrder() {
    await api.post("/orders", { userId: "1" });
    alert("Order placed!");
  }

  return (
    <div>
      <h1>Your Cart</h1>
      {Object.entries(cart).map(([productId, qty]) => (
        <p key={productId}>{productId}: {qty}</p>
      ))}
      <button onClick={placeOrder}>Checkout</button>
    </div>
  );
}
