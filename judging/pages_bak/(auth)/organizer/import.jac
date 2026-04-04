cl import from "@jac/runtime" { Link }
sv import from ...main { import_projects, import_judges, auto_assign_judges, get_all_projects, get_all_judges }
cl import from "../../../components/CSVImport.cl" { CSVImport }
cl import json;

cl {
    def:pub page() -> JsxElement {
        has projects: list = [];
        has judges: list = [];
        has assignResult: str = "";
        has assignError: str = "";
        has loading: bool = True;

        async can with entry {
            try {
                projResult = root spawn get_all_projects();
                if projResult.reports and projResult.reports.length > 0 {
                    data = projResult.reports[0];
                    if isinstance(data, list) {
                        projects = data;
                    }
                }

                judgeResult = root spawn get_all_judges();
                if judgeResult.reports and judgeResult.reports.length > 0 {
                    data = judgeResult.reports[0];
                    if isinstance(data, list) {
                        judges = data;
                    }
                }
            } except Exception as e {
                print(f"Error: {e}");
            }
            loading = False;
        }

        async def handleImportProjects(rows: list) -> int {
            jsonStr = JSON.stringify(rows);
            result = root spawn import_projects(projects_json=jsonStr);
            if result.reports and result.reports.length > 0 {
                data = result.reports[0];
                if data.get("error") {
                    raise Exception(data["error"]);
                }
                # Refresh project list
                projResult = root spawn get_all_projects();
                if projResult.reports and projResult.reports.length > 0 {
                    projData = projResult.reports[0];
                    if isinstance(projData, list) {
                        projects = projData;
                    }
                }
                return data.get("imported", 0);
            }
            return 0;
        }

        async def handleImportJudges(rows: list) -> int {
            jsonStr = JSON.stringify(rows);
            result = root spawn import_judges(judges_json=jsonStr);
            if result.reports and result.reports.length > 0 {
                data = result.reports[0];
                if data.get("error") {
                    raise Exception(data["error"]);
                }
                judgeResult = root spawn get_all_judges();
                if judgeResult.reports and judgeResult.reports.length > 0 {
                    judgeData = judgeResult.reports[0];
                    if isinstance(judgeData, list) {
                        judges = judgeData;
                    }
                }
                return data.get("imported", 0);
            }
            return 0;
        }

        async def handleAutoAssign() -> None {
            assignError = "";
            assignResult = "";
            try {
                result = root spawn auto_assign_judges();
                if result.reports and result.reports.length > 0 {
                    data = result.reports[0];
                    assignResult = f"Auto-assigned {data.get('total_assignments', 0)} project-judge pairs";
                }
            } except Exception as e {
                assignError = f"Auto-assign failed: {e}";
            }
        }

        if loading {
            return <div className="text-muted">Loading...</div>;
        }

        return <div>
            <div className="section-header">
                <h1>Import Data</h1>
                <Link to="/organizer" className="btn btn-secondary">Back to Dashboard</Link>
            </div>

            <div className="grid grid-2 mb-4" style={{"marginTop": "20px"}}>
                <div className="stat-card">
                    <div className="stat-value">{len(projects)}</div>
                    <div className="stat-label">Projects Loaded</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{len(judges)}</div>
                    <div className="stat-label">Judges Registered</div>
                </div>
            </div>

            <div className="grid grid-2" style={{"marginTop": "20px"}}>
                <CSVImport
                    label="Import Projects"
                    columns={["name", "team_name", "track", "github_url", "demo_url", "devpost_url"]}
                    onImport={handleImportProjects}
                />
                <CSVImport
                    label="Import Judges"
                    columns={["name", "email", "role", "assigned_tracks"]}
                    onImport={handleImportJudges}
                />
            </div>

            <div className="section" style={{"marginTop": "24px"}}>
                <div className="card">
                    <div className="flex justify-between items-center">
                        <div>
                            <h4 className="card-title">Auto-Assign Judges</h4>
                            <p className="text-muted text-sm mt-2">
                                Assigns each judge to projects matching their assigned tracks.
                                Judges with no tracks get assigned to all projects.
                            </p>
                        </div>
                        <button className="btn btn-primary" onClick={lambda -> None { handleAutoAssign(); }}>
                            Auto-Assign
                        </button>
                    </div>
                    {assignResult and <div className="alert alert-success mt-4">{assignResult}</div>}
                    {assignError and <div className="alert alert-error mt-4">{assignError}</div>}
                </div>
            </div>
        </div>;
    }
}
