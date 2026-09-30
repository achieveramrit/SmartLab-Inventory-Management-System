import { useEffect, useState } from "react";
import api from "../../api/axios";
import { CloseIcon } from "../ui/Icons";

/**
 * ExtendReturnModal
 * Allows a student (or admin) to request an extension for an issued component,
 * strictly bounded by the maximum allowed days set by the admin.
 */
function ExtendReturnModal({ request: r, token, onClose, onSuccess }) {
  const headers = { Authorization: `Bearer ${token}` };

  const currentDue = r.expectedReturnDate
    ? new Date(r.expectedReturnDate)
    : new Date(Date.now() + 7 * 86_400_000);

  const [maxExtensionDays, setMaxExtensionDays] = useState(7);
  const [newDate, setNewDate] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Calculate maximum allowed date based on current due date + maxExtensionDays
  const maxAllowedDate = new Date(currentDue.getTime() + maxExtensionDays * 86_400_000);
  const maxAllowedDateStr = maxAllowedDate.toISOString().slice(0, 10);
  const minAllowedDateStr = new Date(currentDue.getTime() + 86_400_000).toISOString().slice(0, 10);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get("/requests/settings", { headers });
        if (res.data?.maxExtensionDays) {
          setMaxExtensionDays(res.data.maxExtensionDays);
          const defaultDate = new Date(currentDue.getTime() + res.data.maxExtensionDays * 86_400_000)
            .toISOString()
            .slice(0, 10);
          setNewDate(defaultDate);
        } else {
          setNewDate(new Date(currentDue.getTime() + 7 * 86_400_000).toISOString().slice(0, 10));
        }
      } catch (e) {
        setNewDate(new Date(currentDue.getTime() + 7 * 86_400_000).toISOString().slice(0, 10));
      }
    };
    fetchSettings();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newDate) {
      setError("Please choose a new return date.");
      return;
    }

    const chosen = new Date(newDate);
    if (chosen > maxAllowedDate) {
      setError(`Extension cannot exceed at most ${maxExtensionDays} days (latest allowed: ${maxAllowedDate.toLocaleDateString()}).`);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await api.put(
        `/requests/${r._id}/extend`,
        { newExpectedReturnDate: newDate, reason: reason.trim() },
        { headers }
      );
      if (onSuccess) {
        onSuccess(res.data.message || "Return date extended successfully!");
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to extend return date.");
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
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-[#14213d] border-b border-slate-200 dark:border-slate-700/60">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-[#fca311]">
              Borrowing Period
            </span>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
              Extend Return Date
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

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-[#14213d]/60 border border-slate-200 dark:border-slate-700/60">
            <strong className="text-sm font-bold text-slate-900 dark:text-white block">
              {r.component?.name || "Component"}
            </strong>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
              <span>Current Due Date:</span>
              <span className="font-semibold text-amber-600 dark:text-amber-400">
                {r.expectedReturnDate
                  ? new Date(r.expectedReturnDate).toLocaleDateString()
                  : "Not set"}
              </span>
            </div>
          </div>

          {/* Admin Policy Cap Alert */}
          <div className="p-2.5 rounded-xl text-xs bg-amber-500/10 border border-amber-500/25 text-amber-800 dark:text-[#fca311] flex items-center justify-between">
            <span>Admin Policy Limit:</span>
            <span className="font-bold">
              At most +{maxExtensionDays} days (until {maxAllowedDate.toLocaleDateString()})
            </span>
          </div>

          {error && (
            <div className="p-3 rounded-xl text-xs font-semibold bg-rose-500/15 border border-rose-500/40 text-rose-600 dark:text-rose-300">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              New Return Date (Max {maxAllowedDate.toLocaleDateString()})
            </label>
            <input
              type="date"
              value={newDate}
              min={minAllowedDateStr}
              max={maxAllowedDateStr}
              onChange={(e) => setNewDate(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0d1729] text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Reason for Extension (Optional)
            </label>
            <textarea
              rows="3"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Additional testing required for thesis hardware experiment..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0d1729] text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
            />
          </div>

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
              disabled={loading}
              className="px-5 py-2 rounded-lg text-xs font-bold bg-[#fca311] hover:bg-[#ffb733] text-black shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5"
            >
              {loading ? "Submitting…" : "Confirm Extension"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ExtendReturnModal;
