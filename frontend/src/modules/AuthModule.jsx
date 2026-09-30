import InfoCard from "../components/ui/InfoCard";

/**
 * AuthModule
 * Explains the JWT authentication system implemented in Module 01.
 * Props:
 *   user {object} — { name, email, role }
 */
function AuthModule({ user }) {
  return (
    <section>
      {/* Hero banner */}
      <div className="hero-panel">
        <div>
          <span className="module-number">MODULE 01</span>
          <h3>Secure user access</h3>
          <p>
            JWT authentication and role-based authorization separate
            student and admin operations.
          </p>
        </div>
        <div className="status-card">
          <span>Current session</span>
          <strong>{user.name}</strong>
          <small>{user.email} · {user.role}</small>
        </div>
      </div>

      {/* Feature cards */}
      <div className="cards three">
        <InfoCard
          title="Student Login"
          text="Students authenticate and receive a JWT token for protected APIs."
        />
        <InfoCard
          title="Admin Login"
          text="Admins use the same authentication system with elevated permissions."
        />
        <InfoCard
          title="Role Protection"
          text="Admin-only APIs reject student requests with HTTP 403."
        />
      </div>

      {/* Demo steps */}
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

export default AuthModule;
