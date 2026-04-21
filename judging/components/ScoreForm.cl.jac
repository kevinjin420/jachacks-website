def:pub ScoreForm(props: dict) -> JsxElement {
    has technical: float = props.get("initial_technical", 5.0);
    has jacUsage: float = props.get("initial_jac_usage", 5.0);
    has creativity: float = props.get("initial_creativity", 5.0);
    has impact: float = props.get("initial_impact", 5.0);
    has presentation: float = props.get("initial_presentation", 5.0);
    has notes: str = props.get("initial_notes", "");
    has saving: bool = False;

    disabled = props.get("disabled", False);
    onSave = props.get("onSave", None);
    onSubmit = props.get("onSubmit", None);

    weighted = (
        technical * 0.30 +
        jacUsage * 0.25 +
        creativity * 0.20 +
        impact * 0.15 +
        presentation * 0.10
    );

    def handleSave() -> None {
        if onSave {
            saving = True;
            onSave({
                "technical_execution": technical,
                "jac_usage": jacUsage,
                "creativity": creativity,
                "impact": impact,
                "presentation": presentation,
                "notes": notes,
                "is_final": False
            });
            saving = False;
        }
    }

    def handleSubmit() -> None {
        if onSubmit {
            saving = True;
            onSubmit({
                "technical_execution": technical,
                "jac_usage": jacUsage,
                "creativity": creativity,
                "impact": impact,
                "presentation": presentation,
                "notes": notes,
                "is_final": True
            });
            saving = False;
        }
    }

    sliders = [
        {"label": "Technical Execution", "value": technical, "weight": "30%",
         "setter": lambda v: any -> None { technical = parseFloat(v); }},
        {"label": "JAC Usage", "value": jacUsage, "weight": "25%",
         "setter": lambda v: any -> None { jacUsage = parseFloat(v); }},
        {"label": "Creativity", "value": creativity, "weight": "20%",
         "setter": lambda v: any -> None { creativity = parseFloat(v); }},
        {"label": "Impact", "value": impact, "weight": "15%",
         "setter": lambda v: any -> None { impact = parseFloat(v); }},
        {"label": "Presentation", "value": presentation, "weight": "10%",
         "setter": lambda v: any -> None { presentation = parseFloat(v); }}
    ];

    return <div>
        {[<div className="score-slider-container" key={s["label"]}>
            <div className="score-slider-header">
                <div>
                    <span className="score-slider-label">{s["label"]}</span>
                    <span className="score-slider-weight"> ({s["weight"]})</span>
                </div>
                <span className="score-slider-value">{s["value"].toFixed(1)}</span>
            </div>
            <input
                type="range"
                className="score-slider"
                min="0"
                max="10"
                step="0.5"
                value={s["value"]}
                disabled={disabled}
                onChange={lambda e: any -> None { s["setter"](e.target.value); }}
            />
        </div> for s in sliders]}

        <div className="card" style={{"marginTop": "16px", "marginBottom": "16px", "textAlign": "center"}}>
            <div className="text-muted text-sm">WEIGHTED SCORE</div>
            <div className="score-slider-value" style={{"fontSize": "32px"}}>{weighted.toFixed(2)}</div>
        </div>

        <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea
                className="form-textarea"
                value={notes}
                disabled={disabled}
                placeholder="Optional notes about this project..."
                onChange={lambda e: any -> None { notes = e.target.value; }}
            />
        </div>

        {not disabled and (
            <div className="flex gap-3" style={{"marginTop": "20px"}}>
                <button
                    className="btn btn-secondary"
                    onClick={lambda -> None { handleSave(); }}
                    disabled={saving}
                    style={{"flex": "1"}}
                >
                    {saving and "Saving..." or "Save Draft"}
                </button>
                <button
                    className="btn btn-primary"
                    onClick={lambda -> None {
                        if window.confirm("Submit final score? This cannot be changed.") {
                            handleSubmit();
                        }
                    }}
                    disabled={saving}
                    style={{"flex": "1"}}
                >
                    Submit Final
                </button>
            </div>
        )}
    </div>;
}
