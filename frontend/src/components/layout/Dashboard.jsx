import { useEffect, useRef, useState } from "react";
import Sidebar from "./Sidebar";
import ShortcutsHelp from "./ShortcutsHelp";
import ThemeToggle from "../ui/ThemeToggle";
import { UserIcon } from "../ui/Icons";
import { useTheme } from "../../context/ThemeContext";
import InventoryModule from "../inventory/InventoryModule";
import RequestModule from "../requests/RequestModule";
import ProfileModal from "../auth/ProfileModal";

const MODULE_TITLES = {
  inventory: "SmartLab Inventory Catalog",
  requests:  "Component Requests & Tracking",
};

/**
 * Dashboard
 * Main application shell. Owns:
 *   - Active module state (Inventory & Requests)
 *   - Mobile sidebar drawer state
 *   - User profile & password reset modal
 *   - Keyboard shortcuts handler (shortcuts removed from top bar)
 * Props:
 *   token    {string}
 *   user     {object}
 *   onLogout {() => void}
 */
function Dashboard({ token, user, onLogout }) {
  const [module,        setModule]        = useState("inventory");
  const [currentUser,   setCurrentUser]   = useState(user);
  const [showProfile,   setShowProfile]   = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [sidebarOpen,   setSidebarOpen]   = useState(false);
  const { toggleTheme } = useTheme();

  // Refs shared with active module so keyboard shortcuts can trigger data actions
  const refreshRef = useRef(null);
  const pageNavRef = useRef(null);

  // ── Global keyboard shortcut handler ──────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      // Never intercept while the user is typing
      if (["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) return;

      switch (e.key) {
        case "1": setModule("inventory"); setSidebarOpen(false); break;
        case "2": setModule("requests");  setSidebarOpen(false); break;
        case "p": case "P": setShowProfile((p) => !p); break;
        case "?": setShowShortcuts((s) => !s); break;
        case "Escape":
          setShowShortcuts(false);
          setShowProfile(false);
          setSidebarOpen(false);
          break;
        case "t": case "T": toggleTheme(); break;
        case "r": case "R": refreshRef.current?.(); break;
        case "l": case "L": onLogout(); break;
        case "ArrowLeft":  pageNavRef.current?.prev(); break;
        case "ArrowRight": pageNavRef.current?.next(); break;
        default: break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onLogout, toggleTheme]);

  return (
    <div className={`app-shell${sidebarOpen ? " sidebar-open" : ""}`}>
      {/* Mobile overlay — tapping it closes the drawer */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Mobile sticky top bar (shortcuts button removed as requested) */}
      <div className="mobile-topbar">
        <div className="side-brand mobile-brand">
          <div className="brand-mark small">SL</div>
          <strong>SmartLab</strong>
        </div>
        <div className="mobile-topbar-actions">
          <ThemeToggle variant="icon" />
          <button
            type="button"
            className="icon-btn"
            onClick={() => setShowProfile(true)}
            title="Profile & Settings"
            aria-label="Account Settings"
          >
            <UserIcon size={16} />
          </button>
          <button
            className="hamburger"
            onClick={() => setSidebarOpen((s) => !s)}
            aria-label="Toggle navigation"
            aria-expanded={sidebarOpen}
          >
            <span /><span /><span />
          </button>
        </div>
      </div>

      {/* Sidebar (Authentication and Theme Toggle removed as requested) */}
      <Sidebar
        module={module}
        user={currentUser}
        isOpen={sidebarOpen}
        onNavigate={setModule}
        onClose={() => setSidebarOpen(false)}
        onOpenProfile={() => setShowProfile(true)}
        onLogout={onLogout}
        onShowShortcuts={() => setShowShortcuts(true)}
      />

      {/* Main content area */}
      <main className="main">
        {/* Topbar: Keyboard shortcut button removed as requested */}
        <header className="topbar flex justify-between items-center gap-4 pb-5 mb-7 border-b border-slate-200 dark:border-white/10">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#fca311]">
              SmartLab Inventory System
            </p>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
              {MODULE_TITLES[module] || "Dashboard"}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white dark:bg-[#14213d] hover:bg-slate-100 dark:hover:bg-[#1f3158] border border-slate-300 dark:border-white/10 hover:border-[#fca311] dark:hover:border-[#fca311] transition-all cursor-pointer group shadow-sm hover:shadow-gold"
              onClick={() => setShowProfile(true)}
              title="Click to manage profile or reset password"
            >
              <div className="w-7 h-7 rounded-full bg-[#fca311] text-black font-extrabold flex items-center justify-center text-xs shadow-sm flex-shrink-0">
                {currentUser.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-white max-w-[120px] truncate group-hover:text-[#fca311] dark:group-hover:text-[#fca311] transition-colors">
                {currentUser.name}
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider ${
                  currentUser.role === "admin"
                    ? "bg-[#fca311]/15 text-amber-700 dark:text-[#fca311] border border-[#fca311]/30"
                    : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30"
                }`}
              >
                {currentUser.role}
              </span>
            </button>
            <ThemeToggle variant="pill" />
          </div>
        </header>

        {module === "inventory" && (
          <InventoryModule
            token={token}
            user={currentUser}
            onNavigate={setModule}
            refreshRef={refreshRef}
            pageNavRef={pageNavRef}
          />
        )}
        {module === "requests" && (
          <RequestModule
            token={token}
            user={currentUser}
            refreshRef={refreshRef}
            pageNavRef={pageNavRef}
          />
        )}
      </main>

      {/* Profile & Reset Password Modal */}
      {showProfile && (
        <ProfileModal
          user={currentUser}
          token={token}
          onClose={() => setShowProfile(false)}
          onUpdateUser={(updated) => setCurrentUser((prev) => ({ ...prev, ...updated }))}
        />
      )}

      {/* Keyboard shortcuts modal */}
      {showShortcuts && <ShortcutsHelp onClose={() => setShowShortcuts(false)} />}
    </div>
  );
}

export default Dashboard;
