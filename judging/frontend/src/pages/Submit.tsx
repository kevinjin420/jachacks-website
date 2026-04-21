import { useEffect, useState } from "react";
import { walkerRequest, extractFirst, getStoredEmail } from "../api";
import NavBar from "../components/NavBar";

const TRACKS = [
  "General",
  "AI/ML",
  "Web3",
  "Healthcare",
  "Education",
  "Sustainability",
  "FinTech",
  "Social Impact",
];

export default function Submit() {
  const email = getStoredEmail();
  const [form, setForm] = useState({
    name: "",
    team_name: "",
    track: TRACKS[0],
    github_url: "",
    demo_url: "",
    devpost_url: "",
    description: "",
  });
  const [isEdit, setIsEdit] = useState(false);
  const [projectId, setProjectId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadProject();
  }, []);

  async function loadProject() {
    try {
      const res = extractFirst(
        await walkerRequest("get_my_project", { email })
      );
      if (res && !res.not_found) {
        setForm({
          name: res.name || "",
          team_name: res.team_name || "",
          track: res.track || TRACKS[0],
          github_url: res.github_url || "",
          demo_url: res.demo_url || "",
          devpost_url: res.devpost_url || "",
          description: res.description || "",
        });
        setProjectId(res.project_id || res.id || "");
        setIsEdit(true);
      }
    } catch {
      // No existing project
    } finally {
      setLoading(false);
    }
  }

  function onChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      if (isEdit) {
        await walkerRequest("edit_project", {
          email,
          project_id: projectId,
          ...form,
        });
        setSuccess("Project updated successfully!");
      } else {
        await walkerRequest("submit_project", { email, ...form });
        setSuccess("Project submitted successfully!");
        setIsEdit(true);
        // Reload to get project_id
        await loadProject();
      }
    } catch (err: any) {
      setError(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <>
        <NavBar />
        <div className="container">
          <p style={{ color: "var(--text-muted)" }}>Loading...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <NavBar />
      <div className="container" style={{ maxWidth: 650 }}>
        <h1 className="page-title">
          {isEdit ? "Edit Project" : "Submit Project"}
        </h1>

        <form onSubmit={handleSubmit} className="card">
          <div className="form-group">
            <label>Project Name</label>
            <input
              name="name"
              value={form.name}
              onChange={onChange}
              required
              placeholder="My Awesome Hack"
            />
          </div>
          <div className="form-group">
            <label>Team Name</label>
            <input
              name="team_name"
              value={form.team_name}
              onChange={onChange}
              required
              placeholder="Team Rocket"
            />
          </div>
          <div className="form-group">
            <label>Track</label>
            <select name="track" value={form.track} onChange={onChange}>
              {TRACKS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>GitHub URL</label>
            <input
              name="github_url"
              value={form.github_url}
              onChange={onChange}
              placeholder="https://github.com/..."
            />
          </div>
          <div className="form-group">
            <label>Demo URL</label>
            <input
              name="demo_url"
              value={form.demo_url}
              onChange={onChange}
              placeholder="https://..."
            />
          </div>
          <div className="form-group">
            <label>Devpost URL</label>
            <input
              name="devpost_url"
              value={form.devpost_url}
              onChange={onChange}
              placeholder="https://devpost.com/..."
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={onChange}
              rows={5}
              placeholder="Describe your project..."
              required
            />
          </div>

          {error && <p className="error-msg">{error}</p>}
          {success && <p className="success-msg">{success}</p>}

          <button
            type="submit"
            className="btn-primary"
            style={{ width: "100%", marginTop: 8 }}
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : isEdit
                ? "Update Project"
                : "Submit Project"}
          </button>
        </form>
      </div>
    </>
  );
}
