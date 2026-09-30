import { useCallback, useState } from "react";
import Login from "./components/auth/Login";
import Dashboard from "./components/layout/Dashboard";

/**
 * App
 * Root component — manages authentication state only.
 * Renders Login when no valid session exists, Dashboard when authenticated.
 */
function App() {
  const [token, setToken] = useState(() => localStorage.getItem("smartlab_token"));
  const [user,  setUser]  = useState(() => {
    const saved = localStorage.getItem("smartlab_user");
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogin = useCallback((data) => {
    localStorage.setItem("smartlab_token", data.token);
    localStorage.setItem("smartlab_user",  JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("smartlab_token");
    localStorage.removeItem("smartlab_user");
    setToken(null);
    setUser(null);
  }, []);

  if (!token || !user) {
    return <Login onLogin={handleLogin} />;
  }

  return <Dashboard token={token} user={user} onLogout={handleLogout} />;
}

export default App;