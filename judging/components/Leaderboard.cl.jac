def:pub Leaderboard(props: dict) -> JsxElement {
    data = props.get("data", []);

    if len(data) == 0 {
        return <div className="card">
            <p className="text-muted">No scores submitted yet.</p>
        </div>;
    }

    return <div>
        {[<div key={trackData["track"]} className="section">
            <h3 className="section-title" style={{"marginBottom": "12px"}}>
                {trackData["track"].replace("_", " ").upper()}
            </h3>
            {[<div key={r["project_id"]} className="tie-alert">
                TIE ALERT: Top projects within 0.3 points in {trackData["track"].replace("_", " ")}
            </div> for r in trackData.get("rankings", []) if r.get("tie_alert", False) and r.get("rank", 0) == 1]}
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Project</th>
                            <th>Team</th>
                            <th>Score</th>
                            <th>Judges</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[<tr key={r["project_id"]}>
                            <td>
                                <span className={
                                    "leaderboard-rank" +
                                    (r["rank"] == 1 and " rank-1" or "") +
                                    (r["rank"] == 2 and " rank-2" or "") +
                                    (r["rank"] == 3 and " rank-3" or "")
                                }>
                                    {"#" + str(r["rank"])}
                                </span>
                            </td>
                            <td style={{"fontWeight": "600"}}>
                                {r["name"]}
                                {r.get("tie_alert", False) and (
                                    <span style={{"color": "var(--error)", "marginLeft": "8px", "fontSize": "11px"}}>TIE</span>
                                )}
                            </td>
                            <td className="text-muted">{r["team_name"]}</td>
                            <td className="font-mono text-accent" style={{"fontWeight": "700"}}>
                                {r["avg_score"].toFixed(2)}
                            </td>
                            <td className="font-mono text-muted">{r["num_judges"]}</td>
                        </tr> for r in trackData.get("rankings", [])]}
                    </tbody>
                </table>
            </div>
        </div> for trackData in data]}
    </div>;
}
