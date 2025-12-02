import { useEffect, useState } from "react";
import api from "../api/axios";

export default function Products() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    api.get("/products")
      .then((res) => setProducts(res.data))
      .catch(() => alert("Failed to fetch products"));
  }, []);

  async function addToCart(productId) {
    await api.post("/cart/add", {
      userId: "1",
      productId,
      quantity: 1
    });
    alert("Added to cart");
  }

  return (
    <div>
      <h1>Products</h1>
      {products.map(p => (
        <div key={p.id}>
          <h3>{p.name}</h3>
          <p>{p.price}</p>
          <button onClick={() => addToCart(p.id)}>Add to cart</button>
        </div>
      ))}
    </div>
  );
}
