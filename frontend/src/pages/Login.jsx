import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Notification from "../components/Notification";

const Login = () => {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (event) => {
    setFormData((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!formData.email || !formData.password) {
      setError("Please fill in all fields");
      return;
    }

    const result = await login(formData);
    if (!result.success) {
      setError(result.message);
      return;
    }

    navigate("/dashboard");
  };

  return (
    <div className="auth-page">
      <div className="auth-standalone-shell">
        <div className="auth-backdrop-copy">
          <span className="auth-eyebrow">Secure workspace access</span>
          <h1>Welcome back to your team workspace.</h1>
          <p>
            Sign in to manage ongoing projects, review assignments, and keep your delivery pipeline
            organized from one professional dashboard.
          </p>
          <Link className="ghost-btn light-ghost-btn" to="/">
            Back to home
          </Link>
        </div>

        <form className="auth-card" onSubmit={handleSubmit}>
          <div className="auth-brand-row">
            <div className="brand-mark brand-mark-small">
              <span className="brand-badge">T</span>
              <div>
                <strong>Team Task Manager</strong>
                <span>Login to continue</span>
              </div>
            </div>
          </div>
          <h2>Welcome back</h2>
          <p>Log in to continue managing your team, projects, and daily task flow.</p>
          <Notification message={error} type="error" />
          <label htmlFor="email">Email</label>
          <input id="email" name="email" onChange={handleChange} type="email" value={formData.email} />
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            onChange={handleChange}
            type="password"
            value={formData.password}
          />
          <button className="primary-btn" disabled={loading} type="submit">
            {loading ? "Logging in..." : "Login"}
          </button>
          <p className="auth-link">
            Don&apos;t have an account? <Link to="/signup">Create one</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
