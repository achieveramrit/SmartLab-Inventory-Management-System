import { ChipIcon, EyeIcon, HistoryIcon, TrashIcon, BoltIcon } from "../ui/Icons";

/**
 * ComponentTable
 * Renders the inventory table with component image thumbnails, category tags,
 * stock status, and actions (Inspect, History & Delete).
 * Props:
 *   components {Array}    — list of component objects from API
 *   isAdmin    {boolean}
 *   onSelect   {(component: object) => void}  — opens component details modal
 *   onHistory  {(component: object) => void}  — opens component history modal
 *   onDelete   {(id: string) => void}
 */
function ComponentTable({ components, isAdmin, onSelect, onHistory, onDelete, onRequest }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th style={{ width: "46px" }}>Item</th>
            <th>Component Details</th>
            <th>ID</th>
            <th>Category</th>
            <th>Available</th>
            <th>Location</th>
            <th style={{ textAlign: "right" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {components.length === 0 && (
            <tr>
              <td colSpan={7} className="empty">
                No components found matching your search.
              </td>
            </tr>
          )}
          {components.map((c) => (
            <tr key={c._id} className="component-row" onClick={() => onSelect?.(c)}>
              {/* Image thumbnail */}
              <td onClick={(e) => { e.stopPropagation(); onSelect?.(c); }}>
                <div className="component-thumb-wrap">
                  {c.imageUrl ? (
                    <img
                      src={c.imageUrl}
                      alt={c.name}
                      className="component-thumb"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        e.currentTarget.nextSibling.style.display = "grid";
                      }}
                    />
                  ) : null}
                  <div
                    className="component-thumb-fallback"
                    style={{ display: c.imageUrl ? "none" : "grid" }}
                  >
                    <ChipIcon size={16} />
                  </div>
                </div>
              </td>

              {/* Name & description */}
              <td>
                <strong className="component-name-link">{c.name}</strong>
                <small className="component-desc-truncate">{c.description || "No specifications added"}</small>
              </td>

              <td>
                <span className="component-id-chip">{c.componentId}</span>
              </td>

              <td>
                <span className="category-tag">{c.category}</span>
              </td>

              <td>
                <div className="stock-cell">
                  <span className={c.availableQuantity <= c.lowStockLimit ? "stock low" : "stock"}>
                    {c.availableQuantity} / {c.totalQuantity}
                  </span>
                  {c.availableQuantity <= c.lowStockLimit && (
                    <span className="low-stock-dot" title="Low stock alert" />
                  )}
                </div>
              </td>

              <td>
                <span className="location-text">{c.location || "—"}</span>
              </td>

              {/* Actions */}
              <td style={{ textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                <div className="table-actions-cell">
                  {!isAdmin && onRequest && (
                    <button
                      type="button"
                      className="primary small-btn"
                      style={{ padding: '5px 10px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      disabled={c.availableQuantity === 0}
                      onClick={() => onRequest?.(c)}
                      title={c.availableQuantity === 0 ? "Out of stock" : "Add to issue cart"}
                    >
                      <BoltIcon size={12} />
                      <span>{c.availableQuantity === 0 ? "Out of Stock" : "Add to Cart"}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    className="icon-action-btn view-action"
                    onClick={() => onSelect?.(c)}
                    title="View Component Details & Modal"
                    aria-label={`View details for ${c.name}`}
                  >
                    <EyeIcon size={14} />
                    <span className="action-btn-text">View</span>
                  </button>

                  {isAdmin && (
                    <>
                      <button
                        type="button"
                        className="icon-action-btn history-action"
                        onClick={() => onHistory?.(c)}
                        title="View Issue & Return History"
                        aria-label={`View history for ${c.name}`}
                      >
                        <HistoryIcon size={13} />
                        <span className="action-btn-text">History</span>
                      </button>

                      <button
                        type="button"
                        className="icon-action-btn delete-action"
                        onClick={() => onDelete(c._id)}
                        title="Delete component"
                        aria-label={`Delete ${c.name}`}
                      >
                        <TrashIcon size={13} />
                        <span className="action-btn-text">Delete</span>
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ComponentTable;
