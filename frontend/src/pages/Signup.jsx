import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Notification from "../components/Notification";

const Signup = () => {
  const { signup, loading } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "Member",
  });
  const [error, setError] = useState("");

  const handleChange = (event) => {
    setFormData((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!formData.name || !formData.email || !formData.password) {
      setError("Please fill in all fields");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    const result = await signup(formData);
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
          <span className="auth-eyebrow">Create your workspace access</span>
          <h1>Start organizing your team with a cleaner workflow.</h1>
          <p>
            Set up your account to create projects, assign responsibilities, and track task progress in a
            workspace designed for structured collaboration.
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
                <span>Create account</span>
              </div>
            </div>
          </div>
          <h2>Create account</h2>
          <p>Set up your workspace access.</p>
          <Notification message={error} type="error" />
          <label htmlFor="name">Name</label>
          <input id="name" name="name" onChange={handleChange} type="text" value={formData.name} />
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
          <label htmlFor="role">Role</label>
          <select id="role" name="role" onChange={handleChange} value={formData.role}>
            <option value="Member">Member</option>
            <option value="Admin">Admin</option>
          </select>
          <button className="primary-btn" disabled={loading} type="submit">
            {loading ? "Creating..." : "Signup"}
          </button>
          <p className="auth-link">
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Signup;
