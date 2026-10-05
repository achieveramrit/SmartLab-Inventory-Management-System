import { useState } from "react";
import api from "../../api/axios";
import {
  CloseIcon, PlusIcon, UserIcon, CalendarIcon, CheckIcon, AlertTriangleIcon, XCircleIcon
} from "../ui/Icons";

const STATUS_OPTIONS = [
  { value: "returned",  label: "Returned",  color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30" },
  { value: "issued",    label: "Still Issued", color: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30" },
  { value: "overdue",   label: "Overdue",   color: "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30" },
  { value: "broken",    label: "Broken",    color: "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30" },
  { value: "lost",      label: "Lost",      color: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30" },
];

const CONDITION_OPTIONS = [
  { value: "good",    label: "Good" },
  { value: "broken",  label: "Broken / Damaged" },
  { value: "lost",    label: "Lost" },
];

/**
 * AddRequestHistoryModal
 * Allows admin to manually backfill a component's issue/return history
 * from physical written lab records.
 *
 * Props:
 *   component   {object}   — the component to add history for
 *   token       {string}
 *   onClose     {() => void}
 *   onSuccess   {(newEntry) => void}
 */
function AddRequestHistoryModal({ component, token, onClose, onSuccess }) {
  const headers = { Authorization: `Bearer ${token}` };
  const today = new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState({
    // Student details (free-text — no user lookup needed)
    studentName:       "",
    studentRollId:     "",
    studentEmail:      "",
    studentPhone:      "",
    studentDepartment: "",
    // Record details
    quantity:           1,
    purpose:            "",
    status:             "returned",
    issueDate:          "",
    expectedReturnDate: "",
    actualReturnDate:   "",
    returnCondition:    "good",
    adminComment:       "",
  });

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  // Auto-set return date 7 days after issue date
  const handleIssueDateChange = (val) => {
    update("issueDate", val);
    if (val && !form.expectedReturnDate) {
      const due = new Date(val);
      due.setDate(due.getDate() + 7);
      update("expectedReturnDate", due.toISOString().slice(0, 10));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.studentName.trim()) { setError("Student name is required."); return; }
    if (!form.issueDate)          { setError("Issue date is required."); return; }
    if (form.status === "returned" && !form.actualReturnDate) {
      setError("Return date is required when status is 'Returned'."); return;
    }

    setLoading(true);
    setError("");
    try {
      const payload = {
        studentName:       form.studentName.trim(),
        studentRollId:     form.studentRollId.trim(),
        studentEmail:      form.studentEmail.trim(),
        studentPhone:      form.studentPhone.trim(),
        studentDepartment: form.studentDepartment.trim(),
        quantity:          Number(form.quantity) || 1,
        purpose:           form.purpose.trim() || "Manual entry (backfilled)",
        status:            form.status,
        issueDate:         form.issueDate,
        expectedReturnDate: form.expectedReturnDate || null,
        actualReturnDate:   form.actualReturnDate   || null,
        returnCondition:    form.returnCondition,
        adminComment:       form.adminComment.trim(),
      };

      const res = await api.post(
        `/requests/component/${component._id}/manual`,
        payload,
        { headers }
      );

      if (onSuccess) onSuccess(res.data.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create history entry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-xl my-6 rounded-2xl overflow-hidden shadow-2xl shadow-black/60"
        style={{
          backgroundColor: "var(--surface)",
          color: "var(--text)",
          borderTop: "4px solid var(--accent)",
          border: "1px solid var(--border)",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ─────────────────────────────────────── */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--border)" }}
        >
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-[#fca311]">
              Admin · Backfill Record
            </span>
            <h3 className="text-sm font-extrabold mt-0.5 flex items-center gap-2" style={{ color: "var(--text)" }}>
              <PlusIcon size={14} />
              Add Issue/Return History
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

        {/* ── Body ───────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5 max-h-[78vh] overflow-y-auto">

          {error && (
            <div className="p-3 rounded-xl text-xs font-semibold bg-rose-500/15 border border-rose-500/40 text-rose-600 dark:text-rose-300 flex items-center gap-2">
              <AlertTriangleIcon size={14} />
              {error}
            </div>
          )}

          <div className="p-3 rounded-xl text-xs bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-400">
            This creates a backfilled record for <strong>{component.name}</strong> from physical lab logs.
            It will appear in the Request History tab and exports.
          </div>

          {/* ── Student Details ─────────────────────────── */}
          <fieldset className="border rounded-xl p-4" style={{ borderColor: "var(--border)" }}>
            <legend className="px-2 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
              <UserIcon size={11} /> Student Details
            </legend>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-[11px] font-bold mb-1" style={{ color: "var(--text-muted)" }}>
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.studentName}
                  onChange={e => update("studentName", e.target.value)}
                  placeholder="e.g. Devanshu Patel"
                  className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none"
                  style={{ backgroundColor: "var(--surface-2)", color: "var(--text)", border: "1px solid var(--border)" }}
                  required
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-[11px] font-bold mb-1" style={{ color: "var(--text-muted)" }}>
                  Roll / Student ID
                </label>
                <input
                  type="text"
                  value={form.studentRollId}
                  onChange={e => update("studentRollId", e.target.value)}
                  placeholder="e.g. 21CE001"
                  className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none"
                  style={{ backgroundColor: "var(--surface-2)", color: "var(--text)", border: "1px solid var(--border)" }}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold mb-1" style={{ color: "var(--text-muted)" }}>Email</label>
                <input
                  type="email"
                  value={form.studentEmail}
                  onChange={e => update("studentEmail", e.target.value)}
                  placeholder="student@example.com"
                  className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none"
                  style={{ backgroundColor: "var(--surface-2)", color: "var(--text)", border: "1px solid var(--border)" }}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold mb-1" style={{ color: "var(--text-muted)" }}>Phone</label>
                <input
                  type="text"
                  value={form.studentPhone}
                  onChange={e => update("studentPhone", e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none"
                  style={{ backgroundColor: "var(--surface-2)", color: "var(--text)", border: "1px solid var(--border)" }}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[11px] font-bold mb-1" style={{ color: "var(--text-muted)" }}>Department / Branch</label>
                <input
                  type="text"
                  value={form.studentDepartment}
                  onChange={e => update("studentDepartment", e.target.value)}
                  placeholder="e.g. Computer Engineering"
                  className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none"
                  style={{ backgroundColor: "var(--surface-2)", color: "var(--text)", border: "1px solid var(--border)" }}
                />
              </div>
            </div>
          </fieldset>

          {/* ── Record Details ──────────────────────────── */}
          <fieldset className="border rounded-xl p-4" style={{ borderColor: "var(--border)" }}>
            <legend className="px-2 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
              <CalendarIcon size={11} /> Record Details
            </legend>
            <div className="grid grid-cols-2 gap-3">
              {/* Quantity */}
              <div>
                <label className="block text-[11px] font-bold mb-1" style={{ color: "var(--text-muted)" }}>Quantity</label>
                <input
                  type="number"
                  min={1}
                  max={component.totalQuantity || 999}
                  value={form.quantity}
                  onChange={e => update("quantity", e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none"
                  style={{ backgroundColor: "var(--surface-2)", color: "var(--text)", border: "1px solid var(--border)" }}
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-[11px] font-bold mb-1" style={{ color: "var(--text-muted)" }}>Status</label>
                <select
                  value={form.status}
                  onChange={e => update("status", e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none"
                  style={{ backgroundColor: "var(--surface-2)", color: "var(--text)", border: "1px solid var(--border)" }}
                >
                  {STATUS_OPTIONS.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              {/* Purpose */}
              <div className="col-span-2">
                <label className="block text-[11px] font-bold mb-1" style={{ color: "var(--text-muted)" }}>Purpose / Project</label>
                <input
                  type="text"
                  value={form.purpose}
                  onChange={e => update("purpose", e.target.value)}
                  placeholder="e.g. Mini Project — Line Following Robot"
                  className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none"
                  style={{ backgroundColor: "var(--surface-2)", color: "var(--text)", border: "1px solid var(--border)" }}
                />
              </div>

              {/* Issue Date */}
              <div>
                <label className="block text-[11px] font-bold mb-1" style={{ color: "var(--text-muted)" }}>
                  Issue Date <span className="text-rose-400">*</span>
                </label>
                <input
                  type="date"
                  value={form.issueDate}
                  max={today}
                  onChange={e => handleIssueDateChange(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none"
                  style={{ backgroundColor: "var(--surface-2)", color: "var(--text)", border: "1px solid var(--border)" }}
                />
              </div>

              {/* Expected Return */}
              <div>
                <label className="block text-[11px] font-bold mb-1" style={{ color: "var(--text-muted)" }}>Expected Return Date</label>
                <input
                  type="date"
                  value={form.expectedReturnDate}
                  onChange={e => update("expectedReturnDate", e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none"
                  style={{ backgroundColor: "var(--surface-2)", color: "var(--text)", border: "1px solid var(--border)" }}
                />
              </div>

              {/* Actual Return Date — only when status is returned/broken/lost */}
              {["returned", "broken", "lost"].includes(form.status) && (
                <div>
                  <label className="block text-[11px] font-bold mb-1" style={{ color: "var(--text-muted)" }}>
                    Actual Return Date {form.status === "returned" && <span className="text-rose-400">*</span>}
                  </label>
                  <input
                    type="date"
                    value={form.actualReturnDate}
                    max={today}
                    onChange={e => update("actualReturnDate", e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none"
                    style={{ backgroundColor: "var(--surface-2)", color: "var(--text)", border: "1px solid var(--border)" }}
                  />
                </div>
              )}

              {/* Return Condition — only when returned */}
              {["returned", "broken", "lost"].includes(form.status) && (
                <div>
                  <label className="block text-[11px] font-bold mb-1" style={{ color: "var(--text-muted)" }}>Return Condition</label>
                  <div className="flex gap-2">
                    {CONDITION_OPTIONS.map(c => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => update("returnCondition", c.value)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all"
                        style={
                          form.returnCondition === c.value
                            ? { backgroundColor: "var(--accent)", color: "#000", borderColor: "var(--accent)" }
                            : { backgroundColor: "var(--surface-3)", color: "var(--text-muted)", borderColor: "var(--border)" }
                        }
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin note */}
              <div className="col-span-2">
                <label className="block text-[11px] font-bold mb-1" style={{ color: "var(--text-muted)" }}>
                  Admin Note <span className="font-normal opacity-60">(optional)</span>
                </label>
                <input
                  type="text"
                  value={form.adminComment}
                  onChange={e => update("adminComment", e.target.value)}
                  placeholder="e.g. Backfilled from lab register page 42"
                  className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none"
                  style={{ backgroundColor: "var(--surface-2)", color: "var(--text)", border: "1px solid var(--border)" }}
                />
              </div>
            </div>
          </fieldset>

          {/* ── Footer ─────────────────────────────────── */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              This record will be tagged as a manual backfill entry.
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 rounded-lg text-xs font-semibold transition-colors"
                style={{ backgroundColor: "var(--surface-2)", color: "var(--text)", border: "1px solid var(--border)" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-lg text-xs font-bold bg-[#fca311] hover:bg-[#ffb733] text-black shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5"
              >
                <CheckIcon size={13} />
                {loading ? "Saving…" : "Save Record"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddRequestHistoryModal;
