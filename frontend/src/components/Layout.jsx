import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [pendingTaskCount, setPendingTaskCount] = useState(0);

  useEffect(() => {
    if (!user || user.role !== "Member") {
      setPendingTaskCount(0);
      return undefined;
    }

    const loadPendingTasks = async () => {
      try {
        const { data } = await api.get("/dashboard");
        const pendingTasks =
          data?.assignedTasks?.filter((task) => task.status !== "DONE").length || 0;
        setPendingTaskCount(pendingTasks);
      } catch (error) {
        setPendingTaskCount(0);
      }
    };

    loadPendingTasks();

    const intervalId = window.setInterval(loadPendingTasks, 15000);
    window.addEventListener("focus", loadPendingTasks);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", loadPendingTasks);
    };
  }, [user]);

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
              <span>{link.label}</span>
              {user?.role === "Member" && link.to === "/tasks" && pendingTaskCount > 0 && (
                <span className="nav-badge">{pendingTaskCount}</span>
              )}
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
