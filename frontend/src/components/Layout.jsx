import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const links = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/projects", label: "Projects" },
    { to: "/tasks", label: "Tasks" },
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <h1>Team Task Manager</h1>
          <p className="sidebar-subtitle">Stay aligned and get work done.</p>
        </div>

        <nav className="nav-links">
          {links.map((link) => (
            <Link
              key={link.to}
              className={location.pathname === link.to ? "nav-link active" : "nav-link"}
              to={link.to}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="user-panel">
          <p>{user?.name}</p>
          <span>
            {user?.role} • {user?.email}
          </span>
          <button className="secondary-btn" onClick={handleLogout} type="button">
            Logout
          </button>
        </div>
      </aside>

      <main className="content">{children}</main>
    </div>
  );
};

export default Layout;
