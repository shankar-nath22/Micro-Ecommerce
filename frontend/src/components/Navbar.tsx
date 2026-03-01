import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useUserStore } from "../store/userStore";
import { useThemeStore } from "../store/themeStore";
import api from "../api/axios";
import Swal from "sweetalert2";
import { useNotificationStore } from "../store/notificationStore";
import { useCartStore } from "../store/cartStore";
import { useWishlistStore } from "../store/wishlistStore";
import { Heart, ShoppingBag, ShoppingCart, User, LogOut, Settings, Bell, Search, X } from "lucide-react";
import "./Navbar.css";

interface LowStockItem {
  id: string;
  name: string;
  stock: number;
}

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = useUserStore((state) => state.token);
  const userRole = useUserStore((state) => state.role);
  const userName = useUserStore((state) => state.name);
  const logout = useUserStore((state) => state.logout);
  const { theme, toggleTheme } = useThemeStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { lowStockItems, fetchLowStock, clearNotifications } = useNotificationStore();
  const { setCart: setStoreCart } = useCartStore();
  const { wishlist, fetchWishlist } = useWishlistStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("recentSearches");
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (userRole === "USER") {
      fetchWishlist();
    } else if (userRole === "ADMIN") {
      fetchLowStock();
    }
    setIsMenuOpen(false); // Close menu on navigation
  }, [userRole, location.pathname, fetchLowStock, fetchWishlist]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        const target = event.target as HTMLElement;
        if (!target.closest('.hamburger-btn')) {
          setIsMenuOpen(false);
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length > 1) {
        fetchSuggestions();
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchSuggestions = async () => {
    try {
      const res = await api.get(`/products?name=${encodeURIComponent(searchQuery.trim())}`);
      setSuggestions(res.data.slice(0, 8));
    } catch (err) {
      console.error("Failed to fetch suggestions", err);
    }
  };

  const saveRecentSearch = (query: string) => {
    const newRecent = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(newRecent);
    localStorage.setItem("recentSearches", JSON.stringify(newRecent));
  };

  const removeRecentSearch = (e: React.MouseEvent, query: string) => {
    e.stopPropagation();
    const newRecent = recentSearches.filter(s => s !== query);
    setRecentSearches(newRecent);
    localStorage.setItem("recentSearches", JSON.stringify(newRecent));
  };

  const handleSearchSubmit = (query: string) => {
    const trimmed = query.trim();
    if (trimmed) {
      saveRecentSearch(trimmed);
      navigate(`/products?search=${encodeURIComponent(trimmed)}`);
    } else {
      navigate(`/products`);
    }
    setShowDropdown(false);
    setSearchQuery(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalItems = (searchQuery.trim() === "" ? recentSearches.length : suggestions.length);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => (prev < totalItems - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => (prev > -1 ? prev - 1 : -1));
    } else if (e.key === "Enter") {
      if (selectedIndex >= 0) {
        const selected = searchQuery.trim() === "" ? recentSearches[selectedIndex] : suggestions[selectedIndex].name;
        handleSearchSubmit(selected);
      } else {
        handleSearchSubmit(searchQuery);
      }
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  return (
    <nav className="navbar glass-morphism">
      <div className="nav-container">
        <div className="nav-left">
          <Link to={token ? "/products" : "/"} className="nav-logo">
            <span className="logo-accent">Micro</span>Ecom
          </Link>
          <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle theme">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>

        <div className="nav-right">
          {token && (
            <div className="search-container" ref={searchRef}>
              <form
                className={`search-form ${showDropdown ? "active" : ""}`}
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSearchSubmit(searchQuery);
                }}
                onClick={() => {
                  if (window.innerWidth <= 500) {
                    searchInputRef.current?.focus();
                  }
                }}
              >
                <div className="search-input-wrapper">
                  <button
                    type="button"
                    className="search-back-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      searchInputRef.current?.blur();
                      setShowDropdown(false);
                    }}
                  >
                    ←
                  </button>
                  <span className="search-icon">🔍</span>
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowDropdown(true);
                      setSelectedIndex(-1);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    onKeyDown={handleKeyDown}
                    className="search-input"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="clear-btn"
                      onClick={() => {
                        setSearchQuery("");
                        setSuggestions([]);
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </form>

              {showDropdown && (searchQuery.trim() === "" ? recentSearches.length > 0 : (suggestions.length > 0 || searchQuery.trim().length > 1)) && (
                <div className="search-dropdown glass-morphism">
                  {searchQuery.trim() === "" ? (
                    <div className="dropdown-section">
                      <div className="section-header">Recent</div>
                      {recentSearches.map((query, index) => (
                        <div
                          key={query}
                          className={`suggestion-item ${selectedIndex === index ? "selected" : ""}`}
                          onClick={() => handleSearchSubmit(query)}
                        >
                          <span className="history-icon">🕒</span>
                          <span className="suggestion-text">{query}</span>
                          <button
                            className="remove-history"
                            onClick={(e) => removeRecentSearch(e, query)}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="dropdown-section">
                      {suggestions.length > 0 ? (
                        suggestions.map((p, index) => (
                          <div
                            key={p.id}
                            className={`suggestion-item ${selectedIndex === index ? "selected" : ""}`}
                            onClick={() => handleSearchSubmit(p.name)}
                          >
                            <div className="suggestion-image">
                              {p.imageUrl ? (
                                <img src={p.imageUrl} alt="" />
                              ) : (
                                <div className="image-placeholder-mini">{p.name[0]}</div>
                              )}
                            </div>
                            <div className="suggestion-info">
                              <div className="suggestion-name">{p.name}</div>
                              <div className="suggestion-price">₹{p.price}</div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="no-suggestions">No results for "{searchQuery}"</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {token && userRole === "ADMIN" && (
            <div className="notification-container sidebar-alert" ref={notifRef}>
              <button
                className="notification-bell"
                onClick={() => setShowNotifications(!showNotifications)}
                aria-label="Notifications"
              >
                🔔
                {lowStockItems.length > 0 && (
                  <span className="notification-badge">{lowStockItems.length}</span>
                )}
              </button>

              {showNotifications && (
                <div className="notification-dropdown glass-morphism">
                  <h4 className="dropdown-header">Low Stock</h4>
                  {lowStockItems.length === 0 ? (
                    <div className="dropdown-empty">All levels healthy</div>
                  ) : (
                    <div className="dropdown-list">
                      {lowStockItems.map(item => (
                        <div key={item.id} className="dropdown-item">
                          <span className="item-name">{item.name}</span>
                          <span className={`item-stock ${item.stock === 0 ? 'out-of-stock' : 'low-stock'}`}>
                            {item.stock === 0 ? 'Out of Stock' : `${item.stock} left`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  <Link to="/admin" className="dropdown-footer" onClick={() => setShowNotifications(false)}>
                    Review Settings
                  </Link>
                </div>
              )}
            </div>
          )}

          <div className={`nav-links-container ${isMenuOpen ? 'open' : ''}`} ref={menuRef}>
            {!token ? (
              <div className="nav-links">
                <Link to="/" className="nav-link">Login</Link>
                <Link to="/signup" className="nav-link signup-btn">Get Started</Link>
              </div>
            ) : (
              <div className="nav-links">
                {userRole === "USER" && (
                  <>
                    <Link to="/orders" className="nav-link">Orders</Link>
                    <Link to="/wishlist" className="nav-link wishlist-link">
                      <Heart size={20} className={wishlist.length > 0 ? "heart-filled" : ""} />
                      {wishlist.length > 0 && <span className="notif-badge">{wishlist.length}</span>}
                    </Link>
                    <Link to="/cart" className="nav-link cart-link">Cart</Link>
                  </>
                )}

                {userRole === "ADMIN" && (
                  <Link to="/admin" className="nav-link admin-link">Inventory</Link>
                )}

                <Link to="/profile" className="nav-link profile-link">
                  {userName ? `Hi, ${userName.split(' ')[0]}` : "Profile"}
                </Link>
                <button
                  onClick={async () => {
                    const result = await Swal.fire({
                      title: "Logout?",
                      text: "Are you sure you want to sign out?",
                      icon: "warning",
                      showCancelButton: true,
                      confirmButtonText: "Logout",
                      cancelButtonText: "Stay",
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
                      setStoreCart({}); // Clear cart store on logout
                      clearNotifications();
                      logout();
                      navigate("/");
                      setIsMenuOpen(false);
                    }
                  }}
                  className="logout-btn"
                >
                  Logout
                </button>
              </div>
            )}
          </div>

          {token && (
            <button
              className={`hamburger-btn ${isMenuOpen ? 'active' : ''}`}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
