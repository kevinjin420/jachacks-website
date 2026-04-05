import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { walkerRequest, extractFirst, getStoredEmail } from "../api";
import NavBar from "../components/NavBar";

const CRITERIA = [
  {
    key: "technical_execution",
    label: "Technical Depth",
    weight: 0.35,
    desc: "How well does the code work? How creative is the architecture? Is the demo stable?",
  },
  {
    key: "jac_usage",
    label: "JAC Integration",
    weight: 0.30,
    desc: "How deeply and effectively is JAC used as the backbone? walkers, by llm(), graph-native data, single-file full-stack.",
  },
  {
    key: "creativity",
    label: "Real-World Impact",
    weight: 0.20,
    desc: "Does this solve a real problem? Would anyone actually use it?",
  },
  {
    key: "presentation",
    label: "Presentation",
    weight: 0.15,
    desc: "Can you clearly explain what you built and why it matters? Show, don't tell.",
  },
] as const;

interface Scores {
  technical_execution: number;
  jac_usage: number;
  creativity: number;
  presentation: number;
}

function StarRating({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          onClick={() => !disabled && onChange(star)}
          onMouseEnter={() => !disabled && setHover(star)}
          onMouseLeave={() => setHover(0)}
          style={{
            cursor: disabled ? "default" : "pointer",
            fontSize: "32px",
            color: star <= (hover || value) ? "#F4622A" : "#333",
            transition: "color 0.15s, transform 0.15s",
            transform:
              star <= hover && !disabled ? "scale(1.2)" : "scale(1)",
            userSelect: "none",
          }}
        >
          &#9733;
        </span>
      ))}
    </div>
  );
}

export default function ScoreProject() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const email = getStoredEmail();

  const [project, setProject] = useState<any>(null);
  const [scores, setScores] = useState<Scores>({
    technical_execution: 1,
    jac_usage: 1,
    creativity: 1,
    presentation: 1,
  });
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    loadProject();
  }, [id]);

  async function loadProject() {
    try {
      const res = extractFirst(
        await walkerRequest("get_project_detail", {
          project_id: id,
          email,
        })
      );
      if (res) {
        setProject(res);
        if (res.my_score) {
          const s = res.my_score;
          setScores({
            technical_execution: s.technical_execution ?? 1,
            jac_usage: s.jac_usage ?? 1,
            creativity: s.creativity ?? 1,
            presentation: s.presentation ?? 1,
          });
          setNotes(s.notes || "");
          setIsSubmitted(!!s.is_final);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function overallScore(): number {
    const weighted =
      scores.technical_execution * 0.35 +
      scores.jac_usage * 0.30 +
      scores.creativity * 0.20 +
      scores.presentation * 0.15;
    return Math.round(weighted * 100) / 100;
  }

  async function save(isFinal: boolean) {
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      await walkerRequest("save_score", {
        email,
        project_id: id,
        technical_execution: scores.technical_execution,
        jac_usage: scores.jac_usage,
        creativity: scores.creativity,
        presentation: scores.presentation,
        notes,
        is_final: isFinal,
        round_num: 1,
      });
      setSuccess(isFinal ? "Score submitted!" : "Draft saved!");
      setIsSubmitted(isFinal);
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

  if (!project) {
    return (
      <>
        <NavBar />
        <div className="container">
          <p className="error-msg">Project not found</p>
        </div>
      </>
    );
  }

  return (
    <>
      <NavBar />
      <div className="container" style={{ maxWidth: 750 }}>
        <button
          className="btn-secondary"
          style={{ marginBottom: 16 }}
          onClick={() => navigate("/judge")}
        >
          &larr; Back to Dashboard
        </button>

        <div className="card mb-16">
          {project.table_num != null && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 12,
              padding: "8px 14px",
              background: "rgba(244, 98, 42, 0.1)",
              border: "1px solid var(--accent)",
              borderRadius: 8,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: 'var(--accent)', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: '1.1rem',
                fontFamily: "'Space Mono', monospace",
                flexShrink: 0,
              }}>
                {project.table_num}
              </div>
              <span style={{
                fontFamily: "'Space Mono', monospace",
                fontWeight: 700,
                fontSize: "0.85rem",
                color: "var(--accent)",
              }}>
                TABLE {project.table_num}
              </span>
            </div>
          )}
          <h2
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: "1.4rem",
              fontWeight: 700,
              marginBottom: 8,
            }}
          >
            {project.name}
          </h2>
          <p style={{ color: "var(--text-muted)", marginBottom: 4 }}>
            {project.team_name} &middot; {project.track}
          </p>
          {project.description && (
            <p
              style={{
                fontSize: "0.9rem",
                marginTop: 12,
                lineHeight: 1.5,
                color: "var(--text-muted)",
              }}
            >
              {project.description}
            </p>
          )}
          <div
            style={{
              display: "flex",
              gap: 16,
              marginTop: 12,
              fontSize: "0.85rem",
            }}
          >
            {project.github_url && (
              <a
                href={project.github_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>
            )}
            {project.demo_url && (
              <a
                href={project.demo_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Demo
              </a>
            )}
            {project.devpost_url && (
              <a
                href={project.devpost_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Devpost
              </a>
            )}
          </div>
        </div>

        <div className="card">
          <div className="flex-between mb-16">
            <h3
              style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700 }}
            >
              Scoring
            </h3>
            <div
              style={{
                textAlign: "right",
              }}
            >
              <div
                style={{
                  fontSize: "2rem",
                  fontWeight: 700,
                  color: "var(--accent)",
                  fontFamily: "'Space Mono', monospace",
                  lineHeight: 1,
                }}
              >
                {overallScore()}
              </div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-muted)",
                  marginTop: 2,
                }}
              >
                out of 5.0
              </div>
            </div>
          </div>

          {isSubmitted && (
            <div
              style={{
                padding: "10px 16px",
                background: "rgba(34, 197, 94, 0.1)",
                border: "1px solid rgba(34, 197, 94, 0.3)",
                borderRadius: 8,
                marginBottom: 20,
                color: "var(--success)",
                fontSize: "0.85rem",
              }}
            >
              This score has been submitted as final.
            </div>
          )}

          {CRITERIA.map((c) => (
            <div className="criterion-card" key={c.key}>
              <div className="flex-between" style={{ marginBottom: 4 }}>
                <div>
                  <div className="criterion-name">{c.label}</div>
                  <span
                    style={{
                      fontSize: "0.7rem",
                      color: "var(--text-muted)",
                      fontFamily: "'Space Mono', monospace",
                    }}
                  >
                    {c.weight * 100}% weight
                  </span>
                </div>
                <div
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: "1.2rem",
                    fontWeight: 700,
                    color: "var(--accent)",
                  }}
                >
                  {scores[c.key as keyof Scores]}/5
                </div>
              </div>
              <div className="criterion-desc">{c.desc}</div>
              <StarRating
                value={scores[c.key as keyof Scores]}
                onChange={(v) =>
                  setScores({ ...scores, [c.key]: v })
                }
                disabled={isSubmitted}
              />
            </div>
          ))}

          <div className="form-group" style={{ marginTop: 8 }}>
            <label>Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Optional notes about this project..."
              disabled={isSubmitted}
            />
          </div>

          {error && <p className="error-msg">{error}</p>}
          {success && <p className="success-msg">{success}</p>}

          {!isSubmitted && (
            <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
              <button
                className="btn-secondary"
                onClick={() => save(false)}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Draft"}
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  if (
                    window.confirm(
                      "Submit final score? This cannot be changed."
                    )
                  ) {
                    save(true);
                  }
                }}
                disabled={saving}
              >
                Submit Final
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
