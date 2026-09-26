import { useEffect, useMemo, useState } from "react";
import axios from "axios";

const API = "http://localhost:5000/api";

const api = axios.create({ baseURL: API });

function App() {
  const [token, setToken] = useState(localStorage.getItem("smartlab_token"));
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("smartlab_user");
    return saved ? JSON.parse(saved) : null;
  });

  const logout = () => {
    localStorage.removeItem("smartlab_token");
    localStorage.removeItem("smartlab_user");
    setToken(null);
    setUser(null);
  };

  if (!token || !user) {
    return <Login onLogin={(data) => {
      localStorage.setItem("smartlab_token", data.token);
      localStorage.setItem("smartlab_user", JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
    }} />;
  }

  return (
    <Dashboard
      token={token}
      user={user}
      onLogout={logout}
    />
  );
}

function Login({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    studentId: "",
    department: "Computer Engineering"
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
      const payload = mode === "login"
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
      <div className="auth-card">
        <div className="brand-mark">SL</div>
        <p className="eyebrow">IoT Laboratory</p>
        <h1>SmartLab Inventory</h1>
        <p className="muted">
          Component inventory, requests and issue/return tracking.
        </p>

        <div className="tabs">
          <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>
            Login
          </button>
          <button className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>
            Student Register
          </button>
        </div>

        <form onSubmit={submit}>
          {mode === "register" && (
            <>
              <label>Name<input required value={form.name} onChange={e => setForm({...form, name:e.target.value})} /></label>
              <label>Student ID<input required value={form.studentId} onChange={e => setForm({...form, studentId:e.target.value})} /></label>
            </>
          )}
          <label>Email<input type="email" required value={form.email} onChange={e => setForm({...form, email:e.target.value})} /></label>
          <label>Password<input type="password" required value={form.password} onChange={e => setForm({...form, password:e.target.value})} /></label>
          {mode === "register" && (
            <label>Department<input value={form.department} onChange={e => setForm({...form, department:e.target.value})} /></label>
          )}

          {message && <div className="alert error">{message}</div>}
          <button className="primary full" disabled={loading}>
            {loading ? "Please wait..." : mode === "login" ? "Sign in" : "Create student account"}
          </button>
        </form>

        
      </div>
    </div>
  );
}

function Dashboard({ token, user, onLogout }) {
  const [module, setModule] = useState(user.role === "admin" ? "inventory" : "inventory");

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="side-brand">
          <div className="brand-mark small">SL</div>
          <div>
            <strong>SmartLab</strong>
            <span>Inventory System</span>
          </div>
        </div>

        <nav>
          <button className={module === "auth" ? "nav-active" : ""} onClick={() => setModule("auth")}>
            <span>01</span> Authentication
          </button>
          <button className={module === "inventory" ? "nav-active" : ""} onClick={() => setModule("inventory")}>
            <span>02</span> Inventory
          </button>
          <button className={module === "requests" ? "nav-active" : ""} onClick={() => setModule("requests")}>
            <span>03</span> Requests & Issue
          </button>
        </nav>

        <div className="side-user">
          <div className="avatar">{user.name?.charAt(0)?.toUpperCase()}</div>
          <div className="user-info">
            <strong>{user.name}</strong>
            <span>{user.role}</span>
          </div>
          <button className="logout" onClick={onLogout}>Logout</button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">Software Engineering Practical</p>
            <h2>{module === "auth" ? "Module 1 — Authentication" : module === "inventory" ? "Module 2 — Inventory Management" : "Module 3 — Requests & Issue/Return"}</h2>
          </div>
          <span className={`role-pill ${user.role}`}>{user.role.toUpperCase()}</span>
        </header>

        {module === "auth" && <AuthModule user={user} />}
        {module === "inventory" && <InventoryModule token={token} user={user} />}
        {module === "requests" && <RequestModule token={token} user={user} />}
      </main>
    </div>
  );
}

function AuthModule({ user }) {
  return (
    <section>
      <div className="hero-panel">
        <div>
          <span className="module-number">MODULE 01</span>
          <h3>Secure user access</h3>
          <p>JWT authentication and role-based authorization separate student and admin operations.</p>
        </div>
        <div className="status-card">
          <span>Current session</span>
          <strong>{user.name}</strong>
          <small>{user.email} · {user.role}</small>
        </div>
      </div>

      <div className="cards three">
        <InfoCard title="Student Login" text="Students authenticate and receive a JWT token for protected APIs." />
        <InfoCard title="Admin Login" text="Admins use the same authentication system with elevated permissions." />
        <InfoCard title="Role Protection" text="Admin-only APIs reject student requests with HTTP 403." />
      </div>

      <div className="demo-box">
        <h4>Practical demonstration</h4>
        <ol>
          <li>Login as a student.</li>
          <li>Try an admin-only inventory action.</li>
          <li>Observe access control.</li>
          <li>Login as admin and repeat the action successfully.</li>
        </ol>
      </div>
    </section>
  );
}

function InfoCard({ title, text }) {
  return <div className="info-card"><h4>{title}</h4><p>{text}</p></div>;
}

function InventoryModule({ token, user }) {
  const [components, setComponents] = useState([]);
  const [form, setForm] = useState({
    name: "", componentId: "", category: "", description: "",
    totalQuantity: "", location: "", lowStockLimit: 2
  });
  const [message, setMessage] = useState("");
  const headers = { Authorization: `Bearer ${token}` };
  const load = async () => {
    try {
      const res = await api.get("/components", { headers });
      setComponents(res.data);
    } catch (err) {
      setMessage(err.response?.data?.message || "Could not load inventory.");
    }
  };
  useEffect(() => { load(); }, []);
  const addComponent = async (e) => {
    e.preventDefault();
    try {
      await api.post("/components", {
        ...form,
        totalQuantity: Number(form.totalQuantity),
        lowStockLimit: Number(form.lowStockLimit)
      }, { headers });
      setMessage("Component added successfully.");
      setForm({name:"",componentId:"",category:"",description:"",totalQuantity:"",location:"",lowStockLimit:2});
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || "Could not add component.");
    }
  };
  const deleteComponent = async (id) => {
    if (!window.confirm("Delete this component?")) return;
    try {
      await api.delete(`/components/${id}`, { headers });
      setMessage("Component deleted.");
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || "Delete failed.");
    }
  };
  const lowStock = useMemo(
    () => components.filter(c => c.availableQuantity <= c.lowStockLimit).length,
    [components]
  );
  return (
    <section>
      <div className="stats">
        <Stat label="Components" value={components.length} />
        <Stat label="Units in stock" value={components.reduce((a,c)=>a+c.availableQuantity,0)} />
        <Stat label="Low stock" value={lowStock} />
      </div>

      {message && <div className="alert">{message}</div>}

      <div className="content-grid">
        <div className="panel">
          <div className="panel-head"><div><span className="eyebrow">Inventory</span><h3>Available components</h3></div><button className="ghost" onClick={load}>Refresh</button></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Component</th><th>ID</th><th>Category</th><th>Available</th><th>Location</th>{user.role === "admin" && <th>Action</th>}</tr></thead>
              <tbody>
                {components.map(c => (
                  <tr key={c._id}>
                    <td><strong>{c.name}</strong><small>{c.description}</small></td>
                    <td>{c.componentId}</td>
                    <td>{c.category}</td>
                    <td><span className={c.availableQuantity <= c.lowStockLimit ? "stock low" : "stock"}>{c.availableQuantity}/{c.totalQuantity}</span></td>
                    <td>{c.location || "—"}</td>
                    {user.role === "admin" && <td><button className="danger-link" onClick={() => deleteComponent(c._id)}>Delete</button></td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {user.role === "admin" && (
          <div className="panel">
            <div className="panel-head"><div><span className="eyebrow">Admin</span><h3>Add component</h3></div></div>
            <form onSubmit={addComponent} className="compact-form">
              <label>Name<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>
              <div className="two-col">
                <label>Component ID<input required value={form.componentId} onChange={e=>setForm({...form,componentId:e.target.value})}/></label>
                <label>Category<input required value={form.category} onChange={e=>setForm({...form,category:e.target.value})}/></label>
              </div>
              <div className="two-col">
                <label>Total quantity<input type="number" min="0" required value={form.totalQuantity} onChange={e=>setForm({...form,totalQuantity:e.target.value})}/></label>
                <label>Low stock limit<input type="number" min="0" value={form.lowStockLimit} onChange={e=>setForm({...form,lowStockLimit:e.target.value})}/></label>
              </div>
              <label>Location<input value={form.location} onChange={e=>setForm({...form,location:e.target.value})}/></label>
              <label>Description<textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label>
              <button className="primary">Add component</button>
            </form>
          </div>
        )}
      </div>
    </section>
  );
}

function Stat({ label, value }) {
  return <div className="stat"><span>{label}</span><strong>{value}</strong></div>;
}

function RequestModule({ token, user }) {
  const headers = { Authorization: `Bearer ${token}` };
  const [components, setComponents] = useState([]);
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState({ componentId: "", quantity: 1, purpose: "" });
  const [message, setMessage] = useState("");

  const load = async () => {
    try {
      const comp = await api.get("/components", {headers});
      setComponents(comp.data);

      if (user.role === "admin") {
        const req = await api.get("/requests", {headers});
        setRequests(req.data);
      } else {
        const req = await api.get("/requests/my", {headers});
        setRequests(req.data);
      }
    } catch (err) {
      setMessage(err.response?.data?.message || "Could not load requests.");
    }
  };

  useEffect(() => { load(); }, []);

  const createRequest = async (e) => {
    e.preventDefault();
    try {
      await api.post("/requests", {
        componentId: form.componentId,
        quantity: Number(form.quantity),
        purpose: form.purpose
      }, {headers});
      setMessage("Request submitted successfully.");
      setForm({componentId:"",quantity:1,purpose:""});
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || "Request failed.");
    }
  };

  const action = async (id, type, body) => {
    try {
      await api.put(`/requests/${id}/${type}`, body || {}, {headers});
      setMessage(`Request ${type} completed.`);
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || "Action failed.");
    }
  };

  const overdue = async () => {
    try {
      const res = await api.put("/requests/check-overdue", {}, {headers});
      setMessage(`Overdue check: ${res.data.overdueCount} overdue, ${res.data.emailsSent} email(s) sent.`);
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || "Overdue check failed.");
    }
  };

  return (
    <section>
      {message && <div className="alert">{message}</div>}

      {user.role === "student" && (
        <div className="panel request-form">
          <div className="panel-head"><div><span className="eyebrow">Student</span><h3>Request a component</h3></div></div>
          <form onSubmit={createRequest} className="two-col-form">
            <label>Component
              <select required value={form.componentId} onChange={e=>setForm({...form,componentId:e.target.value})}>
                <option value="">Select component</option>
                {components.filter(c=>c.availableQuantity>0).map(c=><option key={c._id} value={c._id}>{c.name} — {c.availableQuantity} available</option>)}
              </select>
            </label>
            <label>Quantity<input type="number" min="1" required value={form.quantity} onChange={e=>setForm({...form,quantity:e.target.value})}/></label>
            <label className="span-2">Purpose<textarea required value={form.purpose} onChange={e=>setForm({...form,purpose:e.target.value})} placeholder="Why do you need this component?"/></label>
            <button className="primary">Submit request</button>
          </form>
        </div>
      )}

      <div className="panel">
        <div className="panel-head">
          <div><span className="eyebrow">Module 03</span><h3>{user.role === "admin" ? "Manage requests" : "My requests"}</h3></div>
          <div className="head-actions">
            <button className="ghost" onClick={load}>Refresh</button>
            {user.role === "admin" && <button className="warning" onClick={overdue}>Check overdue</button>}
          </div>
        </div>

        <div className="request-list">
          {requests.length === 0 && <div className="empty">No requests found.</div>}
          {requests.map(r => (
            <div className="request-card" key={r._id}>
              <div className="request-main">
                <div className="request-icon">{r.component?.name?.charAt(0) || "C"}</div>
                <div>
                  <h4>{r.component?.name || "Component"}</h4>
                  <p>{r.purpose}</p>
                  {user.role === "admin" && <small>Student: {r.student?.name} · {r.student?.email}</small>}
                </div>
              </div>
              <div className="request-meta">
                <span className={`badge ${r.status}`}>{r.status}</span>
                <span>Qty: {r.quantity}</span>
                {r.expectedReturnDate && <span>Due: {new Date(r.expectedReturnDate).toLocaleDateString()}</span>}
              </div>

              {user.role === "admin" && (
                <div className="request-actions">
                  {r.status === "pending" && <>
                    <button className="primary small-btn" onClick={()=>action(r._id,"approve")}>Approve</button>
                    <button className="danger small-btn" onClick={()=>action(r._id,"reject",{rejectionReason:"Rejected by lab admin"})}>Reject</button>
                  </>}
                  {r.status === "approved" && (
                    <button className="primary small-btn" onClick={()=>action(r._id,"issue",{expectedReturnDate: new Date(Date.now()+7*86400000).toISOString().slice(0,10)})}>Issue</button>
                  )}
                  {(r.status === "issued" || r.status === "overdue") && (
                    <button className="primary small-btn" onClick={()=>action(r._id,"return")}>Return</button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default App;