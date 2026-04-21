cl import from "@jac/runtime" { useNavigate, jacIsLoggedIn }

cl {
    def:pub page() -> JsxElement {
        navigate = useNavigate();

        can with entry {
            if jacIsLoggedIn() {
                role = localStorage.getItem("jachacks_role");
                if role == "judge" {
                    navigate("/judge");
                } elif role == "organizer" {
                    navigate("/organizer");
                } elif role == "sponsor_rep" {
                    navigate("/sponsor");
                } elif role == "participant" {
                    navigate("/submit");
                } else {
                    navigate("/login");
                }
            } else {
                navigate("/login");
            }
        }

        return <div className="login-container">
            <p className="text-muted">Redirecting...</p>
        </div>;
    }
}
