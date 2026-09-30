import { useState } from "react";
import { CloseIcon, ChipIcon, TagIcon, HistoryIcon } from "../ui/Icons";

/**
 * ComponentModal
 * Interactive modal dialog for viewing detailed specifications,
 * category, image, and real-time stock levels of a component.
 * Props:
 *   component {object|null}
 *   isAdmin   {boolean}
 *   onHistory {(comp: object) => void}
 *   onClose   {() => void}
 */
export default function ComponentModal({ component, isAdmin, onHistory, onClose }) {
  const [imgError, setImgError] = useState(false);

  if (!component) return null;

  const isLowStock = component.availableQuantity <= component.lowStockLimit;
  const stockPercent = component.totalQuantity > 0
    ? Math.min(100, Math.round((component.availableQuantity / component.totalQuantity) * 100))
    : 0;

  return (
    <div
      className="shortcuts-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Component Details"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="component-modal">
        {/* Modal Header */}
        <div className="component-modal-header">
          <div>
            <div className="component-modal-badge-row">
              <span className="component-id-badge">{component.componentId}</span>
              <span className="category-tag">
                <TagIcon size={11} /> {component.category}
              </span>
            </div>
            <h3>{component.name}</h3>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close dialog">
            <CloseIcon size={14} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="component-modal-body">
          <div className="component-modal-grid">
            {/* Component Image Banner */}
            <div className="component-modal-image-wrap">
              {component.imageUrl && !imgError ? (
                <img
                  src={component.imageUrl}
                  alt={component.name}
                  className="component-modal-image"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="component-modal-placeholder">
                  <ChipIcon size={48} />
                  <span>{component.category}</span>
                </div>
              )}
            </div>

            {/* Component Stats & Details */}
            <div className="component-modal-info">
              {/* Stock Bar */}
              <div className="modal-stock-section">
                <div className="modal-stock-header">
                  <span>Available Stock</span>
                  <strong className={isLowStock ? "stock low" : "stock"}>
                    {component.availableQuantity} of {component.totalQuantity} units
                  </strong>
                </div>
                <div className="modal-progress-track">
                  <div
                    className={`modal-progress-bar ${isLowStock ? "low" : ""}`}
                    style={{ width: `${stockPercent}%` }}
                  />
                </div>
                {isLowStock && (
                  <small className="modal-low-stock-alert">
                    Low Stock: quantity is at or below limit ({component.lowStockLimit} units)
                  </small>
                )}
              </div>

              {/* Specs Grid */}
              <div className="modal-specs-grid">
                <div className="modal-spec-card">
                  <span className="spec-label">Location</span>
                  <strong className="spec-value">{component.location || "General Lab Storage"}</strong>
                </div>
                <div className="modal-spec-card">
                  <span className="spec-label">Category</span>
                  <strong className="spec-value">{component.category}</strong>
                </div>
                <div className="modal-spec-card">
                  <span className="spec-label">Component ID</span>
                  <strong className="spec-value">{component.componentId}</strong>
                </div>
                <div className="modal-spec-card">
                  <span className="spec-label">Low Stock Threshold</span>
                  <strong className="spec-value">{component.lowStockLimit} units</strong>
                </div>
              </div>

              {/* Description */}
              {component.description && (
                <div className="modal-description-box">
                  <span className="spec-label">Description &amp; Specifications</span>
                  <p>{component.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="component-modal-footer">
          {isAdmin && onHistory && (
            <button
              type="button"
              className="ghost"
              onClick={() => {
                onClose();
                onHistory(component);
              }}
            >
              <HistoryIcon size={14} /> View Issue History
            </button>
          )}
          <button className="primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
