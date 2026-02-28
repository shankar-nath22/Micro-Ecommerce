import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import { useUserStore } from "../store/userStore";
import "./Products.css";
import toast from "react-hot-toast";

interface Product {
  id: string; // Changed from number to string to match backend ID
  name: string;
  description: string;
  price: number;
}

export default function Products() {
  const navigate = useNavigate();
  const userRole = useUserStore((state) => state.role);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [animating, setAnimating] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Product[]>("/products")
      .then((res) => {
        setProducts(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to fetch products");
        setLoading(false);
      });
  }, []);

  async function addToCart(productId: string) {
    setAnimating(productId);
    const timer = setTimeout(() => setAnimating(null), 1500);

    try {
      await api.post("/cart/add", {
        productId,
        quantity: 1,
      });
      toast.success("Added to cart!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to add to cart");
      clearTimeout(timer);
      setAnimating(null);
    }
  }

  if (loading) {
    return (
      <div className="products-page">
        <div className="title-container">
          <h1 className="title">Loading...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="products-page">
      <div className="title-container">
        <h1 className="title">Discover Products</h1>
      </div>

      <div className="product-grid">
        {products.map((p) => (
          <div className="product-card premium-card" key={p.id}>
            <div className="image-placeholder">
              {p.name.charAt(0)}
            </div>

            <div className="product-info">
              <Link to={`/products/${p.id}`} className="product-name-link">
                <h3 className="product-name">{p.name}</h3>
              </Link>
              <p className="product-price">₹{p.price.toLocaleString()}</p>
            </div>

            {userRole !== "ADMIN" && (
              <button
                className={`add-btn ${animating === p.id ? "added" : ""}`}
                onClick={() => addToCart(String(p.id))}
                disabled={animating === p.id}
              >
                {animating === p.id ? "✔ In Cart" : "Add to Cart"}
              </button>
            )}

            {userRole === "ADMIN" && (
              <div className="admin-actions">
                <Link to={`/admin/edit/${p.id}`} className="edit-btn">
                  Edit
                </Link>
                <button
                  className="delete-btn"
                  onClick={async () => {
                    if (window.confirm("Delete this product?")) {
                      try {
                        await api.delete(`/products/${p.id}`);
                        toast.success("Product deleted");
                        setProducts(products.filter(item => item.id !== p.id));
                      } catch (err) {
                        toast.error("Failed to delete product");
                      }
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
