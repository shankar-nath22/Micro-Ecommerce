import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUserStore } from "../store/userStore";
import Swal from "sweetalert2";
import "./Navbar.css";

export default function Navbar() {
  const navigate = useNavigate();
  const token = useUserStore((state) => state.token);
  const userRole = useUserStore((state) => state.role);
  const userName = useUserStore((state) => state.name);
  const logout = useUserStore((state) => state.logout);
  const [searchQuery, setSearchQuery] = useState("");

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
        <Link to={token ? "/products" : "/"} className="nav-logo">
          <span className="logo-accent">Micro</span>Ecom
        </Link>

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
                <Link to="/admin" className="nav-link admin-link">Admin</Link>
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
                    background: "#1e293b",
                    color: "#f8fafc"
                  });
                  if (result.isConfirmed) {
                    logout();
                    navigate("/");
                  }
                }}
                className="btn-logout"
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
