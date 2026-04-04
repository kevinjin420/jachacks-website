import from "@jac/runtime" { Link }

def:pub ProjectCard(props: dict) -> JsxElement {
    project = props.get("project", {});
    linkTo = props.get("linkTo", "");
    status = project.get("status", "not_started");

    chipClass = "chip chip-not-started";
    if status == "in_progress" {
        chipClass = "chip chip-in-progress";
    } elif status == "submitted" {
        chipClass = "chip chip-submitted";
    }

    trackDisplay = project.get("track", "").replace("_", " ").upper();

    content = <div className="card" style={{"cursor": "pointer"}}>
        <div className="card-header">
            <h4 className="card-title">{project.get("name", "Untitled")}</h4>
            <span className={chipClass}>{status.replace("_", " ")}</span>
        </div>
        <div className="flex items-center gap-2 mb-2">
            <span className="chip chip-track">{trackDisplay}</span>
            <span className="text-muted text-sm">{project.get("team_name", "")}</span>
        </div>
        {project.get("description", "") and (
            <p className="text-sm text-muted" style={{"marginTop": "8px"}}>{project["description"]}</p>
        )}
        <div className="flex gap-3 mt-2">
            {project.get("github_url", "") and (
                <a href={project["github_url"]} target="_blank" className="text-sm">GitHub</a>
            )}
            {project.get("demo_url", "") and (
                <a href={project["demo_url"]} target="_blank" className="text-sm">Demo</a>
            )}
            {project.get("devpost_url", "") and (
                <a href={project["devpost_url"]} target="_blank" className="text-sm">Devpost</a>
            )}
        </div>
    </div>;

    if linkTo {
        return <Link to={linkTo} style={{"textDecoration": "none", "color": "inherit"}}>
            {content}
        </Link>;
    }
    return content;
}
