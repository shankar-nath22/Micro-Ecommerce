import { useState, useEffect } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import { useUserStore } from "../store/userStore";
import { Navigate, useNavigate, Link, useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";
import "./AdminDashboard.css";
import EditProductModal from "../components/EditProductModal";
import AddProductModal from "../components/AddProductModal";

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

    const [editingProductId, setEditingProductId] = useState<string | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const [searchParams, setSearchParams] = useSearchParams();
    const initialPage = parseInt(searchParams.get("page") || "1", 10);

    const [currentPage, setCurrentPage] = useState(initialPage > 0 ? initialPage : 1);
    const [pageInput, setPageInput] = useState(currentPage.toString());
    const itemsPerPage = 10;

    // Keep input in sync with page changes (Next/Prev buttons)
    useEffect(() => {
        setPageInput(currentPage.toString());
    }, [currentPage]);

    // Sync state changes to URL
    useEffect(() => {
        const currentParams = Object.fromEntries([...searchParams]);
        if (currentPage > 1) {
            setSearchParams({ ...currentParams, page: currentPage.toString() }, { replace: true });
        } else {
            const newParams = { ...currentParams };
            delete newParams.page;
            setSearchParams(newParams, { replace: true });
        }
    }, [currentPage, setSearchParams, searchParams]);

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

            // Fetch inventory stock for all products in ONE bulk request
            const productIds = fetchedProducts.map(p => p.id);
            const stocksRes = await api.post("/inventory/stocks", productIds);
            const stocksMap: Record<string, number> = {};

            // Map the bulk results for easy lookup
            stocksRes.data.forEach((s: any) => {
                stocksMap[s.productId] = s.quantity;
            });

            const productsWithStock = fetchedProducts.map(p => ({
                ...p,
                stock: stocksMap[p.id] ?? 0
            }));

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
        setCurrentPage(1); // Reset to first page on sort
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
                        onClick={() => setIsAddModalOpen(true)}
                    >
                        + Add New Product
                    </button>
                </div>

                {loading ? (
                    <div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>
                        Loading inventory data...
                    </div>
                ) : (
                    <>
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
                                            sortedProducts
                                                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                                .map((p) => (
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
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingProductId(p.id);
                                                                        setIsEditModalOpen(true);
                                                                    }}
                                                                    className="action-btn edit-action"
                                                                >
                                                                    Edit
                                                                </button>
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
                        {products.length > itemsPerPage && (
                            <div className="pagination-controls">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
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
                                            }
                                        }}
                                        onBlur={() => setPageInput(currentPage.toString())}
                                        className="pagination-input"
                                    />
                                    <span>of {Math.ceil(products.length / itemsPerPage)}</span>
                                </div>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(products.length / itemsPerPage)))}
                                    disabled={currentPage >= Math.ceil(products.length / itemsPerPage)}
                                    className="pagination-btn"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {isEditModalOpen && editingProductId && (
                <EditProductModal
                    productId={editingProductId}
                    onClose={() => {
                        setIsEditModalOpen(false);
                        setEditingProductId(null);
                    }}
                    onSuccess={() => {
                        fetchInventory();
                    }}
                />
            )}

            {isAddModalOpen && (
                <AddProductModal
                    onClose={() => setIsAddModalOpen(false)}
                    onSuccess={() => fetchInventory()}
                />
            )}
        </div>
    );
}
