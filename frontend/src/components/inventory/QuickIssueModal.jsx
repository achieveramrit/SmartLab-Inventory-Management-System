import { useState } from "react";
import api from "../../api/axios";
import { CloseIcon, ChipIcon } from "../ui/Icons";

/**
 * QuickIssueModal
 * Allows students to request / issue a component directly from the inventory page
 * without having to navigate to any other tab.
 */
function QuickIssueModal({ component, token, onClose, onSuccess }) {
  const headers = { Authorization: `Bearer ${token}` };

  const [quantity, setQuantity] = useState(1);
  const [purpose, setPurpose] = useState("");
  // Default expected return date to 7 days from now
  const defaultDueDate = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);
  const [expectedReturnDate, setExpectedReturnDate] = useState(defaultDueDate);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!component) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!purpose.trim()) {
      setError("Please state the purpose for requesting this component.");
      return;
    }

    if (quantity < 1 || quantity > component.availableQuantity) {
      setError(`Quantity must be between 1 and ${component.availableQuantity}.`);
      return;
    }

    setLoading(true);
    setError("");

    try {
      await api.post(
        "/requests",
        {
          componentId: component._id,
          quantity: Number(quantity),
          purpose: purpose.trim(),
          expectedReturnDate: expectedReturnDate || undefined,
        },
        { headers }
      );

      if (onSuccess) {
        onSuccess(`Issue request for ${component.name} (Qty: ${quantity}) submitted successfully!`);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-md bg-white dark:bg-[#0a1120] text-slate-800 dark:text-slate-100 rounded-2xl border border-slate-200 dark:border-slate-700/80 border-t-4 border-t-[#fca311] shadow-2xl shadow-black/40 dark:shadow-black/80 overflow-hidden my-6 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-[#14213d] border-b border-slate-200 dark:border-slate-700/60">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-[#fca311]">
              Direct Lab Issue
            </span>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2 mt-0.5">
              <span>Issue {component.name}</span>
            </h3>
          </div>
          <button
            type="button"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
            onClick={onClose}
            aria-label="Close"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {/* Quick Item Summary Badge */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-100 dark:bg-[#14213d]/60 border border-slate-200 dark:border-slate-700/60">
            <div className="w-10 h-10 rounded-lg bg-amber-500/15 text-amber-700 dark:text-[#fca311] flex items-center justify-center font-bold">
              <ChipIcon size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                  {component.name}
                </span>
                <span className="text-[11px] font-mono font-bold text-amber-600 dark:text-[#fca311]">
                  {component.componentId}
                </span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between mt-0.5">
                <span>{component.category || "General"}</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {component.availableQuantity} units available
                </span>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl text-xs font-semibold bg-rose-500/15 border border-rose-500/40 text-rose-600 dark:text-rose-300">
              {error}
            </div>
          )}

          {/* Quantity Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Quantity to Issue
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                max={component.availableQuantity}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(component.availableQuantity, Number(e.target.value))))}
                required
                className="w-24 px-3 py-2 text-sm font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0d1729] text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
              />
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Max available: {component.availableQuantity}
              </span>
            </div>
          </div>

          {/* Standard Return Period (Locked to 1 Week) */}
          <div className="p-3 rounded-xl bg-slate-100/80 dark:bg-[#14213d]/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 block">
                Standard Lab Return Period
              </span>
              <strong className="text-xs font-bold text-slate-800 dark:text-slate-200 block mt-0.5">
                7 Days (1 Week)
              </strong>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Scheduled Due Date</span>
              <span className="text-xs font-mono font-bold text-amber-600 dark:text-[#fca311] bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 inline-block mt-0.5">
                {new Date(Date.now() + 7 * 86_400_000).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Purpose Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Purpose / Experiment / Project Name
            </label>
            <textarea
              rows="3"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. IoT Smart Irrigation final project lab experiment..."
              required
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0d1729] text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700/60 mt-1">
            <button
              type="button"
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || component.availableQuantity === 0}
              className="px-5 py-2 rounded-lg text-xs font-bold bg-[#fca311] hover:bg-[#ffb733] text-black shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5"
            >
              {loading ? "Submitting…" : "Confirm Issue Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default QuickIssueModal;
