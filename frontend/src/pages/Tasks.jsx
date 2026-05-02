import { Fragment, useEffect, useState } from "react";
import Layout from "../components/Layout";
import LoadingSpinner from "../components/LoadingSpinner";
import Notification from "../components/Notification";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const initialTaskForm = {
  title: "",
  description: "",
  projectId: "",
  assignedTo: "",
  dueDate: "",
};

const initialEditTaskForm = {
  title: "",
  description: "",
  assignedTo: "",
  dueDate: "",
  status: "TODO",
};

const toDateInputValue = (value) => {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value.split("T")[0];
  }

  return new Date(value).toISOString().split("T")[0];
};

const Tasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [taskForm, setTaskForm] = useState(initialTaskForm);
  const [editingTaskId, setEditingTaskId] = useState("");
  const [editingTaskForm, setEditingTaskForm] = useState(initialEditTaskForm);
  const [filters, setFilters] = useState({
    project: "",
    status: "",
    dueDate: "",
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingTaskId, setSavingTaskId] = useState("");
  const [deletingTaskId, setDeletingTaskId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadProjects = async () => {
    try {
      const { data } = await api.get("/projects");
      setProjects(data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to load projects");
    }
  };

  const loadTasks = async (activeFilters = filters) => {
    try {
      const params = Object.fromEntries(
        Object.entries(activeFilters).filter(([, value]) => value)
      );
      const { data } = await api.get("/tasks", { params });
      setTasks(data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to load tasks");
    }
  };

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      await Promise.all([loadProjects(), loadTasks()]);
      setLoading(false);
    };

    initialize();
  }, []);

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    const refreshTasks = () => {
      loadTasks(filters);
    };

    const intervalId = window.setInterval(refreshTasks, 5000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshTasks();
      }
    };

    window.addEventListener("focus", refreshTasks);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshTasks);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user, filters]);

  const handleTaskChange = (event) => {
    setTaskForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleFilterChange = async (event) => {
    const updatedFilters = { ...filters, [event.target.name]: event.target.value };
    setFilters(updatedFilters);
    await loadTasks(updatedFilters);
  };

  const handleEditTaskChange = (event) => {
    setEditingTaskForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleCreateTask = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (
      !taskForm.title ||
      !taskForm.description ||
      !taskForm.projectId ||
      !taskForm.assignedTo ||
      !taskForm.dueDate
    ) {
      setError("Please complete all task fields");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/tasks", taskForm);
      setTaskForm(initialTaskForm);
      setMessage("Task created successfully");
      await loadTasks();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to create task");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (taskId, status) => {
    setMessage("");
    setError("");

    try {
      await api.put(`/tasks/${taskId}`, { status });
      setMessage("Task updated successfully");
      await loadTasks();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to update task");
    }
  };

  const startEditingTask = (task) => {
    setEditingTaskId(task._id);
    setEditingTaskForm({
      title: task.title,
      description: task.description,
      assignedTo: task.assignedTo?._id || task.assignedTo?.id || "",
      dueDate: toDateInputValue(task.dueDate),
      status: task.status,
    });
    setMessage("");
    setError("");
  };

  const cancelEditingTask = () => {
    setEditingTaskId("");
    setEditingTaskForm(initialEditTaskForm);
  };

  const handleSaveTaskEdit = async (taskId) => {
    setMessage("");
    setError("");

    if (
      !editingTaskForm.title ||
      !editingTaskForm.description ||
      !editingTaskForm.assignedTo ||
      !editingTaskForm.dueDate
    ) {
      setError("Please complete all editable task fields");
      return;
    }

    setSavingTaskId(taskId);
    try {
      await api.put(`/tasks/${taskId}`, editingTaskForm);
      setMessage("Task updated successfully");
      cancelEditingTask();
      await loadTasks();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to update task");
    } finally {
      setSavingTaskId("");
    }
  };

  const handleDeleteTask = async (taskId) => {
    setMessage("");
    setError("");
    setDeletingTaskId(taskId);

    try {
      await api.delete(`/tasks/${taskId}`);
      setMessage("Task deleted successfully");
      if (editingTaskId === taskId) {
        cancelEditingTask();
      }
      await loadTasks();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to delete task");
    } finally {
      setDeletingTaskId("");
    }
  };

  const selectedProject = projects.find((project) => project._id === taskForm.projectId);
  const assignableMembers = selectedProject?.members || [];

  return (
    <Layout>
      <section className="page-header">
        <h2>Tasks</h2>
        <p>
          {user?.role === "Admin"
            ? "Create tasks, assign work, and manage progress across projects."
            : "Track your assigned work, filter tasks, and keep your status updated."}
        </p>
      </section>

      <Notification message={message} type="success" />
      <Notification message={error} type="error" />

      {loading ? (
        <LoadingSpinner text="Loading tasks..." />
      ) : (
        <>
          {user?.role === "Admin" && (
            <section className="panel">
              <div className="panel-header">
                <h3>Create Task</h3>
              </div>
              <form className="form-grid" onSubmit={handleCreateTask}>
                <input
                  name="title"
                  onChange={handleTaskChange}
                  placeholder="Task title"
                  type="text"
                  value={taskForm.title}
                />
                <input
                  name="description"
                  onChange={handleTaskChange}
                  placeholder="Task description"
                  type="text"
                  value={taskForm.description}
                />
                <select name="projectId" onChange={handleTaskChange} value={taskForm.projectId}>
                  <option value="">Select project</option>
                  {projects.map((project) => (
                    <option key={project._id} value={project._id}>
                      {project.name}
                    </option>
                  ))}
                </select>
                <select name="assignedTo" onChange={handleTaskChange} value={taskForm.assignedTo}>
                  <option value="">Assign member</option>
                  {assignableMembers.map((member) => (
                    <option key={member._id || member.id} value={member._id || member.id}>
                      {member.name} ({member.role})
                    </option>
                  ))}
                </select>
                <input
                  name="dueDate"
                  onChange={handleTaskChange}
                  type="date"
                  value={taskForm.dueDate}
                />
                <button className="primary-btn" disabled={submitting} type="submit">
                  {submitting ? "Creating..." : "Create Task"}
                </button>
              </form>
            </section>
          )}

          <section className="panel">
            <div className="panel-header">
              <h3>Task List</h3>
            </div>
            <div className="filters-row">
              <select name="project" onChange={handleFilterChange} value={filters.project}>
                <option value="">All projects</option>
                {projects.map((project) => (
                  <option key={project._id} value={project._id}>
                    {project.name}
                  </option>
                ))}
              </select>
              <select name="status" onChange={handleFilterChange} value={filters.status}>
                <option value="">All statuses</option>
                <option value="TODO">TODO</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="DONE">DONE</option>
              </select>
              <input
                name="dueDate"
                onChange={handleFilterChange}
                type="date"
                value={filters.dueDate}
              />
            </div>

            {tasks.length ? (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Project</th>
                      <th>Assigned To</th>
                      <th>Status</th>
                      <th>Due Date</th>
                      <th>Completed On</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task) => {
                      const editableProject = projects.find(
                        (project) => project._id === (task.projectId?._id || task.projectId?.id)
                      );
                      const editableMembers = editableProject?.members || [];
                      const isPendingMemberTask =
                        user?.role === "Member" && task.status !== "DONE";

                      return (
                        <Fragment key={task._id}>
                          <tr className={isPendingMemberTask ? "pending-task-row" : ""} key={task._id}>
                            <td>
                              <div className="task-title-cell">
                                {isPendingMemberTask && <span className="task-alert-dot" />}
                                <span>{task.title}</span>
                              </div>
                            </td>
                            <td>{task.projectId?.name || "Deleted Project"}</td>
                            <td>{task.assignedTo?.name}</td>
                            <td>
                              <span
                                className={
                                  isPendingMemberTask ? "task-status-chip pending" : "task-status-chip"
                                }
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
                            <td>
                              <div className="task-action-group">
                                <select
                                  onChange={(event) =>
                                    handleStatusUpdate(task._id, event.target.value)
                                  }
                                  value={task.status}
                                >
                                  <option value="TODO">TODO</option>
                                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                                  <option value="DONE">DONE</option>
                                </select>
                                {user?.role === "Admin" && (
                                  <div className="action-row">
                                    <button
                                      className="secondary-btn"
                                      onClick={() => startEditingTask(task)}
                                      type="button"
                                    >
                                      {editingTaskId === task._id ? "Editing" : "Edit"}
                                    </button>
                                    <button
                                      className="danger-btn"
                                      disabled={deletingTaskId === task._id}
                                      onClick={() => handleDeleteTask(task._id)}
                                      type="button"
                                    >
                                      {deletingTaskId === task._id ? "Deleting..." : "Delete"}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                          {user?.role === "Admin" && editingTaskId === task._id && (
                            <tr className="editor-row" key={`${task._id}-editor`}>
                              <td colSpan="7">
                                <div className="editor-panel">
                                  <div className="form-grid">
                                    <input
                                      name="title"
                                      onChange={handleEditTaskChange}
                                      placeholder="Task title"
                                      type="text"
                                      value={editingTaskForm.title}
                                    />
                                    <input
                                      name="description"
                                      onChange={handleEditTaskChange}
                                      placeholder="Task description"
                                      type="text"
                                      value={editingTaskForm.description}
                                    />
                                    <select
                                      name="assignedTo"
                                      onChange={handleEditTaskChange}
                                      value={editingTaskForm.assignedTo}
                                    >
                                      <option value="">Assign member</option>
                                      {editableMembers.map((member) => (
                                        <option
                                          key={member._id || member.id}
                                          value={member._id || member.id}
                                        >
                                          {member.name} ({member.role})
                                        </option>
                                      ))}
                                    </select>
                                    <input
                                      name="dueDate"
                                      onChange={handleEditTaskChange}
                                      type="date"
                                      value={editingTaskForm.dueDate}
                                    />
                                    <select
                                      name="status"
                                      onChange={handleEditTaskChange}
                                      value={editingTaskForm.status}
                                    >
                                      <option value="TODO">TODO</option>
                                      <option value="IN_PROGRESS">IN_PROGRESS</option>
                                      <option value="DONE">DONE</option>
                                    </select>
                                  </div>
                                  <div className="action-row">
                                    <button
                                      className="primary-btn"
                                      disabled={savingTaskId === task._id}
                                      onClick={() => handleSaveTaskEdit(task._id)}
                                      type="button"
                                    >
                                      {savingTaskId === task._id ? "Saving..." : "Save Changes"}
                                    </button>
                                    <button
                                      className="secondary-btn"
                                      onClick={cancelEditingTask}
                                      type="button"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="empty-state">No tasks found for the current filters.</p>
            )}
          </section>
        </>
      )}
    </Layout>
  );
};

export default Tasks;
