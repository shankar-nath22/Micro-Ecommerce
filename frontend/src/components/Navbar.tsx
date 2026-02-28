import { Link, useNavigate } from "react-router-dom";
import { useUserStore } from "../store/userStore";
import "./Navbar.css";

export default function Navbar() {
  const navigate = useNavigate();
  const token = useUserStore((state) => state.token);
  const userRole = useUserStore((state) => state.role);
  const logout = useUserStore((state) => state.logout);

  return (
    <nav className="navbar glass-morphism">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
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
              <Link to="/products" className="nav-link">Products</Link>

              {userRole === "USER" && (
                <>
                  <Link to="/orders" className="nav-link">Orders</Link>
                  <Link to="/cart" className="nav-link cart-link">Cart</Link>
                </>
              )}

              {userRole === "ADMIN" && (
                <Link to="/admin" className="nav-link admin-link">Admin</Link>
              )}
              <button
                onClick={() => {
                  logout();
                  navigate("/");
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
