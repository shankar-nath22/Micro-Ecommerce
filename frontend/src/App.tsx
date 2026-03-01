import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Products from "./pages/Products";
import Cart from "./pages/Cart";
import Orders from "./pages/Orders";
import Wishlist from "./pages/Wishlist";
import ProtectedRoute from "./components/ProtectedRoute";
import ProductDetails from "./pages/ProductDetails";
import AdminDashboard from "./pages/AdminDashboard";
import Profile from "./pages/Profile";
import Navbar from "./components/Navbar";
import CartSticker from "./components/CartSticker";
import { Toaster } from "react-hot-toast";
import { useThemeStore } from "./store/themeStore";
import { useCartStore } from "./store/cartStore";
import { useUserStore } from "./store/userStore";
import { useEffect } from "react";
import { useNotifications } from "./hooks/useNotifications";

export default function App() {
  useNotifications();
  const theme = useThemeStore((state) => state.theme);
  const fetchCart = useCartStore((state) => state.fetchCart);
  const token = useUserStore((state) => state.token);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (token) {
      fetchCart();
    }
  }, [token, fetchCart]);

  return (
    <BrowserRouter>
      <Navbar />
      <CartSticker />
      <Toaster position="top-right" />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected Routes */}
        <Route
          path="/products"
          element={
            <ProtectedRoute>
              <Products />
            </ProtectedRoute>
          }
        />

        <Route
          path="/cart"
          element={
            <ProtectedRoute>
              <Cart />
            </ProtectedRoute>
          }
        />

        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/wishlist"
          element={
            <ProtectedRoute>
              <Wishlist />
            </ProtectedRoute>
          }
        />
        <Route
          path="/products/:id"
          element={
            <ProtectedRoute>
              <ProductDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
