cl import from "@jac/runtime" { Link }
sv import from ...main { export_results }

cl {
    def:pub page() -> JsxElement {
        has results: dict = {};
        has loading: bool = True;
        has error: str = "";
        has activeTrack: str = "";

        async can with entry {
            try {
                result = root spawn export_results();
                if result.reports and result.reports.length > 0 {
                    results = result.reports[0];
                }
            } except Exception as e {
                error = f"Failed to load results: {e}";
            }
            loading = False;
        }

        def exportJSON() -> None {
            blob = Blob([JSON.stringify(results, None, 2)], {"type": "application/json"});
            url = URL.createObjectURL(blob);
            a = document.createElement("a");
            a.href = url;
            a.download = "jachacks_results.json";
            a.click();
            URL.revokeObjectURL(url);
        }

        def exportCSV() -> None {
            tracks = results.get("tracks", []);
            lines = ["Track,Rank,Project,Team,Score,Prize,Judges"];
            for t in tracks {
                for w in t.get("winners", []) {
                    lines.append(
                        f"{t['track']},{w['rank']},{w['project']},{w['team']},{w['score']},{w.get('prize', '')},{w['num_judges']}"
                    );
                }
            }
            csv = "\n".join(lines);
            blob = Blob([csv], {"type": "text/csv"});
            url = URL.createObjectURL(blob);
            a = document.createElement("a");
            a.href = url;
            a.download = "jachacks_results.csv";
            a.click();
            URL.revokeObjectURL(url);
        }

        if loading {
            return <div className="text-muted">Loading results...</div>;
        }

        tracks = results.get("tracks", []);
        specialAwards = results.get("special_awards", []);

        return <div>
            <div className="section-header">
                <h1>Results & Export</h1>
                <div className="flex gap-3">
                    <button className="btn btn-secondary" onClick={lambda -> None { exportCSV(); }}>
                        Export CSV
                    </button>
                    <button className="btn btn-primary" onClick={lambda -> None { exportJSON(); }}>
                        Export JSON
                    </button>
                    <Link to="/organizer" className="btn btn-secondary">Back</Link>
                </div>
            </div>

            {error and <div className="alert alert-error">{error}</div>}

            {/* Track tabs */}
            <div className="tabs" style={{"marginTop": "20px"}}>
                <button className={"tab" + (activeTrack == "" and " active" or "")}
                    onClick={lambda -> None { activeTrack = ""; }}>
                    All Tracks
                </button>
                {[<button key={t["track"]} className={"tab" + (activeTrack == t["track"] and " active" or "")}
                    onClick={lambda -> None { activeTrack = t["track"]; }}>
                    {t["track"].replace("_", " ").upper()}
                </button> for t in tracks]}
            </div>

            {/* Results per track */}
            {[<div key={t["track"]} className="section"
                style={{"display": (activeTrack == "" or activeTrack == t["track"]) and "block" or "none"}}>
                <h2 className="section-title mb-4">
                    {t["track"].replace("_", " ").upper()}
                </h2>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Rank</th>
                                <th>Project</th>
                                <th>Team</th>
                                <th>Score</th>
                                <th>Prize</th>
                                <th>Judges</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[<tr key={str(w["rank"])}>
                                <td>
                                    <span className={
                                        "leaderboard-rank" +
                                        (w["rank"] == 1 and " rank-1" or "") +
                                        (w["rank"] == 2 and " rank-2" or "") +
                                        (w["rank"] == 3 and " rank-3" or "")
                                    }>
                                        {"#" + str(w["rank"])}
                                    </span>
                                </td>
                                <td style={{"fontWeight": "600"}}>{w["project"]}</td>
                                <td className="text-muted">{w["team"]}</td>
                                <td className="font-mono text-accent" style={{"fontWeight": "700"}}>
                                    {w["score"].toFixed(2)}
                                </td>
                                <td>
                                    {w.get("prize", "") and (
                                        <span className="chip chip-submitted">{w["prize"]}</span>
                                    )}
                                </td>
                                <td className="font-mono text-muted">{w["num_judges"]}</td>
                            </tr> for w in t.get("winners", [])]}
                        </tbody>
                    </table>
                </div>
            </div> for t in tracks]}

            {/* Special Awards */}
            {len(specialAwards) > 0 and (
                <div className="section">
                    <h2 className="section-title mb-4">Special Awards</h2>
                    <div className="grid grid-2">
                        {[<div key={a["award"]} className="card">
                            <h4 className="card-title">{a["award"]}</h4>
                            <div className="text-muted text-sm">
                                Sponsor: {a["sponsor"]} | Prize: {a["prize"]}
                            </div>
                            <div style={{"marginTop": "8px"}}>
                                {a.get("winner_project", "") and (
                                    <span style={{"color": "var(--success)", "fontWeight": "600"}}>
                                        Winner: {a["winner_project"]}
                                    </span>
                                ) or (
                                    <span className="text-muted">No winner assigned</span>
                                )}
                            </div>
                        </div> for a in specialAwards]}
                    </div>
                </div>
            )}
        </div>;
    }
}
