import { useEffect, useState } from "react";
import api from "../api/axios";
import "./Products.css"; // small styles below
import toast from "react-hot-toast";

interface Product {
  id: number;
  name: string;
  price: number;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [animating, setAnimating] = useState<number | null>(null);

  useEffect(() => {
    api
      .get<Product[]>("/products")
      .then((res) => setProducts(res.data))
      .catch(() => alert("Failed to fetch products"));
  }, []);

async function addToCart(productId: string) {
  setAnimating(Number(productId));   // trigger animation
  setTimeout(() => setAnimating(null), 700); // reset animation
  const userId = localStorage.getItem("userId")!;
  try {
    await api.post("/cart/add", {
      productId,
      quantity: 1,
    });
    toast.success("Added to cart!");
    // alert("Added to cart");
    // Optional: emit event or update cart state globally
  } catch (err) {
    console.error(err);
    alert("Failed to add to cart");
  }
}


  return (
  <div className="products-page">
    <h1 className="title">Products</h1>

    <div className="product-grid">
      {products.map((p) => (
        <div className="product-card" key={p.id}>
          <div className="product-info">
            <h3 className="product-name">{p.name}</h3>
            <p className="product-price">₹{p.price}</p>
          </div>

          <button
            className={`add-btn ${animating === p.id ? "added" : ""}`}
            onClick={() => addToCart(String(p.id))}
          >
            {animating === p.id ? "✔ Added!" : "Add to Cart"}
          </button>
        </div>
      ))}
    </div>
  </div>
);

}
