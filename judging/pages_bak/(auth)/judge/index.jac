sv import from ...main { get_assigned_projects, get_config }
cl import from "../../../components/ProjectCard.cl" { ProjectCard }

cl {
    def:pub page() -> JsxElement {
        has projects: list = [];
        has loading: bool = True;
        has error: str = "";
        has scoringLocked: bool = False;

        async can with entry {
            email = localStorage.getItem("jachacks_email") or "";
            try {
                configResult = root spawn get_config();
                if configResult.reports and configResult.reports.length > 0 {
                    scoringLocked = configResult.reports[0].get("scoring_locked", False);
                }

                result = root spawn get_assigned_projects(email=email);
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

        if loading {
            return <div className="text-muted">Loading your projects...</div>;
        }

        name = localStorage.getItem("jachacks_name") or "Judge";
        scored = len([p for p in projects if p.get("status") == "submitted"]);
        total = len(projects);

        return <div>
            <div className="section">
                <h1>Welcome, {name}</h1>
                <p className="text-muted mt-2">
                    {scored} of {total} projects scored
                </p>
            </div>

            {scoringLocked and (
                <div className="lock-banner">
                    Scoring is locked. No new submissions allowed.
                </div>
            )}

            {error and <div className="alert alert-error">{error}</div>}

            {len(projects) == 0 and not error and (
                <div className="card">
                    <p className="text-muted">No projects assigned to you yet. Check back soon.</p>
                </div>
            )}

            <div className="grid grid-2">
                {[<ProjectCard
                    key={p["project_id"]}
                    project={p}
                    linkTo={"/judge/" + p["project_id"]}
                /> for p in projects]}
            </div>
        </div>;
    }
}
