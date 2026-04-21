import { Link } from "react-router-dom";
import { getStoredRole, logout } from "../api";

const ROLE_COLORS: Record<string, string> = {
  judge: "rgba(34, 197, 94, 0.15)",
  organizer: "rgba(244, 98, 42, 0.15)",
};
const ROLE_TEXT: Record<string, string> = {
  judge: "#22C55E",
  organizer: "#F4622A",
};

export default function NavBar() {
  const role = getStoredRole();
  const email = localStorage.getItem("email") || "";

  return (
    <nav className="nav-bar">
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span className="nav-brand">
          <span style={{ color: "#F4622A", fontFamily: "Syne", fontWeight: 800 }}>JAC</span>
          <span style={{ fontFamily: "Syne", fontWeight: 800 }}>HACKS</span>
        </span>
        <span
          style={{
            fontSize: "11px",
            color: "#666",
            fontFamily: "'Space Mono', monospace",
            fontWeight: 400,
            letterSpacing: "0.05em",
          }}
        >
          JUDGING
        </span>
      </div>
      <div className="nav-links">
        {role === "judge" && <Link to="/judge">Dashboard</Link>}
        {role === "organizer" && (
          <>
            <Link to="/organizer">Mission Control</Link>
            <Link to="/organizer/import">Import</Link>
            <Link to="/organizer/results">Results</Link>
          </>
        )}
        {role && (
          <span
            className="role-badge"
            style={{
              background: ROLE_COLORS[role] || "rgba(136,136,136,0.15)",
              color: ROLE_TEXT[role] || "var(--text-muted)",
            }}
          >
            {role}
          </span>
        )}
        <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
          {email}
        </span>
        <button onClick={logout}>Logout</button>
      </div>
    </nav>
  );
}
