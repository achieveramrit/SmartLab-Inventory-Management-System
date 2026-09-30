import { useState } from "react";
import { PlusIcon, ImageIcon, CloseIcon } from "../ui/Icons";

export const PRESET_CATEGORIES = [
  "Microcontrollers",
  "Sensors",
  "Actuators & Motors",
  "Communication & Wireless",
  "Displays",
  "Power & Battery",
  "Passive Components",
  "Other"
];

// High-quality reliable public IoT/Hardware images for quick selection
const SAMPLE_PRESETS = [
  {
    name: "Arduino Uno R3",
    category: "Microcontrollers",
    imageUrl: "https://images.unsplash.com/photo-1553406830-ef2513450d76?w=600&auto=format&fit=crop&q=80",
    description: "ATmega328P microcontroller board with 14 digital I/O pins and 6 analog inputs."
  },
  {
    name: "Raspberry Pi 4",
    category: "Microcontrollers",
    imageUrl: "https://images.unsplash.com/photo-1550041473-d296a3a8a18b?w=600&auto=format&fit=crop&q=80",
    description: "Broadcom BCM2711 quad-core Cortex-A72 64-bit SoC @ 1.5GHz with 4GB RAM."
  },
  {
    name: "HC-SR04 Ultrasonic Sensor",
    category: "Sensors",
    imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80",
    description: "Ultrasonic ranging module providing 2cm to 400cm non-contact measurement."
  },
  {
    name: "ESP32 DevKit V1",
    category: "Communication & Wireless",
    imageUrl: "https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=600&auto=format&fit=crop&q=80",
    description: "Wi-Fi and dual-mode Bluetooth microcontroller module with integrated antenna."
  }
];

const EMPTY_FORM = {
  name: "",
  componentId: "",
  category: "Microcontrollers",
  description: "",
  imageUrl: "",
  totalQuantity: "",
  location: "",
  lowStockLimit: 2,
};

/**
 * AddComponentForm
 * Admin-only form panel/modal for adding new inventory components with image support,
 * category selector, and sample image presets.
 * Props:
 *   onAdd   {(formData: object) => Promise<void>}
 *   onClose {(() => void) | undefined} — when passed, renders as a modal
 */
function AddComponentForm({ onAdd, onClose }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [customCat, setCustomCat] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const patch = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const applyPreset = (preset) => {
    setForm((prev) => ({
      ...prev,
      name: preset.name,
      category: preset.category,
      imageUrl: preset.imageUrl,
      description: preset.description,
      componentId: prev.componentId || `${preset.name.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const finalCategory = form.category === "Other" && customCat.trim()
        ? customCat.trim()
        : form.category;

      await onAdd({
        ...form,
        category: finalCategory,
      });
      setForm(EMPTY_FORM);
      setCustomCat("");
      if (onClose) onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const content = (
    <div className={`panel add-component-panel ${onClose ? "m-0 border-0 shadow-none bg-transparent" : ""}`}>
      <div className="panel-head flex items-center justify-between">
        <div>
          <span className="eyebrow">Admin Management</span>
          <h3>Add New Component</h3>
        </div>
        {onClose && (
          <button
            type="button"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
            onClick={onClose}
            aria-label="Close"
          >
            <CloseIcon size={18} />
          </button>
        )}
      </div>

      <div className={onClose ? "max-h-[75vh] overflow-y-auto px-1 pr-2" : ""}>
        {/* Quick Presets Bar */}
        <div className="presets-section">
          <span className="presets-label">Quick sample presets:</span>
          <div className="presets-chips">
            {SAMPLE_PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                className="preset-chip-btn"
                onClick={() => applyPreset(p)}
                title={`Fill ${p.name}`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="compact-form">
          <label>Component Name
            <input
              required
              placeholder="e.g. Arduino Uno R3"
              value={form.name}
              onChange={patch("name")}
            />
          </label>

          <div className="two-col">
            <label>Component ID
              <input
                required
                placeholder="e.g. ARD-101"
                value={form.componentId}
                onChange={patch("componentId")}
              />
            </label>

            <label>Category
              <select
                value={form.category}
                onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
              >
                {PRESET_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </label>
          </div>

          {form.category === "Other" && (
            <label>Custom Category Name
              <input
                required
                placeholder="Enter category name"
                value={customCat}
                onChange={(e) => setCustomCat(e.target.value)}
              />
            </label>
          )}

          {/* Image URL with live preview */}
          <label>Component Image URL
            <div className="image-input-wrap">
              <input
                type="url"
                placeholder="https://example.com/image.jpg"
                value={form.imageUrl}
                onChange={patch("imageUrl")}
              />
            </div>
          </label>

          {form.imageUrl && (
            <div className="image-preview-card">
              <span className="preview-label">Image Preview:</span>
              <div className="preview-frame">
                <img
                  src={form.imageUrl}
                  alt="Preview"
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
              </div>
            </div>
          )}

          <div className="two-col">
            <label>Total quantity
              <input
                type="number"
                min="0"
                required
                placeholder="e.g. 15"
                value={form.totalQuantity}
                onChange={patch("totalQuantity")}
              />
            </label>
            <label>Low stock threshold
              <input
                type="number"
                min="0"
                value={form.lowStockLimit}
                onChange={patch("lowStockLimit")}
              />
            </label>
          </div>

          <label>Storage Location in Lab
            <input
              placeholder="e.g. Cabinet A, Drawer 3"
              value={form.location}
              onChange={patch("location")}
            />
          </label>

          <label>Description &amp; Specifications
            <textarea
              placeholder="Technical details, voltage, specs, pins..."
              value={form.description}
              onChange={patch("description")}
            />
          </label>

          <button className="primary full" disabled={submitting}>
            <PlusIcon size={16} />
            <span>{submitting ? "Adding Component…" : "Add Component to Inventory"}</span>
          </button>
        </form>
      </div>
    </div>
  );

  if (onClose) {
    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-3 md:p-6 bg-black/75 backdrop-blur-sm overflow-y-auto"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
      >
        <div
          className="relative w-full max-w-xl bg-white dark:bg-[#0a1120] text-slate-800 dark:text-slate-100 rounded-2xl border border-slate-200 dark:border-slate-700/80 border-t-4 border-t-[#fca311] shadow-2xl shadow-black/40 dark:shadow-black/80 overflow-hidden my-6 p-6 transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {content}
        </div>
      </div>
    );
  }

  return content;
}

export default AddComponentForm;
