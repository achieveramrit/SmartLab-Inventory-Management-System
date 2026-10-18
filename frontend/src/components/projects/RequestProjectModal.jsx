import { useState } from "react";
import api from "../../api/axios";
import { CloseIcon, ChipIcon, RocketIcon, CheckIcon, ClockIcon } from "../ui/Icons";

/**
 * RequestProjectModal
 * 1-Click Kit Request Modal: Allows students to request all IoT components
 * required for a project in a single batch submission.
 */
function RequestProjectModal({ project, token, onClose, onSuccess }) {
  const headers = { Authorization: `Bearer ${token}` };

  const defaultDueDate = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);
  const [expectedReturnDate, setExpectedReturnDate] = useState(defaultDueDate);
  const [purpose, setPurpose] = useState(`IoT Project: ${project.title} - Laboratory prototype & testing`);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const components = project.componentsSummary || [];
  const allAvailable = project.isAvailable;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!purpose.trim()) {
      setError("Please specify the purpose or lab experiment name.");
      return;
    }

    if (!allAvailable) {
      setError("Cannot request this project kit because some components are currently out of stock.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const items = components.map((c) => ({
        componentId: c._id,
        quantity: c.requiredQuantity,
      }));

      const res = await api.post(
        "/requests/batch",
        {
          items,
          purpose: purpose.trim(),
          expectedReturnDate: expectedReturnDate || undefined,
        },
        { headers }
      );

      if (onSuccess) {
        onSuccess(res.data.message || `Successfully submitted request for all components of "${project.title}"!`);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit project kit request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Request Project Kit"
    >
      <div
        className="relative w-full max-w-xl my-6 rounded-2xl overflow-hidden shadow-2xl shadow-black/60 bg-white dark:bg-[#14213d] text-slate-800 dark:text-white border border-slate-200 dark:border-white/10"
        style={{ borderTop: "4px solid #fca311" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#fca311]/15 text-[#fca311] flex items-center justify-center border border-[#fca311]/30">
              <RocketIcon size={20} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#fca311]">
                1-Click Project Kit Request
              </span>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                {project.title}
              </h3>
            </div>
          </div>
          <button
            type="button"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
            onClick={onClose}
            aria-label="Close"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs font-semibold rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50">
              {error}
            </div>
          )}

          {/* Kit Summary Box */}
          <div className="rounded-xl p-3.5 bg-slate-100/70 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <ChipIcon size={14} className="text-[#fca311]" />
                Required Components in this Kit ({components.length})
              </span>
              <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                allAvailable
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                  : "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
              }`}>
                {allAvailable ? "✓ 100% In Stock" : "Missing Components"}
              </span>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {components.map((c) => (
                <div
                  key={c._id}
                  className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-[#1a2b4c] border border-slate-200 dark:border-white/5 text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-slate-900 dark:text-white truncate">{c.name}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      ID: {c.componentId} · Cat: {c.category} {c.location ? `· Loc: ${c.location}` : ""}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="font-black text-slate-900 dark:text-white">
                      Qty: {c.requiredQuantity}
                    </span>
                    <p className={`text-[10px] font-semibold ${
                      c.isAvailable ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                    }`}>
                      {c.availableQuantity} available
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Expected Return Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  min={new Date().toISOString().slice(0, 10)}
                  value={expectedReturnDate}
                  onChange={(e) => setExpectedReturnDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#1a2b4c] text-slate-900 dark:text-white focus:outline-none focus:border-[#fca311]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Estimated Build Time
              </label>
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-xs text-slate-600 dark:text-slate-300">
                <ClockIcon size={14} className="text-[#fca311]" />
                <span>{project.estimatedTime || "2-4 hours"}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Purpose / Experiment Title <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              required
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="State your course, project, or lab purpose..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#1a2b4c] text-slate-900 dark:text-white focus:outline-none focus:border-[#fca311]"
            />
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start gap-2">
            <span className="text-amber-500 font-bold mt-0.5">ℹ</span>
            <span>
              This will submit a batch request for all <strong>{components.length} components</strong> simultaneously.
              Once the lab admin approves and issues them, you can collect the complete kit from the inventory counter.
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !allAvailable}
              className={`px-5 py-2 text-xs font-extrabold rounded-xl transition-all flex items-center gap-2 shadow-sm ${
                allAvailable
                  ? "bg-[#fca311] hover:bg-[#e0920f] text-black shadow-gold cursor-pointer"
                  : "bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed"
              }`}
            >
              <RocketIcon size={14} />
              {loading ? "Submitting Request..." : "Request All Components"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RequestProjectModal;
