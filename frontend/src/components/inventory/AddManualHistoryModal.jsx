import { useState } from "react";
import api from "../../api/axios";
import { CloseIcon, HistoryIcon } from "../ui/Icons";

const EVENT_TYPES = [
  { value: "procurement", label: "Procurement" },
  { value: "repair",      label: "Repair" },
  { value: "maintenance", label: "Maintenance" },
  { value: "upgrade",     label: "Upgrade" },
  { value: "decommission",label: "Decommission" },
  { value: "note",        label: "General Note" },
  { value: "other",       label: "Other" },
];

const TYPE_COLORS = {
  procurement: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  repair:      "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30",
  maintenance: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
  upgrade:     "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30",
  decommission:"bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30",
  note:        "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  other:       "bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-500/30",
};

/**
 * AddManualHistoryModal
 * Admin form to append a lifecycle note to a component's manualHistory array.
 * Props:
 *   component   {object} — the component to annotate
 *   token       {string}
 *   onClose     {() => void}
 *   onSuccess   {(entries: array) => void} — receives the updated manualHistory list
 */
function AddManualHistoryModal({ component, token, onClose, onSuccess }) {
  const headers = { Authorization: `Bearer ${token}` };

  const todayStr = new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState({
    title: "",
    description: "",
    eventDate: todayStr,
    type: "note",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("A title is required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await api.post(
        `/components/${component._id}/history`,
        {
          title: form.title.trim(),
          description: form.description.trim(),
          eventDate: form.eventDate || todayStr,
          type: form.type,
        },
        { headers }
      );
      if (onSuccess) onSuccess(res.data.manualHistory);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add history entry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-md my-6 rounded-2xl overflow-hidden shadow-2xl shadow-black/60"
        style={{
          backgroundColor: "var(--surface)",
          color: "var(--text)",
          borderTop: "4px solid var(--accent)",
          border: "1px solid var(--border)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--border)" }}
        >
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-[#fca311]">
              Admin · Component Lifecycle
            </span>
            <h3 className="text-sm font-extrabold mt-0.5 flex items-center gap-2" style={{ color: "var(--text)" }}>
              <HistoryIcon size={14} />
              Add History Entry
              <span className="font-mono text-xs text-amber-600 dark:text-[#fca311]">
                {component.componentId}
              </span>
            </h3>
          </div>
          <button
            type="button"
            className="p-1.5 rounded-lg transition-colors hover:bg-black/10 dark:hover:bg-white/10"
            style={{ color: "var(--text-muted)" }}
            onClick={onClose}
            aria-label="Close"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {error && (
            <div className="p-3 rounded-xl text-xs font-semibold bg-rose-500/15 border border-rose-500/40 text-rose-600 dark:text-rose-300">
              {error}
            </div>
          )}

          {/* Event Type */}
          <div>
            <label className="block text-xs font-bold mb-2" style={{ color: "var(--text-muted)" }}>
              Event Type
            </label>
            <div className="flex flex-wrap gap-2">
              {EVENT_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => update("type", t.value)}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-all ${
                    form.type === t.value
                      ? TYPE_COLORS[t.value] || "bg-amber-500/20 text-amber-700 border-amber-500/40"
                      : ""
                  }`}
                  style={
                    form.type !== t.value
                      ? { backgroundColor: "var(--surface-2)", color: "var(--text-muted)", borderColor: "var(--border)" }
                      : {}
                  }
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold mb-1" htmlFor="mh-title" style={{ color: "var(--text-muted)" }}>
              Title <span className="text-rose-400">*</span>
            </label>
            <input
              id="mh-title"
              type="text"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="e.g. Received from IIIT Supplier, Repaired burnt resistor…"
              required
              maxLength={120}
              className="w-full px-3 py-2 text-sm rounded-xl focus:outline-none transition-colors"
              style={{
                backgroundColor: "var(--surface-2)",
                color: "var(--text)",
                border: "1px solid var(--border)",
              }}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold mb-1" htmlFor="mh-desc" style={{ color: "var(--text-muted)" }}>
              Description <span className="font-normal opacity-60">(optional)</span>
            </label>
            <textarea
              id="mh-desc"
              rows={3}
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Additional details, vendor info, cost, technician name…"
              maxLength={500}
              className="w-full px-3 py-2 text-sm rounded-xl focus:outline-none transition-colors resize-none"
              style={{
                backgroundColor: "var(--surface-2)",
                color: "var(--text)",
                border: "1px solid var(--border)",
              }}
            />
          </div>

          {/* Event Date */}
          <div>
            <label className="block text-xs font-bold mb-1" htmlFor="mh-date" style={{ color: "var(--text-muted)" }}>
              Event Date
            </label>
            <input
              id="mh-date"
              type="date"
              value={form.eventDate}
              onChange={(e) => update("eventDate", e.target.value)}
              className="px-3 py-2 text-sm rounded-xl focus:outline-none transition-colors"
              style={{
                backgroundColor: "var(--surface-2)",
                color: "var(--text)",
                border: "1px solid var(--border)",
              }}
            />
          </div>

          {/* Actions */}
          <div
            className="flex items-center justify-end gap-2 pt-3 border-t"
            style={{ borderColor: "var(--border)" }}
          >
            <button
              type="button"
              className="px-4 py-2 rounded-lg text-xs font-semibold transition-colors"
              style={{
                backgroundColor: "var(--surface-2)",
                color: "var(--text)",
                border: "1px solid var(--border)",
              }}
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-lg text-xs font-bold bg-[#fca311] hover:bg-[#ffb733] text-black shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5"
            >
              <HistoryIcon size={13} />
              {loading ? "Saving…" : "Add Entry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddManualHistoryModal;
