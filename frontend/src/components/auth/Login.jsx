import { useState } from "react";
import api from "../../api/axios";
import ThemeToggle from "../ui/ThemeToggle";

/**
 * Login
 * Handles both student login and student registration.
 * Props:
 *   onLogin {(data: { token: string, user: object }) => void}
 */
function Login({ onLogin }) {
  const [mode, setMode]       = useState("login");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm]       = useState({
    name: "",
    email: "",
    password: "",
    studentId: "",
    phone: "",
    department: "Computer Engineering",
  });

  const patch = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
      const payload  = mode === "login"
        ? { email: form.email, password: form.password }
        : form;
      const res = await api.post(endpoint, payload);
      onLogin(res.data);
    } catch (err) {
      setMessage(err.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-theme-toggle">
        <ThemeToggle variant="pill" />
      </div>
      <div className="auth-card">
        <div className="brand-mark">SL</div>
        <p className="eyebrow">IoT Laboratory</p>
        <h1>SmartLab Inventory</h1>
        <p className="muted">Component inventory, requests and issue/return tracking.</p>

        {/* Mode tabs */}
        <div className="tabs">
          <button className={mode === "login"    ? "active" : ""} onClick={() => setMode("login")}>
            Login
          </button>
          <button className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>
            Student Register
          </button>
        </div>

        <form onSubmit={submit}>
          {mode === "register" && (
            <>
              <label>Name
                <input required value={form.name} onChange={patch("name")} placeholder="Full Name" />
              </label>
              <label>Student ID / Roll No
                <input required value={form.studentId} onChange={patch("studentId")} placeholder="e.g. 22IT045" />
              </label>
              <label>Phone Number
                <input type="tel" value={form.phone} onChange={patch("phone")} placeholder="e.g. +91 9876543210" />
              </label>
            </>
          )}

          <label>Email
            <input type="email" required value={form.email} onChange={patch("email")} />
          </label>
          <label>Password
            <input type="password" required value={form.password} onChange={patch("password")} />
          </label>

          {mode === "register" && (
            <label>Department
              <input value={form.department} onChange={patch("department")} />
            </label>
          )}

          {message && <div className="alert error">{message}</div>}

          <button className="primary full" disabled={loading}>
            {loading
              ? "Please wait…"
              : mode === "login"
              ? "Sign in"
              : "Create student account"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
