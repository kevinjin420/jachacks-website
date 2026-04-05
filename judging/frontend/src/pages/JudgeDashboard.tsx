import { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { walkerRequest, extractFirst, extractReports, getStoredEmail } from "../api";
import NavBar from "../components/NavBar";

// Only update state if data actually changed (prevents flicker)
function useStableState<T>(initial: T): [T, (v: T) => void] {
  const [state, setState] = useState(initial);
  const ref = useRef(JSON.stringify(initial));
  const setStable = useCallback((v: T) => {
    const json = JSON.stringify(v);
    if (json !== ref.current) {
      ref.current = json;
      setState(v);
    }
  }, []);
  return [state, setStable];
}

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
  group_num?: number;
  table_num?: number;
  round_num?: number;
}

interface CurrentAssignment {
  project_id: string;
  name: string;
  team_name: string;
  track: string;
  group_num: number;
  round_num: number;
  status: string;
  table_num?: number;
}

export default function JudgeDashboard() {
  const email = getStoredEmail();
  const [config, setConfig] = useStableState<any>({});
  const [currentAssignment, setCurrentAssignment] = useStableState<CurrentAssignment | null>(null);
  const [allAssignments, setAllAssignments] = useStableState<AssignedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    loadAll();
    intervalRef.current = window.setInterval(loadAll, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  async function loadAll() {
    try {
      const [cfgRes, projRes] = await Promise.all([
        walkerRequest("get_config", {}),
        walkerRequest("get_assigned_projects", { email }),
      ]);
      const cfg = extractFirst(cfgRes);
      if (cfg) setConfig(cfg);

      const data = extractReports(projRes);
      const list = Array.isArray(data)
        ? data.length === 1 && Array.isArray(data[0]?.projects)
          ? data[0].projects
          : data
        : [];
      setAllAssignments(list);

      // Load current assignment if judging is active
      if (cfg && cfg.current_group > 0) {
        try {
          const assignRes = await walkerRequest("get_current_assignment", { email });
          const assign = extractFirst(assignRes);
          if (assign?.current_assignment) {
            const ca = assign.current_assignment;
            const proj = ca.project || {};
            setCurrentAssignment({
              project_id: proj.project_id || "",
              name: proj.name || "",
              team_name: proj.team_name || "",
              track: proj.track || "",
              table_num: proj.table_num,
              group_num: ca.group_num,
              round_num: ca.round_num,
              status: "pending",
            });
          } else {
            setCurrentAssignment(null);
          }
          // Map all_assignments for the list
          if (assign?.all_assignments) {
            const mapped = assign.all_assignments.map((a: any) => ({
              project_id: a.project?.project_id || "",
              name: a.project?.name || "",
              team_name: a.project?.team_name || "",
              track: a.project?.track || "",
              group_num: a.group_num,
              round_num: a.round_num,
              table_num: a.project?.table_num,
              status: "pending",
            }));
            setAllAssignments(mapped);
          }
        } catch {
          setCurrentAssignment(null);
        }
      } else {
        setCurrentAssignment(null);
        // Still load assignments so judges can see their tables before judging starts
        try {
          const assignRes = await walkerRequest("get_current_assignment", { email });
          const assign = extractFirst(assignRes);
          if (assign?.all_assignments) {
            const mapped = assign.all_assignments.map((a: any) => ({
              project_id: a.project?.project_id || "",
              name: a.project?.name || "",
              team_name: a.project?.team_name || "",
              track: a.project?.track || "",
              group_num: a.group_num,
              round_num: a.round_num,
              table_num: a.project?.table_num,
              status: "pending",
            }));
            setAllAssignments(mapped);
          }
        } catch {}
      }
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

  const isActive = config.current_group > 0;
  const currentScored = currentAssignment?.status === "submitted";

  return (
    <>
      <NavBar />
      <div className="container">
        <h1 className="page-title">Judge Dashboard</h1>

        {loading && (
          <p style={{ color: "var(--text-muted)" }}>Loading...</p>
        )}
        {error && <p className="error-msg">{error}</p>}

        {!loading && !isActive && (
          <>
            <div
              className="card"
              style={{
                textAlign: "center",
                padding: "30px 24px",
                marginBottom: 20,
              }}
            >
              <div style={{ fontSize: "2rem", marginBottom: 8 }}>&#9203;</div>
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, marginBottom: 8 }}>
                Judging hasn't started yet
              </h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                Please wait for the organizer to begin. Here are your table assignments:
              </p>
            </div>

            {/* Show upcoming assignments grouped by group */}
            {allAssignments.length > 0 && (
              <div className="card">
                <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, marginBottom: 16 }}>
                  Your Table Assignments
                </h3>
                {(() => {
                  const byGroup: Record<number, typeof allAssignments> = {};
                  allAssignments.forEach(a => {
                    const g = a.group_num || 0;
                    if (!byGroup[g]) byGroup[g] = [];
                    byGroup[g].push(a);
                  });
                  return Object.entries(byGroup).sort(([a], [b]) => Number(a) - Number(b)).map(([gNum, items]) => (
                    <div key={gNum} style={{ marginBottom: 16 }}>
                      <div style={{
                        fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "0.9rem",
                        color: "var(--accent)", marginBottom: 8,
                      }}>
                        GROUP {gNum}
                      </div>
                      {items.map((a, i) => (
                        <div key={a.project_id + i} style={{
                          display: "flex", alignItems: "center", gap: 12,
                          padding: "10px 12px", borderRadius: 8, marginBottom: 6,
                          background: "var(--bg, #0d0d0d)", border: "1px solid var(--border)",
                        }}>
                          <div style={{
                            width: 42, height: 42, borderRadius: "50%",
                            background: "var(--accent)", color: "white",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontWeight: 800, fontSize: "1.1rem",
                            fontFamily: "'Space Mono', monospace", flexShrink: 0,
                          }}>
                            {a.table_num || "?"}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600 }}>{a.name}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{a.team_name}</div>
                          </div>
                          <span style={{
                            fontSize: "0.7rem", padding: "2px 8px", borderRadius: 4,
                            background: "rgba(244, 98, 42, 0.1)", color: "var(--accent)",
                            fontFamily: "'Space Mono', monospace",
                          }}>
                            Round {a.round_num}
                          </span>
                        </div>
                      ))}
                    </div>
                  ));
                })()}
                <div style={{
                  marginTop: 12, padding: "10px 14px", borderRadius: 8,
                  background: "rgba(244, 98, 42, 0.08)", border: "1px solid var(--border)",
                  fontSize: "0.8rem", color: "var(--text-muted)",
                }}>
                  <strong>Round 1:</strong> Go to your assigned table<br/>
                  <strong>Round 2:</strong> Move one table to the right (Table 10 → Table 1)
                </div>
              </div>
            )}
          </>
        )}

        {!loading && isActive && (
          <>
            {/* Current Group/Round Banner */}
            <div
              style={{
                background: "rgba(244, 98, 42, 0.12)",
                border: "2px solid var(--accent)",
                borderRadius: 12,
                padding: "20px 24px",
                textAlign: "center",
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: "1.8rem",
                  fontWeight: 800,
                  color: "var(--accent)",
                  lineHeight: 1.2,
                }}
              >
                GROUP {config.current_group} — ROUND {config.current_round}
              </div>
            </div>

            {/* Current Assignment */}
            {currentAssignment && !currentScored && (
              <div className="card mb-16" style={{ border: "2px solid var(--accent)" }}>
                <h3
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 700,
                    marginBottom: 4,
                    color: "var(--accent)",
                  }}
                >
                  Your Current Assignment
                </h3>
                <p
                  style={{
                    color: "var(--text-muted)",
                    fontSize: "0.85rem",
                    marginBottom: 16,
                  }}
                >
                  Score this project now (3 min presentation)
                </p>

                <div
                  style={{
                    background: "var(--surface)",
                    borderRadius: 10,
                    padding: "16px 20px",
                    marginBottom: 16,
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                  }}
                >
                  {currentAssignment.table_num != null && (
                    <div style={{
                      textAlign: "center",
                      flexShrink: 0,
                    }}>
                      <div style={{
                        fontFamily: "'Space Mono', monospace",
                        fontSize: "0.65rem",
                        fontWeight: 700,
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}>
                        TABLE
                      </div>
                      <div style={{
                        width: 52, height: 52, borderRadius: '50%',
                        background: 'var(--accent)', color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 800, fontSize: '1.4rem',
                        fontFamily: "'Space Mono', monospace",
                        margin: "4px auto 0",
                      }}>
                        {currentAssignment.table_num}
                      </div>
                    </div>
                  )}
                  <div>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: "1.2rem",
                        marginBottom: 4,
                      }}
                    >
                      {currentAssignment.name}
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                        {currentAssignment.team_name}
                      </span>
                      {currentAssignment.track && (
                        <span className="chip" style={trackStyle(currentAssignment.track)}>
                          {currentAssignment.track}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <Link
                  to={`/judge/${currentAssignment.project_id}`}
                  style={{ textDecoration: "none" }}
                >
                  <button
                    className="btn-primary"
                    style={{
                      width: "100%",
                      fontSize: "1.1rem",
                      padding: "14px 24px",
                      fontWeight: 700,
                    }}
                  >
                    Score This Project
                  </button>
                </Link>
              </div>
            )}

            {/* Already scored current */}
            {currentScored && (
              <div
                className="card mb-16"
                style={{
                  textAlign: "center",
                  padding: "30px 24px",
                  border: "2px solid var(--success, #22C55E)",
                }}
              >
                <div style={{ fontSize: "2.5rem", marginBottom: 8 }}>&#9989;</div>
                <h3
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 700,
                    color: "var(--success, #22C55E)",
                    marginBottom: 4,
                  }}
                >
                  Score Submitted
                </h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                  Waiting for next round... The organizer will advance when ready.
                </p>
              </div>
            )}

            {/* No assignment for this round */}
            {!currentAssignment && (
              <div
                className="card mb-16"
                style={{
                  textAlign: "center",
                  padding: "30px 24px",
                }}
              >
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                  No assignment for this round. Waiting for organizer.
                </p>
              </div>
            )}
          </>
        )}

        {/* All Assignments List */}
        {!loading && allAssignments.length > 0 && (
          <div className="card">
            <h3
              style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 700,
                marginBottom: 12,
              }}
            >
              All Assignments
            </h3>
            <div style={{ display: "grid", gap: 10 }}>
              {allAssignments.map((p) => {
                const isCurrent =
                  isActive &&
                  currentAssignment &&
                  p.project_id === currentAssignment.project_id;
                const isInactive =
                  isActive && !isCurrent && p.status !== "submitted";
                const isScored = p.status === "submitted";

                const cardContent = (
                  <div
                    className="card"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "14px 18px",
                      cursor: isInactive || isScored ? "default" : "pointer",
                      border: isCurrent ? "2px solid var(--accent)" : undefined,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontWeight: 600,
                          marginBottom: 4,
                          fontSize: "0.95rem",
                        }}
                      >
                        {p.name}
                        {p.group_num != null && (
                          <span
                            style={{
                              fontSize: "0.7rem",
                              color: "var(--text-muted)",
                              marginLeft: 8,
                              fontFamily: "'Space Mono', monospace",
                            }}
                          >
                            G{p.group_num}
                            {p.round_num != null && `/R${p.round_num}`}
                          </span>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                          {p.team_name}
                        </span>
                        {p.track && (
                          <span className="chip" style={trackStyle(p.track)}>
                            {p.track}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {isScored ? (
                        <span style={{
                          color: "#22C55E",
                          fontSize: "0.8rem",
                          fontWeight: 700,
                          background: "rgba(34, 197, 94, 0.12)",
                          padding: "4px 10px",
                          borderRadius: 12,
                        }}>
                          &#10003; Scored
                        </span>
                      ) : (
                        <>
                          <span className={chipClass(p.status)}>
                            {chipLabel(p.status)}
                          </span>
                          {!isInactive && (
                            <span style={{ color: "var(--accent)", fontSize: "0.8rem" }}>
                              Score &rarr;
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );

                if (isScored) {
                  return (
                    <div key={p.project_id} style={{ textDecoration: "none", color: "inherit" }}>
                      {cardContent}
                    </div>
                  );
                }

                return (
                  <Link
                    key={p.project_id}
                    to={`/judge/${p.project_id}`}
                    style={{
                      textDecoration: "none",
                      color: "inherit",
                      opacity: isInactive ? 0.4 : 1,
                      pointerEvents: isInactive ? "none" : "auto",
                    }}
                  >
                    {cardContent}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
