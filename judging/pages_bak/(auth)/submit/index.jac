cl import from "@jac/runtime" { useNavigate }
sv import from ...main { get_my_project, submit_project, edit_project }

cl {
    def:pub page() -> JsxElement {
        has projectName: str = "";
        has teamName: str = "";
        has track: str = "";
        has githubUrl: str = "";
        has demoUrl: str = "";
        has devpostUrl: str = "";
        has description: str = "";
        has loading: bool = True;
        has saving: bool = False;
        has error: str = "";
        has success: str = "";
        has existingProject: dict = {};
        has isEdit: bool = False;

        email = localStorage.getItem("jachacks_email") or "";
        navigate = useNavigate();

        async can with entry {
            try {
                result = root spawn get_my_project(email=email);
                if result.reports and result.reports.length > 0 {
                    data = result.reports[0];
                    if not data.get("not_found") and not data.get("error") {
                        existingProject = data;
                        isEdit = True;
                        projectName = data.get("name", "");
                        teamName = data.get("team_name", "");
                        track = data.get("track", "");
                        githubUrl = data.get("github_url", "");
                        demoUrl = data.get("demo_url", "");
                        devpostUrl = data.get("devpost_url", "");
                        description = data.get("description", "");
                    }
                }
            } except Exception as e {
                print(f"Error: {e}");
            }
            loading = False;
        }

        async def handleSubmit(e: any) -> None {
            e.preventDefault();
            error = "";
            success = "";
            saving = True;

            try {
                if isEdit {
                    result = root spawn edit_project(
                        email=email,
                        project_id=existingProject["project_id"],
                        name=projectName,
                        team_name=teamName,
                        track=track,
                        github_url=githubUrl,
                        demo_url=demoUrl,
                        devpost_url=devpostUrl,
                        description=description
                    );
                } else {
                    result = root spawn submit_project(
                        email=email,
                        name=projectName,
                        team_name=teamName,
                        track=track,
                        github_url=githubUrl,
                        demo_url=demoUrl,
                        devpost_url=devpostUrl,
                        description=description
                    );
                }
                if result.reports and result.reports.length > 0 {
                    data = result.reports[0];
                    if data.get("error") {
                        error = data["error"];
                    } else {
                        existingProject = data;
                        isEdit = True;
                        success = isEdit and "Project updated!" or "Project submitted!";
                    }
                }
            } except Exception as e {
                error = f"Failed: {e}";
            }
            saving = False;
        }

        if loading {
            return <div className="text-muted">Loading...</div>;
        }

        return <div style={{"maxWidth": "640px", "margin": "0 auto"}}>
            <h1>{isEdit and "Edit Your Submission" or "Submit Your Project"}</h1>
            <p className="text-muted mt-2 mb-4">
                {isEdit and "Update your project details below." or "One submission per team. Fill in your project details."}
            </p>

            {error and <div className="alert alert-error">{error}</div>}
            {success and <div className="alert alert-success">{success}</div>}

            <form onSubmit={handleSubmit}>
                <div className="card" style={{"marginBottom": "20px"}}>
                    <div className="form-group">
                        <label className="form-label">Project Name *</label>
                        <input className="form-input" value={projectName}
                            onChange={lambda e: any -> None { projectName = e.target.value; }}
                            placeholder="My Awesome AI Project" required={True} />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Team Name *</label>
                        <input className="form-input" value={teamName}
                            onChange={lambda e: any -> None { teamName = e.target.value; }}
                            placeholder="Team Rocket" required={True}
                            disabled={isEdit} />
                        {isEdit and <p className="text-muted text-sm mt-2">Team name cannot be changed after submission.</p>}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Track *</label>
                        <select className="form-select" value={track}
                            onChange={lambda e: any -> None { track = e.target.value; }}
                            required={True}>
                            <option value="">Select a track...</option>
                            <option value="agentic_ai">Agentic AI</option>
                            <option value="fintech_open">Fintech / Open</option>
                            <option value="social_impact">Social Impact</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea className="form-textarea" value={description}
                            onChange={lambda e: any -> None { description = e.target.value; }}
                            placeholder="What does your project do? What problem does it solve?"
                            style={{"minHeight": "100px"}} />
                    </div>
                </div>

                <div className="card" style={{"marginBottom": "20px"}}>
                    <h4 className="card-title mb-4">Links</h4>

                    <div className="form-group">
                        <label className="form-label">GitHub Repository</label>
                        <input className="form-input" value={githubUrl}
                            onChange={lambda e: any -> None { githubUrl = e.target.value; }}
                            placeholder="https://github.com/team/project" />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Live Demo URL</label>
                        <input className="form-input" value={demoUrl}
                            onChange={lambda e: any -> None { demoUrl = e.target.value; }}
                            placeholder="https://your-demo.vercel.app" />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Devpost URL</label>
                        <input className="form-input" value={devpostUrl}
                            onChange={lambda e: any -> None { devpostUrl = e.target.value; }}
                            placeholder="https://devpost.com/software/project" />
                    </div>
                </div>

                <button type="submit" className="btn btn-primary btn-lg w-full"
                    disabled={saving}>
                    {saving and "Saving..." or (isEdit and "Update Project" or "Submit Project")}
                </button>
            </form>
        </div>;
    }
}
