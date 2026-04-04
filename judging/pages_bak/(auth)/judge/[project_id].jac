cl import from "@jac/runtime" { useParams, useNavigate, Link }
sv import from ...main { get_project_detail, save_score }
cl import from "../../../components/ScoreForm.cl" { ScoreForm }

cl {
    def:pub page() -> JsxElement {
        has project: dict = {};
        has loading: bool = True;
        has error: str = "";
        has saved: str = "";

        params = useParams();
        navigate = useNavigate();
        projectId = params.id;
        email = localStorage.getItem("jachacks_email") or "";

        async can with entry {
            try {
                result = root spawn get_project_detail(
                    project_id=projectId,
                    email=email
                );
                if result.reports and result.reports.length > 0 {
                    data = result.reports[0];
                    if data.get("error") {
                        error = data["error"];
                    } else {
                        project = data;
                    }
                }
            } except Exception as e {
                error = f"Failed to load project: {e}";
            }
            loading = False;
        }

        async def handleScore(scoreData: dict) -> None {
            error = "";
            saved = "";
            try {
                result = root spawn save_score(
                    email=email,
                    project_id=projectId,
                    technical_execution=scoreData["technical_execution"],
                    jac_usage=scoreData["jac_usage"],
                    creativity=scoreData["creativity"],
                    impact=scoreData["impact"],
                    presentation=scoreData["presentation"],
                    notes=scoreData.get("notes", ""),
                    is_final=scoreData.get("is_final", False)
                );
                if result.reports and result.reports.length > 0 {
                    data = result.reports[0];
                    if data.get("error") {
                        error = data["error"];
                    } else {
                        if scoreData.get("is_final") {
                            saved = "Score submitted successfully!";
                            # Reload to show read-only state
                            reloadResult = root spawn get_project_detail(
                                project_id=projectId,
                                email=email
                            );
                            if reloadResult.reports and reloadResult.reports.length > 0 {
                                project = reloadResult.reports[0];
                            }
                        } else {
                            saved = "Draft saved!";
                        }
                    }
                }
            } except Exception as e {
                error = f"Failed to save: {e}";
            }
        }

        if loading {
            return <div className="text-muted">Loading project...</div>;
        }

        myScore = project.get("my_score", None);
        isLocked = project.get("scoring_locked", False);
        isFinal = myScore != None and myScore.get("is_final", False);
        disabled = isLocked or isFinal;

        return <div>
            <Link to="/judge" className="text-sm mb-4" style={{"display": "inline-block"}}>
                Back to projects
            </Link>

            <div className="section">
                <h1>{project.get("name", "Project")}</h1>
                <div className="flex items-center gap-3 mt-2">
                    <span className="chip chip-track">
                        {project.get("track", "").replace("_", " ").upper()}
                    </span>
                    <span className="text-muted">{project.get("team_name", "")}</span>
                </div>
                {project.get("description", "") and (
                    <p className="text-muted mt-2">{project["description"]}</p>
                )}
                <div className="flex gap-3 mt-2">
                    {project.get("github_url", "") and (
                        <a href={project["github_url"]} target="_blank">GitHub</a>
                    )}
                    {project.get("demo_url", "") and (
                        <a href={project["demo_url"]} target="_blank">Demo</a>
                    )}
                    {project.get("devpost_url", "") and (
                        <a href={project["devpost_url"]} target="_blank">Devpost</a>
                    )}
                </div>
            </div>

            {isLocked and (
                <div className="lock-banner">Scoring is locked.</div>
            )}

            {isFinal and (
                <div className="alert alert-success">
                    Score submitted as final. Read-only.
                </div>
            )}

            {error and <div className="alert alert-error">{error}</div>}
            {saved and <div className="alert alert-success">{saved}</div>}

            <ScoreForm
                disabled={disabled}
                initial_technical={myScore and myScore.get("technical_execution", 5.0) or 5.0}
                initial_jac_usage={myScore and myScore.get("jac_usage", 5.0) or 5.0}
                initial_creativity={myScore and myScore.get("creativity", 5.0) or 5.0}
                initial_impact={myScore and myScore.get("impact", 5.0) or 5.0}
                initial_presentation={myScore and myScore.get("presentation", 5.0) or 5.0}
                initial_notes={myScore and myScore.get("notes", "") or ""}
                onSave={lambda data: dict -> None { handleScore(data); }}
                onSubmit={lambda data: dict -> None { handleScore(data); }}
            />
        </div>;
    }
}
