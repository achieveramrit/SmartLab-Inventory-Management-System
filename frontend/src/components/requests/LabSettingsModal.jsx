import { useEffect, useState } from "react";
import api from "../../api/axios";
import { CloseIcon } from "../ui/Icons";

/**
 * LabSettingsModal
 * Allows admin to configure standard issue durations and maximum allowed extension days.
 */
function LabSettingsModal({ token, onClose, onSaved }) {
  const headers = { Authorization: `Bearer ${token}` };

  const [standardDays, setStandardDays] = useState(7);
  const [maxExtDays, setMaxExtDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get("/requests/settings", { headers });
        if (res.data) {
          setStandardDays(res.data.standardIssueDays || 7);
          setMaxExtDays(res.data.maxExtensionDays || 7);
        }
      } catch (err) {
        setMessage({ type: "error", text: "Could not load existing lab settings." });
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await api.put(
        "/requests/settings",
        {
          standardIssueDays: Number(standardDays),
          maxExtensionDays: Number(maxExtDays),
        },
        { headers }
      );
      setMessage({ type: "success", text: res.data.message || "Settings updated successfully!" });
      if (onSaved) {
        onSaved(res.data.settings);
      }
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to update settings.",
      });
    } finally {
      setSaving(false);
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
              Lab Policy &amp; Rules
            </span>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
              Borrowing &amp; Extension Limits
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

        {/* Body */}
        {loading ? (
          <div className="p-12 text-center text-sm font-semibold text-slate-400">
            Loading lab settings…
          </div>
        ) : (
          <form onSubmit={handleSave} className="p-6 flex flex-col gap-4">
            {message && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold border ${
                  message.type === "error"
                    ? "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300"
                    : "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                }`}
              >
                {message.text}
              </div>
            )}

            {/* Standard Return Period */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Standard Component Issue Duration (Days)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="60"
                  required
                  value={standardDays}
                  onChange={(e) => setStandardDays(e.target.value)}
                  className="w-24 px-3 py-2 text-sm font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0d1729] text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Default: 7 days (1 week)
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                When a student issues a component, this determines the default return date.
              </p>
            </div>

            {/* Max Extension Days */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Maximum Allowed Extension Limit (At Most Days)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="30"
                  required
                  value={maxExtDays}
                  onChange={(e) => setMaxExtDays(e.target.value)}
                  className="w-24 px-3 py-2 text-sm font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0d1729] text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Allowed cap for students
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Students will be strictly prohibited from extending past this number of days beyond their scheduled due date.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-700/60 mt-2">
              <button
                type="button"
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                onClick={onClose}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-lg text-xs font-bold bg-[#fca311] hover:bg-[#ffb733] text-black shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5"
              >
                {saving ? "Saving…" : "Save Policy Limits"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default LabSettingsModal;
