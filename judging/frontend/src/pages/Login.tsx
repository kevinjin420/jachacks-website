import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authRequest, walkerRequest, extractFirst } from "../api";

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await authRequest("/user/login", { username, password });
      const token = res?.token || res?.data?.token;
      if (!token) throw new Error("Invalid credentials");
      localStorage.setItem("token", token);
      localStorage.setItem("email", username);
      localStorage.setItem("username", username);

      // Fetch profile to get role
      const profile = extractFirst(
        await walkerRequest("get_profile", { email: username })
      );
      const role = profile?.role || "judge";
      localStorage.setItem("role", role);

      if (role === "organizer") navigate("/organizer");
      else navigate("/judge");
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        padding: 20,
      }}
    >
      <div className="login-card">
        <h1
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: "2.2rem",
            fontWeight: 800,
            marginBottom: 4,
            letterSpacing: "-0.02em",
          }}
        >
          <span style={{ color: "#F4622A" }}>JAC</span>
          <span style={{ color: "#FFFFFF" }}>HACKS</span>
          <span
            style={{
              color: "var(--text-muted)",
              fontSize: "1rem",
              marginLeft: 10,
              fontWeight: 600,
              fontFamily: "'Space Mono', monospace",
            }}
          >
            2026
          </span>
        </h1>
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "0.9rem",
            marginBottom: 32,
            fontFamily: "'Space Mono', monospace",
          }}
        >
          Judging Platform &mdash; Ann Arbor, MI
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="judge@example.com"
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="error-msg">{error}</p>}

          <button
            type="submit"
            className="btn-primary"
            style={{ width: "100%", marginTop: 8 }}
            disabled={loading}
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        <p
          style={{
            textAlign: "center",
            marginTop: 24,
            fontSize: "0.8rem",
            color: "var(--text-muted)",
            lineHeight: 1.5,
          }}
        >
          Judges: use the credentials provided by your organizer
        </p>
      </div>
    </div>
  );
}
