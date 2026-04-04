cl import from "@jac/runtime" { Link }
cl import from react { useEffect }
sv import from ...main { get_leaderboard, get_progress, get_config, lock_scoring }
cl import from "../../../components/Leaderboard.cl" { Leaderboard }
cl import from "../../../components/ProgressBar.cl" { ProgressBar }
cl import from "../../../components/TieAlert.cl" { TieAlert }

cl {
    def:pub page() -> JsxElement {
        has leaderboardData: list = [];
        has progressData: dict = {};
        has config: dict = {};
        has loading: bool = True;
        has error: str = "";

        async def fetchData() -> None {
            try {
                lbResult = root spawn get_leaderboard();
                if lbResult.reports and lbResult.reports.length > 0 {
                    leaderboardData = lbResult.reports[0];
                }

                progResult = root spawn get_progress();
                if progResult.reports and progResult.reports.length > 0 {
                    progressData = progResult.reports[0];
                }

                cfgResult = root spawn get_config();
                if cfgResult.reports and cfgResult.reports.length > 0 {
                    config = cfgResult.reports[0];
                }
            } except Exception as e {
                error = f"Failed to load dashboard: {e}";
            }
            loading = False;
        }

        async can with entry {
            await fetchData();
        }

        # Poll every 5 seconds
        useEffect(lambda -> None {
            interval = setInterval(lambda -> None { fetchData(); }, 5000);
            return lambda -> None { clearInterval(interval); };
        }, []);

        async def toggleLock() -> None {
            newLocked = not config.get("scoring_locked", False);
            result = root spawn lock_scoring(locked=newLocked);
            if result.reports and result.reports.length > 0 {
                config = {**config, "scoring_locked": result.reports[0].get("scoring_locked", False)};
            }
        }

        if loading {
            return <div className="text-muted">Loading dashboard...</div>;
        }

        scoringLocked = config.get("scoring_locked", False);
        totalProjects = progressData.get("total_projects", 0);
        totalJudges = progressData.get("total_judges", 0);
        judges = progressData.get("judges", []);
        totalSubmitted = sum([j.get("submitted", 0) for j in judges]);
        totalAssigned = sum([j.get("assigned", 0) for j in judges]);

        return <div>
            <div className="section-header">
                <h1>Mission Control</h1>
                <div className="flex gap-3">
                    <Link to="/organizer/import" className="btn btn-secondary">Import Data</Link>
                    <Link to="/organizer/results" className="btn btn-primary">View Results</Link>
                </div>
            </div>

            {error and <div className="alert alert-error">{error}</div>}

            {/* Stats Row */}
            <div className="grid grid-4 mb-4" style={{"marginTop": "20px"}}>
                <div className="stat-card">
                    <div className="stat-value">{totalProjects}</div>
                    <div className="stat-label">Projects</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{totalJudges}</div>
                    <div className="stat-label">Judges</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{totalSubmitted}/{totalAssigned}</div>
                    <div className="stat-label">Scores Submitted</div>
                </div>
                <div className="stat-card">
                    <div className="toggle-container" style={{"justifyContent": "center"}}>
                        <div
                            className={"toggle" + (scoringLocked and " active" or "")}
                            onClick={lambda -> None { toggleLock(); }}
                        />
                        <span style={{"fontSize": "12px", "color": scoringLocked and "var(--error)" or "var(--text-muted)"}}>
                            {scoringLocked and "LOCKED" or "UNLOCKED"}
                        </span>
                    </div>
                    <div className="stat-label">Scoring Lock</div>
                </div>
            </div>

            {/* Tie Alerts */}
            <TieAlert data={leaderboardData} />

            {/* Leaderboard */}
            <div className="section">
                <h2 className="section-title">Leaderboard</h2>
                <Leaderboard data={leaderboardData} />
            </div>

            {/* Judge Progress */}
            <div className="section">
                <h2 className="section-title">Judge Progress</h2>
                <div className="card">
                    <ProgressBar data={progressData} />
                </div>
            </div>
        </div>;
    }
}
