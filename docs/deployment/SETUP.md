# Deployment & Setup

## EC2 Initial Setup (Sprint 0 — S0-1)

```bash
# on the krusetre EC2 instance
chmod +x docs/deployment/ec2-setup.sh
./docs/deployment/ec2-setup.sh
```

The script updates the OS, installs Python 3.12 + venv and PostgreSQL 16 + PostGIS, creates the `matamu` database and `~/matamu-env`, installs the required packages, and runs a smoke test.

For a manual alternative, follow the commands in the script and the project deployment notes.

## LiteLLM / Bedrock Test (S0-3)

On EC2, with the proxy running on port 4000:

```bash
curl -X POST http://localhost:4000/v1/chat/completions -H "Content-Type: application/json" \
  -d '{"model": "bedrock-claude-haiku-4-5", "messages": [{"role": "user", "content": "Hello"}]}'
curl -X POST http://localhost:4000/v1/chat/completions -H "Content-Type: application/json" \
  -d '{"model": "bedrock-claude-sonnet-4-5", "messages": [{"role": "user", "content": "Hello"}]}'
```

If LiteLLM is not running, start it with `litellm --config litellm_config.yaml` or check the systemd service.

## Deploy (CI/CD)

1. **SSH Key:** Add your `MyServerKey.pem` content to GitHub Secrets as `EC2_SSH_DEPLOY_KEY`.
2. **Secrets:** Add following to GitHub Repo Secrets:
   - `EC2_HOST`: <your-ec2-public-ip>
   - `EC2_USER`: ec2-user
   - `DEPLOY_PATH`: /var/www/matamu
3. **EC2 Setup (Initial):**
   - Ensure `/var/www/matamu` exists and is accessible by `ec2-user`.
   - Configure a `systemd` service for Gunicorn auto-restart.
     Create `/etc/systemd/system/matamu-backend.service`:
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
     Then run `sudo systemctl daemon-reload && sudo systemctl enable matamu-backend`.
