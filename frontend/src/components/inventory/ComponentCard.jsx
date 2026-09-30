import { useState } from "react";
import { ChipIcon, EyeIcon, HistoryIcon, TrashIcon, BoltIcon } from "../ui/Icons";

/**
 * ComponentCard
 * Modern visual card for displaying components with images, specs, stock status, and actions.
 * Perfect for student catalog view and responsive grids.
 * Props:
 *   component   {object}
 *   isAdmin     {boolean}
 *   onSelect    {(comp: object) => void}
 *   onRequest   {(comp: object) => void}
 *   onHistory   {(comp: object) => void}
 *   onDelete    {(id: string) => void}
 */
function ComponentCard({
  component: c,
  isAdmin,
  onSelect,
  onRequest,
  onHistory,
  onDelete,
}) {
  const [imgError, setImgError] = useState(false);

  const isOutOfStock = c.availableQuantity === 0;
  const isLowStock = !isOutOfStock && c.availableQuantity <= (c.lowStockLimit ?? 2);

  return (
    <div
      className={`comp-card ${isOutOfStock ? "out-of-stock" : isLowStock ? "low-stock" : ""}`}
      onClick={() => onSelect(c)}
    >
      {/* Card Media Header */}
      <div className="comp-card-media">
        {c.imageUrl && !imgError ? (
          <img
            src={c.imageUrl}
            alt={c.name}
            className="comp-card-img"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="comp-card-placeholder">
            <ChipIcon size={38} className="comp-card-placeholder-icon" />
            <span className="comp-card-initial">{c.name?.charAt(0) || "C"}</span>
          </div>
        )}

        {/* Category Pill Tag */}
        <span className="comp-card-cat-badge">{c.category || "General"}</span>

        {/* Stock Status Pill */}
        <div className="comp-card-stock-pill">
          {isOutOfStock ? (
            <span className="badge danger">Out of Stock</span>
          ) : isLowStock ? (
            <span className="badge warning">Low: {c.availableQuantity} left</span>
          ) : (
            <span className="badge success">{c.availableQuantity} Available</span>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="comp-card-body">
        <div className="comp-card-header">
          <span className="comp-card-id">{c.componentId}</span>
          <h4 className="comp-card-title" title={c.name}>
            {c.name}
          </h4>
        </div>

        {c.description ? (
          <p className="comp-card-desc">{c.description}</p>
        ) : (
          <p className="comp-card-desc empty-desc">No description available.</p>
        )}

        {/* Card Metadata Meta */}
        <div className="comp-card-meta">
          <div className="comp-meta-item">
            <span className="meta-label">Total Stock</span>
            <span className="meta-val">{c.totalQuantity} units</span>
          </div>
          {c.location && (
            <div className="comp-meta-item">
              <span className="meta-label">Location</span>
              <span className="meta-val">{c.location}</span>
            </div>
          )}
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="comp-card-footer" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="ghost small-btn card-view-btn"
          onClick={() => onSelect(c)}
          title="View detailed specs & pinout"
        >
          <EyeIcon size={14} /> View Details
        </button>

        {isAdmin ? (
          <div className="card-admin-btns">
            {onHistory && (
              <button
                type="button"
                className="ghost small-btn"
                onClick={() => onHistory(c)}
                title="View issue & return history"
              >
                <HistoryIcon size={14} /> History
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                className="danger small-btn icon-only"
                onClick={() => onDelete(c._id)}
                title="Delete component"
                aria-label="Delete component"
              >
                <TrashIcon size={14} />
              </button>
            )}
          </div>
        ) : (
          onRequest && (
            <button
              type="button"
              className="primary small-btn card-request-btn"
              disabled={isOutOfStock}
              onClick={() => onRequest(c)}
              title={isOutOfStock ? "Currently out of stock" : "Add to issue cart"}
            >
              <BoltIcon size={13} />
              <span>{isOutOfStock ? "Out of Stock" : "Add to Cart"}</span>
            </button>
          )
        )}
      </div>
    </div>
  );
}

export default ComponentCard;
