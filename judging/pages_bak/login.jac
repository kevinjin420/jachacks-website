cl import from "@jac/runtime" { jacLogin, jacSignup, useNavigate, jacIsLoggedIn }
sv import from ..main { get_profile, register_participant }

cl {
    def:pub page() -> JsxElement {
        has email: str = "";
        has password: str = "";
        has displayName: str = "";
        has error: str = "";
        has loading: bool = False;
        has isSignup: bool = False;

        navigate = useNavigate();

        can with entry {
            if jacIsLoggedIn() {
                role = localStorage.getItem("jachacks_role");
                if role {
                    if role == "judge" { navigate("/judge"); }
                    elif role == "organizer" { navigate("/organizer"); }
                    elif role == "sponsor_rep" { navigate("/sponsor"); }
                    elif role == "participant" { navigate("/submit"); }
                }
            }
        }

        def redirectByRole(role: str) -> None {
            if role == "judge" { navigate("/judge"); }
            elif role == "organizer" { navigate("/organizer"); }
            elif role == "sponsor_rep" { navigate("/sponsor"); }
            elif role == "participant" { navigate("/submit"); }
            else { navigate("/submit"); }
        }

        async def handleSubmit(e: any) -> None {
            e.preventDefault();
            error = "";

            if not email.trim() or not password {
                error = "Please fill in all fields";
                return;
            }

            if isSignup and not displayName.trim() {
                error = "Please enter your name";
                return;
            }

            loading = True;

            if isSignup {
                result = await jacSignup(email, password);
                if not result["success"] {
                    error = result.get("error", "Signup failed");
                    loading = False;
                    return;
                }
                # Auto-create participant profile on signup
                try {
                    regResult = root spawn register_participant(
                        email=email,
                        name=displayName.trim()
                    );
                    if regResult.reports and regResult.reports.length > 0 {
                        profile = regResult.reports[0];
                        role = profile.get("role", "participant");
                        localStorage.setItem("jachacks_role", role);
                        localStorage.setItem("jachacks_email", email);
                        localStorage.setItem("jachacks_user_id", profile.get("user_id", ""));
                        localStorage.setItem("jachacks_name", profile.get("name", ""));
                        loading = False;
                        redirectByRole(role);
                        return;
                    }
                } except Exception as e {
                    error = f"Profile creation failed: {e}";
                    loading = False;
                    return;
                }
            } else {
                success = await jacLogin(email, password);
                if not success {
                    error = "Invalid credentials";
                    loading = False;
                    return;
                }
            }

            # Fetch profile to determine role
            try {
                profileResult = root spawn get_profile(email=email);
                if profileResult.reports and profileResult.reports.length > 0 {
                    profile = profileResult.reports[0];
                    if profile.get("error") {
                        # No profile yet — might be an old account, create participant profile
                        regResult = root spawn register_participant(
                            email=email,
                            name=email.split("@")[0]
                        );
                        if regResult.reports and regResult.reports.length > 0 {
                            profile = regResult.reports[0];
                        } else {
                            error = "Could not create profile";
                            loading = False;
                            return;
                        }
                    }
                    role = profile.get("role", "participant");
                    localStorage.setItem("jachacks_role", role);
                    localStorage.setItem("jachacks_email", email);
                    localStorage.setItem("jachacks_user_id", profile.get("user_id", ""));
                    localStorage.setItem("jachacks_name", profile.get("name", ""));
                    loading = False;
                    redirectByRole(role);
                    return;
                } else {
                    error = "Could not load profile";
                }
            } except Exception as e {
                error = f"Login error: {e}";
            }
            loading = False;
        }

        return <div className="login-container">
            <div className="login-card">
                <div className="login-title">
                    <span style={{"color": "var(--accent)"}}>JAC</span>HACKS
                </div>
                <div className="login-subtitle">Judging & Submissions Platform</div>

                <form onSubmit={handleSubmit}>
                    {error and <div className="alert alert-error">{error}</div>}

                    {isSignup and (
                        <div className="form-group">
                            <label className="form-label">Your Name</label>
                            <input
                                type="text"
                                className="form-input"
                                value={displayName}
                                onChange={lambda e: any -> None { displayName = e.target.value; }}
                                placeholder="Jane Doe"
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                            type="text"
                            className="form-input"
                            value={email}
                            onChange={lambda e: any -> None { email = e.target.value; }}
                            placeholder="you@umich.edu"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            type="password"
                            className="form-input"
                            value={password}
                            onChange={lambda e: any -> None { password = e.target.value; }}
                            placeholder="Password"
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg w-full"
                        disabled={loading}
                    >
                        {loading and "Loading..." or (isSignup and "Sign Up as Hacker" or "Login")}
                    </button>

                    <div style={{"textAlign": "center", "marginTop": "16px"}}>
                        <button
                            type="button"
                            className="text-sm"
                            style={{"background": "none", "border": "none", "color": "var(--accent)", "cursor": "pointer"}}
                            onClick={lambda -> None { isSignup = not isSignup; error = ""; }}
                        >
                            {isSignup and "Already have an account? Login" or "New hacker? Sign up here"}
                        </button>
                    </div>
                </form>
            </div>
        </div>;
    }
}
