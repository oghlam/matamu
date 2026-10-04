# Mat(a)Mu — Project Documentation

> OpenCV AI Competition 2026 · Blaz Labs
> Workdir: C:\laragon\www\matamu

---

## Documentation Structure

| Folder | Contents | In GitHub? |
|--------|-----|---------------|
| `docs/sprints/` | Sprint plans, progress logs, daily notes | ❌ No — internal build notes |
| `docs/architecture/` | System and agentic flow diagrams | ✅ Yes |
| `docs/evaluation/` | Failure cases and benchmarks | ✅ Yes |
| `docs/agentic-traces/` | JSON decision traces for captured observations | ✅ Yes |
| `docs/matamu-road-defect-icons/` | Defect icon source files (SVG + CSS); keep one mapping source | ✅ Yes |
| `docs/deployment/` | Deployment guide, CI/CD pipeline, environment setup | ✅ Yes, without credentials |
| `Road-Asset-Intelligence-Blueprint/` | Raw RAIP blueprint material | ❌ No (`.gitignore`) |
| `Mat_a_Mu_Project_Proposal.pdf` | Raw proposal material | ❌ No (`.gitignore`) |
| `Mat_a_Mu_Technical_Sharpening.md` | Raw technical notes | ❌ No (`.gitignore`) |
| `cover-matamu*.png` | Raw cover images | ❌ No (`.gitignore`) |

---

## Files That Must Not Enter GitHub

- ❌ Proposal PDF (internal Blaz Labs)
- ❌ RAIP blueprint (internal reference)
- ❌ Cover images (internal branding)
- ❌ `.env` files, API keys, and credentials
- ❌ LiteLLM proxy configuration
- ❌ AWS credentials (`.pem`, `.key`)
- ❌ Model files (`.onnx`, `.pt`, and similar large artifacts)
- ❌ Uploaded evidence photos
- ❌ `.workbuddy-ai/` and `.claude/` (agent session data)
- ❌ `AGENTS.md` (local agent/developer instructions)
- ❌ Local `media/evidence/` files
- ❌ `db.sqlite3` (local database; schema is represented by migrations)

## Files That Belong in GitHub

- ✅ Source code (`matamu-backend`, `matamu-cv`, `matamu-frontend`)
- ✅ Public documentation (`docs/`)
- ✅ `.gitignore`
- ✅ `requirements.txt` / `package.json` (pinned dependencies)
- ✅ `Dockerfile` / `docker-compose.yml` (without credentials)
- ✅ Example environment file (`.env.example`; placeholders only)
- ✅ README.md
- ✅ Architecture diagrams (`docs/architecture/`)

---

## CI/CD Pipeline

```
GitHub (repo) → CI/CD auto-deploy → EC2 Kurusetra (AWS)
```

**Rules:**
- Pushing to `main` triggers deployment to EC2 when the workflow is enabled.
- Credentials must be stored in GitHub Secrets or EC2 environment variables, never in source code.
- The production `.env` file is created manually on EC2 and is never committed.

---

## Env File Structure (.env.example)

The `.env.example` file contains safe placeholders for the repository. The production `.env` file exists only on EC2 and is never committed.
