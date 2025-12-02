import { useEffect, useState } from "react";
import api from "../api/axios";

interface Product {
  id: number;
  name: string;
  price: number;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    api
      .get<Product[]>("/products")
      .then((res) => setProducts(res.data))
      .catch(() => alert("Failed to fetch products"));
  }, []);

async function addToCart(productId: number | string) {
  try {
    await api.post("/cart/add", {
      userId: "1",
      productId,
      quantity: 1,
    });
    alert("Added to cart");
    // Optional: emit event or update cart state globally
  } catch (err) {
    console.error(err);
    alert("Failed to add to cart");
  }
}


  return (
    <div>
      <h1>Products</h1>
      {products.map((p) => (
        <div key={p.id}>
          <h3>{p.name}</h3>
          <p>{p.price}</p>
          <button onClick={() => addToCart(p.id)}>Add to cart</button>
        </div>
      ))}
    </div>
  );
}
