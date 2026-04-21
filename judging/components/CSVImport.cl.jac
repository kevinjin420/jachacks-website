def:pub CSVImport(props: dict) -> JsxElement {
    has fileContent: str = "";
    has parsed: list = [];
    has error: str = "";
    has importing: bool = False;
    has result: str = "";

    label = props.get("label", "Upload CSV");
    onImport = props.get("onImport", None);
    columns = props.get("columns", []);

    def handleFileChange(e: any) -> None {
        file = e.target.files[0];
        if not file {
            return;
        }
        error = "";
        result = "";
        reader = FileReader();
        reader.onload = lambda evt: any -> None {
            text = evt.target.result;
            fileContent = text;
            lines = text.strip().split("\n");
            if len(lines) < 2 {
                error = "CSV must have at least a header and one data row";
                return;
            }
            headers = [h.strip().strip("\"") for h in lines[0].split(",")];
            rows = [];
            for line in lines[1:] {
                if not line.strip() {
                    continue;
                }
                values = [v.strip().strip("\"") for v in line.split(",")];
                row = {};
                for (i, h) in enumerate(headers) {
                    if i < len(values) {
                        row[h] = values[i];
                    } else {
                        row[h] = "";
                    }
                }
                rows.append(row);
            }
            parsed = rows;
        };
        reader.readAsText(file);
    }

    async def handleImport() -> None {
        if not onImport or len(parsed) == 0 {
            return;
        }
        importing = True;
        error = "";
        try {
            res = await onImport(parsed);
            result = f"Successfully imported {res} items";
            parsed = [];
            fileContent = "";
        } except Exception as e {
            error = f"Import failed: {e}";
        }
        importing = False;
    }

    return <div className="card">
        <h4 className="card-title mb-4">{label}</h4>

        {error and <div className="alert alert-error">{error}</div>}
        {result and <div className="alert alert-success">{result}</div>}

        {len(parsed) == 0 and (
            <div className="dropzone">
                <input
                    type="file"
                    accept=".csv"
                    onChange={lambda e: any -> None { handleFileChange(e); }}
                    style={{"display": "none"}}
                    id={"csv-" + label}
                />
                <label htmlFor={"csv-" + label} style={{"cursor": "pointer"}}>
                    <div style={{"fontSize": "28px", "marginBottom": "8px"}}>+</div>
                    <div className="dropzone-label">Click to select a CSV file</div>
                    {len(columns) > 0 and (
                        <div className="text-muted text-sm mt-2">
                            Expected columns: {", ".join(columns)}
                        </div>
                    )}
                </label>
            </div>
        )}

        {len(parsed) > 0 and (
            <div>
                <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-muted">{len(parsed)} rows parsed</span>
                    <div className="flex gap-2">
                        <button
                            className="btn btn-secondary btn-sm"
                            onClick={lambda -> None { parsed = []; fileContent = ""; result = ""; }}
                        >
                            Clear
                        </button>
                        <button
                            className="btn btn-primary btn-sm"
                            onClick={lambda -> None { handleImport(); }}
                            disabled={importing}
                        >
                            {importing and "Importing..." or f"Import {len(parsed)} rows"}
                        </button>
                    </div>
                </div>
                <div className="table-container" style={{"maxHeight": "300px", "overflowY": "auto"}}>
                    <table>
                        <thead>
                            <tr>
                                {[<th key={k}>{k}</th> for k in parsed[0].keys()]}
                            </tr>
                        </thead>
                        <tbody>
                            {[<tr key={str(i)}>
                                {[<td key={k}>{row[k]}</td> for k in row.keys()]}
                            </tr> for (i, row) in enumerate(parsed)]}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
    </div>;
}
