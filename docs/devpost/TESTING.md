# Mat(a)Mu — Devpost Testing and Reproducibility Guide

## Requirements

- Python environment matching `matamu-backend/requirements.txt`.
- Node.js and npm matching the frontend toolchain.
- A local SQLite database is sufficient for the documented local test path.
- AWS/Bedrock credentials are optional for local mock-mode tests and required for production-path verification.

## Start the application

From the repository root:

```cmd
start-dev.bat
```

Open:

- `http://localhost:5173` — citizen PWA.
- `http://127.0.0.1:8080/dashboard/` — operator dashboard.
- `http://127.0.0.1:8080/api/docs` — API documentation.

## Run automated evidence checks

```cmd
cd matamu-backend
venv\Scripts\python.exe docs\integration_test.py
venv\Scripts\python.exe docs\agentic_scenario_runner.py
```

Expected documented baseline:

- Integration: 46/46 pass.
- Agentic scenarios: 4/4 pass.

The checks cover normal capture, missing/invalid GPS, duplicate and nearby reports, quality gates, privacy processing, publication routing, and fallback behavior.

## Manual judge flow

1. Open the PWA.
2. Use capture or gallery upload with a road image.
3. Confirm live location permission and inspect the visible GPS watermark.
4. Submit and record the returned class, confidence, trust score, status, and summary.
5. Open the public map and select the new report.
6. Open the operator dashboard and show the report, IQE queue, and follow-up controls.
7. Open `/dashboard/agentic/` and show the JSON trace for the perception → decision → action path.

## Production verification before submission

- Citizen PWA: `https://matamu.32-193-23-154.nip.io`
- Operator dashboard: `https://matamu-dash.32-193-23-154.nip.io/dashboard`

- Run the same flow from a network outside the deployment host.
- Verify the public endpoint uses production authentication settings; do not use `BYPASS_AUTH=1` in the judge environment.
- Verify only blurred evidence is publicly served.
- Verify the endpoint, repository, video, and archive are accessible without private credentials.
- Record real production latency separately from the local mock-mode latency.
