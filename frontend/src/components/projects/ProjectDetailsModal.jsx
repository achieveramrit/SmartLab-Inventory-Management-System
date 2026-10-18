import { useState } from "react";
import { CloseIcon, ChipIcon, RocketIcon, ExternalLinkIcon, ClockIcon, EditIcon, CheckIcon } from "../ui/Icons";

/**
 * ProjectDetailsModal
 * Shows complete project template specifications, wiring guide links,
 * and live component inventory status checklist.
 */
function ProjectDetailsModal({
  project,
  isAdmin,
  onRequestKit,
  onEdit,
  onClose,
}) {
  const [imgError, setImgError] = useState(false);

  if (!project) return null;

  const components = project.componentsSummary || [];
  const allAvailable = project.isAvailable;

  const getDifficultyBadge = (level) => {
    switch (level?.toLowerCase()) {
      case "advanced":
        return "bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30";
      case "intermediate":
        return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30";
      default:
        return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30";
    }
  };

  return (
    <div
      className="fixed inset-0 z-[115] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={project.title}
    >
      <div
        className="relative w-full max-w-2xl my-6 rounded-2xl overflow-hidden shadow-2xl shadow-black/60 bg-white dark:bg-[#14213d] text-slate-800 dark:text-white border border-slate-200 dark:border-white/10"
        style={{ borderTop: "4px solid #fca311" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hero Header with Media or Pattern */}
        <div className="relative h-44 bg-slate-900 overflow-hidden">
          {project.imageUrl && !imgError ? (
            <img
              src={project.imageUrl}
              alt={project.title}
              className="w-full h-full object-cover opacity-80"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#14213d] via-[#1f3158] to-[#0a1120] flex items-center justify-center">
              <RocketIcon size={56} className="text-[#fca311]/40" />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

          {/* Close Button */}
          <button
            type="button"
            className="absolute top-3 right-3 p-1.5 rounded-full bg-black/50 text-white/80 hover:text-white hover:bg-black/80 transition-colors cursor-pointer"
            onClick={onClose}
            aria-label="Close"
          >
            <CloseIcon size={18} />
          </button>

          {/* Badges on hero */}
          <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${getDifficultyBadge(project.difficulty)}`}>
                {project.difficulty || "Beginner"}
              </span>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/20 text-white backdrop-blur-sm border border-white/20">
                {project.category || "IoT"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${
                allAvailable
                  ? "bg-emerald-500/90 text-white shadow-sm"
                  : "bg-rose-500/90 text-white shadow-sm"
              }`}>
                {allAvailable ? "✓ 100% In Stock & Ready to Build" : "✕ Components Out of Stock"}
              </span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
          <div>
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white leading-tight">
                {project.title}
              </h2>
              {project.estimatedTime && (
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-lg flex-shrink-0">
                  <ClockIcon size={13} className="text-[#fca311]" />
                  <span>{project.estimatedTime}</span>
                </div>
              )}
            </div>

            <p className="mt-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {project.description}
            </p>
          </div>

          {/* Tags */}
          {project.tags && project.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {project.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#fca311]/10 text-amber-700 dark:text-[#fca311] border border-[#fca311]/20"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Documentation Link if available */}
          {project.documentationUrl && (
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between text-xs">
              <div className="text-blue-700 dark:text-blue-300 font-medium">
                Official Wiring & Schematic Documentation Available
              </div>
              <a
                href={project.documentationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                <span>Open Guide</span>
                <ExternalLinkIcon size={13} />
              </a>
            </div>
          )}

          {/* Component Inventory Checklist */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <ChipIcon size={14} className="text-[#fca311]" />
                Component Inventory Checklist ({components.length} items)
              </h4>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                {project.availableCount || 0} / {components.length} In Stock
              </span>
            </div>

            <div className="border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 dark:bg-white/[0.04] text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-white/10">
                  <tr>
                    <th className="py-2 px-3">Component</th>
                    <th className="py-2 px-3">Category</th>
                    <th className="py-2 px-3 text-center">Required</th>
                    <th className="py-2 px-3 text-center">In Stock</th>
                    <th className="py-2 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                  {components.map((c) => (
                    <tr key={c._id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                        <div>{c.name}</div>
                        <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 font-normal">
                          {c.componentId} {c.location ? `· ${c.location}` : ""}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                        {c.category}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-900 dark:text-white">
                        {c.requiredQuantity}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold">
                        <span className={c.isAvailable ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
                          {c.availableQuantity}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {c.isAvailable ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            Available
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                            Need +{c.missingQuantity}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onEdit) onEdit(project);
                }}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-[#fca311] hover:text-[#fca311] transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <EditIcon size={14} />
                Edit Template
              </button>
            )}

            {!isAdmin && (
              <button
                type="button"
                disabled={!allAvailable}
                onClick={() => {
                  onClose();
                  if (onRequestKit) onRequestKit(project);
                }}
                className={`px-5 py-2 text-xs font-extrabold rounded-xl transition-all flex items-center gap-2 shadow-sm ${
                  allAvailable
                    ? "bg-[#fca311] hover:bg-[#e0920f] text-black shadow-gold cursor-pointer"
                    : "bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                }`}
              >
                <RocketIcon size={14} />
                {allAvailable ? "Request Project Kit (1-Click)" : "Kit Unavailable"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProjectDetailsModal;
