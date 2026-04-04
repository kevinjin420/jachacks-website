import from "@jac/runtime" { Link, jacLogout, jacIsLoggedIn, useNavigate }

def:pub Navbar(props: dict) -> JsxElement {
    navigate = useNavigate();
    isLoggedIn = jacIsLoggedIn();
    role = props.get("role", "");
    email = props.get("email", "");

    def handleLogout() -> None {
        jacLogout();
        navigate("/login");
    }

    roleLabel = "";
    if role == "judge" {
        roleLabel = "Judge";
    } elif role == "organizer" {
        roleLabel = "Organizer";
    } elif role == "sponsor_rep" {
        roleLabel = "Sponsor Rep";
    } elif role == "participant" {
        roleLabel = "Hacker";
    }

    return <nav className="navbar">
        <div className="navbar-brand">
            <span className="accent">JAC</span>HACKS
            <span style={{"fontSize": "12px", "color": "#666", "marginLeft": "4px"}}>JUDGING</span>
        </div>
        <div className="navbar-links">
            {isLoggedIn and role == "judge" and (
                <Link to="/judge">My Projects</Link>
            )}
            {isLoggedIn and role == "organizer" and (<>
                <Link to="/organizer">Dashboard</Link>
                <Link to="/organizer/import">Import</Link>
                <Link to="/organizer/awards">Awards</Link>
                <Link to="/organizer/results">Results</Link>
            </>)}
            {isLoggedIn and role == "sponsor_rep" and (
                <Link to="/sponsor">Score Projects</Link>
            )}
            {isLoggedIn and role == "participant" and (
                <Link to="/submit">My Submission</Link>
            )}
            {isLoggedIn and roleLabel and (
                <span className="nav-role-badge">{roleLabel}</span>
            )}
            {isLoggedIn and (
                <button onClick={lambda -> None { handleLogout(); }}>Logout</button>
            )}
        </div>
    </nav>;
}
