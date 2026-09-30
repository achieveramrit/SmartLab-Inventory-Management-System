import { useState } from "react";
import { CloseIcon, CheckIcon, AlertTriangleIcon, XCircleIcon, PhoneIcon } from "../ui/Icons";

/**
 * ReturnConditionModal
 * Allows admin to record the physical condition of a component when marking return:
 * - Good (restocks available inventory)
 * - Broken / Damaged (records damage, doesn't restock)
 * - Lost (permanently deducts from lab total inventory)
 */
function ReturnConditionModal({ request: r, onClose, onConfirm }) {
  const [condition, setCondition] = useState("good");
  const [adminComment, setAdminComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onConfirm(r._id, { condition, adminComment: adminComment.trim() });
      onClose();
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
              Inventory Return
            </span>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
              Record Return Condition
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
            <div className="flex justify-between items-start">
              <div>
                <strong className="text-sm font-bold text-slate-900 dark:text-white block">
                  {r.component?.name || "Component"}
                </strong>
                <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
                  Issued to: <span className="font-semibold text-slate-700 dark:text-slate-200">{r.student?.name}</span> ({r.student?.studentId || r.student?.email})
                </span>
                {r.student?.phone && (
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1 mt-0.5">
                    <PhoneIcon size={11} /> {r.student?.phone}
                  </span>
                )}
              </div>
              <span className="px-2 py-0.5 text-xs font-bold rounded bg-amber-500/15 text-amber-700 dark:text-[#fca311]">
                Qty: {r.quantity}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Component Return Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              <label
                className={`p-3 rounded-xl border text-center cursor-pointer transition-all flex flex-col items-center gap-1.5 ${
                  condition === "good"
                    ? "bg-emerald-500/15 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-bold"
                    : "bg-slate-50 dark:bg-[#14213d]/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                }`}
              >
                <input
                  type="radio"
                  name="condition"
                  value="good"
                  checked={condition === "good"}
                  onChange={() => setCondition("good")}
                  className="sr-only"
                />
                <span className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckIcon size={15} />
                </span>
                <span className="text-xs">Good</span>
                <span className="text-[10px] opacity-75">Restocks +{r.quantity}</span>
              </label>

              <label
                className={`p-3 rounded-xl border text-center cursor-pointer transition-all flex flex-col items-center gap-1.5 ${
                  condition === "broken"
                    ? "bg-purple-500/15 border-purple-500 text-purple-800 dark:text-purple-300 font-bold"
                    : "bg-slate-50 dark:bg-[#14213d]/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                }`}
              >
                <input
                  type="radio"
                  name="condition"
                  value="broken"
                  checked={condition === "broken"}
                  onChange={() => setCondition("broken")}
                  className="sr-only"
                />
                <span className="w-7 h-7 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <AlertTriangleIcon size={15} />
                </span>
                <span className="text-xs">Broken</span>
                <span className="text-[10px] opacity-75">Damaged / Defect</span>
              </label>

              <label
                className={`p-3 rounded-xl border text-center cursor-pointer transition-all flex flex-col items-center gap-1.5 ${
                  condition === "lost"
                    ? "bg-rose-500/15 border-rose-500 text-rose-800 dark:text-rose-300 font-bold"
                    : "bg-slate-50 dark:bg-[#14213d]/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                }`}
              >
                <input
                  type="radio"
                  name="condition"
                  value="lost"
                  checked={condition === "lost"}
                  onChange={() => setCondition("lost")}
                  className="sr-only"
                />
                <span className="w-7 h-7 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <XCircleIcon size={15} />
                </span>
                <span className="text-xs">Lost</span>
                <span className="text-[10px] opacity-75">Total Stock -{r.quantity}</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Admin Notes / Damage Report (Optional)
            </label>
            <textarea
              rows="2"
              value={adminComment}
              onChange={(e) => setAdminComment(e.target.value)}
              placeholder={
                condition === "broken"
                  ? "e.g. Pin 4 bent, circuit board burned..."
                  : condition === "lost"
                  ? "e.g. Student reported component missing during field test..."
                  : "e.g. Returned on time in good working condition..."
              }
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
              className={`px-5 py-2 rounded-lg text-xs font-bold text-white transition-all flex items-center gap-1.5 ${
                condition === "good"
                  ? "bg-emerald-600 hover:bg-emerald-500"
                  : condition === "broken"
                  ? "bg-purple-600 hover:bg-purple-500"
                  : "bg-rose-600 hover:bg-rose-500"
              }`}
            >
              {loading ? "Processing…" : `Confirm ${condition === "good" ? "Return" : `as ${condition}`}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReturnConditionModal;
