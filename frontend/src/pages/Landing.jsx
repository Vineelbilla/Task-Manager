import { Link } from "react-router-dom";

const Landing = () => {
  return (
    <div className="landing-page">
      <header className="landing-nav">
        <div className="brand-mark">
          <span className="brand-badge">T</span>
          <div>
            <strong>Team Task Manager</strong>
            <span>Professional team coordination platform</span>
          </div>
        </div>

        <nav className="landing-actions">
          <Link className="ghost-btn" to="/login">
            Login
          </Link>
          <Link className="primary-btn" to="/signup">
            Get started
          </Link>
        </nav>
      </header>

      <main className="landing-hero">
        <section className="landing-copy">
          <span className="auth-eyebrow landing-eyebrow">Team workspace</span>
          <h1>Keep projects moving with clear ownership and organized execution.</h1>
          <p>
            Team Task Manager helps admins structure work, assign responsibilities, and track progress
            across the full project lifecycle while keeping member workflows focused and easy to follow.
          </p>

          <ul className="landing-list">
            <li>Centralized project planning with role-aware access</li>
            <li>Task assignments, due dates, and progress tracking in one flow</li>
            <li>Clean dashboards for both team leads and members</li>
          </ul>

          <div className="landing-cta-row">
            <Link className="primary-btn" to="/signup">
              Start your workspace
            </Link>
          </div>
        </section>

        <aside className="landing-highlight-card">
          <span className="landing-card-label">System highlights</span>
          <h2>Built for team clarity</h2>
          <p>
            Separate admin and member responsibilities, reduce confusion across assignments, and keep
            the entire workspace aligned through a single structured interface.
          </p>

          <div className="landing-metric-grid">
            <div className="landing-metric">
              <strong>Admin</strong>
              <span>Create projects and manage assignments</span>
            </div>
            <div className="landing-metric">
              <strong>Member</strong>
              <span>Update progress and stay on top of deliverables</span>
            </div>
            <div className="landing-metric">
              <strong>Secure</strong>
              <span>JWT authentication and protected routes</span>
            </div>
            <div className="landing-metric">
              <strong>Scalable</strong>
              <span>MongoDB-backed task and project workflows</span>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default Landing;
