def:pub ProgressBar(props: dict) -> JsxElement {
    data = props.get("data", {});
    judges = data.get("judges", []);
    totalProjects = data.get("total_projects", 0);

    if len(judges) == 0 {
        return <div className="card">
            <p className="text-muted">No judges registered yet.</p>
        </div>;
    }

    return <div className="table-container">
        <table>
            <thead>
                <tr>
                    <th>Judge</th>
                    <th>Assigned</th>
                    <th>Scored</th>
                    <th>Submitted</th>
                    <th>Progress</th>
                </tr>
            </thead>
            <tbody>
                {[<tr key={j["judge_email"]}>
                    <td>
                        <div style={{"fontWeight": "600"}}>{j["judge_name"]}</div>
                        <div className="text-muted text-sm">{j["judge_email"]}</div>
                    </td>
                    <td className="font-mono">{j["assigned"]}</td>
                    <td className="font-mono">{j["scored"]}</td>
                    <td className="font-mono">{j["submitted"]}</td>
                    <td style={{"minWidth": "120px"}}>
                        <div className="progress-bar-container">
                            <div
                                className={"progress-bar-fill" + (j["remaining"] == 0 and j["assigned"] > 0 and " complete" or "")}
                                style={{"width": (j["assigned"] > 0 and str(int(j["submitted"] / j["assigned"] * 100)) + "%" or "0%")}}
                            />
                        </div>
                        <div className="text-muted text-sm font-mono mt-2">
                            {j["remaining"]} remaining
                        </div>
                    </td>
                </tr> for j in judges]}
            </tbody>
        </table>
    </div>;
}
