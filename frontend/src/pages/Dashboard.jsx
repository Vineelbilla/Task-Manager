import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import LoadingSpinner from "../components/LoadingSpinner";
import Notification from "../components/Notification";
import StatCard from "../components/StatCard";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const initialUserForm = {
  name: "",
  email: "",
  role: "Member",
};

const Dashboard = () => {
  const { user, updateUser } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [userStats, setUserStats] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [editingUserId, setEditingUserId] = useState("");
  const [editingUserForm, setEditingUserForm] = useState(initialUserForm);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [savingUserId, setSavingUserId] = useState("");
  const [deletingUserId, setDeletingUserId] = useState("");

  const isAdmin = user?.role === "Admin";
  const sortedUserStats = [...userStats].sort((firstUser, secondUser) => {
    if (secondUser.tasksCompleted !== firstUser.tasksCompleted) {
      return secondUser.tasksCompleted - firstUser.tasksCompleted;
    }

    if (secondUser.totalTasksAssigned !== firstUser.totalTasksAssigned) {
      return secondUser.totalTasksAssigned - firstUser.totalTasksAssigned;
    }

    return firstUser.name.localeCompare(secondUser.name);
  });
  const topPerformer = sortedUserStats[0] || null;
  const selectedUser =
    sortedUserStats.find((member) => String(member.userId) === String(selectedUserId)) || null;
  const selectedUserTasks =
    dashboard?.allTasks?.filter(
      (task) => String(task.assignedTo?._id || task.assignedTo?.id) === String(selectedUserId)
    ) || [];

  const fetchDashboardData = async () => {
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
      const sortedStats = [...stats].sort((firstUser, secondUser) => {
        if (secondUser.tasksCompleted !== firstUser.tasksCompleted) {
          return secondUser.tasksCompleted - firstUser.tasksCompleted;
        }

        if (secondUser.totalTasksAssigned !== firstUser.totalTasksAssigned) {
          return secondUser.totalTasksAssigned - firstUser.totalTasksAssigned;
        }

        return firstUser.name.localeCompare(secondUser.name);
      });
      setSelectedUserId((currentSelectedUserId) => {
        if (!isAdmin || !stats.length) {
          return "";
        }

        const stillExists = sortedStats.some(
          (member) => String(member.userId) === String(currentSelectedUserId)
        );
        if (stillExists) {
          return currentSelectedUserId;
        }

        return String(sortedStats[0].userId);
      });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [isAdmin]);

  const startEditingUser = (member) => {
    setEditingUserId(String(member.userId));
    setEditingUserForm({
      name: member.name,
      email: member.email,
      role: member.role,
    });
    setMessage("");
    setError("");
  };

  const cancelEditingUser = () => {
    setEditingUserId("");
    setEditingUserForm(initialUserForm);
  };

  const handleEditingUserChange = (event) => {
    setEditingUserForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSaveUser = async (userId) => {
    setMessage("");
    setError("");

    if (!editingUserForm.name || !editingUserForm.email || !editingUserForm.role) {
      setError("Name, email, and role are required");
      return;
    }

    setSavingUserId(String(userId));
    try {
      const { data } = await api.put(`/admin/users/${userId}`, editingUserForm);
      if (String(userId) === String(user?.id)) {
        updateUser(data.user);
      }
      setMessage("User updated successfully");
      cancelEditingUser();
      await fetchDashboardData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to update user");
    } finally {
      setSavingUserId("");
    }
  };

  const handleDeleteUser = async (userId) => {
    setMessage("");
    setError("");
    setDeletingUserId(String(userId));

    try {
      await api.delete(`/admin/users/${userId}`);
      if (editingUserId === String(userId)) {
        cancelEditingUser();
      }
      setMessage("User deleted successfully");
      await fetchDashboardData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to delete user");
    } finally {
      setDeletingUserId("");
    }
  };

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

      <Notification message={message} type="success" />
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
                      {dashboard.allTasks.map((task) => {
                        const isPendingTask = task.status !== "DONE";

                        return (
                        <tr className={isPendingTask ? "pending-task-row" : ""} key={task._id}>
                          <td>
                            <div className="task-title-cell">
                              {isPendingTask && <span className="task-alert-dot" />}
                              <span>{task.title}</span>
                            </div>
                          </td>
                          <td>{task.projectId?.name || "Deleted Project"}</td>
                          <td>{task.assignedTo?.name || "-"}</td>
                          <td>{task.createdBy?.name || "-"}</td>
                          <td>
                            <span
                              className={isPendingTask ? "task-status-chip pending" : "task-status-chip"}
                            >
                              {task.status}
                            </span>
                          </td>
                          <td>{new Date(task.dueDate).toLocaleDateString()}</td>
                          <td>
                            {task.completedAt
                              ? new Date(task.completedAt).toLocaleDateString()
                              : "-"}
                          </td>
                        </tr>
                      )})}
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
                <h3>Team Performance</h3>
              </div>
              {topPerformer && (
                <p className="helper-text">
                  Top performer: {topPerformer.name} with {topPerformer.tasksCompleted} completed
                  tasks
                </p>
              )}
              {sortedUserStats.length ? (
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
                      {sortedUserStats.map((member) => (
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
                      {selectedUserTasks.map((task) => {
                        const isPendingTask = task.status !== "DONE";

                        return (
                        <tr className={isPendingTask ? "pending-task-row" : ""} key={task._id}>
                          <td>
                            <div className="task-title-cell">
                              {isPendingTask && <span className="task-alert-dot" />}
                              <span>{task.title}</span>
                            </div>
                          </td>
                          <td>{task.projectId?.name || "Deleted Project"}</td>
                          <td>{task.createdBy?.name || "-"}</td>
                          <td>
                            <span
                              className={isPendingTask ? "task-status-chip pending" : "task-status-chip"}
                            >
                              {task.status}
                            </span>
                          </td>
                          <td>{new Date(task.dueDate).toLocaleDateString()}</td>
                          <td>
                            {task.completedAt
                              ? new Date(task.completedAt).toLocaleDateString()
                              : "-"}
                          </td>
                        </tr>
                      )})}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="empty-state">No tasks are assigned to this user yet.</p>
              )}
            </section>
          )}

          {isAdmin && (
            <section className="panel">
              <div className="panel-header">
                <h3>Manage Users</h3>
              </div>
              <p className="helper-text">
                Update names, emails, and roles, or remove users that should no longer have
                access.
              </p>
              {sortedUserStats.length ? (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedUserStats.map((member) => (
                        <tr key={`manage-${member.userId}`}>
                          <td>
                            {editingUserId === String(member.userId) ? (
                              <input
                                name="name"
                                onChange={handleEditingUserChange}
                                type="text"
                                value={editingUserForm.name}
                              />
                            ) : (
                              member.name
                            )}
                          </td>
                          <td>
                            {editingUserId === String(member.userId) ? (
                              <input
                                name="email"
                                onChange={handleEditingUserChange}
                                type="email"
                                value={editingUserForm.email}
                              />
                            ) : (
                              member.email
                            )}
                          </td>
                          <td>
                            {editingUserId === String(member.userId) ? (
                              member.role === "Admin" ? (
                                <input disabled type="text" value={editingUserForm.role} />
                              ) : (
                                <select
                                  name="role"
                                  onChange={handleEditingUserChange}
                                  value={editingUserForm.role}
                                >
                                  <option value="Admin">Admin</option>
                                  <option value="Member">Member</option>
                                </select>
                              )
                            ) : (
                              member.role
                            )}
                          </td>
                          <td>
                            <div className="action-row">
                              {editingUserId === String(member.userId) ? (
                                <>
                                  <button
                                    className="primary-btn"
                                    disabled={savingUserId === String(member.userId)}
                                    onClick={() => handleSaveUser(member.userId)}
                                    type="button"
                                  >
                                    {savingUserId === String(member.userId)
                                      ? "Saving..."
                                      : "Save"}
                                  </button>
                                  <button
                                    className="secondary-btn"
                                    onClick={cancelEditingUser}
                                    type="button"
                                  >
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <button
                                  className="secondary-btn"
                                  onClick={() => startEditingUser(member)}
                                  type="button"
                                >
                                  Edit
                                </button>
                              )}
                              <button
                                className="danger-btn"
                                disabled={
                                  deletingUserId === String(member.userId) ||
                                  String(member.userId) === String(user?.id) ||
                                  member.role === "Admin"
                                }
                                onClick={() => handleDeleteUser(member.userId)}
                                type="button"
                              >
                                {deletingUserId === String(member.userId)
                                  ? "Deleting..."
                                  : "Delete"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="empty-state">No users available to manage yet.</p>
              )}
            </section>
          )}
        </>
      )}
    </Layout>
  );
};

export default Dashboard;
