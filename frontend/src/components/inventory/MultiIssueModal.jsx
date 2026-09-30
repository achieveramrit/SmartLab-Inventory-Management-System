import { useState } from "react";
import api from "../../api/axios";
import { CloseIcon, TrashIcon, ChipIcon, BoltIcon } from "../ui/Icons";

/**
 * MultiIssueModal
 * Allows students to request multiple components in a single batch submission.
 * cartItems: [{ component: {...}, quantity: number }]
 */
function MultiIssueModal({ cartItems, onUpdateCart, token, onClose, onSuccess }) {
  const headers = { Authorization: `Bearer ${token}` };

  const [purpose, setPurpose] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [partialErrors, setPartialErrors] = useState([]);

  const handleQuantityChange = (componentId, newQty) => {
    onUpdateCart((prev) =>
      prev.map((item) =>
        item.component._id === componentId
          ? { ...item, quantity: Math.max(1, Math.min(item.component.availableQuantity, Number(newQty))) }
          : item
      )
    );
  };

  const handleRemove = (componentId) => {
    onUpdateCart((prev) => prev.filter((item) => item.component._id !== componentId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!purpose.trim()) {
      setError("Please state the purpose / experiment name for these components.");
      return;
    }
    if (cartItems.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    setLoading(true);
    setError("");
    setPartialErrors([]);

    try {
      const res = await api.post(
        "/requests/batch",
        {
          items: cartItems.map((item) => ({
            componentId: item.component._id,
            quantity: item.quantity,
          })),
          purpose: purpose.trim(),
        },
        { headers }
      );

      const { message, errors: errs } = res.data;
      if (errs && errs.length > 0) {
        setPartialErrors(errs);
      }
      if (onSuccess) onSuccess(message);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit batch request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Multi-component issue cart"
    >
      <div
        className="relative w-full max-w-lg my-6 rounded-2xl overflow-hidden shadow-2xl shadow-black/60"
        style={{
          backgroundColor: "var(--surface)",
          color: "var(--text)",
          borderTop: "4px solid var(--accent)",
          border: "1px solid var(--border)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ───────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--border)" }}
        >
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-[#fca311]">
              Lab Issue Cart
            </span>
            <h3 className="text-base font-extrabold mt-0.5 flex items-center gap-2" style={{ color: "var(--text)" }}>
              <ChipIcon size={16} />
              Issue {cartItems.length} Component{cartItems.length !== 1 ? "s" : ""}
            </h3>
          </div>
          <button
            type="button"
            className="p-1.5 rounded-lg transition-colors hover:bg-black/10 dark:hover:bg-white/10"
            style={{ color: "var(--text-muted)" }}
            onClick={onClose}
            aria-label="Close cart"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {/* ── Body ─────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
          {/* Cart Items */}
          <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1 cart-scroll">
            {cartItems.length === 0 ? (
              <div
                className="text-center py-8 text-sm rounded-xl border border-dashed"
                style={{ color: "var(--text-muted)", borderColor: "var(--border)", backgroundColor: "var(--surface-2)" }}
              >
                Your cart is empty. Close this modal and click <strong>Issue</strong> on components to add them.
              </div>
            ) : (
              cartItems.map((item) => {
                const c = item.component;
                const isOver = item.quantity > c.availableQuantity;
                return (
                  <div
                    key={c._id}
                    className="flex items-center gap-3 p-3 rounded-xl border transition-colors"
                    style={{
                      backgroundColor: "var(--surface-2)",
                      borderColor: isOver ? "rgb(239 68 68 / 0.5)" : "var(--border)",
                    }}
                  >
                    {/* Component Icon */}
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 font-bold text-sm"
                      style={{ backgroundColor: "rgba(252,163,17,0.15)", color: "var(--accent)" }}
                    >
                      <ChipIcon size={18} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm truncate" style={{ color: "var(--text)" }}>
                          {c.name}
                        </span>
                        <span className="font-mono text-[11px] font-bold text-amber-600 dark:text-[#fca311] ml-2 shrink-0">
                          {c.componentId}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                          {c.category}
                        </span>
                        <span
                          className={`text-[11px] font-semibold ${
                            isOver ? "text-rose-500" : "text-emerald-500"
                          }`}
                        >
                          · {c.availableQuantity} avail.
                        </span>
                      </div>
                    </div>

                    {/* Quantity Control */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        className="w-7 h-7 rounded-lg font-bold text-sm flex items-center justify-center transition-colors"
                        style={{
                          backgroundColor: "var(--surface-3)",
                          color: "var(--text)",
                          border: "1px solid var(--border)",
                        }}
                        onClick={() => handleQuantityChange(c._id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={c.availableQuantity}
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(c._id, e.target.value)}
                        className="w-12 text-center text-sm font-bold rounded-lg py-1 focus:outline-none"
                        style={{
                          backgroundColor: "var(--surface)",
                          color: "var(--text)",
                          border: `1px solid ${isOver ? "rgb(239 68 68 / 0.6)" : "var(--border)"}`,
                        }}
                      />
                      <button
                        type="button"
                        className="w-7 h-7 rounded-lg font-bold text-sm flex items-center justify-center transition-colors"
                        style={{
                          backgroundColor: "var(--surface-3)",
                          color: "var(--text)",
                          border: "1px solid var(--border)",
                        }}
                        onClick={() => handleQuantityChange(c._id, item.quantity + 1)}
                        disabled={item.quantity >= c.availableQuantity}
                      >
                        +
                      </button>
                    </div>

                    {/* Remove */}
                    <button
                      type="button"
                      className="p-1.5 rounded-lg transition-colors hover:bg-rose-500/15 text-rose-400 hover:text-rose-500 shrink-0"
                      onClick={() => handleRemove(c._id)}
                      title="Remove from cart"
                    >
                      <TrashIcon size={14} />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Summary strip */}
          {cartItems.length > 0 && (
            <div
              className="flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm"
              style={{ backgroundColor: "rgba(252,163,17,0.08)", borderColor: "rgba(252,163,17,0.3)" }}
            >
              <span style={{ color: "var(--text-muted)" }}>
                {cartItems.length} component type{cartItems.length !== 1 ? "s" : ""} ·{" "}
                {cartItems.reduce((sum, i) => sum + i.quantity, 0)} total units
              </span>
              <span className="text-xs font-bold text-amber-600 dark:text-[#fca311]">
                Return in {cartItems.length > 0 ? "7" : "—"} days
              </span>
            </div>
          )}

          {/* Errors */}
          {error && (
            <div className="p-3 rounded-xl text-xs font-semibold bg-rose-500/15 border border-rose-500/40 text-rose-600 dark:text-rose-300">
              {error}
            </div>
          )}
          {partialErrors.length > 0 && (
            <div className="p-3 rounded-xl text-xs bg-amber-500/10 border border-amber-500/30">
              <p className="font-bold text-amber-600 dark:text-[#fca311] mb-1">Some items were skipped:</p>
              <ul className="list-disc list-inside space-y-0.5 text-amber-700 dark:text-amber-300">
                {partialErrors.map((e, i) => (
                  <li key={i}>{e.name || e.componentId}: {e.reason}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Purpose Field */}
          <div>
            <label
              className="block text-xs font-bold mb-1"
              style={{ color: "var(--text-muted)" }}
              htmlFor="batch-purpose"
            >
              Purpose / Experiment / Project Name <span className="text-rose-400">*</span>
            </label>
            <textarea
              id="batch-purpose"
              rows={3}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. IoT Smart Irrigation — ECE 402 final project lab session..."
              required
              className="w-full px-3 py-2 text-sm rounded-xl focus:outline-none transition-colors"
              style={{
                backgroundColor: "var(--surface-2)",
                color: "var(--text)",
                border: "1px solid var(--border)",
              }}
            />
            <p className="text-[11px] mt-1" style={{ color: "var(--text-dim)" }}>
              This purpose applies to all components in this batch.
            </p>
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
              disabled={loading || cartItems.length === 0}
              className="px-5 py-2 rounded-lg text-xs font-bold bg-[#fca311] hover:bg-[#ffb733] text-black shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <BoltIcon size={13} />
              {loading ? "Submitting…" : `Submit ${cartItems.length} Request${cartItems.length !== 1 ? "s" : ""}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MultiIssueModal;
