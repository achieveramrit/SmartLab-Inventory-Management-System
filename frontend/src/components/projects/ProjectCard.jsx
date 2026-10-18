import { useState } from "react";
import { ChipIcon, RocketIcon, ClockIcon, EditIcon, TrashIcon, EyeIcon } from "../ui/Icons";

/**
 * ProjectCard
 * Responsive card showcasing an IoT Project template, showing live component
 * inventory readiness, specifications, and 1-click batch request trigger.
 */
function ProjectCard({
  project,
  isAdmin,
  onSelect,
  onRequestKit,
  onEdit,
  onDelete,
}) {
  const [imgError, setImgError] = useState(false);

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
      className={`group relative flex flex-col rounded-2xl bg-white dark:bg-[#14213d] border transition-all duration-200 overflow-hidden shadow-sm hover:shadow-xl ${
        allAvailable
          ? "border-slate-200 dark:border-white/10 hover:border-[#fca311]/50 dark:hover:border-[#fca311]/50"
          : "border-slate-200 dark:border-white/5 opacity-85 hover:opacity-100"
      }`}
    >
      {/* Card Header Media */}
      <div
        className="relative h-40 bg-slate-900 cursor-pointer overflow-hidden"
        onClick={() => onSelect(project)}
      >
        {project.imageUrl && !imgError ? (
          <img
            src={project.imageUrl}
            alt={project.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#14213d] via-[#1a2d52] to-[#0a1120] flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
            <RocketIcon size={48} className="text-[#fca311]/30 group-hover:text-[#fca311]/60 transition-colors" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Top Floating Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm backdrop-blur-md ${getDifficultyBadge(project.difficulty)}`}>
            {project.difficulty || "Beginner"}
          </span>

          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/60 text-white backdrop-blur-md border border-white/10 shadow-sm">
            {project.category || "IoT"}
          </span>
        </div>

        {/* Bottom Floating Availability Badge */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
          <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md ${
            allAvailable
              ? "bg-emerald-500 text-white"
              : project.availableCount > 0
              ? "bg-amber-500 text-black font-black"
              : "bg-slate-700 text-slate-200"
          }`}>
            {allAvailable ? (
              <><span>✓</span> Ready to Build (100% In Stock)</>
            ) : (
              <><span>⚠</span> {project.availableCount || 0}/{components.length} Items Available</>
            )}
          </span>

          {project.estimatedTime && (
            <span className="text-[10px] font-bold text-white/90 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-md flex items-center gap-1 border border-white/10">
              <ClockIcon size={11} className="text-[#fca311]" />
              {project.estimatedTime}
            </span>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="flex flex-col flex-1 p-4">
        {/* Title & Description */}
        <h3
          className="text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-[#fca311] dark:group-hover:text-[#fca311] transition-colors line-clamp-1 cursor-pointer"
          onClick={() => onSelect(project)}
          title={project.title}
        >
          {project.title}
        </h3>

        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
          {project.description}
        </p>

        {/* Components Required List Preview */}
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/5">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1.5">
            <span className="flex items-center gap-1">
              <ChipIcon size={12} className="text-[#fca311]" />
              Kit Components:
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              {components.length} item{components.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="flex flex-wrap gap-1 max-h-16 overflow-hidden">
            {components.slice(0, 3).map((c) => (
              <span
                key={c._id}
                className={`text-[10px] font-medium px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                  c.isAvailable
                    ? "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300"
                    : "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400"
                }`}
                title={`${c.name} (Need: ${c.requiredQuantity}, Available: ${c.availableQuantity})`}
              >
                <span className="font-bold">{c.name.split(" ")[0]}</span> ×{c.requiredQuantity}
                {!c.isAvailable && <span className="text-[9px] font-bold">(!)</span>}
              </span>
            ))}
            {components.length > 3 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 text-slate-400">
                +{components.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Tags */}
        {project.tags && project.tags.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1">
            {project.tags.slice(0, 3).map((tag, i) => (
              <span key={i} className="text-[9px] font-semibold text-slate-400 dark:text-slate-500">
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex-1" />

        {/* Card Footer Actions */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center gap-2">
          {isAdmin ? (
            <>
              <button
                type="button"
                onClick={() => onSelect(project)}
                className="flex-1 py-1.5 px-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <EyeIcon size={13} />
                Details
              </button>
              <button
                type="button"
                onClick={() => onEdit(project)}
                className="p-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-[#fca311] hover:border-[#fca311] transition-colors cursor-pointer"
                title="Edit Template"
              >
                <EditIcon size={14} />
              </button>
              <button
                type="button"
                onClick={() => onDelete(project._id)}
                className="p-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-rose-500 hover:border-rose-500 transition-colors cursor-pointer"
                title="Delete Template"
              >
                <TrashIcon size={14} />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onSelect(project)}
                className="py-1.5 px-3 text-xs font-bold rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                View Details
              </button>
              <button
                type="button"
                disabled={!allAvailable}
                onClick={() => onRequestKit(project)}
                className={`flex-1 py-1.5 px-3 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm ${
                  allAvailable
                    ? "bg-[#fca311] hover:bg-[#e0920f] text-black shadow-gold cursor-pointer"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                }`}
              >
                <RocketIcon size={13} />
                {allAvailable ? "Request Kit" : "Unavailable"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProjectCard;
