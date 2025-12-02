import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  function handleLogout() {
    localStorage.removeItem("token");
    navigate("/");
  }

  return (
    <nav
      style={{
        display: "flex",
        gap: "20px",
        padding: "10px",
        background: "#f2f2f2",
        marginBottom: "20px",
      }}
    >
      <Link to="/">Home</Link>

      {!token && (
        <>
          <Link to="/">Login</Link>
          <Link to="/signup">Signup</Link>
        </>
      )}

      {token && (
        <>
          <Link to="/products">Products</Link>
          <Link to="/cart">Cart</Link>
          <button onClick={handleLogout} style={{ cursor: "pointer" }}>
            Logout
          </button>
        </>
      )}
    </nav>
  );
}
