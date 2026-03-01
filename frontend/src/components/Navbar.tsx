import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useUserStore } from "../store/userStore";
import { useThemeStore } from "../store/themeStore";
import api from "../api/axios";
import Swal from "sweetalert2";
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

  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("recentSearches");
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (userRole === "ADMIN") {
      fetchLowStock();
    }
  }, [userRole, location.pathname]); // Refresh on navigation

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Live Suggestions Debounce
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
      setSuggestions(res.data.slice(0, 8)); // Limit to 8 suggestions
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

  const fetchLowStock = async () => {
    try {
      const res = await api.get<any[]>("/products");

      // Fetch accurate inventory for each product
      const itemsWithStock = await Promise.all(
        res.data.map(async (p) => {
          let stock = p.stock || 0;
          try {
            const stockRes = await api.get(`/inventory/stock/${p.id}`);
            stock = stockRes.data.quantity;
          } catch (e) { }
          return { id: p.id, name: p.name, stock };
        })
      );

      const criticallyLow = itemsWithStock.filter(item => item.stock < 5);
      setLowStockItems(criticallyLow);
    } catch (err) {
      console.error("Failed to fetch low stock alerts", err);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate(`/products`);
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

        <div className="nav-links">
          {!token && (
            <>
              <Link to="/" className="nav-link">Login</Link>
              <Link to="/signup" className="nav-link signup-btn">Get Started</Link>
            </>
          )}

          {token && (
            <>
              <div className="search-container" ref={searchRef}>
                <form
                  className={`search-form ${showDropdown ? "active" : ""}`}
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSearchSubmit(searchQuery);
                  }}
                >
                  <div className="search-input-wrapper">
                    <span className="search-icon">🔍</span>
                    <input
                      type="text"
                      placeholder="Search products..."
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
                        <div className="section-header">Recent Searches</div>
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
                          <div className="no-suggestions">No products matching "{searchQuery}"</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {userRole === "USER" && (
                <>
                  <Link to="/orders" className="nav-link">Orders</Link>
                  <Link to="/cart" className="nav-link cart-link">Cart</Link>
                </>
              )}

              {userRole === "ADMIN" && (
                <>
                  <Link to="/admin" className="nav-link admin-link">Manage Inventory</Link>
                  <div className="notification-container" ref={notifRef}>
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
                        <h4 className="dropdown-header">Low Stock Alerts</h4>
                        {lowStockItems.length === 0 ? (
                          <div className="dropdown-empty">All stock levels are healthy.</div>
                        ) : (
                          <div className="dropdown-list">
                            {lowStockItems.map(item => (
                              <div key={item.id} className="dropdown-item">
                                <span className="item-name">{item.name}</span>
                                <span className="item-stock">{item.stock} left</span>
                              </div>
                            ))}
                          </div>
                        )}
                        <Link to="/admin" className="dropdown-footer" onClick={() => setShowNotifications(false)}>
                          Review Inventory
                        </Link>
                      </div>
                    )}
                  </div>
                </>
              )}

              <Link to="/profile" className="nav-link profile-link">
                {userName ? `Hi, ${userName.split(' ')[0]}` : "Profile"}
              </Link>
              <button
                onClick={async () => {
                  const result = await Swal.fire({
                    title: "Ready to leave?",
                    text: "You will need to manually sign back in next time.",
                    icon: "question",
                    showCancelButton: true,
                    confirmButtonColor: "#ef4444",
                    cancelButtonColor: "#3b82f6",
                    confirmButtonText: "Yes, logout",
                    customClass: {
                      popup: 'swal-premium'
                    }
                  });
                  if (result.isConfirmed) {
                    logout();
                    navigate("/");
                  }
                }}
                className="logout-btn"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
