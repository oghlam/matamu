# Devpost Requirement-to-Evidence Matrix

| Devpost requirement / judging area | Repository evidence | Final proof to attach or show |
|---|---|---|
| Problem, users, impact | `DEVPOST-SUBMISSION.md`, `docs/technical-report-draft.md` | Demo introduction and final write-up |
| Substantive OpenCV 5 analysis | `matamu-cv/`, `docs/architecture/system-architecture.md` | Live capture result and technical report |
| AWS component | `docs/deployment/SETUP.md`, architecture docs, `.env.example` | Public endpoint and deployment configuration summary |
| Agentic Vision path | `docs/architecture/agentic-flow.md`, `docs/agentic-traces/`, `docs/WHY-AGENTIC.md` | Trace showing OpenCV output changes routing/action |
| Technical execution | `matamu-cv/`, backend API, frontend PWA | Working demo and test output |
| User experience | `matamu-frontend/`, dashboard templates | Capture → map → review walkthrough |
| Documentation/presentation | `README.md`, `docs/`, `DEMO-SCRIPT.md` | Technical report, screenshots, video |
| Reproducibility | pinned `requirements.txt`, `package.json`, `TESTING.md` | Judge-accessible repository/archive |
| Failure cases and limitations | `docs/evaluation/failure-cases.md` | Video callout and report section |
| Responsible operation | SFace blur, IQE queue, RBAC, rate limiting, trace logs | Privacy and human-review demonstration |

## Track decision

Recommend selecting `Agentic Vision Award` only if the final demo includes a live or recorded trace where the OpenCV result changes a later routing/action decision. Do not select `Best Use of COOL Award` unless the core workload is actually executed on the required AWS Graviton/Arm path and comparative measurements are available.

