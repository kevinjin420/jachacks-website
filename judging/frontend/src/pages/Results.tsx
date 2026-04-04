import { useEffect, useState } from "react";
import { walkerRequest, extractFirst, extractReports } from "../api";
import NavBar from "../components/NavBar";

function rankDisplay(rank: number): string {
  if (rank === 1) return "\uD83E\uDD47";
  if (rank === 2) return "\uD83E\uDD48";
  if (rank === 3) return "\uD83E\uDD49";
  return `#${rank}`;
}

export default function Results() {
  const [results, setResults] = useState<any>(null);
  const [awards, setAwards] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Award creation
  const [awardName, setAwardName] = useState("");
  const [awardSponsor, setAwardSponsor] = useState("");
  const [awardPrize, setAwardPrize] = useState("");
  const [awardMsg, setAwardMsg] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [resResults, resAwards, resProjects] = await Promise.all([
        walkerRequest("export_results", { track: "" }),
        walkerRequest("get_awards", {}),
        walkerRequest("get_all_projects", {}),
      ]);
      const r = extractFirst(resResults);
      if (r) setResults(r);
      setAwards(extractReports(resAwards));
      setProjects(extractReports(resProjects));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function createAward() {
    setAwardMsg("");
    try {
      await walkerRequest("create_award", {
        name: awardName,
        sponsor: awardSponsor,
        prize_description: awardPrize,
      });
      setAwardMsg("Award created!");
      setAwardName("");
      setAwardSponsor("");
      setAwardPrize("");
      const resAwards = await walkerRequest("get_awards", {});
      setAwards(extractReports(resAwards));
    } catch (err: any) {
      setAwardMsg(`Error: ${err.message}`);
    }
  }

  async function setWinner(awardId: string, projectId: string) {
    try {
      await walkerRequest("set_award_winner", {
        award_id: awardId,
        project_id: projectId,
      });
      const resAwards = await walkerRequest("get_awards", {});
      setAwards(extractReports(resAwards));
    } catch (err: any) {
      alert(err.message);
    }
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(results, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "jachacks-results.json";
    a.click();
    URL.revokeObjectURL(url);
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

  const tracks = results?.tracks || [];

  return (
    <>
      <NavBar />
      <div className="container">
        <div className="flex-between mb-16">
          <h1 className="page-title" style={{ marginBottom: 0 }}>
            Final Results
          </h1>
          <button
            className="btn-primary"
            onClick={exportJson}
            disabled={!results}
          >
            Export JSON
          </button>
        </div>

        {error && <p className="error-msg mb-16">{error}</p>}

        {/* Track Rankings */}
        {tracks.map((t: any) => (
          <div className="card mb-16" key={t.track || "all"}>
            <h3
              style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 700,
                color: "var(--accent)",
                marginBottom: 12,
                fontSize: "1.1rem",
              }}
            >
              {t.track || "All Tracks"}
            </h3>
            {t.rankings && t.rankings.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Project</th>
                    <th>Team</th>
                    <th>Avg Score</th>
                    <th>Judges</th>
                  </tr>
                </thead>
                <tbody>
                  {t.rankings.map((r: any) => (
                    <tr
                      key={r.project_id}
                      style={
                        r.rank <= 3
                          ? {
                              background:
                                "rgba(244, 98, 42, 0.03)",
                            }
                          : undefined
                      }
                    >
                      <td
                        style={{
                          fontWeight: 700,
                          fontSize:
                            r.rank <= 3 ? "1.3rem" : undefined,
                          textAlign: "center",
                          width: 60,
                        }}
                      >
                        {rankDisplay(r.rank)}
                      </td>
                      <td
                        style={{
                          fontWeight: r.rank <= 3 ? 700 : 400,
                          fontSize:
                            r.rank <= 3 ? "1.05rem" : undefined,
                        }}
                      >
                        {r.name}
                      </td>
                      <td style={{ color: "var(--text-muted)" }}>
                        {r.team_name}
                      </td>
                      <td
                        style={{
                          fontWeight: 600,
                          fontFamily: "'Space Mono', monospace",
                          color:
                            r.rank <= 3
                              ? "var(--accent)"
                              : "var(--text)",
                        }}
                      >
                        {typeof r.avg_score === "number"
                          ? r.avg_score.toFixed(2)
                          : r.avg_score}
                      </td>
                      <td>{r.num_judges}</td>
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
                No rankings available
              </p>
            )}
          </div>
        ))}

        {tracks.length === 0 && (
          <div className="card mb-16">
            <p style={{ color: "var(--text-muted)" }}>
              No results available yet.
            </p>
          </div>
        )}

        {/* Special Awards */}
        <div className="card mb-16">
          <h3
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700,
              marginBottom: 16,
            }}
          >
            Special Awards
          </h3>

          {awards.length > 0 && (
            <table style={{ marginBottom: 20 }}>
              <thead>
                <tr>
                  <th>Award</th>
                  <th>Sponsor</th>
                  <th>Prize</th>
                  <th>Winner</th>
                  <th>Set Winner</th>
                </tr>
              </thead>
              <tbody>
                {awards.map((a: any) => (
                  <tr key={a.id || a.award_id || a.name}>
                    <td style={{ fontWeight: 600 }}>{a.name}</td>
                    <td style={{ color: "var(--text-muted)" }}>
                      {a.sponsor}
                    </td>
                    <td style={{ color: "var(--text-muted)" }}>
                      {a.prize_description}
                    </td>
                    <td>
                      {a.winner_name || a.project_id ? (
                        <span
                          style={{
                            color: "var(--success)",
                            fontWeight: 600,
                          }}
                        >
                          {a.winner_name || a.project_id}
                        </span>
                      ) : (
                        <span style={{ color: "var(--text-muted)" }}>
                          Not set
                        </span>
                      )}
                    </td>
                    <td>
                      <select
                        style={{ width: "auto", minWidth: 140 }}
                        value={a.project_id || ""}
                        onChange={(e) =>
                          setWinner(
                            a.id || a.award_id,
                            e.target.value
                          )
                        }
                      >
                        <option value="">Select project</option>
                        {projects.map((p: any) => (
                          <option
                            key={p.project_id || p.id}
                            value={p.project_id || p.id}
                          >
                            {p.name} ({p.team_name})
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <h4
            className="section-header"
            style={{ fontSize: "0.9rem", marginBottom: 12 }}
          >
            Create Award
          </h4>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              placeholder="Award name"
              value={awardName}
              onChange={(e) => setAwardName(e.target.value)}
              style={{ flex: "1 1 200px" }}
            />
            <input
              placeholder="Sponsor"
              value={awardSponsor}
              onChange={(e) => setAwardSponsor(e.target.value)}
              style={{ flex: "1 1 150px" }}
            />
            <input
              placeholder="Prize description"
              value={awardPrize}
              onChange={(e) => setAwardPrize(e.target.value)}
              style={{ flex: "1 1 200px" }}
            />
            <button
              className="btn-primary"
              onClick={createAward}
              disabled={!awardName}
            >
              Create
            </button>
          </div>
          {awardMsg && (
            <p
              style={{
                fontSize: "0.85rem",
                marginTop: 8,
                color: awardMsg.startsWith("Error")
                  ? "var(--danger)"
                  : "var(--success)",
              }}
            >
              {awardMsg}
            </p>
          )}
        </div>
      </div>
    </>
  );
}
