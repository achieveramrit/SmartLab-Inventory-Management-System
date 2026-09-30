import { useState } from "react";
import api from "../../api/axios";
import { CloseIcon, UserIcon, LockIcon } from "../ui/Icons";

/**
 * ProfileModal
 * Full Tailwind CSS modal for updating profile information and securely resetting password.
 * Fixes all squishing issues with proper spacing, max-width, inputs, and responsive layout.
 * Props:
 *   user         {object}   — { id, name, email, role, studentId, department }
 *   token        {string}
 *   onClose      {() => void}
 *   onUpdateUser {(user: object) => void}
 */
function ProfileModal({ user, token, onClose, onUpdateUser }) {
  const headers = { Authorization: `Bearer ${token}` };

  const [activeTab, setActiveTab] = useState("profile"); // "profile" | "password"

  // Profile Form state
  const [name, setName] = useState(user.name || "");
  const [department, setDepartment] = useState(user.department || "");
  const [studentId, setStudentId] = useState(user.studentId || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [profileMsg, setProfileMsg] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Password Form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // ── Handle Profile Update ─────────────────────────────────
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg(null);
    try {
      const res = await api.put(
        "/auth/profile",
        {
          name: name.trim(),
          department: department.trim(),
          studentId: user.role === "student" ? studentId.trim() : undefined,
          phone: phone.trim(),
        },
        { headers }
      );
      setProfileMsg({ type: "success", text: res.data.message || "Profile updated successfully!" });
      if (onUpdateUser && res.data.user) {
        onUpdateUser(res.data.user);
      }
    } catch (err) {
      setProfileMsg({
        type: "error",
        text: err.response?.data?.message || "Failed to update profile.",
      });
    } finally {
      setProfileLoading(false);
    }
  };

  // ── Handle Password Reset ─────────────────────────────────
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword.length < 6) {
      setPasswordMsg({
        type: "error",
        text: "New password must be at least 6 characters long.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg({
        type: "error",
        text: "New passwords do not match. Please re-enter.",
      });
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await api.put(
        "/auth/reset-password",
        { currentPassword, newPassword },
        { headers }
      );
      setPasswordMsg({
        type: "success",
        text: res.data.message || "Password updated successfully!",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordMsg({
        type: "error",
        text: err.response?.data?.message || "Failed to reset password. Verify your current password.",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div
      className="smartlab-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="smartlab-modal-card max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="smartlab-modal-header">
          <div>
            <span className="block text-[10px] font-extrabold uppercase tracking-wider text-[#fca311]">
              Account Settings
            </span>
            <h3 className="text-base md:text-lg font-extrabold text-inherit leading-tight m-0">
              My Profile &amp; Security
            </h3>
          </div>
          <button
            type="button"
            className="p-1.5 rounded-lg text-slate-400 hover:text-inherit hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div
          className="flex border-b px-6"
          style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--border)" }}
        >
          <button
            type="button"
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all ${
              activeTab === "profile"
                ? "border-[#fca311] text-[#fca311]"
                : "border-transparent opacity-75 hover:opacity-100"
            }`}
            style={{
              backgroundColor: activeTab === "profile" ? "var(--surface)" : "transparent",
              color: activeTab === "profile" ? "var(--accent)" : "var(--text-muted)",
            }}
            onClick={() => setActiveTab("profile")}
          >
            <UserIcon size={14} />
            <span>Profile Details</span>
          </button>

          <button
            type="button"
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all ${
              activeTab === "password"
                ? "border-[#fca311] text-[#fca311]"
                : "border-transparent opacity-75 hover:opacity-100"
            }`}
            style={{
              backgroundColor: activeTab === "password" ? "var(--surface)" : "transparent",
              color: activeTab === "password" ? "var(--accent)" : "var(--text-muted)",
            }}
            onClick={() => setActiveTab("password")}
          >
            <LockIcon size={14} />
            <span>Reset Password</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {/* TAB 1: Profile Details */}
          {activeTab === "profile" && (
            <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4">
              {profileMsg && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold border ${
                    profileMsg.type === "error"
                      ? "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300"
                      : "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                  }`}
                >
                  {profileMsg.text}
                </div>
              )}

              {/* User Identity Preview Card */}
              <div
                className="flex items-center gap-3.5 p-3.5 rounded-xl border"
                style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--border)" }}
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#fca311] to-amber-300 text-black font-black text-xl flex items-center justify-center shadow-md shadow-amber-500/20 flex-shrink-0">
                  {user.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div className="flex flex-col min-w-0">
                  <strong className="text-sm font-extrabold truncate" style={{ color: "var(--text)" }}>
                    {user.name}
                  </strong>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{user.email}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider ${
                        user.role === "admin"
                          ? "bg-[#fca311]/15 text-amber-700 dark:text-[#fca311] border border-[#fca311]/30"
                          : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30"
                      }`}
                    >
                      {user.role}
                    </span>
                  </div>
                </div>
              </div>

              {/* Form Input: Full Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold" style={{ color: "var(--text)" }}>
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  style={{
                    backgroundColor: "var(--input-bg)",
                    borderColor: "var(--input-border)",
                    color: "var(--input-text)",
                  }}
                  className="w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none transition-all"
                />
              </div>

              {/* Form Input: Email (Disabled) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold" style={{ color: "var(--text)" }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  style={{
                    backgroundColor: "var(--surface-2)",
                    borderColor: "var(--border)",
                    color: "var(--text-dim)",
                  }}
                  className="w-full px-3.5 py-2.5 rounded-lg border text-sm cursor-not-allowed select-none outline-none"
                />
                <span className="text-[11px]" style={{ color: "var(--text-dim)" }}>
                  Email address is permanently associated with this account.
                </span>
              </div>

              {/* Form Input: Student ID */}
              {user.role === "student" && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold" style={{ color: "var(--text)" }}>
                    Student ID / Enrollment Number
                  </label>
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="e.g. 21012011000"
                    style={{
                      backgroundColor: "var(--input-bg)",
                      borderColor: "var(--input-border)",
                      color: "var(--input-text)",
                    }}
                    className="w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none transition-all"
                  />
                </div>
              )}

              {/* Form Input: Department */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold" style={{ color: "var(--text)" }}>
                  Department
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Computer Engineering"
                  style={{
                    backgroundColor: "var(--input-bg)",
                    borderColor: "var(--input-border)",
                    color: "var(--input-text)",
                  }}
                  className="w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none transition-all"
                />
              </div>

              {/* Form Input: Phone Number */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold" style={{ color: "var(--text)" }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 9876543210"
                  style={{
                    backgroundColor: "var(--input-bg)",
                    borderColor: "var(--input-border)",
                    color: "var(--input-text)",
                  }}
                  className="w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none transition-all"
                />
                <span className="text-[11px]" style={{ color: "var(--text-dim)" }}>
                  Lab staff may contact you regarding issued items or returns.
                </span>
              </div>

              {/* Actions */}
              <div
                className="flex items-center justify-end gap-3 pt-3 border-t mt-2"
                style={{ borderColor: "var(--border)" }}
              >
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    backgroundColor: "var(--surface-2)",
                    borderColor: "var(--border)",
                    color: "var(--text)",
                  }}
                  className="px-4 py-2 rounded-lg text-xs font-semibold hover:opacity-80 transition-colors border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="px-5 py-2 rounded-lg text-xs font-bold text-black bg-[#fca311] hover:bg-[#e5920a] shadow-md shadow-amber-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {profileLoading ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: Reset Password */}
          {activeTab === "password" && (
            <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
              {passwordMsg && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold border ${
                    passwordMsg.type === "error"
                      ? "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300"
                      : "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                  }`}
                >
                  {passwordMsg.text}
                </div>
              )}

              <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                To update your password, enter your current password followed by your new password (minimum 6 characters).
              </p>

              {/* Current Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold" style={{ color: "var(--text)" }}>
                  Current Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  autoComplete="current-password"
                  style={{
                    backgroundColor: "var(--input-bg)",
                    borderColor: "var(--input-border)",
                    color: "var(--input-text)",
                  }}
                  className="w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none transition-all"
                />
              </div>

              {/* New Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold" style={{ color: "var(--text)" }}>
                  New Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min. 6 characters)"
                  autoComplete="new-password"
                  style={{
                    backgroundColor: "var(--input-bg)",
                    borderColor: "var(--input-border)",
                    color: "var(--input-text)",
                  }}
                  className="w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none transition-all"
                />
              </div>

              {/* Confirm New Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold" style={{ color: "var(--text)" }}>
                  Confirm New Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type new password"
                  autoComplete="new-password"
                  style={{
                    backgroundColor: "var(--input-bg)",
                    borderColor: "var(--input-border)",
                    color: "var(--input-text)",
                  }}
                  className="w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none transition-all"
                />
              </div>

              {/* Actions */}
              <div
                className="flex items-center justify-end gap-3 pt-3 border-t mt-2"
                style={{ borderColor: "var(--border)" }}
              >
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    backgroundColor: "var(--surface-2)",
                    borderColor: "var(--border)",
                    color: "var(--text)",
                  }}
                  className="px-4 py-2 rounded-lg text-xs font-semibold hover:opacity-80 transition-colors border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-5 py-2 rounded-lg text-xs font-bold text-black bg-[#fca311] hover:bg-[#e5920a] shadow-md shadow-amber-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {passwordLoading ? "Updating…" : "Update Password"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfileModal;
