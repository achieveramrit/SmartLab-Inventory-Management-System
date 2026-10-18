/**
 * Sidebar
 * Left navigation drawer built with Tailwind CSS.
 * Clean, modern layout with brand logo, nav links, shortcut hint, and bottom user profile card.
 * Props:
 *   module          {string}         — current active module key
 *   user            {object}         — { name, role, studentId, email }
 *   isOpen          {boolean}        — mobile drawer open state
 *   onNavigate      {(key: string) => void}
 *   onClose         {() => void}     — called when overlay or close triggers
 *   onOpenProfile   {() => void}     — opens profile & password reset modal
 *   onLogout        {() => void}
 *   onShowShortcuts {() => void}
 */

import { UserIcon } from "../ui/Icons";

const NAV_ITEMS = [
  { key: "inventory", label: "Inventory",        num: "01" },
  { key: "requests",  label: "Requests & Issue", num: "02" },
  { key: "projects",  label: "IoT Projects",     num: "03" },
];

function Sidebar({
  module,
  user,
  isOpen,
  onNavigate,
  onClose,
  onOpenProfile,
  onLogout,
  onShowShortcuts,
}) {
  const isAdmin = user.role === "admin";

  return (
    <aside
      className={`sidebar fixed inset-y-0 left-0 z-50 flex flex-col w-[260px] bg-[#14213d] text-white border-r border-white/10 p-4 transition-transform duration-300 ease-in-out md:translate-x-0 ${
        isOpen ? "translate-x-0 open shadow-2xl shadow-black/80" : "-translate-x-full"
      }`}
    >
      {/* Brand Top Accent Line */}
      <div className="h-0.5 w-full bg-gradient-to-r from-[#fca311] via-[#fca311]/50 to-transparent rounded-full mb-3 flex-shrink-0" />

      {/* Brand Header */}
      <div className="flex items-center gap-3 pb-4 mb-2 border-b border-white/10">
        <div className="w-9 h-9 rounded-xl bg-[#fca311] text-black flex items-center justify-center shadow-gold flex-shrink-0" style={{ boxShadow: "0 0 14px rgba(252,163,17,0.4)" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="4" width="16" height="16" rx="2" />
            <rect x="9" y="9" width="6" height="6" />
            <line x1="9" y1="1" x2="9" y2="4" />
            <line x1="15" y1="1" x2="15" y2="4" />
            <line x1="9" y1="20" x2="9" y2="23" />
            <line x1="15" y1="20" x2="15" y2="23" />
            <line x1="20" y1="9" x2="23" y2="9" />
            <line x1="20" y1="14" x2="23" y2="14" />
            <line x1="1" y1="9" x2="4" y2="9" />
            <line x1="1" y1="14" x2="4" y2="14" />
          </svg>
        </div>
        <div className="min-w-0">
          <strong className="block text-sm font-extrabold tracking-tight text-white leading-tight">
            SmartLab
          </strong>
          <span className="block text-[11px] text-slate-400 font-medium leading-tight">
            Inventory System
          </span>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex flex-col gap-1.5 mt-2">
        {NAV_ITEMS.map((item) => {
          const isActive = module === item.key;
          return (
            <button
              key={item.key}
              type="button"
              className={`group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                isActive
                  ? "bg-[#fca311]/15 text-[#fca311] border border-[#fca311]/30 shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-white/5 border border-transparent"
              }`}
              onClick={() => {
                onNavigate(item.key);
                onClose();
              }}
              title={`Press ${item.num.replace("0", "")} to navigate`}
            >
              {isActive && (
                <span className="absolute left-0 top-2 bottom-2 w-1 bg-[#fca311] rounded-r-md shadow-[0_0_8px_#fca311]" />
              )}
              <span
                className={`text-[10px] font-bold font-mono tracking-wider transition-colors ${
                  isActive ? "text-[#fca311]" : "text-slate-400 group-hover:text-slate-200"
                }`}
              >
                {item.num}
              </span>
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Spacer to push user info and shortcuts to bottom */}
      <div className="flex-1 min-h-[20px]" />

      {/* Keyboard shortcut hint */}
      <div
        className="flex items-center justify-between px-3 py-2 mb-3 rounded-xl text-xs font-medium text-slate-400 bg-black/25 hover:bg-black/40 hover:text-[#fca311] border border-dashed border-white/10 hover:border-[#fca311]/50 cursor-pointer transition-all"
        onClick={onShowShortcuts}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onShowShortcuts()}
        title="View keyboard shortcuts (?)"
      >
        <span className="text-[11px] font-semibold">Shortcuts</span>
        <kbd className="px-1.5 py-0.5 rounded bg-black/60 text-[#fca311] text-[10px] font-mono border border-white/10">
          ?
        </kbd>
      </div>

      {/* User profile & security section — Bottom UI */}
      <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
        {/* User Card */}
        <div
          className="flex items-center gap-3 p-2.5 rounded-xl bg-black/30 hover:bg-black/50 border border-white/10 hover:border-[#fca311]/50 transition-all cursor-pointer group"
          onClick={() => {
            onOpenProfile?.();
            onClose();
          }}
          title="Click to view profile or reset password"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && onOpenProfile?.()}
        >
          {/* Avatar */}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-extrabold flex-shrink-0 group-hover:scale-105 transition-transform"
            style={{
              background: isAdmin
                ? "linear-gradient(135deg, #fca311, #f59e0b)"
                : "linear-gradient(135deg, #3b82f6, #6366f1)",
              color: isAdmin ? "#000" : "#fff",
              boxShadow: isAdmin
                ? "0 0 0 2px rgba(252,163,17,0.3), 0 2px 8px rgba(252,163,17,0.3)"
                : "0 0 0 2px rgba(99,102,241,0.3), 0 2px 8px rgba(99,102,241,0.3)",
              letterSpacing: "-0.02em",
            }}
          >
            {user.name
              ? user.name.trim().split(/\s+/).length > 1
                ? (user.name.trim().split(/\s+/)[0][0] + user.name.trim().split(/\s+/).slice(-1)[0][0]).toUpperCase()
                : user.name.charAt(0).toUpperCase()
              : isAdmin ? "LA" : "U"
            }
          </div>

          {/* User Details */}
          <div className="flex flex-col min-w-0 flex-1">
            <span
              className="text-xs font-bold text-white truncate group-hover:text-[#fca311] transition-colors leading-snug"
              title={user.name}
            >
              {user.name}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider ${
                  isAdmin
                    ? "bg-[#fca311]/20 text-[#fca311] border border-[#fca311]/30"
                    : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                }`}
              >
                {user.role}
              </span>
              {user.studentId && (
                <span className="text-[10px] text-slate-400 truncate">
                  {user.studentId}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-[11px] font-bold text-slate-200 bg-white/5 hover:bg-[#fca311] hover:text-black border border-white/10 hover:border-[#fca311] transition-all shadow-sm"
            onClick={() => {
              onOpenProfile?.();
              onClose();
            }}
            title="Update Profile & Reset Password"
          >
            <UserIcon size={12} />
            <span>Profile</span>
          </button>

          <button
            type="button"
            className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-[11px] font-bold text-rose-400 bg-white/5 hover:bg-rose-500/20 hover:text-rose-300 border border-white/10 hover:border-rose-500/40 transition-all shadow-sm"
            onClick={onLogout}
            title="Log out of SmartLab"
          >
            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
