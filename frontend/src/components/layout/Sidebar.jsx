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
        <div className="w-9 h-9 rounded-xl bg-[#fca311] text-black font-black flex items-center justify-center text-sm shadow-gold flex-shrink-0 tracking-wider">
          SL
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
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#fca311] to-amber-300 text-black font-extrabold flex items-center justify-center text-sm shadow-md group-hover:scale-105 transition-transform flex-shrink-0">
            {user.name?.charAt(0)?.toUpperCase() || "U"}
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
