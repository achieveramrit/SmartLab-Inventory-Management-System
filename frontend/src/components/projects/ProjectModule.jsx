import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import api from "../../api/axios";
import { DEFAULT_PAGINATION } from "../../constants";
import Pagination from "../ui/Pagination";
import ProjectCard from "./ProjectCard";
import ProjectDetailsModal from "./ProjectDetailsModal";
import CreateProjectModal from "./CreateProjectModal";
import RequestProjectModal from "./RequestProjectModal";
import {
  SearchIcon,
  CloseIcon,
  FilterIcon,
  PlusIcon,
  RocketIcon,
  SparklesIcon,
  ChipIcon,
  CheckIcon,
} from "../ui/Icons";

const CATEGORY_TABS = [
  "All",
  "IoT & Smart Systems",
  "Robotics & Automation",
  "Wearables & Healthcare",
  "Home Automation",
  "Agriculture & Environment",
  "Security & Surveillance",
];

const DIFFICULTY_TABS = ["All", "Beginner", "Intermediate", "Advanced"];

/**
 * ProjectModule
 * The IoT Project Recommendation Hub & Template Management System.
 * - Live matches templates against real-time lab component stock.
 * - Students can filter and 1-click request full project component kits.
 * - Admins can create, edit, seed, and manage project templates.
 */
function ProjectModule({ token, user, onNavigate, refreshRef, pageNavRef }) {
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);
  const isAdmin = user.role === "admin";

  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({
    totalTemplates: 0,
    availableTemplates: 0,
    unavailableTemplates: 0,
  });
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeDifficulty, setActiveDifficulty] = useState("All");
  // Default to showing only available projects for students
  const [onlyAvailable, setOnlyAvailable] = useState(!isAdmin);

  // Modals state
  const [selectedProject, setSelectedProject] = useState(null);
  const [requestModalProject, setRequestModalProject] = useState(null);
  const [createModalProject, setCreateModalProject] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // ── Data Fetching ─────────────────────────────────────────────
  const load = useCallback(
    async (
      page = 1,
      search = searchTerm,
      cat = activeCategory,
      diff = activeDifficulty,
      onlyAvail = onlyAvailable
    ) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: "12",
        });

        if (search && search.trim()) {
          params.append("search", search.trim());
        }
        if (cat && cat !== "All") {
          params.append("category", cat);
        }
        if (diff && diff !== "All") {
          params.append("difficulty", diff);
        }
        params.append("onlyAvailable", onlyAvail ? "true" : "false");

        const res = await api.get(`/projects?${params.toString()}`, { headers });
        setProjects(res.data.data || []);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
        if (res.data.pagination) {
          setPagination(res.data.pagination);
        }
      } catch (err) {
        setMessage(err.response?.data?.message || "Failed to load project templates.");
      } finally {
        setLoading(false);
      }
    },
    [headers, searchTerm, activeCategory, activeDifficulty, onlyAvailable]
  );

  // Debounced load on search and filter change
  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      load(1, "", activeCategory, activeDifficulty, onlyAvailable);
      return;
    }
    const timer = setTimeout(() => {
      load(1, searchTerm, activeCategory, activeDifficulty, onlyAvailable);
    }, 220);
    return () => clearTimeout(timer);
  }, [searchTerm, activeCategory, activeDifficulty, onlyAvailable]); // eslint-disable-line react-hooks/exhaustive-deps

  // Wire keyboard shortcuts
  useEffect(() => {
    if (refreshRef) {
      refreshRef.current = () =>
        load(pagination.currentPage, searchTerm, activeCategory, activeDifficulty, onlyAvailable);
    }
    if (pageNavRef) {
      pageNavRef.current = {
        prev: () => {
          if (pagination.currentPage > 1)
            load(pagination.currentPage - 1, searchTerm, activeCategory, activeDifficulty, onlyAvailable);
        },
        next: () => {
          if (pagination.currentPage < pagination.totalPages)
            load(pagination.currentPage + 1, searchTerm, activeCategory, activeDifficulty, onlyAvailable);
        },
      };
    }
  });

  // Admin delete project
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this project template?")) return;
    try {
      await api.delete(`/projects/${id}`, { headers });
      setSuccessMsg("Project template deleted successfully.");
      load(pagination.currentPage);
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to delete project template.");
    }
  };

  // Admin seed starter templates
  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await api.post("/projects/seed", {}, { headers });
      setSuccessMsg(res.data.message || "Starter IoT projects seeded successfully!");
      load(1);
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to seed default projects.");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Top Hero / Header ────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#14213d] via-[#1a2d52] to-[#14213d] text-white p-6 sm:p-8 border border-white/10 shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#fca311]/20 border border-[#fca311]/40 text-[#fca311] text-xs font-bold mb-3">
              <SparklesIcon size={14} />
              <span>Smart Recommendation Engine</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {isAdmin ? "IoT Project Templates & Kit Management" : "Ready-to-Build IoT Projects"}
            </h1>

            <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
              {isAdmin
                ? "Manage standardized IoT project templates. The system matches required hardware against active laboratory inventory so students are recommended projects with in-stock components."
                : "Explore curated IoT project templates that can be built right now with currently available lab inventory. Select any project to request all required components with a single click!"}
            </p>
          </div>

          {/* Stats & Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-lg border border-emerald-500/30">
                {stats.availableTemplates}
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Ready to Build
                </p>
                <p className="text-sm font-extrabold text-white">
                  100% In Stock
                </p>
              </div>
            </div>

            {isAdmin && (
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCreateModalProject(null);
                    setShowCreateModal(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-[#fca311] hover:bg-[#e0920f] text-black font-extrabold text-xs shadow-gold transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <PlusIcon size={16} />
                  <span>Add Project Template</span>
                </button>

                {stats.totalTemplates === 0 && (
                  <button
                    type="button"
                    disabled={seeding}
                    onClick={handleSeed}
                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RocketIcon size={15} />
                    <span>{seeding ? "Seeding..." : "Seed Starter Projects"}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Success Toast Banner ─────────────────────────────────── */}
      {successMsg && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 text-xs font-semibold shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0">
              <CheckIcon size={12} />
            </div>
            <span>{successMsg}</span>
          </div>
          <div className="flex items-center gap-2">
            {!isAdmin && onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate("requests")}
                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-colors cursor-pointer"
              >
                Track in Requests →
              </button>
            )}
            <button
              type="button"
              onClick={() => setSuccessMsg("")}
              className="p-1 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
            >
              <CloseIcon size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Error Banner ─────────────────────────────────────────── */}
      {message && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50 text-xs font-semibold shadow-sm">
          <span>{message}</span>
          <button
            type="button"
            onClick={() => setMessage("")}
            className="p-1 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors"
          >
            <CloseIcon size={14} />
          </button>
        </div>
      )}

      {/* ── Search & Filters Bar ─────────────────────────────────── */}
      <div className="rounded-2xl bg-white dark:bg-[#14213d] border border-slate-200 dark:border-white/10 p-4 shadow-sm space-y-3.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <SearchIcon size={16} />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search projects by title, description, components..."
              className="w-full pl-10 pr-9 py-2 text-xs rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-[#1a2b4c] text-slate-900 dark:text-white focus:outline-none focus:border-[#fca311]"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <CloseIcon size={14} />
              </button>
            )}
          </div>

          {/* Availability Toggle */}
          <label className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none hover:border-[#fca311] transition-colors">
            <input
              type="checkbox"
              checked={onlyAvailable}
              onChange={(e) => setOnlyAvailable(e.target.checked)}
              className="w-4 h-4 rounded text-[#fca311] accent-[#fca311] cursor-pointer"
            />
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${onlyAvailable ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
              Only 100% In-Stock Projects
            </span>
          </label>
        </div>

        {/* Filter Pills (Category & Difficulty) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-white/5">
          {/* Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1 flex-shrink-0">
              Category:
            </span>
            {CATEGORY_TABS.map((cat) => {
              const active = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    active
                      ? "bg-[#fca311] text-black font-extrabold shadow-sm"
                      : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Difficulty Tabs */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">
              Difficulty:
            </span>
            {DIFFICULTY_TABS.map((diff) => {
              const active = activeDifficulty === diff;
              return (
                <button
                  key={diff}
                  type="button"
                  onClick={() => setActiveDifficulty(diff)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    active
                      ? "bg-[#14213d] dark:bg-white text-white dark:text-black"
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
                  }`}
                >
                  {diff}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Projects Grid ────────────────────────────────────────── */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="inline-block w-8 h-8 border-3 border-[#fca311] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
            Evaluating laboratory component inventory & matching templates...
          </p>
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-white/10 p-12 text-center bg-white dark:bg-[#14213d]/50">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#fca311]/15 text-[#fca311] flex items-center justify-center">
            <RocketIcon size={32} />
          </div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
            {onlyAvailable ? "No 100% In-Stock Projects Found" : "No Project Templates Found"}
          </h3>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            {onlyAvailable
              ? "All project templates currently require one or more components that are out of stock or low. You can uncheck 'Only 100% In-Stock Projects' to view all templates, or check back once components are replenished."
              : "Try adjusting your search query, difficulty filters, or category tabs."}
          </p>
          <div className="mt-5 flex justify-center gap-3">
            {onlyAvailable && (
              <button
                type="button"
                onClick={() => setOnlyAvailable(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#fca311]/20 text-[#fca311] hover:bg-[#fca311]/30 border border-[#fca311]/40 transition-colors cursor-pointer"
              >
                View All Project Templates
              </button>
            )}
            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  setCreateModalProject(null);
                  setShowCreateModal(true);
                }}
                className="px-4 py-2 rounded-xl text-xs font-extrabold bg-[#fca311] hover:bg-[#e0920f] text-black shadow-gold transition-colors cursor-pointer"
              >
                + Create New Template
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((proj) => (
            <ProjectCard
              key={proj._id}
              project={proj}
              isAdmin={isAdmin}
              onSelect={(p) => setSelectedProject(p)}
              onRequestKit={(p) => setRequestModalProject(p)}
              onEdit={(p) => {
                setCreateModalProject(p);
                setShowCreateModal(true);
              }}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* ── Pagination ───────────────────────────────────────────── */}
      {pagination.totalPages > 1 && (
        <Pagination
          pagination={pagination}
          onPageChange={(p) => load(p)}
        />
      )}

      {/* ── Modals ──────────────────────────────────────────────── */}
      {/* Project Details Modal */}
      {selectedProject && (
        <ProjectDetailsModal
          project={selectedProject}
          isAdmin={isAdmin}
          onRequestKit={(p) => setRequestModalProject(p)}
          onEdit={(p) => {
            setCreateModalProject(p);
            setShowCreateModal(true);
          }}
          onClose={() => setSelectedProject(null)}
        />
      )}

      {/* Request Project Kit Modal (Students) */}
      {requestModalProject && (
        <RequestProjectModal
          project={requestModalProject}
          token={token}
          onClose={() => setRequestModalProject(null)}
          onSuccess={(msg) => {
            setSuccessMsg(msg);
            load(pagination.currentPage);
          }}
        />
      )}

      {/* Create / Edit Project Modal (Admins) */}
      {showCreateModal && (
        <CreateProjectModal
          project={createModalProject}
          token={token}
          onClose={() => {
            setShowCreateModal(false);
            setCreateModalProject(null);
          }}
          onSuccess={(msg) => {
            setSuccessMsg(msg);
            load(pagination.currentPage);
          }}
        />
      )}
    </div>
  );
}

export default ProjectModule;
