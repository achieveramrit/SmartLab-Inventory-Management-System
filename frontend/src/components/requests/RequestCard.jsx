import {
  UserIcon,
  MailIcon,
  PhoneIcon,
  CalendarIcon,
  ClockIcon,
  CheckIcon,
  AlertTriangleIcon,
  XCircleIcon,
  BoltIcon
} from "../ui/Icons";

/**
 * RequestCard
 * Displays a single request with status badge, student metadata,
 * dates, purpose, and actions using clean typography and professional SVG icons.
 * When isSelectable is true (admin bulk mode), renders a checkbox overlay.
 */
function RequestCard({ request: r, isAdmin, onAction, onReturnPrompt, onExtendPrompt,
  isSelectable = false, isSelected = false, onToggleSelect }) {
  const student = r.student || {};
  const isOverdue = r.status === "overdue";
  const isIssued = r.status === "issued";

  const getStatusBadge = () => {
    if (r.status === "broken") {
      return (
        <span className="badge danger flex items-center gap-1">
          <AlertTriangleIcon size={11} />
          <span>Broken</span>
        </span>
      );
    }
    if (r.status === "lost") {
      return (
        <span className="badge danger flex items-center gap-1">
          <XCircleIcon size={11} />
          <span>Lost</span>
        </span>
      );
    }
    if (r.status === "returned") {
      return (
        <span className="badge success flex items-center gap-1">
          <CheckIcon size={11} />
          <span>Returned {r.returnCondition && r.returnCondition !== "good" ? `(${r.returnCondition})` : ""}</span>
        </span>
      );
    }
    if (r.status === "issued") {
      return (
        <span className="badge info flex items-center gap-1">
          <BoltIcon size={11} />
          <span>Active Issue</span>
        </span>
      );
    }
    if (r.status === "overdue") {
      return (
        <span className="badge danger flex items-center gap-1">
          <ClockIcon size={11} />
          <span>Overdue</span>
        </span>
      );
    }
    if (r.status === "approved") return <span className="badge success">Approved</span>;
    if (r.status === "rejected") return <span className="badge danger">Rejected</span>;
    return <span className="badge warning">Pending</span>;
  };

  return (
    <div
      className={`request-card ${isSelected ? "request-card-selected" : ""}`}
      style={isSelected ? { borderColor: "var(--accent)", borderWidth: "2px" } : {}}
    >
      {/* Bulk Select Checkbox */}
      {isSelectable && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleSelect?.(); }}
          className="absolute top-3 left-3 z-10 w-5 h-5 rounded flex items-center justify-center transition-all"
          style={{
            backgroundColor: isSelected ? "var(--accent)" : "var(--surface-3)",
            border: `2px solid ${isSelected ? "var(--accent)" : "var(--border)"}`,
          }}
          aria-label={isSelected ? "Deselect" : "Select"}
          title={isSelected ? "Click to deselect" : "Click to select for bulk action"}
        >
          {isSelected && (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </button>
      )}
      {/* Top Main Section — shift right when checkbox is shown */}
      <div className="request-main" style={isSelectable ? { paddingLeft: "28px" } : {}}>
        <div className="request-icon">
          {r.component?.name?.charAt(0) || "C"}
        </div>
        <div className="request-body">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h4 style={{ margin: 0, fontSize: "15px" }}>{r.component?.name || "Component"}</h4>
            {r.component?.componentId && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-[#fca311] font-bold">
                {r.component?.componentId}
              </span>
            )}
          </div>

          <p style={{ margin: "4px 0 6px", fontSize: "13px" }}>{r.purpose}</p>

          {/* Student details display (Clean SVG icons, no emojis) */}
          {isAdmin ? (
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#14213d]/50 border border-slate-200 dark:border-slate-700/60 my-1.5 flex flex-col gap-1 text-xs">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <UserIcon size={13} className="text-slate-400" />
                  <span>{student.name || "Unknown Student"}</span>
                </span>
                {student.studentId && (
                  <span className="text-[10px] font-mono bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded">
                    ID: {student.studentId}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between flex-wrap gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <MailIcon size={12} className="text-slate-400" />
                  <span>{student.email || "—"}</span>
                </span>
                {student.phone ? (
                  <a
                    href={`tel:${student.phone}`}
                    className="text-amber-600 dark:text-[#fca311] font-medium hover:underline flex items-center gap-1"
                  >
                    <PhoneIcon size={12} />
                    <span>{student.phone}</span>
                  </a>
                ) : (
                  <span className="text-slate-400 italic">No phone added</span>
                )}
              </div>

              {student.department && (
                <div className="text-[10px] text-slate-400">
                  Dept: {student.department}
                </div>
              )}
            </div>
          ) : (
            student.phone && (
              <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
                <PhoneIcon size={12} className="text-slate-400" />
                <span>Contact: {student.phone}</span>
              </div>
            )
          )}

          {/* Extension Notice */}
          {r.extensionStatus === "extended" && (
            <div className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20 mt-1 flex items-center gap-1.5">
              <CalendarIcon size={12} />
              <span>Extended Return {r.extensionReason ? `· Reason: "${r.extensionReason}"` : ""}</span>
            </div>
          )}

          {/* Admin comment or damage report */}
          {r.adminComment && (
            <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/40 px-2 py-1 rounded mt-1">
              Note: {r.adminComment}
            </div>
          )}
        </div>
      </div>

      {/* Footer row — meta + actions */}
      <div className="request-footer">
        <div className="request-meta">
          {getStatusBadge()}
          <span style={{ fontWeight: 600 }}>Qty: {r.quantity}</span>
          {r.issueDate && (
            <span title="Date component was issued">
              Issued: {new Date(r.issueDate).toLocaleDateString()}
            </span>
          )}
          {r.expectedReturnDate && (
            <span
              style={{
                color: isOverdue ? "#ef4444" : undefined,
                fontWeight: isOverdue ? 700 : undefined,
              }}
              title="Scheduled return date"
            >
              Due: {new Date(r.expectedReturnDate).toLocaleDateString()}
            </span>
          )}
          {r.actualReturnDate && (
            <span>Returned: {new Date(r.actualReturnDate).toLocaleDateString()}</span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="request-actions">
          {/* Admin Actions */}
          {isAdmin && (
            <>
              {r.status === "pending" && (
                <>
                  <button
                    type="button"
                    className="primary small-btn"
                    onClick={() => onAction(r._id, "approve")}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className="danger small-btn"
                    onClick={() => onAction(r._id, "reject", { rejectionReason: "Rejected by lab admin" })}
                  >
                    Reject
                  </button>
                </>
              )}

              {r.status === "approved" && (
                <button
                  type="button"
                  className="primary small-btn"
                  onClick={() => onAction(r._id, "issue", {
                    expectedReturnDate: new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10),
                  })}
                >
                  Issue to Student
                </button>
              )}

              {(isIssued || isOverdue) && (
                <button
                  type="button"
                  className="primary small-btn"
                  onClick={() => {
                    if (onReturnPrompt) {
                      onReturnPrompt(r);
                    } else {
                      onAction(r._id, "return");
                    }
                  }}
                  title="Mark returned and verify physical condition"
                >
                  Mark Return
                </button>
              )}
            </>
          )}

          {/* Student Actions: Extend Return */}
          {!isAdmin && (isIssued || isOverdue) && (
            <button
              type="button"
              className="ghost small-btn"
              onClick={() => onExtendPrompt?.(r)}
              title="Request an extension on the return date"
              style={{ border: "1px solid var(--accent)", color: "var(--accent)" }}
            >
              Extend Return
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default RequestCard;
