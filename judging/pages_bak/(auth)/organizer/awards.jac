cl import from "@jac/runtime" { Link }
sv import from ...main { get_awards, create_award, set_award_winner, get_all_projects }

cl {
    def:pub page() -> JsxElement {
        has awards: list = [];
        has projects: list = [];
        has loading: bool = True;
        has error: str = "";
        has success: str = "";

        # New award form
        has newName: str = "";
        has newSponsor: str = "";
        has newPrize: str = "";
        has creating: bool = False;

        async can with entry {
            try {
                aResult = root spawn get_awards();
                if aResult.reports and aResult.reports.length > 0 {
                    data = aResult.reports[0];
                    if isinstance(data, list) {
                        awards = data;
                    }
                }
                pResult = root spawn get_all_projects();
                if pResult.reports and pResult.reports.length > 0 {
                    data = pResult.reports[0];
                    if isinstance(data, list) {
                        projects = data;
                    }
                }
            } except Exception as e {
                error = f"Failed to load: {e}";
            }
            loading = False;
        }

        async def handleCreate() -> None {
            if not newName.trim() or not newSponsor.trim() {
                error = "Name and sponsor are required";
                return;
            }
            creating = True;
            error = "";
            try {
                result = root spawn create_award(
                    name=newName,
                    sponsor=newSponsor,
                    prize_description=newPrize
                );
                if result.reports and result.reports.length > 0 {
                    awards = awards + [result.reports[0]];
                    newName = "";
                    newSponsor = "";
                    newPrize = "";
                    success = "Award created!";
                }
            } except Exception as e {
                error = f"Failed to create: {e}";
            }
            creating = False;
        }

        async def handleSetWinner(awardId: str, projectId: str) -> None {
            error = "";
            try {
                result = root spawn set_award_winner(award_id=awardId, project_id=projectId);
                if result.reports and result.reports.length > 0 {
                    data = result.reports[0];
                    if data.get("error") {
                        error = data["error"];
                    } else {
                        awards = [
                            data if a["award_id"] == awardId else a
                            for a in awards
                        ];
                        success = "Winner assigned!";
                    }
                }
            } except Exception as e {
                error = f"Failed: {e}";
            }
        }

        if loading {
            return <div className="text-muted">Loading...</div>;
        }

        # Pre-populate JacHacks awards
        presetAwards = [
            {"name": "Best JAC Builder", "sponsor": "Jaseci Labs", "prize": "$400 cash"},
            {"name": "Best Use of Base44", "sponsor": "Base44", "prize": "Credits"},
            {"name": "Best Claude Code + JAC Dev Tool", "sponsor": "Anthropic", "prize": "$500 Claude credits"},
            {"name": "Best Use of Lovable", "sponsor": "Lovable", "prize": "3 months free"},
            {"name": "Best Use of Insforge", "sponsor": "Insforge", "prize": "Credits + merch"},
            {"name": "Best Use of Backboard", "sponsor": "Backboard", "prize": "1-year subscription"},
            {"name": "Best Startup Idea", "sponsor": "SH1P", "prize": "Fast-track access"},
            {"name": "Content / Viral Track", "sponsor": "JacHacks", "prize": "$100 x4 categories"}
        ];

        return <div>
            <div className="section-header">
                <h1>Special Awards</h1>
                <Link to="/organizer" className="btn btn-secondary">Back to Dashboard</Link>
            </div>

            {error and <div className="alert alert-error">{error}</div>}
            {success and <div className="alert alert-success">{success}</div>}

            {/* Create Award */}
            <div className="card mb-4" style={{"marginTop": "20px"}}>
                <h3 className="card-title mb-4">Create New Award</h3>
                <div className="grid grid-3">
                    <div className="form-group">
                        <label className="form-label">Award Name</label>
                        <input className="form-input" value={newName}
                            onChange={lambda e: any -> None { newName = e.target.value; }}
                            placeholder="Best Use of..." />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Sponsor</label>
                        <input className="form-input" value={newSponsor}
                            onChange={lambda e: any -> None { newSponsor = e.target.value; }}
                            placeholder="Company name" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Prize</label>
                        <input className="form-input" value={newPrize}
                            onChange={lambda e: any -> None { newPrize = e.target.value; }}
                            placeholder="$500, credits, etc." />
                    </div>
                </div>
                <button className="btn btn-primary" onClick={lambda -> None { handleCreate(); }}
                    disabled={creating}>
                    {creating and "Creating..." or "Create Award"}
                </button>

                {len(awards) == 0 and (
                    <div style={{"marginTop": "16px"}}>
                        <p className="text-muted text-sm mb-2">Quick add JacHacks 2026 awards:</p>
                        <div className="flex gap-2" style={{"flexWrap": "wrap"}}>
                            {[<button key={pa["name"]} className="btn btn-secondary btn-sm"
                                onClick={lambda -> None {
                                    newName = pa["name"];
                                    newSponsor = pa["sponsor"];
                                    newPrize = pa["prize"];
                                }}>
                                {pa["name"]}
                            </button> for pa in presetAwards]}
                        </div>
                    </div>
                )}
            </div>

            {/* Existing Awards */}
            <div className="section">
                <h2 className="section-title">Existing Awards ({len(awards)})</h2>
                {[<div key={a["award_id"]} className="card mb-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h4 className="card-title">{a["name"]}</h4>
                            <div className="text-muted text-sm">
                                Sponsor: {a["sponsor"]} | Prize: {a["prize_description"]}
                            </div>
                        </div>
                        <div>
                            {a.get("winner_project_id", "") and (
                                <span className="chip chip-submitted">
                                    Winner set
                                </span>
                            ) or (
                                <select className="form-select" style={{"width": "200px"}}
                                    onChange={lambda e: any -> None {
                                        if e.target.value {
                                            handleSetWinner(a["award_id"], e.target.value);
                                        }
                                    }}>
                                    <option value="">Select winner...</option>
                                    {[<option key={p["project_id"]} value={p["project_id"]}>
                                        {p["name"]}
                                    </option> for p in projects]}
                                </select>
                            )}
                        </div>
                    </div>
                </div> for a in awards]}
            </div>
        </div>;
    }
}
