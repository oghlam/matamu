# Deployment & Setup

## EC2 Initial Setup (Sprint 0 — S0-1)

```bash
# di EC2 krusetre
chmod +x docs/deployment/ec2-setup.sh
./docs/deployment/ec2-setup.sh
```

Script: `ec2-setup.sh` — update OS, install Python 3.12 + venv, Postgres 16 + PostGIS, create DB `matamu`, venv `~/matamu-env`, pip deps (opencv 5.x, ultralytics, Django 5.x, django-ninja, psycopg, boto3, litellm), lalu smoke test.

Manual alternative: lihat `AGENTS.md` S0-1 untuk langkah satu-per-satu.

## LiteLLM / Bedrock Test (S0-3)

Di EC2 (proxy jalan di :4000):

```bash
curl -X POST http://localhost:4000/v1/chat/completions -H "Content-Type: application/json" \
  -d '{"model": "bedrock-claude-haiku-4-5", "messages": [{"role": "user", "content": "Hello"}]}'
curl -X POST http://localhost:4000/v1/chat/completions -H "Content-Type: application/json" \
  -d '{"model": "bedrock-claude-sonnet-4-5", "messages": [{"role": "user", "content": "Hello"}]}'
```

Jika LiteLLM belum jalan: `litellm --config litellm_config.yaml` atau cek service systemd.

## Deploy (CI/CD)

1. **SSH Key:** Add your `MyServerKey.pem` content to GitHub Secrets as `EC2_SSH_DEPLOY_KEY`.
2. **Secrets:** Add following to GitHub Repo Secrets:
   - `EC2_HOST`: <redacted-ip>
   - `EC2_USER`: ec2-user
   - `DEPLOY_PATH`: /var/www/matamu
3. **EC2 Setup (Initial):**
   - Pastikan `/var/www/matamu` sudah ada dan bisa diakses `ec2-user`.
   - Setup `systemd` service untuk Gunicorn agar auto-restart:
     Buat `/etc/systemd/system/matamu-backend.service`:
     ```ini
     [Unit]
     Description=Gunicorn daemon for Mat(a)Mu
     After=network.target

     [Service]
     User=ec2-user
     Group=ec2-user
     WorkingDirectory=/var/www/matamu/matamu-backend
     ExecStart=/home/ec2-user/matamu-env/bin/gunicorn matamu_backend.wsgi:application
     Restart=always

     [Install]
     WantedBy=multi-user.target
     ```
     Lalu jalankan `sudo systemctl daemon-reload && sudo systemctl enable matamu-backend`.
