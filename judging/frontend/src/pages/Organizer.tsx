import { useEffect, useState, useRef } from "react";
import { walkerRequest, extractFirst, extractReports } from "../api";
import NavBar from "../components/NavBar";

export default function Organizer() {
  const [config, setConfig] = useState<any>({});
  const [progress, setProgress] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [selectedTrack, setSelectedTrack] = useState("");
  const [error, setError] = useState("");
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    loadAll();
    intervalRef.current = window.setInterval(loadAll, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    loadLeaderboard();
  }, [selectedTrack]);

  async function loadAll() {
    try {
      const [cfgRes, progRes] = await Promise.all([
        walkerRequest("get_config", {}),
        walkerRequest("get_progress", {}),
      ]);
      const cfg = extractFirst(cfgRes);
      if (cfg) setConfig(cfg);
      const prog = extractFirst(progRes);
      if (prog) setProgress(prog);
    } catch (err: any) {
      setError(err.message);
    }
    loadLeaderboard();
  }

  async function loadLeaderboard() {
    try {
      const res = await walkerRequest("get_leaderboard", {
        track: selectedTrack,
      });
      const data = extractReports(res);
      setLeaderboard(Array.isArray(data) ? data : []);
    } catch {
      // ignore
    }
  }

  async function toggleLock() {
    try {
      await walkerRequest("lock_scoring", {
        locked: !config.scoring_locked,
      });
      setConfig({ ...config, scoring_locked: !config.scoring_locked });
    } catch (err: any) {
      setError(err.message);
    }
  }

  const judges = progress?.judges || [];
  const totalScored = judges.reduce(
    (s: number, j: any) => s + (j.submitted || j.scored || 0),
    0
  );

  // Collect unique tracks from leaderboard
  const tracks = [
    ...new Set(leaderboard.map((t) => t.track).filter(Boolean)),
  ];

  return (
    <>
      <NavBar />
      <div className="container">
        <div className="flex-between mb-16">
          <h1 className="page-title" style={{ marginBottom: 0 }}>
            Mission Control
          </h1>
          <span
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: "0.8rem",
              color: "var(--text-muted)",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              padding: "4px 12px",
              borderRadius: 20,
            }}
          >
            Round 1
          </span>
        </div>

        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-icon">&#128203;</div>
            <div className="stat-value">
              {progress?.total_projects || 0}
            </div>
            <div className="stat-label">Projects</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">&#9878;&#65039;</div>
            <div className="stat-value">
              {progress?.total_judges || 0}
            </div>
            <div className="stat-label">Judges</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">&#9989;</div>
            <div className="stat-value">{totalScored}</div>
            <div className="stat-label">Scores In</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">&#128274;</div>
            <div
              className="flex-between"
              style={{ justifyContent: "center", gap: 12 }}
            >
              <span
                style={{
                  fontSize: "0.9rem",
                  color: config.scoring_locked
                    ? "var(--danger)"
                    : "var(--success)",
                  fontWeight: 600,
                }}
              >
                {config.scoring_locked ? "Locked" : "Open"}
              </span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={!!config.scoring_locked}
                  onChange={toggleLock}
                />
                <span className="slider"></span>
              </label>
            </div>
            <div className="stat-label">Scoring Lock</div>
          </div>
        </div>

        {error && <p className="error-msg mb-16">{error}</p>}

        {/* Leaderboard */}
        <div className="card mb-16">
          <div className="flex-between mb-16">
            <h3
              style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 700,
              }}
            >
              Leaderboard
            </h3>
          </div>

          <div className="track-tabs" style={{ marginBottom: 16 }}>
            <button
              className={`track-tab${selectedTrack === "" ? " active" : ""}`}
              onClick={() => setSelectedTrack("")}
            >
              All Tracks
            </button>
            {tracks.map((t) => (
              <button
                key={t}
                className={`track-tab${selectedTrack === t ? " active" : ""}`}
                onClick={() => setSelectedTrack(t)}
              >
                {t}
              </button>
            ))}
          </div>

          {leaderboard.map((trackData) => (
            <div
              key={trackData.track || "all"}
              style={{ marginBottom: 24 }}
            >
              {trackData.track && (
                <h4
                  style={{
                    color: "var(--accent)",
                    marginBottom: 8,
                    fontSize: "1rem",
                    fontFamily: "'Syne', sans-serif",
                  }}
                >
                  {trackData.track}
                </h4>
              )}
              {trackData.rankings && trackData.rankings.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Project</th>
                      <th>Team</th>
                      <th>Avg Score</th>
                      <th>Judges</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {trackData.rankings.map((r: any) => (
                      <tr key={r.project_id}>
                        <td style={{ fontWeight: 700 }}>#{r.rank}</td>
                        <td>{r.name}</td>
                        <td style={{ color: "var(--text-muted)" }}>
                          {r.team_name}
                        </td>
                        <td
                          style={{
                            fontWeight: 600,
                            fontFamily: "'Space Mono', monospace",
                          }}
                        >
                          {typeof r.avg_score === "number"
                            ? r.avg_score.toFixed(2)
                            : r.avg_score}
                        </td>
                        <td>{r.num_judges}</td>
                        <td>
                          {r.tie_alert && (
                            <span className="tie-alert">TIE</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p
                  style={{
                    color: "var(--text-muted)",
                    fontSize: "0.85rem",
                  }}
                >
                  No rankings yet
                </p>
              )}
            </div>
          ))}

          {leaderboard.length === 0 && (
            <p
              style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}
            >
              No data yet. Import projects and judges to get started.
            </p>
          )}
        </div>

        {/* Judge Progress */}
        <div className="card">
          <h3
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700,
              marginBottom: 16,
            }}
          >
            Judge Progress
          </h3>
          {judges.length > 0 ? (
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>Judge</th>
                    <th>Email</th>
                    <th>Assigned</th>
                    <th>Submitted</th>
                    <th>Progress</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {judges.map((j: any, i: number) => {
                    const pct =
                      j.assigned > 0
                        ? Math.round(
                            ((j.submitted || j.scored || 0) /
                              j.assigned) *
                              100
                          )
                        : 0;
                    return (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>
                          {j.judge_name}
                        </td>
                        <td style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                          {j.judge_email}
                        </td>
                        <td>{j.assigned}</td>
                        <td>{j.submitted}/{j.assigned}</td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div
                              style={{
                                background: "var(--border)",
                                borderRadius: 4,
                                height: 6,
                                width: 60,
                                overflow: "hidden",
                              }}
                            >
                              <div
                                style={{
                                  background:
                                    pct === 100
                                      ? "var(--success)"
                                      : "var(--accent)",
                                  height: "100%",
                                  width: `${pct}%`,
                                  borderRadius: 4,
                                  transition: "width 0.5s ease",
                                }}
                              />
                            </div>
                            <span
                              style={{
                                fontSize: "0.75rem",
                                color: pct === 100 ? "var(--success)" : "var(--text-muted)",
                                fontFamily: "'Space Mono', monospace",
                                fontWeight: pct === 100 ? 700 : 400,
                              }}
                            >
                              {pct}%
                            </span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: 4 }}>
                            <button
                              className="btn-secondary"
                              style={{ fontSize: "0.7rem", padding: "3px 8px" }}
                              onClick={async () => {
                                try {
                                  await walkerRequest("send_invite_email", {
                                    to_email: j.judge_email,
                                    to_name: j.judge_name,
                                    password: "jachacks2026",
                                    platform_url: window.location.origin,
                                  });
                                  alert(`Invite sent to ${j.judge_email}`);
                                } catch {
                                  // Copy fallback
                                  const msg = `Hey ${j.judge_name}! You're a judge at JacHacks 2026.\n\nLogin: ${window.location.origin}\nEmail: ${j.judge_email}\nPassword: jachacks2026`;
                                  await navigator.clipboard.writeText(msg);
                                  alert(`Email failed — invite copied to clipboard instead`);
                                }
                              }}
                            >
                              ✉️ Invite
                            </button>
                            <button
                              className="btn-secondary"
                              style={{ fontSize: "0.7rem", padding: "3px 8px" }}
                              onClick={async () => {
                                try {
                                  await walkerRequest("auto_assign_judges", {});
                                  loadAll();
                                } catch {}
                              }}
                            >
                              🔄 Assign
                            </button>
                            <button
                              className="btn-secondary"
                              style={{ fontSize: "0.7rem", padding: "3px 8px", color: "var(--danger, #ef4444)" }}
                              onClick={async () => {
                                if (!confirm(`Remove ${j.judge_name} (${j.judge_email}) as a judge?`)) return;
                                try {
                                  await walkerRequest("delete_judge", { email: j.judge_email });
                                  loadAll();
                                } catch (e: any) {
                                  alert(`Error: ${e.message}`);
                                }
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "0.85rem",
              }}
            >
              No judges yet
            </p>
          )}
        </div>
      </div>
    </>
  );
}
