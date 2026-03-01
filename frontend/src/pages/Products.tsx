import { useEffect, useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import { useUserStore } from "../store/userStore";
import "./Products.css";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import EditProductModal from "../components/EditProductModal";

interface Product {
  id: string; // Changed from number to string to match backend ID
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl?: string;
}

export default function Products() {
  const navigate = useNavigate();
  const userRole = useUserStore((state) => state.role);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [animating, setAnimating] = useState<string | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get("search");
  const initialPage = parseInt(searchParams.get("page") || "1", 10);

  const [currentPage, setCurrentPage] = useState(initialPage > 0 ? initialPage : 1);
  const [pageInput, setPageInput] = useState(currentPage.toString());
  const itemsPerPage = 12;

  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  // Sync state changes to URL
  useEffect(() => {
    const currentParams = Object.fromEntries([...searchParams]);
    if (currentPage > 1) {
      setSearchParams({ ...currentParams, page: currentPage.toString() }, { replace: true });
    } else {
      const newParams = { ...currentParams };
      delete newParams.page;
      setSearchParams(newParams, { replace: true });
    }
  }, [currentPage, setSearchParams, searchParams]);

  useEffect(() => {
    fetchProducts();
  }, [searchQuery]);

  const fetchProducts = () => {
    setLoading(true);
    const url = searchQuery ? `/products?name=${encodeURIComponent(searchQuery)}` : "/products";
    api
      .get<Product[]>(url)
      .then((res) => {
        setProducts(res.data);
        setLoading(false);
        // Only reset to 1 if we're doing a totally new search query
        if (searchQuery && searchParams.get("page") === null) {
          setCurrentPage(1);
        }
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to fetch products");
        setLoading(false);
      });
  };

  async function addToCart(productId: string) {
    setAnimating(productId);
    const timer = setTimeout(() => setAnimating(null), 1500);

    try {
      await api.post("/cart/add", {
        productId,
        quantity: 1,
      });
      toast.success("Added to cart!");
    } catch (err: any) {
      console.error(err);
      if (err.response && err.response.status === 400 && err.response.data && err.response.data.error) {
        toast.error(err.response.data.error);
      } else {
        toast.error("Failed to add to cart");
      }
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
        <h1 className="title">
          {searchQuery ? `Search Results for "${searchQuery}"` : "Discover Products"}
        </h1>
      </div>

      {products.length === 0 && !loading && (
        <div className="no-results-container">
          <div className="no-results-icon">🔍</div>
          <h2>No results found for "{searchQuery}"</h2>
          <p>We couldn't find what you're looking for. Try checking your spelling or using more general terms.</p>
          <button
            className="clear-search-btn"
            onClick={() => {
              setSearchParams({});
              navigate("/products");
            }}
          >
            Back to All Products
          </button>
        </div>
      )}

      <div className="product-grid">
        {products
          .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
          .map((p) => (
            <div className="product-card premium-card" key={p.id}>
              <div className="image-container">
                {p.imageUrl ? (
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="product-image"
                  />
                ) : (
                  <div className="image-placeholder">
                    {p.name.charAt(0)}
                  </div>
                )}
              </div>

              <div className="product-info">
                <Link to={`/products/${p.id}`} className="product-name-link">
                  <h3 className="product-name">{p.name}</h3>
                </Link>
                <p className="product-price">₹{p.price.toLocaleString()}</p>
              </div>

              {userRole !== "ADMIN" && (
                <button
                  className={`add-btn ${animating === p.id ? "added" : ""} ${p.stock === 0 ? "out-of-stock" : ""}`}
                  onClick={() => addToCart(String(p.id))}
                  disabled={animating === p.id || p.stock === 0}
                >
                  {p.stock === 0
                    ? "Out of Stock"
                    : animating === p.id
                      ? "✔ In Cart"
                      : "Add to Cart"}
                </button>
              )}

              {userRole === "ADMIN" && (
                <div className="admin-actions">
                  <button
                    onClick={() => {
                      setEditingProductId(p.id);
                      setIsEditModalOpen(true);
                    }}
                    className="edit-btn"
                  >
                    Edit
                  </button>
                  <button
                    className="delete-btn"
                    onClick={async () => {
                      const result = await Swal.fire({
                        title: "Delete Product?",
                        text: "Are you sure you want to delete this product? This cannot be undone.",
                        icon: "warning",
                        showCancelButton: true,
                        confirmButtonColor: "#ef4444",
                        cancelButtonColor: "#3b82f6",
                        confirmButtonText: "Yes, delete it",
                        customClass: {
                          popup: 'swal-premium'
                        }
                      });

                      if (result.isConfirmed) {
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

      {products.length > itemsPerPage && (
        <div className="pagination-controls" style={{ marginTop: '40px' }}>
          <button
            onClick={() => {
              setCurrentPage(prev => Math.max(prev - 1, 1));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            Previous
          </button>
          <div className="pagination-jump">
            <span>Page</span>
            <input
              type="number"
              min="1"
              max={Math.ceil(products.length / itemsPerPage)}
              value={pageInput}
              onChange={(e) => {
                const valStr = e.target.value;
                setPageInput(valStr);
                const val = parseInt(valStr, 10);
                if (!isNaN(val) && val > 0 && val <= Math.ceil(products.length / itemsPerPage)) {
                  setCurrentPage(val);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              onBlur={() => setPageInput(currentPage.toString())}
              className="pagination-input"
            />
            <span>of {Math.ceil(products.length / itemsPerPage)}</span>
          </div>
          <button
            onClick={() => {
              setCurrentPage(prev => Math.min(prev + 1, Math.ceil(products.length / itemsPerPage)));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            disabled={currentPage >= Math.ceil(products.length / itemsPerPage)}
            className="pagination-btn"
          >
            Next
          </button>
        </div>
      )}
      {isEditModalOpen && editingProductId && (
        <EditProductModal
          productId={editingProductId}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingProductId(null);
          }}
          onSuccess={() => {
            fetchProducts();
          }}
        />
      )}
    </div>
  );
}
