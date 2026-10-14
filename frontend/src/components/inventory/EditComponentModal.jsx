import { useState } from "react";
import { CloseIcon, CheckIcon } from "../ui/Icons";
import { PRESET_CATEGORIES } from "./AddComponentForm";

/**
 * EditComponentModal
 * Admin-only modal for editing an existing inventory component.
 * Props:
 *   component  {object}  — the component to edit
 *   onSave     {(id: string, data: object) => Promise<void>}
 *   onClose    {() => void}
 */
function EditComponentModal({ component: comp, onSave, onClose }) {
  const [form, setForm] = useState({
    name:          comp.name          || "",
    category:      PRESET_CATEGORIES.includes(comp.category) ? comp.category : "Other",
    description:   comp.description   || "",
    imageUrl:      comp.imageUrl      || "",
    totalQuantity: comp.totalQuantity != null ? comp.totalQuantity : "",
    location:      comp.location      || "",
    lowStockLimit: comp.lowStockLimit != null ? comp.lowStockLimit : 2,
  });
  const [customCat,  setCustomCat]  = useState(
    !PRESET_CATEGORIES.includes(comp.category) ? comp.category : ""
  );
  const [submitting, setSubmitting] = useState(false);
  const [imgPreview, setImgPreview] = useState(comp.imageUrl || "");

  const patch = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const finalCategory =
        form.category === "Other" && customCat.trim()
          ? customCat.trim()
          : form.category;

      await onSave(comp._id, {
        name:          form.name,
        category:      finalCategory,
        description:   form.description,
        imageUrl:      form.imageUrl,
        totalQuantity: Number(form.totalQuantity),
        location:      form.location,
        lowStockLimit: Number(form.lowStockLimit),
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 md:p-6 bg-black/75 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Edit Component"
    >
      <div
        className="relative w-full max-w-xl bg-white dark:bg-[#0a1120] text-slate-800 dark:text-slate-100 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-2xl shadow-black/40 dark:shadow-black/80 overflow-hidden my-6 transition-all"
        style={{ borderTop: "4px solid #3b82f6" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-200 dark:border-slate-700/60">
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-widest text-blue-500 mb-1">
              Admin · Edit Inventory
            </span>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight">
              Edit Component
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
              <span>Editing: <span className="font-semibold text-slate-700 dark:text-slate-200">{comp.name}</span></span>
              <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400">
                {comp.componentId}
              </span>
            </p>
          </div>
          <button
            type="button"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
            onClick={onClose}
            aria-label="Close edit modal"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="max-h-[70vh] overflow-y-auto px-6 py-4">
          <form onSubmit={handleSubmit} className="compact-form">

            {/* Name */}
            <label>
              Component Name
              <input
                required
                placeholder="e.g. Arduino Uno R3"
                value={form.name}
                onChange={patch("name")}
              />
            </label>

            {/* ID — read only since it's a unique identifier */}
            <label>
              Component ID
              <div style={{ position: "relative" }}>
                <input
                  value={comp.componentId}
                  readOnly
                  style={{ opacity: 0.55, cursor: "not-allowed", paddingRight: "80px" }}
                  title="Component ID cannot be changed after creation"
                />
                <span style={{
                  position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
                  fontSize: "10px", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}>
                  Read-only
                </span>
              </div>
            </label>

            <div className="two-col">
              {/* Category */}
              <label>
                Category
                <select
                  value={form.category}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm((prev) => ({ ...prev, category: val }));
                    if (val !== "Other") setCustomCat("");
                  }}
                >
                  {PRESET_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </label>

              {/* Low Stock Threshold */}
              <label>
                Low Stock Threshold
                <input
                  type="number"
                  min="0"
                  value={form.lowStockLimit}
                  onChange={patch("lowStockLimit")}
                />
              </label>
            </div>

            {/* Custom Category Input */}
            {form.category === "Other" && (
              <label>
                Custom Category Name
                <input
                  required
                  placeholder="Enter custom category"
                  value={customCat}
                  onChange={(e) => setCustomCat(e.target.value)}
                />
              </label>
            )}

            {/* Image URL */}
            <label>
              Component Image URL
              <input
                type="url"
                placeholder="https://example.com/image.jpg"
                value={form.imageUrl}
                onChange={(e) => {
                  patch("imageUrl")(e);
                  setImgPreview(e.target.value);
                }}
              />
            </label>

            {/* Image Preview */}
            {imgPreview && (
              <div className="image-preview-card">
                <span className="preview-label">Image Preview:</span>
                <div className="preview-frame">
                  <img
                    src={imgPreview}
                    alt="Preview"
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                </div>
              </div>
            )}

            <div className="two-col">
              {/* Total Quantity */}
              <label>
                Total Quantity
                <input
                  type="number"
                  min="0"
                  required
                  placeholder="e.g. 15"
                  value={form.totalQuantity}
                  onChange={patch("totalQuantity")}
                />
              </label>

              {/* Available (display only) */}
              <label>
                Currently Available
                <input
                  value={comp.availableQuantity ?? "—"}
                  readOnly
                  style={{ opacity: 0.55, cursor: "not-allowed" }}
                  title="Available quantity is auto-calculated based on active issues"
                />
              </label>
            </div>

            {/* Location */}
            <label>
              Storage Location in Lab
              <input
                placeholder="e.g. Cabinet A, Drawer 3"
                value={form.location}
                onChange={patch("location")}
              />
            </label>

            {/* Description */}
            <label>
              Description &amp; Specifications
              <textarea
                placeholder="Technical details, voltage, specs, pins..."
                value={form.description}
                onChange={patch("description")}
                rows={3}
              />
            </label>

            {/* Info note */}
            <div style={{
              display: "flex", alignItems: "flex-start", gap: "8px",
              padding: "10px 12px", borderRadius: "10px",
              background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.25)",
              fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px",
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: "1px" }}>
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>
                Changing <strong>Total Quantity</strong> will automatically adjust available stock.
                The difference is added to or subtracted from currently available units.
              </span>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="primary full"
              disabled={submitting}
              style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px",
                backgroundColor: "#3b82f6", borderColor: "#3b82f6",
              }}
            >
              <CheckIcon size={16} />
              <span>{submitting ? "Saving Changes…" : "Save Changes"}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EditComponentModal;
