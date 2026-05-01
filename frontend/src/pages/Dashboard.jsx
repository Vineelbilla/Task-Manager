import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import LoadingSpinner from "../components/LoadingSpinner";
import Notification from "../components/Notification";
import StatCard from "../components/StatCard";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [userStats, setUserStats] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isAdmin = user?.role === "Admin";
  const topPerformer = userStats.reduce(
    (best, current) =>
      !best || current.tasksCompleted > best.tasksCompleted ? current : best,
    null
  );
  const selectedUser =
    userStats.find((member) => String(member.userId) === String(selectedUserId)) || null;
  const selectedUserTasks =
    dashboard?.allTasks?.filter(
      (task) => String(task.assignedTo?._id || task.assignedTo?.id) === String(selectedUserId)
    ) || [];

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const requests = [api.get("/dashboard")];
        if (isAdmin) {
          requests.push(api.get("/admin/user-stats"));
        }

        const [dashboardResponse, userStatsResponse] = await Promise.all(requests);
        setDashboard(dashboardResponse.data);
        const stats = userStatsResponse?.data || [];
        setUserStats(stats);
        setSelectedUserId((currentSelectedUserId) => {
          if (!isAdmin || !stats.length) {
            return "";
          }

          const stillExists = stats.some(
            (member) => String(member.userId) === String(currentSelectedUserId)
          );
          if (stillExists) {
            return currentSelectedUserId;
          }

          return String(stats[0].userId);
        });
      } catch (requestError) {
        setError(requestError.response?.data?.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [isAdmin]);

  return (
    <Layout>
      <section className="page-header">
        <h2>Dashboard</h2>
        <p>
          {isAdmin
            ? "Track overall team delivery, completed work, and recent activity."
            : "Your task progress and workload at a glance."}
        </p>
        {isAdmin && <span className="view-label">Admin View</span>}
      </section>

      <Notification message={error} type="error" />

      {loading ? (
        <LoadingSpinner text="Loading dashboard..." />
      ) : (
        <>
          <div className="stats-grid">
            <StatCard label="Total Tasks" value={dashboard?.stats?.totalTasks || 0} />
            <StatCard label="Completed" value={dashboard?.stats?.completedTasks || 0} />
            <StatCard label="Overdue" value={dashboard?.stats?.overdueTasks || 0} />
            <StatCard
              label={isAdmin ? "Tasks Created By Me" : "Assigned To Me"}
              value={isAdmin ? dashboard?.stats?.createdByMe || 0 : dashboard?.stats?.assignedToMe || 0}
            />
          </div>

          <section className="panel">
            <div className="panel-header">
              <h3>{isAdmin ? "Team Overview" : "My Tasks"}</h3>
            </div>
            {isAdmin ? (
              dashboard?.allTasks?.length ? (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Project</th>
                        <th>Assigned To</th>
                        <th>Created By</th>
                        <th>Status</th>
                        <th>Due Date</th>
                        <th>Completed On</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.allTasks.map((task) => (
                        <tr key={task._id}>
                          <td>{task.title}</td>
                          <td>{task.projectId?.name || "Deleted Project"}</td>
                          <td>{task.assignedTo?.name || "-"}</td>
                          <td>{task.createdBy?.name || "-"}</td>
                          <td>{task.status}</td>
                          <td>{new Date(task.dueDate).toLocaleDateString()}</td>
                          <td>
                            {task.completedAt
                              ? new Date(task.completedAt).toLocaleDateString()
                              : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="empty-state">No team tasks found yet.</p>
              )
            ) : dashboard?.assignedTasks?.length ? (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Project</th>
                      <th>Status</th>
                      <th>Due Date</th>
                      <th>Completed On</th>
                    </tr>
                  </thead>
                  <tbody>
                      {dashboard.assignedTasks.map((task) => (
                        <tr key={task._id}>
                          <td>{task.title}</td>
                          <td>{task.projectId?.name || "Deleted Project"}</td>
                          <td>{task.status}</td>
                          <td>{new Date(task.dueDate).toLocaleDateString()}</td>
                          <td>
                            {task.completedAt
                              ? new Date(task.completedAt).toLocaleDateString()
                              : "-"}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="empty-state">No tasks assigned yet.</p>
            )}
          </section>

          {isAdmin && (
            <section className="panel">
              <div className="panel-header">
                <h3>Recent Tasks</h3>
              </div>
              {dashboard?.recentTasks?.length ? (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Project</th>
                        <th>Assigned To</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th>Completed On</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.recentTasks.map((task) => (
                        <tr key={task._id}>
                          <td>{task.title}</td>
                          <td>{task.projectId?.name || "Deleted Project"}</td>
                          <td>{task.assignedTo?.name || "-"}</td>
                          <td>{task.status}</td>
                          <td>{new Date(task.createdAt).toLocaleDateString()}</td>
                          <td>
                            {task.completedAt
                              ? new Date(task.completedAt).toLocaleDateString()
                              : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="empty-state">No recent tasks available.</p>
              )}
            </section>
          )}

          {isAdmin && (
            <section className="panel">
              <div className="panel-header">
                <h3>Team Performance</h3>
              </div>
              {topPerformer && (
                <p className="helper-text">
                  Top performer: {topPerformer.name} with {topPerformer.tasksCompleted} completed
                  tasks
                </p>
              )}
              {userStats.length ? (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>User Name</th>
                        <th>Email</th>
                        <th>Tasks Assigned</th>
                        <th>Completed</th>
                        <th>Pending</th>
                        <th>Projects Involved</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userStats.map((member) => (
                        <tr
                          className={
                            [
                              topPerformer?.userId === member.userId ? "highlight-row" : "",
                              String(selectedUserId) === String(member.userId)
                                ? "selected-row"
                                : "",
                              "clickable-row",
                            ]
                              .filter(Boolean)
                              .join(" ")
                          }
                          onClick={() => setSelectedUserId(String(member.userId))}
                          key={member.userId}
                        >
                          <td>{member.name}</td>
                          <td>{member.email}</td>
                          <td>{member.totalTasksAssigned}</td>
                          <td>{member.tasksCompleted}</td>
                          <td>{member.tasksPending}</td>
                          <td>{member.projectsInvolved}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="empty-state">No user performance data available yet.</p>
              )}
            </section>
          )}

          {isAdmin && selectedUser && (
            <section className="panel">
              <div className="panel-header">
                <h3>{selectedUser.name} Tasks</h3>
              </div>
              <p className="helper-text">
                Showing all tasks assigned to {selectedUser.name}, including completed and pending
                work.
              </p>
              {selectedUserTasks.length ? (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Project</th>
                        <th>Created By</th>
                        <th>Status</th>
                        <th>Due Date</th>
                        <th>Completed On</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedUserTasks.map((task) => (
                        <tr key={task._id}>
                          <td>{task.title}</td>
                          <td>{task.projectId?.name || "Deleted Project"}</td>
                          <td>{task.createdBy?.name || "-"}</td>
                          <td>{task.status}</td>
                          <td>{new Date(task.dueDate).toLocaleDateString()}</td>
                          <td>
                            {task.completedAt
                              ? new Date(task.completedAt).toLocaleDateString()
                              : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="empty-state">No tasks are assigned to this user yet.</p>
              )}
            </section>
          )}
        </>
      )}
    </Layout>
  );
};

export default Dashboard;
