def:pub AwardScoreForm(props: dict) -> JsxElement {
    has scoreVal: float = props.get("initial_score", 5.0);
    has notes: str = props.get("initial_notes", "");
    has saving: bool = False;

    disabled = props.get("disabled", False);
    awardName = props.get("award_name", "");
    projectName = props.get("project_name", "");
    onSave = props.get("onSave", None);
    onSubmit = props.get("onSubmit", None);

    def handleSave() -> None {
        if onSave {
            saving = True;
            onSave({"score": scoreVal, "notes": notes, "is_final": False});
            saving = False;
        }
    }

    def handleSubmit() -> None {
        if onSubmit {
            saving = True;
            onSubmit({"score": scoreVal, "notes": notes, "is_final": True});
            saving = False;
        }
    }

    return <div className="card">
        <div className="card-header">
            <div>
                <h4 className="card-title">{projectName}</h4>
                <span className="chip chip-track mt-2">{awardName}</span>
            </div>
        </div>

        <div className="score-slider-container" style={{"marginTop": "16px"}}>
            <div className="score-slider-header">
                <span className="score-slider-label">Score</span>
                <span className="score-slider-value">{scoreVal.toFixed(1)}</span>
            </div>
            <input
                type="range"
                className="score-slider"
                min="0"
                max="10"
                step="0.5"
                value={scoreVal}
                disabled={disabled}
                onChange={lambda e: any -> None { scoreVal = parseFloat(e.target.value); }}
            />
        </div>

        <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea
                className="form-textarea"
                value={notes}
                disabled={disabled}
                placeholder="Notes about this project for this award..."
                onChange={lambda e: any -> None { notes = e.target.value; }}
            />
        </div>

        {not disabled and (
            <div className="flex gap-3">
                <button
                    className="btn btn-secondary btn-sm"
                    onClick={lambda -> None { handleSave(); }}
                    disabled={saving}
                >
                    Save Draft
                </button>
                <button
                    className="btn btn-primary btn-sm"
                    onClick={lambda -> None {
                        if window.confirm("Submit final score?") {
                            handleSubmit();
                        }
                    }}
                    disabled={saving}
                >
                    Submit Final
                </button>
            </div>
        )}
    </div>;
}
