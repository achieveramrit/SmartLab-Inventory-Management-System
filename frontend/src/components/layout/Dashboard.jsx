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

// Navigation items shared between sidebar and mobile bottom tab bar
const NAV_ITEMS = [
  {
    key: "inventory",
    label: "Inventory",
    num: "01",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="7" height="7" rx="1"/><rect x="15" y="3" width="7" height="7" rx="1"/>
        <rect x="2" y="14" width="7" height="7" rx="1"/><rect x="15" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    key: "requests",
    label: "Requests",
    num: "02",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
  },
];

/**
 * Dashboard
 * Main application shell. Owns:
 *   - Active module state (Inventory & Requests)
 *   - Mobile sidebar drawer state (desktop only)
 *   - Mobile bottom tab bar (mobile)
 *   - User profile & password reset modal
 *   - Keyboard shortcuts handler
 */
function Dashboard({ token, user, onLogout }) {
  const [module,        setModule]        = useState("inventory");
  const [currentUser,   setCurrentUser]   = useState(user);
  const [showProfile,   setShowProfile]   = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [sidebarOpen,   setSidebarOpen]   = useState(false);
  const { toggleTheme } = useTheme();

  const refreshRef = useRef(null);
  const pageNavRef = useRef(null);

  // ── Global keyboard shortcuts ─────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
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

  const navigateTo = (key) => {
    setModule(key);
    setSidebarOpen(false);
  };

  return (
    <div className="app-shell">
      {/* ── Desktop Sidebar ─────────────────────────────────────── */}
      <Sidebar
        module={module}
        user={currentUser}
        isOpen={sidebarOpen}
        onNavigate={navigateTo}
        onClose={() => setSidebarOpen(false)}
        onOpenProfile={() => setShowProfile(true)}
        onLogout={onLogout}
        onShowShortcuts={() => setShowShortcuts(true)}
      />

      {/* ── Content Column (mobile topbar + main + bottom nav) ───── */}
      <div className="content-col">

        {/* Mobile sticky top bar — hidden on desktop via CSS */}
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
          </div>
        </div>

        {/* ── Main Content ─────────────────────────────────────── */}
        <main className="main">
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
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider ${
                  currentUser.role === "admin"
                    ? "bg-[#fca311]/15 text-amber-700 dark:text-[#fca311] border border-[#fca311]/30"
                    : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30"
                }`}>
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

        {/* ── Mobile Bottom Tab Bar — hidden on desktop via CSS ─── */}
        <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
          {NAV_ITEMS.map((item) => {
            const active = module === item.key;
            return (
              <button
                key={item.key}
                type="button"
                className={`mobile-tab-btn ${active ? "active" : ""}`}
                onClick={() => navigateTo(item.key)}
                aria-current={active ? "page" : undefined}
              >
                <span className="mobile-tab-icon">{item.icon}</span>
                <span className="mobile-tab-label">{item.label}</span>
                {active && <span className="mobile-tab-indicator" />}
              </button>
            );
          })}
          <button
            type="button"
            className="mobile-tab-btn"
            onClick={() => setShowProfile(true)}
            aria-label="Profile"
          >
            <span className="mobile-tab-icon">
              <div style={{
                width: 22, height: 22, borderRadius: "50%",
                background: "#fca311", color: "#000",
                fontWeight: 900, fontSize: 11,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {currentUser.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
            </span>
            <span className="mobile-tab-label">Profile</span>
          </button>
          <button
            type="button"
            className="mobile-tab-btn logout"
            onClick={onLogout}
            aria-label="Logout"
          >
            <span className="mobile-tab-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </span>
            <span className="mobile-tab-label">Logout</span>
          </button>
        </nav>

      </div>{/* end .content-col */}

      {/* Profile Modal */}
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
