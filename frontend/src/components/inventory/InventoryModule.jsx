import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import api from "../../api/axios";
import { INV_PAGE_SIZE, DEFAULT_PAGINATION } from "../../constants";
import Stat from "../ui/Stat";
import Pagination from "../ui/Pagination";
import ComponentTable from "./ComponentTable";
import ComponentCardsGrid from "./ComponentCardsGrid";
import AddComponentForm, { PRESET_CATEGORIES } from "./AddComponentForm";
import ComponentModal from "./ComponentModal";
import ComponentHistoryModal from "./ComponentHistoryModal";
import QuickIssueModal from "./QuickIssueModal";
import MultiIssueModal from "./MultiIssueModal";
import { SearchIcon, CloseIcon, FilterIcon, PlusIcon, ChipIcon } from "../ui/Icons";

const CATEGORY_TABS = ["All", ...PRESET_CATEGORIES];

/**
 * InventoryModule
 * Lists components with optimized search, category filtering,
 * rich card view for students (with images and stock status),
 * management table + history for admins, and responsive pagination.
 * Props:
 *   token       {string}
 *   user        {object}  — { role, ... }
 *   onNavigate  {(mod: string) => void}
 *   refreshRef  {React.MutableRefObject}  — wired to keyboard shortcut R
 *   pageNavRef  {React.MutableRefObject}  — wired to keyboard shortcuts ← →
 */
function InventoryModule({ token, user, onNavigate, refreshRef, pageNavRef }) {
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);
  const isAdmin = user.role === "admin";

  const [components,        setComponents]        = useState([]);
  const [pagination,        setPagination]        = useState(DEFAULT_PAGINATION);
  const [message,           setMessage]           = useState("");
  const [loading,           setLoading]           = useState(false);

  // Search & Filter state
  const [searchTerm,        setSearchTerm]        = useState("");
  const [activeCategory,    setActiveCategory]    = useState("All");

  // View state: Admin can toggle between Table and Cards; Students always get Cards
  const [viewMode,          setViewMode]          = useState(isAdmin ? "table" : "cards");

  // Modals state
  const [showAddModal,           setShowAddModal]           = useState(false);
  const [selectedComponent,      setSelectedComponent]      = useState(null);
  const [historyComponent,       setHistoryComponent]       = useState(null);
  const [selectedIssueComponent, setSelectedIssueComponent] = useState(null);

  // Multi-issue cart (students only)
  const [cartItems,    setCartItems]    = useState([]);  // [{ component, quantity }]
  const [showCart,     setShowCart]     = useState(false);

  // ── Optimized Data fetching ──────────────────────────────────
  const load = useCallback(async (page = 1, search = searchTerm, category = activeCategory) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(INV_PAGE_SIZE),
      });

      if (search && search.trim()) {
        params.append("search", search.trim());
      }
      if (category && category !== "All") {
        params.append("category", category);
      }

      const res = await api.get(`/components?${params.toString()}`, { headers });
      setComponents(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      setMessage(err.response?.data?.message || "Could not load inventory.");
    } finally {
      setLoading(false);
    }
  }, [headers, searchTerm, activeCategory]);

  // Single consolidated effect for mount, search debounce, and category changes
  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      load(1, "", activeCategory);
      return;
    }
    const timer = setTimeout(() => {
      load(1, searchTerm, activeCategory);
    }, 220);
    return () => clearTimeout(timer);
  }, [searchTerm, activeCategory]); // eslint-disable-line react-hooks/exhaustive-deps

  // Wire up keyboard shortcut refs
  useEffect(() => {
    if (refreshRef) {
      refreshRef.current = () => load(pagination.currentPage, searchTerm, activeCategory);
    }
    if (pageNavRef) {
      pageNavRef.current = {
        prev: () => {
          if (pagination.currentPage > 1) {
            load(pagination.currentPage - 1, searchTerm, activeCategory);
          }
        },
        next: () => {
          if (pagination.currentPage < pagination.totalPages) {
            load(pagination.currentPage + 1, searchTerm, activeCategory);
          }
        },
      };
    }
  });

  // ── Actions ─────────────────────────────────────────────────
  const handleAdd = async (form) => {
    try {
      await api.post("/components", {
        ...form,
        totalQuantity: Number(form.totalQuantity),
        lowStockLimit: Number(form.lowStockLimit),
      }, { headers });
      setMessage("Component added successfully with image & category.");
      load(1, searchTerm, activeCategory);
    } catch (err) {
      setMessage(err.response?.data?.message || "Could not add component.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this component from inventory?")) return;
    try {
      await api.delete(`/components/${id}`, { headers });
      setMessage("Component deleted.");
      load(pagination.currentPage, searchTerm, activeCategory);
    } catch (err) {
      setMessage(err.response?.data?.message || "Delete failed.");
    }
  };

  const handleRequestClick = (comp) => {
    if (isAdmin) {
      // Admin: direct issue via QuickIssueModal
      setSelectedIssueComponent(comp);
    } else {
      // Student: add to multi-issue cart
      setCartItems((prev) => {
        const exists = prev.find((item) => item.component._id === comp._id);
        if (exists) return prev; // Already in cart, don't duplicate
        return [...prev, { component: comp, quantity: 1 }];
      });
      setMessage(`${comp.name} added to your issue cart!`);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  // ── Derived values (for admin stats) ─────────────────────────
  const lowStockCount = useMemo(
    () => components.filter((c) => c.availableQuantity <= (c.lowStockLimit ?? 2)).length,
    [components]
  );
  const unitsInStock = useMemo(
    () => components.reduce((sum, c) => sum + (c.availableQuantity || 0), 0),
    [components]
  );

  return (
    <section className="inventory-section" style={{ paddingBottom: "1rem" }}>
      {/* Stats row — ONLY shown for Admin as requested */}
      {isAdmin && (
        <div className="stats">
          <Stat label="Total Components" value={pagination.totalItems} />
          <Stat label="Units in Stock"   value={unitsInStock} />
          <Stat label="Low Stock Alert"  value={lowStockCount} />
        </div>
      )}

      {message && <div className="alert">{message}</div>}

      <div className="content-single">
        {/* Main Panel */}
        <div className="panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">SmartLab Catalog</span>
              <h3>
                {isAdmin ? "Inventory Management" : "Explore Lab Components"}
              </h3>
            </div>
            <div className="head-actions">
              {/* Admin Add Component button */}
              {isAdmin && (
                <button
                  type="button"
                  className="primary"
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                  onClick={() => setShowAddModal(true)}
                  title="Add a new component to inventory"
                >
                  <PlusIcon size={14} />
                  <span>Add Component</span>
                </button>
              )}

              {/* Admin view mode switch: Table / Cards */}
              {isAdmin && (
                <div className="view-mode-toggle">
                  <button
                    type="button"
                    className={`view-toggle-btn ${viewMode === "table" ? "active" : ""}`}
                    onClick={() => setViewMode("table")}
                    title="Table View"
                  >
                    Table
                  </button>
                  <button
                    type="button"
                    className={`view-toggle-btn ${viewMode === "cards" ? "active" : ""}`}
                    onClick={() => setViewMode("cards")}
                    title="Cards View"
                  >
                    Cards
                  </button>
                </div>
              )}

              <button
                type="button"
                className="ghost"
                onClick={() => load(pagination.currentPage, searchTerm, activeCategory)}
              >
                Refresh
              </button>
            </div>
          </div>

          {/* Search Bar & Category Filter Bar */}
          <div className="inventory-controls">
            {/* Search Input */}
            <div className="search-bar-wrap">
              <span className="search-icon"><SearchIcon size={16} /></span>
              <input
                type="text"
                className="search-input"
                placeholder="Search components by name, ID, specs, location, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearchTerm("")}
                  title="Clear search"
                  aria-label="Clear search"
                >
                  <CloseIcon size={13} />
                </button>
              )}
            </div>

            {/* Category Filter Chips */}
            <div className="category-chips-scroll">
              <span className="category-filter-label">
                <FilterIcon size={12} /> Category:
              </span>
              <div className="category-chips-list">
                {CATEGORY_TABS.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`category-chip ${activeCategory === cat ? "active" : ""}`}
                    onClick={() => setActiveCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Catalog Content: Cards for Students, or Table/Cards for Admin */}
          {loading ? (
            <div className="loading-state">Loading components…</div>
          ) : viewMode === "cards" || !isAdmin ? (
            <>
              <ComponentCardsGrid
                components={components}
                isAdmin={isAdmin}
                onSelect={(comp) => setSelectedComponent(comp)}
                onRequest={handleRequestClick}
                onHistory={(comp) => setHistoryComponent(comp)}
                onDelete={handleDelete}
              />

              <div className="pagination-row">
                <span className="pagination-info">
                  {pagination.totalItems} component{pagination.totalItems !== 1 ? "s" : ""} found
                  {activeCategory !== "All" && ` in ${activeCategory}`}
                  {searchTerm && ` matching "${searchTerm}"`} · page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <Pagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  onPageChange={(p) => load(p, searchTerm, activeCategory)}
                />
              </div>
            </>
          ) : (
            <>
              <ComponentTable
                components={components}
                isAdmin={isAdmin}
                onSelect={(comp) => setSelectedComponent(comp)}
                onHistory={(comp) => setHistoryComponent(comp)}
                onDelete={handleDelete}
                onRequest={handleRequestClick}
              />

              <div className="pagination-row">
                <span className="pagination-info">
                  {pagination.totalItems} component{pagination.totalItems !== 1 ? "s" : ""} found
                  {activeCategory !== "All" && ` in ${activeCategory}`}
                  {searchTerm && ` matching "${searchTerm}"`} · page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <Pagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  onPageChange={(p) => load(p, searchTerm, activeCategory)}
                />
              </div>
            </>
          )}
        </div>

      </div>

      {/* Add Component Modal for Admin */}
      {showAddModal && (
        <AddComponentForm
          onAdd={handleAdd}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* Component Details Modal */}
      {selectedComponent && (
        <ComponentModal
          component={selectedComponent}
          isAdmin={isAdmin}
          onHistory={(comp) => setHistoryComponent(comp)}
          onClose={() => setSelectedComponent(null)}
        />
      )}

      {/* Direct Component Issue Modal for Students */}
      {selectedIssueComponent && (
        <QuickIssueModal
          component={selectedIssueComponent}
          token={token}
          onClose={() => setSelectedIssueComponent(null)}
          onSuccess={(msg) => {
            setMessage(msg);
            load(pagination.currentPage, searchTerm, activeCategory);
          }}
        />
      )}

      {/* Component Issue & Return History Modal (Admin Only) */}
      {historyComponent && (
        <ComponentHistoryModal
          component={historyComponent}
          token={token}
          isAdmin={isAdmin}
          onClose={() => setHistoryComponent(null)}
        />
      )}

      {/* Multi-Issue Cart FAB for Students */}
      {!isAdmin && cartItems.length > 0 && (
        <div
          className="fixed bottom-6 right-6 z-[90] flex flex-col items-end gap-2"
        >
          <button
            type="button"
            onClick={() => setShowCart(true)}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl font-bold text-sm shadow-2xl shadow-amber-500/30 transition-all hover:scale-105 active:scale-95"
            style={{ backgroundColor: "#fca311", color: "#000" }}
            title="Open issue cart"
          >
            <ChipIcon size={18} />
            <span>Cart</span>
            <span
              className="w-6 h-6 rounded-full bg-black/20 text-black text-xs font-black flex items-center justify-center"
            >
              {cartItems.length}
            </span>
          </button>
          <button
            type="button"
            className="text-[11px] font-semibold px-3 py-1 rounded-xl transition-colors"
            style={{ backgroundColor: "var(--surface-2)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
            onClick={() => setCartItems([])}
          >
            Clear cart
          </button>
        </div>
      )}

      {/* Multi-Component Issue Cart Modal (Students) */}
      {showCart && (
        <MultiIssueModal
          cartItems={cartItems}
          onUpdateCart={setCartItems}
          token={token}
          onClose={() => setShowCart(false)}
          onSuccess={(msg) => {
            setMessage(msg);
            setCartItems([]);
            load(pagination.currentPage, searchTerm, activeCategory);
          }}
        />
      )}
    </section>
  );
}

export default InventoryModule;
