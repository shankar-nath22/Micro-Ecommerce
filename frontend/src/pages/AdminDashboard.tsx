import { useState, useEffect } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import { useUserStore } from "../store/userStore";
import { Navigate, useNavigate, Link } from "react-router-dom";
import Swal from "sweetalert2";
import "./AdminDashboard.css";

interface Product {
    id: string; // From product service
    name: string;
    price: number;
    stock: number; // Will hold inventory stock
}

export default function AdminDashboard() {
    const role = useUserStore((state) => state.role);
    const navigate = useNavigate();

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    type SortColumn = 'name' | 'price' | 'stock';
    type SortDirection = 'asc' | 'desc';
    const [sortColumn, setSortColumn] = useState<SortColumn>('stock');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

    if (role !== "ADMIN") {
        return <Navigate to="/products" replace />;
    }

    useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        setLoading(true);
        try {
            // Fetch products
            const productsRes = await api.get<Product[]>("/products");
            const fetchedProducts = productsRes.data;

            // Fetch inventory stock for all products simultaneously
            const productsWithStock = await Promise.all(
                fetchedProducts.map(async (p) => {
                    let inventoryStock = p.stock || 0;
                    try {
                        const stockRes = await api.get(`/inventory/stock/${p.id}`);
                        inventoryStock = stockRes.data.quantity;
                    } catch (err: any) {
                        // Ignore 404s (stock not found)
                        if (err.response?.status !== 404) {
                            console.error(`Failed to fetch stock for ${p.id}`, err);
                        }
                    }
                    return { ...p, stock: inventoryStock };
                })
            );

            setProducts(productsWithStock);
        } catch (err) {
            console.error("Failed to load inventory:", err);
            toast.error("Failed to load inventory data");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (productId: string) => {
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
                await api.delete(`/products/${productId}`);
                toast.success("Product deleted successfully");
                setProducts(products.filter(p => p.id !== productId));
            } catch (err) {
                console.error("Failed to delete product:", err);
                toast.error("Failed to delete product");
            }
        }
    };

    const handleSort = (column: SortColumn) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    const renderSortIcon = (column: SortColumn) => {
        if (sortColumn !== column) return <span className="sort-icon inactive">↕</span>;
        return <span className="sort-icon active">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
    };

    const sortedProducts = [...products].sort((a, b) => {
        let valA = a[sortColumn];
        let valB = b[sortColumn];

        if (typeof valA === 'string' && typeof valB === 'string') {
            valA = valA.toLowerCase();
            valB = valB.toLowerCase();
        }

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    return (
        <div className="admin-root">
            <div className="admin-container" style={{ maxWidth: "1000px" }}>
                <div className="admin-header-row">
                    <h1 className="admin-title" style={{ marginBottom: 0 }}>Manage Inventory</h1>
                    <button
                        className="admin-submit"
                        style={{ marginTop: 0 }}
                        onClick={() => navigate("/admin/add")}
                    >
                        + Add New Product
                    </button>
                </div>

                {loading ? (
                    <div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>
                        Loading inventory data...
                    </div>
                ) : (
                    <div className="admin-card premium-card glass-morphism" style={{ padding: "0", overflow: "hidden" }}>
                        <div className="table-responsive">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th onClick={() => handleSort('name')} className="sortable-header">Product Name {renderSortIcon('name')}</th>
                                        <th onClick={() => handleSort('price')} className="sortable-header">Price {renderSortIcon('price')}</th>
                                        <th onClick={() => handleSort('stock')} className="sortable-header">Stock {renderSortIcon('stock')}</th>
                                        <th style={{ textAlign: "right" }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>
                                                No products found.
                                            </td>
                                        </tr>
                                    ) : (
                                        sortedProducts.map((p) => (
                                            <tr key={p.id} className={p.stock < 5 ? "low-stock-row" : ""}>
                                                <td>
                                                    <div className="product-cell">
                                                        <strong>{p.name}</strong>
                                                        {p.stock < 5 && <span className="warning-badge">Low Stock</span>}
                                                    </div>
                                                </td>
                                                <td>₹{p.price.toLocaleString()}</td>
                                                <td className={p.stock === 0 ? "out-of-stock-text" : (p.stock < 5 ? "low-stock-text" : "")}>
                                                    {p.stock}
                                                </td>
                                                <td>
                                                    <div className="actions-cell">
                                                        <Link to={`/admin/edit/${p.id}`} className="action-btn edit-action">
                                                            Edit
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDelete(p.id)}
                                                            className="action-btn delete-action"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
