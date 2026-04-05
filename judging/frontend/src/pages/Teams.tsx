import { useEffect, useState } from "react";
import { walkerRequest, extractFirst } from "../api";

export default function Teams() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    load();
    const iv = setInterval(load, 10000);
    return () => clearInterval(iv);
  }, []);

  async function load() {
    try {
      const res = await walkerRequest("get_team_tables", {});
      const d = extractFirst(res);
      if (d) setData(d);
    } catch {}
    setLoading(false);
  }

  const currentGroup = data?.current_group || 0;
  const currentRound = data?.current_round || 0;
  const groups = data?.groups || [];

  // Flatten all projects for search
  const allProjects = groups.flatMap((g: any) =>
    (g.projects || []).map((p: any) => ({ ...p, group_num: g.group_num }))
  );

  const filtered = search.trim()
    ? allProjects.filter(
        (p: any) =>
          p.name?.toLowerCase().includes(search.toLowerCase()) ||
          p.team_name?.toLowerCase().includes(search.toLowerCase())
      )
    : null;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(ellipse at top, #1a1208 0%, #0d0d0d 50%)",
        color: "#e8e8e8",
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "rgba(13,13,13,0.85)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid #2a2a2a",
          padding: "12px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div>
          <span style={{ color: "#F4622A", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "1.1rem" }}>
            JAC
          </span>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "1.1rem" }}>HACKS</span>
          <span style={{ fontSize: "0.7rem", color: "#666", marginLeft: 6, fontFamily: "'Space Mono', monospace" }}>
            TABLE ASSIGNMENTS
          </span>
        </div>
        {currentGroup > 0 && (
          <div
            style={{
              background: "rgba(244, 98, 42, 0.15)",
              border: "1px solid #F4622A",
              borderRadius: 20,
              padding: "4px 14px",
              fontFamily: "'Space Mono', monospace",
              fontSize: "0.8rem",
              fontWeight: 700,
              color: "#F4622A",
              animation: "pulse-dot 2s ease-in-out infinite",
            }}
          >
            🔴 LIVE — Group {currentGroup} Round {currentRound}
          </div>
        )}
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "20px 16px" }}>
        {/* Search */}
        <div style={{ marginBottom: 20 }}>
          <input
            type="text"
            placeholder="🔍 Search your team or project name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "14px 16px",
              background: "#1a1a1a",
              border: "1px solid #2a2a2a",
              borderRadius: 10,
              color: "white",
              fontSize: "1rem",
              fontFamily: "'DM Sans', sans-serif",
              outline: "none",
            }}
          />
        </div>

        {/* Search results */}
        {filtered && (
          <div style={{ marginBottom: 24 }}>
            {filtered.length === 0 ? (
              <p style={{ color: "#888", textAlign: "center", padding: 20 }}>No matches found</p>
            ) : (
              filtered.map((p: any) => (
                <div
                  key={p.name + p.group_num}
                  style={{
                    background: currentGroup === p.group_num ? "rgba(244, 98, 42, 0.1)" : "#1a1a1a",
                    border: currentGroup === p.group_num ? "2px solid #F4622A" : "1px solid #2a2a2a",
                    borderRadius: 12,
                    padding: 20,
                    marginBottom: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                  }}
                >
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: "50%",
                      background: "#F4622A",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      fontSize: "1.4rem",
                      fontFamily: "'Space Mono', monospace",
                      flexShrink: 0,
                    }}
                  >
                    {p.table_num}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>{p.name}</div>
                    <div style={{ color: "#888", fontSize: "0.85rem" }}>{p.team_name}</div>
                    <div style={{ marginTop: 4, display: "flex", gap: 8 }}>
                      <span
                        style={{
                          fontSize: "0.7rem",
                          padding: "2px 8px",
                          borderRadius: 4,
                          background: "rgba(244, 98, 42, 0.15)",
                          color: "#F4622A",
                          fontFamily: "'Space Mono', monospace",
                        }}
                      >
                        GROUP {p.group_num}
                      </span>
                      <span
                        style={{
                          fontSize: "0.7rem",
                          padding: "2px 8px",
                          borderRadius: 4,
                          background: "rgba(136, 136, 136, 0.15)",
                          color: "#888",
                        }}
                      >
                        TABLE {p.table_num}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {loading && <p style={{ color: "#888", textAlign: "center" }}>Loading...</p>}

        {/* All groups */}
        {!loading &&
          groups.map((g: any) => (
            <div
              key={g.group_num}
              style={{
                marginBottom: 20,
                border: currentGroup === g.group_num ? "2px solid #F4622A" : "1px solid #2a2a2a",
                borderRadius: 12,
                overflow: "hidden",
                background: currentGroup === g.group_num ? "rgba(244, 98, 42, 0.05)" : "#1a1a1a",
              }}
            >
              <div
                style={{
                  padding: "12px 16px",
                  background: currentGroup === g.group_num ? "rgba(244, 98, 42, 0.15)" : "#222",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, color: "#F4622A" }}>
                  GROUP {g.group_num}
                </span>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: "0.75rem", color: "#888", fontFamily: "'Space Mono', monospace" }}>
                    {g.projects?.length || 0} teams
                  </span>
                  {currentGroup === g.group_num && (
                    <span
                      style={{
                        fontSize: "0.7rem",
                        padding: "2px 8px",
                        borderRadius: 4,
                        background: "#F4622A",
                        color: "white",
                        fontWeight: 700,
                      }}
                    >
                      NOW PRESENTING
                    </span>
                  )}
                </div>
              </div>
              {(g.projects || []).map((p: any, i: number) => (
                <div
                  key={p.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 16px",
                    borderBottom: i < g.projects.length - 1 ? "1px solid #2a2a2a" : "none",
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: "#F4622A",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      fontSize: "0.9rem",
                      fontFamily: "'Space Mono', monospace",
                      flexShrink: 0,
                    }}
                  >
                    {p.table_num}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{p.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "#888" }}>{p.team_name}</div>
                  </div>
                </div>
              ))}
            </div>
          ))}
      </div>
    </div>
  );
}
