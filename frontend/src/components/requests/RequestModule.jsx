import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import { REQ_PAGE_SIZE, DEFAULT_PAGINATION } from "../../constants";
import Pagination from "../ui/Pagination";
import RequestCard from "./RequestCard";
import ReturnConditionModal from "./ReturnConditionModal";
import ExtendReturnModal from "./ExtendReturnModal";
import LabSettingsModal from "./LabSettingsModal";
import { SearchIcon, CloseIcon, FilterIcon, ClockIcon, SettingsIcon, CheckIcon } from "../ui/Icons";

/**
 * RequestModule
 * Lists requests and issued items with real-time student/component search,
 * status filter pills, return condition tracking, return extension, and
 * admin bulk selection (approve / reject / issue) for group cart processing.
 */
function RequestModule({ token, user, refreshRef, pageNavRef }) {
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);
  const isAdmin = user.role === "admin";

  const [requests,   setRequests]   = useState([]);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [message,    setMessage]    = useState("");
  const [loading,    setLoading]    = useState(false);

  // Search & Filter
  const [searchTerm,   setSearchTerm]   = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modals
  const [returnModalRequest, setReturnModalRequest] = useState(null);
  const [extendModalRequest, setExtendModalRequest] = useState(null);
  const [showSettingsModal,  setShowSettingsModal]  = useState(false);

  // ── Bulk Selection (Admin only) ───────────────────────────────
  const [selectedIds,    setSelectedIds]    = useState(new Set());
  const [bulkLoading,    setBulkLoading]    = useState(false);

  // ── Data fetching ────────────────────────────────────────────
  const load = useCallback(async (page = 1) => {
    setLoading(true);
    setSelectedIds(new Set()); // clear selection on page change
    try {
      const endpoint = isAdmin ? "/requests" : "/requests/my";
      const reqRes   = await api.get(`${endpoint}?page=${page}&limit=${REQ_PAGE_SIZE}`, { headers });
      setRequests(reqRes.data.data);
      setPagination(reqRes.data.pagination);
    } catch (err) {
      setMessage(err.response?.data?.message || "Could not load requests.");
    } finally {
      setLoading(false);
    }
  }, [headers, isAdmin]);

  useEffect(() => { load(1); }, [load]);

  // Wire up keyboard shortcuts
  useEffect(() => {
    if (refreshRef) {
      refreshRef.current = () => load(pagination.currentPage);
    }
    if (pageNavRef) {
      pageNavRef.current = {
        prev: () => { if (pagination.currentPage > 1) load(pagination.currentPage - 1); },
        next: () => { if (pagination.currentPage < pagination.totalPages) load(pagination.currentPage + 1); },
      };
    }
  });

  // ── Individual Actions ────────────────────────────────────────
  const handleAction = async (id, type, body) => {
    try {
      await api.put(`/requests/${id}/${type}`, body || {}, { headers });
      setMessage(`Request ${type} completed successfully.`);
      load(pagination.currentPage);
    } catch (err) {
      setMessage(err.response?.data?.message || "Action failed.");
    }
  };

  const handleConfirmReturn = async (id, payload) => {
    try {
      await api.put(`/requests/${id}/return`, payload, { headers });
      setMessage(`Component return processed (${payload.condition} condition recorded).`);
      load(pagination.currentPage);
    } catch (err) {
      setMessage(err.response?.data?.message || "Return processing failed.");
    }
  };

  const handleCheckOverdue = async () => {
    try {
      const res = await api.put("/requests/check-overdue", {}, { headers });
      setMessage(
        `Overdue check: ${res.data.overdueCount} overdue, ${res.data.emailsSent} email(s) sent.`
      );
      load(pagination.currentPage);
    } catch (err) {
      setMessage(err.response?.data?.message || "Overdue check failed.");
    }
  };

  // ── Bulk Selection Helpers ────────────────────────────────────
  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const selectable = filteredRequests.filter(
      (r) => r.status === "pending" || r.status === "approved"
    );
    if (selectedIds.size === selectable.length && selectable.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectable.map((r) => r._id)));
    }
  };

  // ── Bulk Actions ──────────────────────────────────────────────
  const handleBulkAction = async (actionType) => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    setMessage("");
    try {
      const ids = Array.from(selectedIds);
      const res = await api.post(`/requests/${actionType}`, { ids }, { headers });
      setMessage(res.data.message);
      setSelectedIds(new Set());
      load(pagination.currentPage);
    } catch (err) {
      setMessage(err.response?.data?.message || `Bulk ${actionType} failed.`);
    } finally {
      setBulkLoading(false);
    }
  };

  // ── Status Counts ────────────────────────────────────────────
  const counts = useMemo(() => {
    const c = { all: requests.length, pending: 0, approved: 0, issued: 0, overdue: 0, returned: 0 };
    requests.forEach((r) => {
      if (r.status === "pending") c.pending++;
      else if (r.status === "approved") c.approved++;
      else if (r.status === "issued") c.issued++;
      else if (r.status === "overdue") c.overdue++;
      else if (["returned", "broken", "lost"].includes(r.status)) c.returned++;
    });
    return c;
  }, [requests]);

  // ── Client-side Filtering ────────────────────────────────────
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (statusFilter !== "all") {
        if (statusFilter === "issued"   && r.status !== "issued")                                    return false;
        if (statusFilter === "overdue"  && r.status !== "overdue")                                   return false;
        if (statusFilter === "pending"  && r.status !== "pending")                                   return false;
        if (statusFilter === "approved" && r.status !== "approved")                                  return false;
        if (statusFilter === "returned" && !["returned", "broken", "lost"].includes(r.status))       return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const sName  = r.student?.name?.toLowerCase()      || "";
        const sEmail = r.student?.email?.toLowerCase()     || "";
        const sId    = r.student?.studentId?.toLowerCase() || "";
        const sPhone = r.student?.phone?.toLowerCase()     || "";
        const cName  = r.component?.name?.toLowerCase()    || "";
        const cId    = r.component?.componentId?.toLowerCase() || "";
        const purp   = r.purpose?.toLowerCase()            || "";
        return sName.includes(q) || sEmail.includes(q) || sId.includes(q) ||
               sPhone.includes(q) || cName.includes(q) || cId.includes(q) || purp.includes(q);
      }
      return true;
    });
  }, [requests, statusFilter, searchTerm]);

  // Determine what bulk actions are available based on selection
  const selectedRequests = useMemo(
    () => filteredRequests.filter((r) => selectedIds.has(r._id)),
    [filteredRequests, selectedIds]
  );
  const hasPendingSelected  = selectedRequests.some((r) => r.status === "pending");
  const hasApprovedSelected = selectedRequests.some((r) => r.status === "approved");

  const selectablePendingCount  = filteredRequests.filter((r) => r.status === "pending").length;
  const selectableApprovedCount = filteredRequests.filter((r) => r.status === "approved").length;

  return (
    <section>
      {message && <div className="alert">{message}</div>}

      {/* ── Bulk Action Toolbar (Admin, appears when items are selected) ── */}
      {isAdmin && selectedIds.size > 0 && (
        <div
          className="sticky top-2 z-50 mb-3 flex items-center justify-between gap-3 px-4 py-3 rounded-2xl shadow-2xl shadow-black/40 border"
          style={{
            backgroundColor: "var(--surface-2)",
            borderColor: "var(--accent)",
            borderLeft: "4px solid var(--accent)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm"
              style={{ backgroundColor: "var(--accent)", color: "#000" }}
            >
              {selectedIds.size}
            </div>
            <span className="text-sm font-bold" style={{ color: "var(--text)" }}>
              {selectedIds.size} request{selectedIds.size !== 1 ? "s" : ""} selected
            </span>
            {selectedRequests.some((r) => r.status === "pending") && (
              <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-amber-500/15 text-amber-600 dark:text-[#fca311] border border-amber-500/30">
                {selectedRequests.filter((r) => r.status === "pending").length} pending
              </span>
            )}
            {selectedRequests.some((r) => r.status === "approved") && (
              <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                {selectedRequests.filter((r) => r.status === "approved").length} approved
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {hasPendingSelected && (
              <>
                <button
                  type="button"
                  disabled={bulkLoading}
                  onClick={() => handleBulkAction("batch-approve")}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white transition-colors flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
                >
                  <CheckIcon size={12} />
                  {bulkLoading ? "Processing…" : `Approve ${selectedRequests.filter((r) => r.status === "pending").length}`}
                </button>
                <button
                  type="button"
                  disabled={bulkLoading}
                  onClick={() => handleBulkAction("batch-reject")}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white transition-colors flex items-center gap-1.5"
                >
                  {bulkLoading ? "…" : `Reject ${selectedRequests.filter((r) => r.status === "pending").length}`}
                </button>
              </>
            )}
            {hasApprovedSelected && (
              <button
                type="button"
                disabled={bulkLoading}
                onClick={() => handleBulkAction("batch-issue")}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-black transition-colors flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
                style={{ backgroundColor: "var(--accent)" }}
              >
                {bulkLoading ? "…" : `Issue ${selectedRequests.filter((r) => r.status === "approved").length}`}
              </button>
            )}
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              style={{ backgroundColor: "var(--surface-3)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Main Request list panel */}
      <div className="panel">
        <div className="panel-head">
          <div>
            <span className="eyebrow">SmartLab Module 03</span>
            <h3>{isAdmin ? "Manage Component Requests & Returns" : "My Issued Components & Requests"}</h3>
          </div>
          <div className="head-actions">
            <button className="ghost" onClick={() => load(pagination.currentPage)}>
              Refresh
            </button>
            {isAdmin && (
              <>
                {/* Select All / Deselect All — only when there are selectable items */}
                {(selectablePendingCount > 0 || selectableApprovedCount > 0) && (
                  <button
                    type="button"
                    className="ghost flex items-center gap-1.5"
                    onClick={toggleSelectAll}
                    title="Select / deselect all actionable requests on this page"
                  >
                    <CheckIcon size={13} />
                    <span>
                      {selectedIds.size === (selectablePendingCount + selectableApprovedCount) && selectedIds.size > 0
                        ? "Deselect All"
                        : `Select All (${selectablePendingCount + selectableApprovedCount})`}
                    </span>
                  </button>
                )}
                <button
                  className="ghost flex items-center gap-1.5"
                  onClick={() => setShowSettingsModal(true)}
                  title="Configure standard borrowing days and max extension limits"
                >
                  <SettingsIcon size={13} />
                  <span>Policy Limits</span>
                </button>
                <button className="warning flex items-center gap-1.5" onClick={handleCheckOverdue}>
                  <ClockIcon size={13} />
                  <span>Check Overdue</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="inventory-controls">
          <div className="search-bar-wrap">
            <span className="search-icon"><SearchIcon size={16} /></span>
            <input
              type="text"
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={
                isAdmin
                  ? "Search by student name, roll ID, phone number, component name or ID…"
                  : "Search your requests by component name or ID…"
              }
            />
            {searchTerm && (
              <button type="button" className="search-clear-btn" onClick={() => setSearchTerm("")} aria-label="Clear search">
                <CloseIcon size={14} />
              </button>
            )}
          </div>

          <div className="category-chips-scroll">
            <span className="category-filter-label"><FilterIcon size={12} /> Status:</span>
            <div className="category-chips-list">
              {[
                { id: "all",      label: "All",             count: counts.all },
                { id: "pending",  label: "Pending",         count: counts.pending },
                { id: "approved", label: "Approved",        count: counts.approved },
                { id: "issued",   label: "Active Issue",    count: counts.issued },
                { id: "overdue",  label: "Overdue",         count: counts.overdue },
                { id: "returned", label: "Returned/Closed", count: counts.returned },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`category-chip ${statusFilter === tab.id ? "active" : ""}`}
                  onClick={() => setStatusFilter(tab.id)}
                >
                  <span>{tab.label}</span>
                  <span style={{
                    marginLeft: "6px",
                    padding: "1px 6px",
                    borderRadius: "10px",
                    fontSize: "10px",
                    background: statusFilter === tab.id ? "rgba(0,0,0,0.25)" : "var(--border)",
                    color: statusFilter === tab.id ? "#000" : "var(--text-dim)",
                    fontWeight: 700,
                  }}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">Loading requests…</div>
        ) : (
          <>
            <div className="request-list">
              {filteredRequests.length === 0 && (
                <div className="empty">
                  {searchTerm || statusFilter !== "all"
                    ? "No requests matching your active filter criteria."
                    : "No requests found."}
                </div>
              )}
              {filteredRequests.map((r) => (
                <RequestCard
                  key={r._id}
                  request={r}
                  isAdmin={isAdmin}
                  onAction={handleAction}
                  onReturnPrompt={(req) => setReturnModalRequest(req)}
                  onExtendPrompt={(req) => setExtendModalRequest(req)}
                  // Bulk select props (admin only)
                  isSelectable={isAdmin && (r.status === "pending" || r.status === "approved")}
                  isSelected={selectedIds.has(r._id)}
                  onToggleSelect={() => toggleSelect(r._id)}
                />
              ))}
            </div>

            <div className="pagination-row">
              <span className="pagination-info">
                Showing {filteredRequests.length} of {pagination.totalItems} request{pagination.totalItems !== 1 ? "s" : ""} ·
                page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={load}
              />
            </div>
          </>
        )}
      </div>

      {/* Return Condition Modal (Admin) */}
      {returnModalRequest && (
        <ReturnConditionModal
          request={returnModalRequest}
          onClose={() => setReturnModalRequest(null)}
          onConfirm={handleConfirmReturn}
        />
      )}

      {/* Extend Return Modal */}
      {extendModalRequest && (
        <ExtendReturnModal
          request={extendModalRequest}
          token={token}
          onClose={() => setExtendModalRequest(null)}
          onSuccess={(msg) => {
            setMessage(msg);
            load(pagination.currentPage);
          }}
        />
      )}

      {/* Admin Lab Policy Limits Modal */}
      {showSettingsModal && (
        <LabSettingsModal
          token={token}
          onClose={() => setShowSettingsModal(false)}
          onSaved={(newSettings) => {
            setMessage(`Lab policies updated: Standard ${newSettings.standardIssueDays} days, Max extension ${newSettings.maxExtensionDays} days.`);
          }}
        />
      )}
    </section>
  );
}

export default RequestModule;
