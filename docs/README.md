# Mat(a)Mu — Project Documentation

> OpenCV AI Competition 2026 · Blaz Labs
> Workdir: C:\laragon\www\matamu

---

## Struktur Dokumentasi

| Folder | Isi | Masuk GitHub? |
|--------|-----|---------------|
| `docs/sprints/` | Sprint plan, progress log, daily notes | ✅ Ya |
| `docs/architecture/` | Architecture diagram, component diagram, agentic flow | ✅ Ya |
| `docs/api/` | API documentation (Django Ninja auto-generated) | ✅ Ya |
| `docs/deployment/` | Deployment guide, CI/CD pipeline, env setup | ✅ Ya (tanpa credentials) |
| `Road-Asset-Intelligence-Blueprint/` | Bahan mentah — RAIP blueprint | ❌ Tidak (.gitignore) |
| `Mat_a_Mu_Project_Proposal.pdf` | Bahan mentah — proposal | ❌ Tidak (.gitignore) |
| `Mat_a_Mu_Technical_Sharpening.md` | Bahan mentah — technical detail | ❌ Tidak (.gitignore) |
| `cover-matamu*.png` | Bahan mentah — cover images | ❌ Tidak (.gitignore) |

---

## Yang TIDAK Boleh Masuk GitHub

- ❌ Proposal PDF (internal Blaz Labs)
- ❌ Blueprint RAIP (internal reference)
- ❌ Cover images (internal branding)
- ❌ `.env` / API keys / credentials
- ❌ LiteLLM proxy config
- ❌ AWS credentials (.pem, .key)
- ❌ Model files (.onnx, .pt — terlalu besar)
- ❌ Upload evidence (foto warga)
- ❌ `.workbuddy-ai/` (session memory)

## Yang MASUK GitHub

- ✅ Source code (matamu-backend, matamu-cv, matamu-frontend)
- ✅ Documentation (docs/)
- ✅ `.gitignore`
- ✅ `requirements.txt` / `package.json` (pinned dependencies)
- ✅ `Dockerfile` / `docker-compose.yml` (tanang credentials)
- ✅ Example env file (`.env.example` — placeholder only, no real values)
- ✅ README.md
- ✅ Architecture diagram (docs/architecture/)

---

## CI/CD Pipeline

```
GitHub (repo) → CI/CD auto-deploy → EC2 Kurusetra (AWS)
```

**Rules:**
- Push ke `main` → auto deploy ke EC2
- Credentials dipisah: GitHub Secrets atau EC2 env vars (tidak di code)
- `.env` di EC2 dibuat manual, tidak dari repo

---

## Env File Structure (.env.example)

File `.env.example` (placeholder, aman untuk repo) dibuat terpisah. File `.env` asli hanya di EC2, tidak masuk repo.
