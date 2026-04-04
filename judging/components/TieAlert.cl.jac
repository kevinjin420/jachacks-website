def:pub TieAlert(props: dict) -> JsxElement {
    data = props.get("data", []);

    ties = [];
    for trackData in data {
        rankings = trackData.get("rankings", []);
        hasTie = False;
        for r in rankings {
            if r.get("tie_alert", False) {
                hasTie = True;
            }
        }
        if hasTie {
            ties.append(trackData["track"]);
        }
    }

    if len(ties) == 0 {
        return <></>;
    }

    return <div>
        {[<div key={t} className="tie-alert">
            <span style={{"fontSize": "18px"}}>!</span>
            TIE ALERT in {t.replace("_", " ").upper()} track - top projects within 0.3 points. Consider tiebreaker.
        </div> for t in ties]}
    </div>;
}
