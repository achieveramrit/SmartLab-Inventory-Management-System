import { useEffect, useState } from "react";
import api from "../../api/axios";
import Pagination from "../ui/Pagination";
import AddManualHistoryModal from "./AddManualHistoryModal";
import { CloseIcon, HistoryIcon, FileTextIcon, PrinterIcon, PhoneIcon, PlusIcon, TrashIcon } from "../ui/Icons";

/**
 * ComponentHistoryModal
 * Displays the complete issue and return audit trail for a component,
 * plus an admin-editable manual lifecycle timeline.
 * Theme-aware (light / dark mode), with export options for DOCX and printable PDF.
 */
function ComponentHistoryModal({ component: initialComponent, token, onClose, isAdmin = false }) {
  const headers = { Authorization: `Bearer ${token}` };

  // Keep a local copy of the component so we can update manualHistory in-place
  const [component, setComponent] = useState(initialComponent);

  const [history, setHistory] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Tab: "requests" | "lifecycle"
  const [activeTab, setActiveTab] = useState("requests");
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);

  const loadHistory = async (page = 1) => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/requests/component/${component._id}?page=${page}&limit=10`, { headers });
      setHistory(res.data.data);
      setSummary(res.data.summary);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load component history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (component?._id) {
      loadHistory(1);
    }
  }, [component?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Delete a manual history entry ────────────────────────────
  const handleDeleteEntry = async (entryId) => {
    if (!window.confirm("Delete this history entry?")) return;
    setDeleteLoadingId(entryId);
    try {
      const res = await api.delete(`/components/${component._id}/history/${entryId}`, { headers });
      setComponent((prev) => ({ ...prev, manualHistory: res.data.manualHistory }));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete entry.");
    } finally {
      setDeleteLoadingId(null);
    }
  };

  // ── Export as DOCX (Word Document) ───────────────────────────
  const handleExportDOCX = async () => {
    try {
      // Fetch all records for full export
      const res = await api.get(`/requests/component/${component._id}?page=1&limit=500`, { headers });
      const records = res.data.data || [];

      const rowsHtml = records.map((r, idx) => {
        const s = r.student || {};
        const issueDateStr = r.issueDate ? new Date(r.issueDate).toLocaleDateString() : (r.requestDate ? new Date(r.requestDate).toLocaleDateString() : "—");
        const dueDateStr = r.expectedReturnDate ? new Date(r.expectedReturnDate).toLocaleDateString() : "—";
        const returnDateStr = r.actualReturnDate ? new Date(r.actualReturnDate).toLocaleDateString() : "Not returned";
        const statusLabel = r.returnCondition && r.returnCondition !== "good" ? `${r.status} (${r.returnCondition})` : r.status;

        return `
          <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
            <td style="padding: 8px 10px; border: 1px solid #cbd5e1;">${idx + 1}</td>
            <td style="padding: 8px 10px; border: 1px solid #cbd5e1;">
              <strong>${s.name || "Unknown"}</strong><br/>
              <span style="font-size: 11px; color: #64748b;">${s.studentId ? `ID: ${s.studentId} · ` : ''}${s.email || ''}</span><br/>
              <span style="font-size: 11px; color: #64748b;">${s.phone ? `Phone: ${s.phone}` : ''}</span>
            </td>
            <td style="padding: 8px 10px; border: 1px solid #cbd5e1; text-align: center;">${r.quantity}</td>
            <td style="padding: 8px 10px; border: 1px solid #cbd5e1;">${r.purpose || "—"}</td>
            <td style="padding: 8px 10px; border: 1px solid #cbd5e1; text-transform: uppercase; font-weight: bold; font-size: 11px;">${statusLabel}</td>
            <td style="padding: 8px 10px; border: 1px solid #cbd5e1;">${issueDateStr}</td>
            <td style="padding: 8px 10px; border: 1px solid #cbd5e1;">${dueDateStr}</td>
            <td style="padding: 8px 10px; border: 1px solid #cbd5e1;">${returnDateStr}</td>
          </tr>
        `;
      }).join("");

      const content = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset="utf-8">
          <title>SmartLab - ${component.name} History</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; margin: 24px; color: #1e293b; }
            h2 { color: #14213d; margin-bottom: 4px; }
            .meta { font-size: 13px; color: #475569; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }
            th { background-color: #14213d; color: #ffffff; padding: 10px; text-align: left; border: 1px solid #14213d; }
          </style>
        </head>
        <body>
          <h2>SmartLab Inventory - Component Issue & Return History</h2>
          <div class="meta">
            <strong>Component:</strong> ${component.name} (${component.componentId}) | 
            <strong>Category:</strong> ${component.category || "General"} | 
            <strong>Stock:</strong> ${component.availableQuantity} available of ${component.totalQuantity} total<br/>
            <strong>Generated on:</strong> ${new Date().toLocaleString()}
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Student Details</th>
                <th>Qty</th>
                <th>Purpose</th>
                <th>Status</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th>Return Date</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || '<tr><td colspan="8" style="padding:16px;text-align:center;">No history records found.</td></tr>'}
            </tbody>
          </table>
        </body>
        </html>
      `;

      const blob = new Blob(['\ufeff', content], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `History_${component.componentId || 'Component'}_${Date.now()}.doc`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to export DOCX: " + (err.message || "Unknown error"));
    }
  };

  // ── Export as PDF (Printable Report) ─────────────────────────
  const handleExportPDF = async () => {
    try {
      const res = await api.get(`/requests/component/${component._id}?page=1&limit=500`, { headers });
      const records = res.data.data || [];

      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        alert("Pop-up blocker prevented printing. Please allow popups for this site.");
        return;
      }

      const rowsHtml = records.map((r, idx) => {
        const s = r.student || {};
        const issueDateStr = r.issueDate ? new Date(r.issueDate).toLocaleDateString() : (r.requestDate ? new Date(r.requestDate).toLocaleDateString() : "—");
        const dueDateStr = r.expectedReturnDate ? new Date(r.expectedReturnDate).toLocaleDateString() : "—";
        const returnDateStr = r.actualReturnDate ? new Date(r.actualReturnDate).toLocaleDateString() : "Not returned";
        const statusLabel = r.returnCondition && r.returnCondition !== "good" ? `${r.status} (${r.returnCondition})` : r.status;

        return `
          <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
            <td style="padding: 7px 9px; border: 1px solid #cbd5e1;">${idx + 1}</td>
            <td style="padding: 7px 9px; border: 1px solid #cbd5e1;">
              <strong>${s.name || "Unknown"}</strong><br/>
              <span style="font-size: 11px; color: #64748b;">${s.studentId ? `ID: ${s.studentId} · ` : ''}${s.email || ''}</span>
              ${s.phone ? `<br/><span style="font-size: 11px; color: #64748b;">Phone: ${s.phone}</span>` : ''}
            </td>
            <td style="padding: 7px 9px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">${r.quantity}</td>
            <td style="padding: 7px 9px; border: 1px solid #cbd5e1;">${r.purpose || "—"}</td>
            <td style="padding: 7px 9px; border: 1px solid #cbd5e1; text-transform: uppercase; font-weight: bold; font-size: 10px;">${statusLabel}</td>
            <td style="padding: 7px 9px; border: 1px solid #cbd5e1;">${issueDateStr}</td>
            <td style="padding: 7px 9px; border: 1px solid #cbd5e1;">${dueDateStr}</td>
            <td style="padding: 7px 9px; border: 1px solid #cbd5e1;">${returnDateStr}</td>
          </tr>
        `;
      }).join("");

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Component History - ${component.name}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 30px; color: #0f172a; }
            .header { border-bottom: 2px solid #14213d; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
            .header h1 { font-size: 20px; margin: 0; color: #14213d; }
            .header .badge { background: #fca311; color: #000; padding: 3px 8px; border-radius: 4px; font-weight: bold; font-size: 12px; }
            .meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; font-size: 12px; }
            .meta-card { background: #f1f5f9; padding: 10px; border-radius: 6px; }
            .meta-card span { display: block; font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: bold; }
            .meta-card strong { font-size: 13px; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 15px; }
            th { background-color: #14213d; color: #ffffff; padding: 8px 10px; text-align: left; border: 1px solid #14213d; font-size: 10px; text-transform: uppercase; }
            @media print {
              body { margin: 15mm; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>SmartLab Component Audit Trail</h1>
              <p style="margin: 4px 0 0; font-size: 12px; color: #64748b;">Detailed issue and return record report</p>
            </div>
            <div>
              <span class="badge">${component.componentId}</span>
            </div>
          </div>

          <div class="meta-grid">
            <div class="meta-card">
              <span>Component</span>
              <strong>${component.name}</strong>
            </div>
            <div class="meta-card">
              <span>Category</span>
              <strong>${component.category || "General"}</strong>
            </div>
            <div class="meta-card">
              <span>Current Stock</span>
              <strong>${component.availableQuantity} / ${component.totalQuantity} Units</strong>
            </div>
            <div class="meta-card">
              <span>Generated On</span>
              <strong>${new Date().toLocaleDateString()}</strong>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Student Details</th>
                <th>Qty</th>
                <th>Purpose</th>
                <th>Status</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th>Return Date</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || '<tr><td colspan="8" style="padding:16px;text-align:center;">No records available.</td></tr>'}
            </tbody>
          </table>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    } catch (err) {
      alert("Failed to generate PDF: " + (err.message || "Unknown error"));
    }
  };

  return (
    <>
    <div
      className="smartlab-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="smartlab-modal-card max-w-4xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="smartlab-modal-header">
          <div>
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-[#fca311]">
              <HistoryIcon size={12} /> Audit Trail &amp; History
            </span>
            <h3 className="text-base md:text-lg font-extrabold text-inherit flex items-center gap-2 mt-0.5 m-0">
              <span>{component.name}</span>
              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-[#fca311] border border-amber-500/20 font-mono text-xs font-bold">
                {component.componentId}
              </span>
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Export Buttons — only on requests tab */}
            {activeTab === "requests" && (
              <>
                <button
                  type="button"
                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-[#fca311] hover:bg-amber-500/25 border border-amber-500/30 transition-colors flex items-center gap-1.5"
                  onClick={handleExportDOCX}
                  title="Export complete history as Word DOCX"
                >
                  <FileTextIcon size={13} /> Export DOCX
                </button>
                <button
                  type="button"
                  style={{
                    backgroundColor: "var(--surface-3)",
                    color: "var(--text)",
                    borderColor: "var(--border)",
                  }}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold hover:opacity-85 border transition-colors flex items-center gap-1.5"
                  onClick={handleExportPDF}
                  title="Export complete history as printable PDF"
                >
                  <PrinterIcon size={13} /> Export PDF
                </button>
              </>
            )}
            {/* Add Entry button — only on lifecycle tab for admins */}
            {activeTab === "lifecycle" && isAdmin && (
              <button
                type="button"
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-[#fca311] hover:bg-amber-500/25 border border-amber-500/30 transition-colors flex items-center gap-1.5"
                onClick={() => setShowAddEntry(true)}
              >
                <PlusIcon size={13} /> Add Entry
              </button>
            )}
            <button
              type="button"
              className="p-1.5 rounded-lg text-slate-400 hover:text-inherit hover:bg-black/10 dark:hover:bg-white/10 transition-colors ml-1"
              onClick={onClose}
              aria-label="Close"
            >
              <CloseIcon size={18} />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div
          className="flex border-b"
          style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--border)" }}
        >
          {["requests", "lifecycle"].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className="px-5 py-2.5 text-xs font-bold capitalize transition-colors border-b-2"
              style={{
                borderBottomColor: activeTab === tab ? "var(--accent)" : "transparent",
                color: activeTab === tab ? "var(--accent)" : "var(--text-muted)",
                backgroundColor: "transparent",
              }}
            >
              {tab === "requests" ? "Request History" : "Lifecycle Timeline"}
              {tab === "lifecycle" && (
                <span
                  className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ backgroundColor: "var(--surface-3)", color: "var(--text-muted)" }}
                >
                  {(component.manualHistory || []).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div
          className="p-6 max-h-[75vh] overflow-y-auto flex flex-col gap-5"
          style={{ backgroundColor: "var(--surface)", color: "var(--text)" }}
        >
          {/* ── Quick Component Summary (always visible) ─────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            <div className="p-3 rounded-xl border flex flex-col gap-1" style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--border)" }}>
              <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: "var(--text-muted)" }}>Category</span>
              <strong className="text-sm font-bold truncate" style={{ color: "var(--text)" }}>{component.category || "General"}</strong>
            </div>
            <div className="p-3 rounded-xl border flex flex-col gap-1" style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--border)" }}>
              <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: "var(--text-muted)" }}>Available / Total</span>
              <strong className="text-sm font-bold" style={{ color: "var(--text)" }}>{component.availableQuantity} / {component.totalQuantity}</strong>
            </div>
            <div className="p-3 rounded-xl border flex flex-col gap-1" style={{ backgroundColor: "rgba(252, 163, 17, 0.1)", borderColor: "rgba(252, 163, 17, 0.35)" }}>
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-700 dark:text-[#fca311]">Currently Issued</span>
              <strong className="text-sm font-bold text-amber-800 dark:text-[#fca311]">{summary ? summary.issued + summary.overdue : "—"}</strong>
            </div>
            <div className="p-3 rounded-xl border flex flex-col gap-1" style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--border)" }}>
              <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: "var(--text-muted)" }}>Total Returned</span>
              <strong className="text-sm font-bold" style={{ color: "var(--text)" }}>{summary ? summary.returned : "—"}</strong>
            </div>
            <div className="p-3 rounded-xl border flex flex-col gap-1 col-span-2 sm:col-span-1" style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--border)" }}>
              <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: "var(--text-muted)" }}>Lifetime Requests</span>
              <strong className="text-sm font-bold" style={{ color: "var(--text)" }}>{summary ? summary.totalRequests : "—"}</strong>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl text-xs font-semibold bg-rose-500/15 border border-rose-500/40 text-rose-600 dark:text-rose-300">{error}</div>
          )}

          {/* ── TAB: REQUEST HISTORY ─────────────────────────────────── */}
          {activeTab === "requests" && (
            <>
              {loading ? (
                <div className="py-12 text-center text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
                  Loading issue and return history…
                </div>
              ) : history.length === 0 ? (
                <div className="py-12 text-center flex flex-col items-center justify-center p-6 rounded-2xl border border-dashed" style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--border)" }}>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: "var(--surface-3)", color: "var(--accent)" }}>
                    <HistoryIcon size={24} />
                  </div>
                  <h4 className="text-sm font-bold mb-1" style={{ color: "var(--text)" }}>No Issue History Yet</h4>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>This component has not been issued to or requested by any student yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="uppercase text-[10px] tracking-wider border-b font-bold" style={{ backgroundColor: "var(--surface-2)", color: "var(--text-muted)", borderColor: "var(--border)" }}>
                      <tr>
                        <th className="py-3 px-4">Student Details</th>
                        <th className="py-3 px-3">Qty</th>
                        <th className="py-3 px-4">Purpose</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3">Issue Date</th>
                        <th className="py-3 px-3">Due Date</th>
                        <th className="py-3 px-3">Return Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
                      {history.map((record) => {
                        const student = record.student || {};
                        return (
                          <tr key={record._id} className="transition-colors hover:opacity-90" style={{ borderColor: "var(--border)" }}>
                            <td className="py-3 px-4">
                              <div className="flex flex-col">
                                <strong className="font-semibold" style={{ color: "var(--text)" }}>{student.name || "Unknown Student"}</strong>
                                <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                                  {student.studentId ? `ID: ${student.studentId}` : student.email}
                                  {student.department ? ` · ${student.department}` : ""}
                                </span>
                                {student.phone && (
                                  <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium flex items-center gap-1 mt-0.5">
                                    <PhoneIcon size={10} /> {student.phone}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-3"><span className="font-bold" style={{ color: "var(--text)" }}>{record.quantity}</span></td>
                            <td className="py-3 px-4 max-w-[160px] truncate" style={{ color: "var(--text-muted)" }} title={record.purpose}>{record.purpose || "—"}</td>
                            <td className="py-3 px-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                record.status === "issued" ? "bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30"
                                : record.status === "returned" ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                                : record.status === "overdue" ? "bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30"
                                : record.status === "broken" ? "bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/30"
                                : record.status === "lost" ? "bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/30"
                                : "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30"
                              }`}>
                                {record.returnCondition && record.returnCondition !== "good" ? `${record.status} (${record.returnCondition})` : record.status}
                              </span>
                            </td>
                            <td className="py-3 px-3" style={{ color: "var(--text-muted)" }}>
                              {record.issueDate ? new Date(record.issueDate).toLocaleDateString() : record.requestDate ? new Date(record.requestDate).toLocaleDateString() : "—"}
                            </td>
                            <td className="py-3 px-3" style={{ color: "var(--text-muted)" }}>
                              {record.expectedReturnDate ? new Date(record.expectedReturnDate).toLocaleDateString() : "—"}
                            </td>
                            <td className="py-3 px-3">
                              {record.actualReturnDate ? (
                                <span className="text-emerald-600 dark:text-emerald-400 font-medium">{new Date(record.actualReturnDate).toLocaleDateString()}</span>
                              ) : record.status === "issued" || record.status === "overdue" ? (
                                <span className="text-amber-600 dark:text-amber-400 font-semibold">Not returned</span>
                              ) : (
                                <span style={{ color: "var(--text-dim)" }}>—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {pagination.totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t" style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--border)" }}>
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {pagination.totalItems} record{pagination.totalItems !== 1 ? "s" : ""} · page {pagination.currentPage} of {pagination.totalPages}
                      </span>
                      <Pagination currentPage={pagination.currentPage} totalPages={pagination.totalPages} onPageChange={(p) => loadHistory(p)} />
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* ── TAB: LIFECYCLE TIMELINE ───────────────────────────────── */}
          {activeTab === "lifecycle" && (
            <div className="flex flex-col gap-3">
              {isAdmin && (
                <div className="flex items-center justify-between">
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Manually log procurement, repairs, upgrades, and notes for this component.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowAddEntry(true)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-[#fca311] border border-amber-500/30 hover:bg-amber-500/25 transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    <PlusIcon size={12} /> Add Entry
                  </button>
                </div>
              )}

              {(component.manualHistory || []).length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center rounded-2xl border border-dashed gap-2" style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--border)" }}>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: "var(--surface-3)", color: "var(--accent)" }}>
                    <HistoryIcon size={24} />
                  </div>
                  <h4 className="text-sm font-bold" style={{ color: "var(--text)" }}>No lifecycle entries yet</h4>
                  {isAdmin && (
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>Click "Add Entry" to log the first lifecycle event for this component.</p>
                  )}
                </div>
              ) : (
                <div className="relative pl-6">
                  {/* Timeline vertical line */}
                  <div className="absolute left-2 top-2 bottom-2 w-px" style={{ backgroundColor: "var(--border)" }} />

                  <div className="flex flex-col gap-4">
                    {(component.manualHistory || []).map((entry) => {
                      const typeColorMap = {
                        procurement: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
                        repair:      "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30",
                        maintenance: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
                        upgrade:     "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30",
                        decommission:"bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30",
                        note:        "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
                        other:       "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30",
                      };
                      const colorCls = typeColorMap[entry.type] || typeColorMap.other;

                      return (
                        <div key={entry._id} className="relative flex gap-3">
                          {/* Timeline dot */}
                          <div
                            className="absolute -left-6 top-1 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
                            style={{ backgroundColor: "var(--surface)", borderColor: "var(--accent)" }}
                          />

                          {/* Card */}
                          <div
                            className="flex-1 p-3.5 rounded-xl border transition-colors"
                            style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--border)" }}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${colorCls}`}>
                                    {entry.type}
                                  </span>
                                  <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                                    {entry.eventDate ? new Date(entry.eventDate).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" }) : "—"}
                                  </span>
                                </div>
                                <p className="text-sm font-bold" style={{ color: "var(--text)" }}>{entry.title}</p>
                                {entry.description && (
                                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{entry.description}</p>
                                )}
                              </div>
                              {isAdmin && (
                                <button
                                  type="button"
                                  className="p-1.5 rounded-lg transition-colors hover:bg-rose-500/15 text-rose-400 hover:text-rose-500 shrink-0"
                                  onClick={() => handleDeleteEntry(entry._id)}
                                  disabled={deleteLoadingId === entry._id}
                                  title="Delete this entry"
                                >
                                  <TrashIcon size={13} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="smartlab-modal-footer">
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {activeTab === "requests"
              ? `Total records: ${pagination.totalItems}`
              : `${(component.manualHistory || []).length} lifecycle entr${(component.manualHistory || []).length !== 1 ? "ies" : "y"}`}
          </span>
          <button
            type="button"
            style={{ backgroundColor: "var(--surface-3)", color: "var(--text)", borderColor: "var(--border)" }}
            className="px-5 py-2 rounded-lg text-xs font-semibold hover:opacity-80 transition-colors border"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>

    {/* Add Manual History Entry Modal */}
    {showAddEntry && (
      <AddManualHistoryModal
        component={component}
        token={token}
        onClose={() => setShowAddEntry(false)}
        onSuccess={(updatedHistory) => {
          setComponent((prev) => ({ ...prev, manualHistory: updatedHistory }));
        }}
      />
    )}
  </>
  );
}

export default ComponentHistoryModal;

