import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy, useEffect } from "react";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import CartSticker from "./components/CartSticker";
import { Toaster } from "react-hot-toast";
import { useThemeStore } from "./store/themeStore";
import { useCartStore } from "./store/cartStore";
import { useUserStore } from "./store/userStore";
import { useNotifications } from "./hooks/useNotifications";
import { useModalStore } from "./store/modalStore";
import EditProductModal from "./components/EditProductModal";

// Lazy-loaded pages
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const Products = lazy(() => import("./pages/Products"));
const Cart = lazy(() => import("./pages/Cart"));
const Orders = lazy(() => import("./pages/Orders"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const ProductDetails = lazy(() => import("./pages/ProductDetails"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminOrders = lazy(() => import("./pages/AdminOrders"));
const Profile = lazy(() => import("./pages/Profile"));

export default function App() {
  useNotifications();
  const theme = useThemeStore((state) => state.theme);
  const fetchCart = useCartStore((state) => state.fetchCart);
  const token = useUserStore((state) => state.token);
  const { isEditModalOpen, editingProductId, closeEditModal } = useModalStore();

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

      {/* Global Edit Modal */}
      {isEditModalOpen && editingProductId && (
        <EditProductModal
          productId={editingProductId}
          onClose={closeEditModal}
          onSuccess={() => {
            // Global refresh logic can go here if needed later
            // For now, modal handles its own closures
          }}
        />
      )}

      <Suspense fallback={<div className="grid-loader-overlay"><div className="loader-spinner"></div></div>}>
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
          <Route
            path="/admin/orders"
            element={
              <ProtectedRoute>
                <AdminOrders />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
