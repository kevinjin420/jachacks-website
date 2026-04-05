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
  const [allProjects, setAllProjects] = useState<any[]>([]);
  const [assigningJudge, setAssigningJudge] = useState<string | null>(null);
  const [assigningName, setAssigningName] = useState("");
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [flowLoading, setFlowLoading] = useState("");
  const [flowMsg, setFlowMsg] = useState("");
  const [groups, setGroups] = useState<any[]>([]);
  const [groupsOpen, setGroupsOpen] = useState(true);
  const [timerStart, setTimerStart] = useState<number | null>(null);
  const [timerDisplay, setTimerDisplay] = useState("0:00");
  const timerRef = useRef<number | null>(null);

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
      const [cfgRes, progRes, projRes, grpRes] = await Promise.all([
        walkerRequest("get_config", {}),
        walkerRequest("get_progress", {}),
        walkerRequest("get_all_projects", {}),
        walkerRequest("get_groups", {}),
      ]);
      const cfg = extractFirst(cfgRes);
      if (cfg) {
        setConfig(cfg);
        // Collapse groups when judging is active
        if (cfg.current_group > 0) setGroupsOpen(false);
      }
      const prog = extractFirst(progRes);
      if (prog) setProgress(prog);
      const projs = extractReports(projRes);
      if (Array.isArray(projs)) setAllProjects(projs);
      const grps = extractFirst(grpRes);
      if (Array.isArray(grps)) setGroups(grps);
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

  // Timer effect
  useEffect(() => {
    if (timerStart) {
      timerRef.current = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - timerStart) / 1000);
        const mins = Math.floor(elapsed / 60);
        const secs = elapsed % 60;
        setTimerDisplay(`${mins}:${secs.toString().padStart(2, "0")}`);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setTimerDisplay("0:00");
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerStart]);

  function startTimer() { setTimerStart(Date.now()); }
  function resetTimer() { setTimerStart(null); }

  async function setupGroups() {
    setFlowLoading("setup");
    setFlowMsg("");
    try {
      await walkerRequest("create_groups", { group_size: 10 });
      await walkerRequest("assign_rotation", {});
      setFlowMsg("Groups created & judges assigned!");
      await loadAll();
    } catch (err: any) {
      setFlowMsg(`Error: ${err.message}`);
    } finally {
      setFlowLoading("");
    }
  }

  async function startGroup(groupNum: number) {
    setFlowLoading("start");
    try {
      await walkerRequest("set_judging_state", { current_group: groupNum, current_round: 1 });
      startTimer();
      await loadAll();
    } catch (err: any) {
      setFlowMsg(`Error: ${err.message}`);
    } finally {
      setFlowLoading("");
    }
  }

  async function startRound2() {
    setFlowLoading("round2");
    try {
      const g = config.current_group || 1;
      await walkerRequest("set_judging_state", { current_group: g, current_round: 2 });
      startTimer();
      await loadAll();
    } catch (err: any) {
      setFlowMsg(`Error: ${err.message}`);
    } finally {
      setFlowLoading("");
    }
  }

  async function endGroup() {
    setFlowLoading("end");
    try {
      await walkerRequest("set_judging_state", { current_group: 0, current_round: 0 });
      resetTimer();
      setFlowMsg("Group complete! Call in the next group.");
      await loadAll();
    } catch (err: any) {
      setFlowMsg(`Error: ${err.message}`);
    } finally {
      setFlowLoading("");
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
          {config.current_group > 0 && (
            <span
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: "0.8rem",
                color: "var(--accent)",
                background: "rgba(244, 98, 42, 0.15)",
                border: "1px solid var(--accent)",
                padding: "4px 12px",
                borderRadius: 20,
                fontWeight: 700,
              }}
            >
              Group {config.current_group} / Round {config.current_round}
            </span>
          )}
        </div>

        {/* ACTIVE JUDGING — Big timer + controls */}
        {config.current_group > 0 && (
          <div className="card mb-16" style={{ border: "2px solid var(--accent)", background: "rgba(244, 98, 42, 0.05)", textAlign: "center" }}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "3rem", fontWeight: 700, color: "var(--accent)" }}>
              {timerDisplay}
            </div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.8rem", fontWeight: 800, color: "white", margin: "8px 0" }}>
              GROUP {config.current_group} — ROUND {config.current_round}
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontFamily: "'Space Mono', monospace", marginBottom: 20 }}>
              {config.current_group} of {config.total_groups || "?"} groups • 3 min per round
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              {config.current_round === 1 ? (
                <button className="btn-primary" onClick={startRound2} disabled={!!flowLoading}
                  style={{ fontWeight: 700, fontSize: "1.1rem", padding: "12px 32px" }}>
                  {flowLoading === "round2" ? "..." : "🔄 Rotate → Round 2"}
                </button>
              ) : (
                <button className="btn-primary" onClick={endGroup} disabled={!!flowLoading}
                  style={{ fontWeight: 700, fontSize: "1.1rem", padding: "12px 32px" }}>
                  {flowLoading === "end" ? "..." : "✅ End Group " + config.current_group}
                </button>
              )}
              <button className="btn-secondary" onClick={endGroup} disabled={!!flowLoading}
                style={{ color: "var(--danger, #ef4444)", fontSize: "1rem", padding: "12px 24px", fontWeight: 700 }}>
                ✕ Stop & Exit
              </button>
            </div>
            {config.current_round === 1 && (
              <p style={{ marginTop: 12, color: "var(--text-muted)", fontSize: "0.8rem" }}>
                When time's up, click Rotate. Judges move one table to the right.
              </p>
            )}
          </div>
        )}

        {/* SETUP / GROUP SELECTION — when not actively judging */}
        {(!config.current_group || config.current_group === 0) && (
          <div className="card mb-16" style={{ border: "2px solid var(--accent)", background: "rgba(244, 98, 42, 0.05)" }}>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, marginBottom: 12, color: "var(--accent)" }}>
              {groups.length === 0 ? "Setup Judging" : "Select a Group to Start"}
            </h3>

            {groups.length === 0 ? (
              <div>
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: 16 }}>
                  This will split projects into groups of 10 and assign each judge 2 projects per group.
                </p>
                <button className="btn-primary" onClick={setupGroups} disabled={!!flowLoading}
                  style={{ fontWeight: 700, fontSize: "1rem", padding: "10px 24px" }}>
                  {flowLoading === "setup" ? "Setting up..." : "🎯 Setup Groups & Assign Judges"}
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", marginTop: 8 }}>
                {groups.map((g: any) => (
                  <button key={g.group_num} className="btn-secondary"
                    onClick={() => startGroup(g.group_num)}
                    disabled={!!flowLoading}
                    style={{
                      padding: "16px", textAlign: "center", borderRadius: 12,
                      border: "2px solid var(--border)", transition: "all 0.15s",
                    }}>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "1.2rem", color: "var(--accent)" }}>
                      GROUP {g.group_num}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 4 }}>
                      {g.projects?.length || 0} projects
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--success)", marginTop: 4 }}>
                      ▶ Start
                    </div>
                  </button>
                ))}
              </div>
            )}

            {flowMsg && (
              <p style={{ marginTop: 12, fontSize: "0.85rem", color: flowMsg.startsWith("Error") ? "var(--danger)" : "var(--success)" }}>
                {flowMsg}
              </p>
            )}
          </div>
        )}

        {/* Group Details — collapsible */}
        {groups.length > 0 && (
          <div className="card mb-16">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
              onClick={() => setGroupsOpen(!groupsOpen)}>
              <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, margin: 0 }}>
                Group Details
              </h3>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontFamily: "'Space Mono', monospace" }}>
                {groupsOpen ? "▼ hide" : "▶ show"} ({groups.length} groups, {groups.reduce((s: number, g: any) => s + (g.projects?.length || 0), 0)} projects)
              </span>
            </div>
            {groupsOpen && (
              <div style={{ display: "grid", gap: 16, marginTop: 16, gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))" }}>
                {groups.map((g: any) => (
                  <div key={g.group_num} style={{
                    border: config.current_group === g.group_num ? "2px solid var(--accent)" : "1px solid var(--border)",
                    borderRadius: 10, padding: 16, background: "var(--bg, #0d0d0d)",
                  }}>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
                      <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "1rem", color: "var(--accent)" }}>
                        GROUP {g.group_num}
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "'Space Mono', monospace" }}>
                        {g.projects?.length || 0} projects
                      </span>
                    </div>
                    {(g.projects || []).map((p: any) => (
                      <div key={p.project_id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%', background: 'var(--accent)', color: 'white',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 800, fontSize: '0.85rem', fontFamily: "'Space Mono', monospace", flexShrink: 0,
                        }}>{p.table_num}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: "0.85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{p.team_name}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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
                                    platform_url: "https://jachacks.org/judging",
                                  });
                                  alert(`Invite sent to ${j.judge_email}`);
                                } catch {
                                  // Copy fallback
                                  const msg = `Hey ${j.judge_name}! You're a judge at JacHacks 2026.\n\nLogin: https://jachacks.org/judging\nEmail: ${j.judge_email}\nPassword: jachacks2026`;
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
                              onClick={() => {
                                setAssigningJudge(j.judge_email);
                                setAssigningName(j.judge_name);
                                setSelectedProjects([]);
                              }}
                            >
                              📋 Assign
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

        {/* Assign Projects Modal */}
        {assigningJudge && (
          <div style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.7)", zIndex: 1000,
            display: "flex", alignItems: "center", justifyContent: "center",
          }} onClick={() => setAssigningJudge(null)}>
            <div style={{
              background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: 12, padding: 24, maxWidth: 500, width: "90%",
              maxHeight: "80vh", overflowY: "auto",
            }} onClick={(e) => e.stopPropagation()}>
              <h3 style={{ fontFamily: "'Syne', sans-serif", marginBottom: 4 }}>
                Assign Projects to {assigningName}
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: 16 }}>
                Select projects, then click Assign Selected.
              </p>

              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <button className="btn-secondary" style={{ fontSize: "0.75rem", padding: "4px 10px" }}
                  onClick={() => setSelectedProjects(allProjects.map((p: any) => p.project_id))}>
                  Select All
                </button>
                <button className="btn-secondary" style={{ fontSize: "0.75rem", padding: "4px 10px" }}
                  onClick={() => setSelectedProjects([])}>
                  Clear
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {allProjects.map((p: any) => (
                  <label key={p.project_id} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "8px 12px", borderRadius: 8,
                    background: selectedProjects.includes(p.project_id) ? "rgba(244,98,42,0.1)" : "var(--bg, #0d0d0d)",
                    border: `1px solid ${selectedProjects.includes(p.project_id) ? "var(--accent)" : "var(--border)"}`,
                    cursor: "pointer", transition: "all 0.15s",
                  }}>
                    <input type="checkbox"
                      checked={selectedProjects.includes(p.project_id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProjects([...selectedProjects, p.project_id]);
                        } else {
                          setSelectedProjects(selectedProjects.filter((id) => id !== p.project_id));
                        }
                      }}
                      style={{ accentColor: "var(--accent)" }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{p.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {p.team_name} · {(p.track || "").replace("_", " ")}
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
                <button className="btn-secondary" onClick={() => setAssigningJudge(null)}>
                  Cancel
                </button>
                <button className="btn-primary"
                  disabled={selectedProjects.length === 0}
                  onClick={async () => {
                    try {
                      await walkerRequest("assign_judges", {
                        email: assigningJudge,
                        project_ids: selectedProjects,
                      });
                      setAssigningJudge(null);
                      loadAll();
                    } catch (e: any) {
                      alert(`Error: ${e.message}`);
                    }
                  }}
                >
                  Assign {selectedProjects.length} Project{selectedProjects.length !== 1 ? "s" : ""}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
