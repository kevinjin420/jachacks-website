import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { walkerRequest, extractReports, getStoredEmail } from "../api";
import NavBar from "../components/NavBar";

const TRACK_COLORS: Record<string, { bg: string; text: string }> = {
  agentic_ai: { bg: "rgba(139, 92, 246, 0.15)", text: "#8B5CF6" },
  fintech_open: { bg: "rgba(59, 130, 246, 0.15)", text: "#3B82F6" },
  social_impact: { bg: "rgba(34, 197, 94, 0.15)", text: "#22C55E" },
};

function trackStyle(track: string) {
  const c = TRACK_COLORS[track] || {
    bg: "rgba(136, 136, 136, 0.15)",
    text: "#888",
  };
  return { background: c.bg, color: c.text };
}

interface AssignedProject {
  project_id: string;
  name: string;
  team_name: string;
  track: string;
  status: string;
  draft_score?: number;
}

export default function JudgeDashboard() {
  const email = getStoredEmail();
  const [projects, setProjects] = useState<AssignedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    try {
      const res = await walkerRequest("get_assigned_projects", { email });
      const data = extractReports(res);
      const list = Array.isArray(data)
        ? data.length === 1 && Array.isArray(data[0]?.projects)
          ? data[0].projects
          : data
        : [];
      setProjects(list);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function chipClass(status: string) {
    if (status === "submitted") return "chip chip-submitted";
    if (status === "draft") return "chip chip-draft";
    return "chip chip-pending";
  }

  function chipLabel(status: string) {
    if (status === "submitted") return "Submitted";
    if (status === "draft") return "Draft";
    return "Pending";
  }

  const submitted = projects.filter(
    (p) => p.status === "submitted"
  ).length;
  const drafts = projects.filter((p) => p.status === "draft").length;
  const remaining = projects.length - submitted - drafts;

  return (
    <>
      <NavBar />
      <div className="container">
        <h1 className="page-title">Judge Dashboard</h1>

        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-icon">&#128203;</div>
            <div className="stat-value">{projects.length}</div>
            <div className="stat-label">Assigned</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">&#9989;</div>
            <div className="stat-value">{submitted}</div>
            <div className="stat-label">Submitted</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">&#9998;</div>
            <div className="stat-value">{drafts}</div>
            <div className="stat-label">Drafts</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">&#8987;</div>
            <div className="stat-value">{remaining}</div>
            <div className="stat-label">Remaining</div>
          </div>
        </div>

        {loading && (
          <p style={{ color: "var(--text-muted)" }}>
            Loading projects...
          </p>
        )}
        {error && <p className="error-msg">{error}</p>}

        {!loading && projects.length === 0 && (
          <div className="card" style={{ textAlign: "center" }}>
            <p style={{ color: "var(--text-muted)" }}>
              No projects assigned yet. Please wait for an organizer to
              assign projects.
            </p>
          </div>
        )}

        {!loading && projects.length > 0 && (
          <div style={{ display: "grid", gap: 12 }}>
            {projects.map((p) => (
              <Link
                key={p.project_id}
                to={`/judge/${p.project_id}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div
                  className="card"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "16px 20px",
                    cursor: "pointer",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontWeight: 600,
                        marginBottom: 4,
                        fontSize: "1rem",
                      }}
                    >
                      {p.name}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          color: "var(--text-muted)",
                          fontSize: "0.85rem",
                        }}
                      >
                        {p.team_name}
                      </span>
                      <span
                        className="chip"
                        style={trackStyle(p.track)}
                      >
                        {p.track}
                      </span>
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    {p.status === "draft" && p.draft_score && (
                      <span
                        style={{
                          fontFamily: "'Space Mono', monospace",
                          fontSize: "0.85rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        {p.draft_score}/5
                      </span>
                    )}
                    <span className={chipClass(p.status)}>
                      {chipLabel(p.status)}
                    </span>
                    <span
                      style={{
                        color: "var(--accent)",
                        fontSize: "0.85rem",
                      }}
                    >
                      Score &rarr;
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
