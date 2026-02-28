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

  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

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
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
              <form className="search-form" onSubmit={handleSearch}>
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                <button type="submit" className="search-btn">🔍</button>
              </form>

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
