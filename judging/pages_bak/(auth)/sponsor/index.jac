sv import from ...main { get_award_projects, save_award_score }
cl import from "../../../components/AwardScoreForm.cl" { AwardScoreForm }

cl {
    def:pub page() -> JsxElement {
        has projects: list = [];
        has loading: bool = True;
        has error: str = "";
        has success: str = "";

        email = localStorage.getItem("jachacks_email") or "";

        async can with entry {
            try {
                result = root spawn get_award_projects(email=email);
                if result.reports and result.reports.length > 0 {
                    data = result.reports[0];
                    if isinstance(data, list) {
                        projects = data;
                    } elif data.get("error") {
                        error = data["error"];
                    }
                }
            } except Exception as e {
                error = f"Failed to load projects: {e}";
            }
            loading = False;
        }

        async def handleScore(projectId: str, awardId: str, scoreData: dict) -> None {
            error = "";
            success = "";
            try {
                result = root spawn save_award_score(
                    email=email,
                    award_id=awardId,
                    project_id=projectId,
                    score=scoreData["score"],
                    notes=scoreData.get("notes", ""),
                    is_final=scoreData.get("is_final", False)
                );
                if result.reports and result.reports.length > 0 {
                    data = result.reports[0];
                    if data.get("error") {
                        error = data["error"];
                    } else {
                        if scoreData.get("is_final") {
                            success = "Score submitted!";
                        } else {
                            success = "Draft saved!";
                        }
                        # Refresh
                        refreshResult = root spawn get_award_projects(email=email);
                        if refreshResult.reports and refreshResult.reports.length > 0 {
                            refreshData = refreshResult.reports[0];
                            if isinstance(refreshData, list) {
                                projects = refreshData;
                            }
                        }
                    }
                }
            } except Exception as e {
                error = f"Failed to save: {e}";
            }
        }

        if loading {
            return <div className="text-muted">Loading projects...</div>;
        }

        name = localStorage.getItem("jachacks_name") or "Sponsor Rep";
        awardName = "";
        if len(projects) > 0 {
            awardName = projects[0].get("award_name", "");
        }
        scored = len([p for p in projects if p.get("status") == "submitted"]);

        return <div>
            <div className="section">
                <h1>Welcome, {name}</h1>
                {awardName and (
                    <div className="flex items-center gap-3 mt-2">
                        <span className="chip chip-track">{awardName}</span>
                        <span className="text-muted">{scored} of {len(projects)} scored</span>
                    </div>
                )}
            </div>

            {error and <div className="alert alert-error">{error}</div>}
            {success and <div className="alert alert-success">{success}</div>}

            {len(projects) == 0 and not error and (
                <div className="card">
                    <p className="text-muted">No award assigned or no projects available.</p>
                </div>
            )}

            <div className="grid grid-2">
                {[<AwardScoreForm
                    key={p["project_id"]}
                    project_name={p.get("name", "")}
                    award_name={p.get("award_name", "")}
                    initial_score={p.get("my_score") != None and p["my_score"] or 5.0}
                    initial_notes={p.get("my_notes", "")}
                    disabled={p.get("is_final", False)}
                    onSave={lambda data: dict -> None { handleScore(p["project_id"], p["award_id"], data); }}
                    onSubmit={lambda data: dict -> None { handleScore(p["project_id"], p["award_id"], data); }}
                /> for p in projects]}
            </div>
        </div>;
    }
}
