import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import LoadingSpinner from "../components/LoadingSpinner";
import Notification from "../components/Notification";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const emptyProjectForm = {
  name: "",
  description: "",
};

const Projects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [projectForm, setProjectForm] = useState(emptyProjectForm);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [editingProjectId, setEditingProjectId] = useState("");
  const [editingMembers, setEditingMembers] = useState([]);
  const [editingProjectForm, setEditingProjectForm] = useState(emptyProjectForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingProjectId, setSavingProjectId] = useState("");
  const [deletingProjectId, setDeletingProjectId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchProjects = async () => {
    try {
      const { data } = await api.get("/projects");
      setProjects(data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to load projects");
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await api.get("/auth/users");
      setUsers(data);
    } catch (requestError) {
      setUsers([]);
    }
  };

  useEffect(() => {
    const loadPage = async () => {
      setLoading(true);
      await Promise.all([fetchProjects(), fetchUsers()]);
      setLoading(false);
    };

    loadPage();
  }, []);

  const handleProjectChange = (event) => {
    setProjectForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleMemberSelection = (memberId) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  const handleEditingProjectChange = (event) => {
    setEditingProjectForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleEditingMemberSelection = (memberId) => {
    setEditingMembers((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  const handleCreateProject = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!projectForm.name || !projectForm.description) {
      setError("Project name and description are required");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/projects", { ...projectForm, members: selectedMembers });
      setProjectForm(emptyProjectForm);
      setSelectedMembers([]);
      setMessage("Project created successfully");
      await fetchProjects();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to create project");
    } finally {
      setSubmitting(false);
    }
  };

  const startEditingMembers = (project) => {
    setEditingProjectId(project._id);
    setEditingMembers(
      project.members
        .map((member) => member._id || member.id)
        .filter((memberId) => memberId !== user.id)
    );
    setEditingProjectForm({
      name: project.name,
      description: project.description,
    });
    setMessage("");
    setError("");
  };

  const cancelEditingMembers = () => {
    setEditingProjectId("");
    setEditingMembers([]);
    setEditingProjectForm(emptyProjectForm);
  };

  const saveProjectMembers = async (projectId) => {
    setMessage("");
    setError("");
    setSavingProjectId(projectId);

    try {
      await api.put(`/projects/${projectId}/members`, { members: editingMembers });
      setMessage("Project members updated successfully");
      cancelEditingMembers();
      await fetchProjects();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to update project members");
    } finally {
      setSavingProjectId("");
    }
  };

  const saveProjectDetails = async (projectId) => {
    setMessage("");
    setError("");

    if (!editingProjectForm.name || !editingProjectForm.description) {
      setError("Project name and description are required");
      return;
    }

    setSavingProjectId(projectId);

    try {
      await api.put(`/projects/${projectId}`, editingProjectForm);
      await api.put(`/projects/${projectId}/members`, { members: editingMembers });
      setMessage("Project updated successfully");
      cancelEditingMembers();
      await fetchProjects();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to update project");
    } finally {
      setSavingProjectId("");
    }
  };

  const handleDeleteProject = async (projectId) => {
    setMessage("");
    setError("");
    setDeletingProjectId(projectId);

    try {
      await api.delete(`/projects/${projectId}`);
      setMessage("Project deleted successfully");
      if (editingProjectId === projectId) {
        cancelEditingMembers();
      }
      await fetchProjects();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to delete project");
    } finally {
      setDeletingProjectId("");
    }
  };

  const availableMembers = users.filter((member) => member.id !== user.id);

  return (
    <Layout>
      <section className="page-header">
        <h2>Projects</h2>
        <p>Create projects, tick members, and then assign tasks to those members.</p>
      </section>

      <Notification message={message} type="success" />
      <Notification message={error} type="error" />

      {loading ? (
        <LoadingSpinner text="Loading projects..." />
      ) : (
        <>
          {user?.role === "Admin" && (
            <section className="panel">
              <div className="panel-header">
                <h3>Create Project</h3>
              </div>
              <form className="form-grid" onSubmit={handleCreateProject}>
                <input
                  name="name"
                  onChange={handleProjectChange}
                  placeholder="Project name"
                  type="text"
                  value={projectForm.name}
                />
                <input
                  name="description"
                  onChange={handleProjectChange}
                  placeholder="Project description"
                  type="text"
                  value={projectForm.description}
                />
                <div className="checkbox-panel">
                  <div className="checkbox-panel-header">
                    <strong>Select Members</strong>
                    <span>Tick the members to include in this project.</span>
                  </div>
                  {availableMembers.length ? (
                    <div className="checkbox-list">
                      {availableMembers.map((member) => (
                        <label className="checkbox-item" key={member.id}>
                          <input
                            checked={selectedMembers.includes(member.id)}
                            onChange={() => handleMemberSelection(member.id)}
                            type="checkbox"
                          />
                          <span>
                            {member.name} ({member.role})
                          </span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="empty-state">No other members are available yet.</p>
                  )}
                </div>
                <button className="primary-btn" disabled={submitting} type="submit">
                  {submitting ? "Creating..." : "Create Project"}
                </button>
              </form>
            </section>
          )}

          <section className="panel">
            <div className="panel-header">
              <h3>Project List</h3>
            </div>
            {projects.length ? (
              <div className="project-grid">
                {projects.map((project) => (
                  <article className="project-card" key={project._id}>
                    <h4>{project.name}</h4>
                    <p>{project.description}</p>
                    <span>Owner: {project.createdBy?.name}</span>
                    <div className="member-list">
                      <strong>Members</strong>
                      {project.members.map((member) => (
                        <small key={member._id || member.id}>
                          {member.name} - {member.role}
                        </small>
                      ))}
                    </div>
                    {user?.role === "Admin" && project.createdBy?._id === user.id && (
                      <>
                        {editingProjectId === project._id ? (
                          <div className="editor-panel">
                            <div className="form-grid">
                              <input
                                name="name"
                                onChange={handleEditingProjectChange}
                                placeholder="Project name"
                                type="text"
                                value={editingProjectForm.name}
                              />
                              <input
                                name="description"
                                onChange={handleEditingProjectChange}
                                placeholder="Project description"
                                type="text"
                                value={editingProjectForm.description}
                              />
                            </div>
                            <div className="checkbox-panel">
                              <div className="checkbox-panel-header">
                                <strong>Edit Members</strong>
                                <span>The project owner stays included automatically.</span>
                              </div>
                              {availableMembers.length ? (
                                <div className="checkbox-list">
                                  {availableMembers.map((member) => (
                                    <label className="checkbox-item" key={member.id}>
                                      <input
                                        checked={editingMembers.includes(member.id)}
                                        onChange={() => handleEditingMemberSelection(member.id)}
                                        type="checkbox"
                                      />
                                      <span>
                                        {member.name} ({member.role})
                                      </span>
                                    </label>
                                  ))}
                                </div>
                              ) : (
                                <p className="empty-state">No other members are available yet.</p>
                              )}
                            </div>
                            <div className="action-row">
                              <button
                                className="primary-btn"
                                disabled={savingProjectId === project._id}
                                onClick={() => saveProjectDetails(project._id)}
                                type="button"
                              >
                                {savingProjectId === project._id ? "Saving..." : "Save Changes"}
                              </button>
                              <button
                                className="secondary-btn"
                                onClick={cancelEditingMembers}
                                type="button"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            className="secondary-btn"
                            onClick={() => startEditingMembers(project)}
                            type="button"
                          >
                            Edit Project
                          </button>
                        )}
                        <button
                          className="danger-btn"
                          disabled={deletingProjectId === project._id}
                          onClick={() => handleDeleteProject(project._id)}
                          type="button"
                        >
                          {deletingProjectId === project._id ? "Deleting..." : "Delete Project"}
                        </button>
                      </>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <p className="empty-state">No projects available yet.</p>
            )}
          </section>
        </>
      )}
    </Layout>
  );
};

export default Projects;
