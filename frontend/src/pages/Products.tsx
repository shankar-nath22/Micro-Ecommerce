import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import { Product } from "../types/product";
import { useUserStore } from "../store/userStore";
import { useCartStore } from "../store/cartStore";
import "./Products.css";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import EditProductModal from "../components/EditProductModal";
import { useWishlistStore } from "../store/wishlistStore";
import { Heart, Laptop, Shirt, Home, Sparkles, Dumbbell, Watch, Layers, ChevronRight, LayoutGrid, List as ListIcon, SlidersHorizontal } from "lucide-react";
import StarRating from "../components/StarRating";

export default function Products() {
  const navigate = useNavigate();
  const userRole = useUserStore((state) => state.role);
  const { wishlist, addToWishlist, removeFromWishlist, isInWishlist } = useWishlistStore();
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
  const [ratings, setRatings] = useState<Record<string, { averageRating: number; numReviews: number }>>({});

  // Advanced Filters
  const [selectedCategories, setSelectedCategories] = useState<string[]>(searchParams.getAll("category") || []);
  const [minPrice, setMinPrice] = useState<number | "">(searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : "");
  const [maxPrice, setMaxPrice] = useState<number | "">(searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : "");
  const [inStockOnly, setInStockOnly] = useState<boolean>(searchParams.get("inStock") === "true");
  const [sortBy, setSortBy] = useState<string>(searchParams.get("sort") || "latest");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const itemsPerPage = 12;

  const productsRef = useRef<HTMLDivElement>(null);

  const scrollToProducts = () => {
    productsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const categories = [
    { name: "All", icon: <Layers size={20} /> },
    { name: "Electronics", icon: <Laptop size={20} /> },
    { name: "Fashion", icon: <Shirt size={20} /> },
    { name: "Home", icon: <Home size={20} /> },
    { name: "Beauty", icon: <Sparkles size={20} /> },
    { name: "Sports", icon: <Dumbbell size={20} /> },
    { name: "Accessories", icon: <Watch size={20} /> },
  ];

  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  // Reset pagination to page 1 when the search query changes
  useEffect(() => {
    if (searchQuery) {
      setCurrentPage(1);
    }
  }, [searchQuery]);

  // Sync state changes to URL
  useEffect(() => {
    const nextParams = new URLSearchParams();

    if (currentPage > 1) nextParams.set("page", currentPage.toString());
    if (searchQuery) nextParams.set("search", searchQuery);

    selectedCategories.forEach(cat => nextParams.append("category", cat));

    if (minPrice !== "") nextParams.set("minPrice", minPrice.toString());
    if (maxPrice !== "") nextParams.set("maxPrice", maxPrice.toString());
    if (inStockOnly) nextParams.set("inStock", "true");
    if (sortBy !== "latest") nextParams.set("sort", sortBy);

    setSearchParams(nextParams, { replace: true });
  }, [currentPage, selectedCategories, minPrice, maxPrice, inStockOnly, sortBy, searchQuery, setSearchParams]);

  useEffect(() => {
    fetchProducts();
  }, [searchQuery, selectedCategories, minPrice, maxPrice, inStockOnly, sortBy]);

  useEffect(() => {
    if (products.length > 0) {
      const visibleProductIds = products
        .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
        .map(p => p.id);

      if (visibleProductIds.length > 0) {
        api.post('/reviews/stats/bulk', { productIds: visibleProductIds })
          .then(res => {
            setRatings(prev => ({ ...prev, ...res.data }));
          })
          .catch(err => console.error("Failed to fetch ratings", err));
      }
    }
  }, [products, currentPage]);

  const fetchProducts = () => {
    setLoading(true);
    let url = "/products";
    const params = new URLSearchParams();

    if (searchQuery) params.append("name", searchQuery);
    // Fixed: backend @RequestParam is named 'categories'
    selectedCategories.forEach(cat => params.append("categories", cat));
    if (minPrice !== "") params.append("minPrice", minPrice.toString());
    if (maxPrice !== "" && maxPrice < 100000) params.append("maxPrice", maxPrice.toString());
    if (inStockOnly) params.append("inStock", "true");

    const queryString = params.toString();
    if (queryString) url += `?${queryString}`;
    api
      .get<Product[]>(url)
      .then((res) => {
        let sortedData = [...res.data];

        // Frontend Sorting Logic
        if (sortBy === "price-low") {
          sortedData.sort((a, b) => a.price - b.price);
        } else if (sortBy === "price-high") {
          sortedData.sort((a, b) => b.price - a.price);
        } else if (sortBy === "rating") {
          // Sort by average rating (descending)
          // Note: Full rating sorting requires bulk stats to be already fetched or handled differently
          // For now, we sort by what we have or just price as fallback
        }

        setProducts(sortedData);
        setLoading(false);
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
      useCartStore.getState().fetchCart();
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

  // Removed early loading return to prevent layout collapse and scroll jumps

  const handleCategoryChange = (catName: string) => {
    if (catName === "All") {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(prev =>
        prev.includes(catName)
          ? prev.filter(c => c !== catName)
          : [...prev, catName]
      );
    }
    setCurrentPage(1);
  };

  return (
    <div className="products-page bacola-style">
      {/* Breadcrumbs */}
      <nav className="breadcrumbs-container">
        <div className="breadcrumbs">
          <Link to="/">Home</Link>
          <ChevronRight size={14} className="breadcrumb-separator" />
          <span>Shop</span>
          {selectedCategories.length > 0 && (
            <>
              <ChevronRight size={14} className="breadcrumb-separator" />
              <span>{selectedCategories.join(", ")}</span>
            </>
          )}
        </div>
      </nav>

      {/* Hero Banner */}
      <div className="shop-banner">
        <div className="banner-content">
          <span className="banner-subtitle">Premium Collections 2026</span>
          <h1 className="banner-title">Upgrade your <span>Lifestyle</span></h1>
          <p className="banner-text">Discover latest electronics, fashion, and home essentials with exclusive deals.</p>
          <button className="shop-now-btn" onClick={scrollToProducts}>Explore Now</button>
        </div>
        <div className="banner-overlay"></div>
      </div>

      <div className="products-layout">
        <aside className="filter-sidebar">
          {/* Categories Filter */}
          <div className="filter-section">
            <h3 className="filter-title">Product Categories</h3>
            <div className="checkbox-list">
              {categories.map((cat) => (
                <label key={cat.name} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={cat.name === "All" ? selectedCategories.length === 0 : selectedCategories.includes(cat.name)}
                    onChange={() => handleCategoryChange(cat.name)}
                  />
                  <span className="checkbox-custom"></span>
                  <div className="category-label-content">
                    {cat.icon}
                    <span className="checkbox-label">{cat.name}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="filter-section">
            <h3 className="filter-title">Filter by Price</h3>
            <div className="price-slider-container">
              <div className="dual-slider">
                <div className="slider-row">
                  <div className="slider-header">
                    <label>Min Price</label>
                    <div className="price-input-wrapper">
                      <span className="currency-prefix">₹</span>
                      <input
                        type="number"
                        className="numeric-price-input"
                        value={minPrice}
                        onChange={(e) => {
                          const val = e.target.value === "" ? "" : Number(e.target.value);
                          setMinPrice(val);
                        }}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100000"
                    step="1000"
                    value={minPrice || 0}
                    onChange={(e) => setMinPrice(Number(e.target.value))}
                    className="price-slider"
                  />
                </div>

                <div className="slider-row">
                  <div className="slider-header">
                    <label>Max Price</label>
                    <div className="price-input-wrapper">
                      <span className="currency-prefix">₹</span>
                      <input
                        type="number"
                        className="numeric-price-input"
                        value={maxPrice}
                        onChange={(e) => {
                          const val = e.target.value === "" ? "" : Number(e.target.value);
                          setMaxPrice(val);
                        }}
                        placeholder="100,000"
                      />
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100000"
                    step="1000"
                    value={maxPrice === "" ? 100000 : maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="price-slider"
                  />
                </div>
              </div>

              <div className="price-values">
                <div className="price-range-label">
                  <span className="price-label-text">Range selected:</span>
                  <span className="price-amount">
                    ₹{(minPrice || 0).toLocaleString()} — {maxPrice === "" || maxPrice >= 100000 ? "₹100,000+" : `₹${maxPrice.toLocaleString()}`}
                  </span>
                </div>
                <button className="filter-go-btn" onClick={() => fetchProducts()}>
                  APPLY FILTER
                </button>
              </div>
            </div>
          </div>

          {/* Status Filter */}
          <div className="filter-section">
            <h3 className="filter-title">Availability</h3>
            <div className="checkbox-list">
              <label className="checkbox-item">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={() => setInStockOnly(!inStockOnly)}
                />
                <span className="checkbox-custom"></span>
                <span className="checkbox-label">In Stock Only</span>
              </label>
            </div>
          </div>
        </aside>

        <div className="main-content" ref={productsRef}>
          {/* Controls Bar */}
          <div className="controls-bar">
            <div className="view-toggles">
              <button
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Grid View"
              >
                <LayoutGrid size={20} />
              </button>
              <button
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="List View"
              >
                <ListIcon size={20} />
              </button>
            </div>

            <div className="results-count">
              Showing {products.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}–
              {Math.min(currentPage * itemsPerPage, products.length)} of {products.length} products
            </div>

            <div className="sort-controls">
              <span className="sort-label">Sort by:</span>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="latest">Latest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>

          <div className="product-grid-wrapper">
            {loading && (
              <div className="grid-loader-overlay">
                <div className="loader-spinner"></div>
              </div>
            )}

            <div className={`product-grid ${viewMode}`}>
              {products
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map((p) => (
                  <div
                    className={`product-card premium-card ${viewMode}-card`}
                    key={p.id}
                    onClick={() => navigate(`/products/${p.id}`)}
                  >
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
                      {userRole === "USER" && (
                        <button
                          className={`wishlist-toggle ${isInWishlist(p.id) ? 'active' : ''}`}
                          onClick={async (e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            try {
                              if (isInWishlist(p.id)) {
                                await removeFromWishlist(p.id);
                                toast.success("Removed from wishlist");
                              } else {
                                await addToWishlist(p.id);
                                toast.success("Added to wishlist!");
                              }
                            } catch (err) {
                              toast.error("Wishlist sync failed");
                            }
                          }}
                        >
                          <Heart size={20} fill={isInWishlist(p.id) ? "currentColor" : "none"} />
                        </button>
                      )}
                    </div>

                    <div className="product-info">
                      <Link to={`/products/${p.id}`} className="product-name-link" onClick={(e) => e.stopPropagation()}>
                        <h3 className="product-name">{p.name}</h3>
                      </Link>
                      <div className="product-rating-row">
                        <StarRating rating={ratings[p.id]?.averageRating || 0} size={14} />
                        <span className="rating-count">({ratings[p.id]?.numReviews || 0})</span>
                      </div>
                      {/* <p className="product-description">{p.description}</p> */}
                    </div>

                    <div className="action-area">
                      <p className="product-price">₹{p.price.toLocaleString()}</p>

                      {userRole !== "ADMIN" && (
                        <button
                          className={`add-btn ${animating === p.id ? "added" : ""} ${p.stock === 0 ? "out-of-stock" : ""}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(String(p.id));
                          }}
                          disabled={animating === p.id || p.stock === 0}
                        >
                          {p.stock === 0
                            ? "Out of Stock"
                            : animating === p.id
                              ? "✔ Added"
                              : "Add to Cart"}
                        </button>
                      )}

                      {userRole === "ADMIN" && (
                        <div className="admin-actions">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingProductId(p.id);
                              setIsEditModalOpen(true);
                            }}
                            className="edit-btn"
                          >
                            Edit
                          </button>
                          <button
                            className="delete-btn"
                            onClick={async (e) => {
                              e.stopPropagation();
                              const result = await Swal.fire({
                                title: "Delete Product?",
                                text: "Are you sure you want to delete this product?",
                                icon: "warning",
                                showCancelButton: true,
                                confirmButtonColor: "#ef4444",
                                cancelButtonColor: "#3b82f6",
                                confirmButtonText: "Yes, delete it"
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
                  </div>
                ))}
            </div>

            {products.length === 0 && !loading && (
              <div className="no-products-found">
                <SlidersHorizontal size={48} />
                <h3>No products found</h3>
                <p>Try adjusting your search or filters to find what you're looking for.</p>
                <button onClick={() => {
                  setSelectedCategories([]);
                  setMinPrice("");
                  setMaxPrice("");
                  setInStockOnly(false);
                  // setSearchQuery(""); // Do not reset search query here, it's from URL
                }} className="reset-filters-btn">
                  Reset All Filters
                </button>
              </div>
            )}
          </div>

          {products.length > itemsPerPage && (
            <div className="pagination-controls">
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
        </div>
      </div>

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
