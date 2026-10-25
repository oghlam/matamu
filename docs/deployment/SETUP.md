# Deployment & Setup

## EC2 Initial Setup (Sprint 0 — S0-1)

```bash
# on the krusetre EC2 instance
chmod +x docs/deployment/ec2-setup.sh
./docs/deployment/ec2-setup.sh
```

The script updates the OS, installs Python 3.12 + venv and PostgreSQL 16 + PostGIS, creates the `matamu` database and `~/matamu-env`, installs the required packages, and runs a smoke test.

For a manual alternative, follow the commands in the script and the project deployment notes.

## LiteLLM / Amazon Nova Test (S0-3)

On EC2, with the proxy running on port 4000:

```bash
curl -X POST http://localhost:4000/v1/chat/completions -H "Content-Type: application/json" \
  -d '{"model": "amazon.nova-lite-v1:0", "messages": [{"role": "user", "content": "Hello"}]}'
curl -X POST http://localhost:4000/v1/chat/completions -H "Content-Type: application/json" \
  -d '{"model": "amazon.nova-pro-v1:0", "messages": [{"role": "user", "content": "Hello"}]}'
```

If LiteLLM is not running, start it with `litellm --config litellm_config.yaml` or check the systemd service. Direct Bedrock calls use the same Nova model IDs through the Converse API.

## Deploy (CI/CD)

1. **SSH Key:** Add your `MyServerKey.pem` content to GitHub Secrets as `EC2_SSH_DEPLOY_KEY`.
2. **Secrets:** Add the following to GitHub Repo Secrets:
   - `EC2_HOST`: <your-ec2-public-ip>
   - `EC2_USER`: `ec2-user`
3. **Canonical EC2 layout:** The workflow deploys code to `/home/ec2-user/matamu`.
   Runtime evidence is intentionally outside the checkout at
   `/var/lib/matamu/media`, with `0755` directories and `0644` files. The
   deploy creates `/var/www/matamu` as a compatibility symlink, but Nginx
   should use `/var/lib/matamu/media/` for its `/media/` alias.
4. **EC2 Setup (Initial):** Configure the `matamu` systemd service to use the
   same checkout and environment:
   ```ini
   [Unit]
   Description=Mat(a)Mu Gunicorn
   After=network.target

   [Service]
   User=ec2-user
   Group=ec2-user
   WorkingDirectory=/home/ec2-user/matamu/matamu-backend
   EnvironmentFile=/home/ec2-user/matamu/matamu-backend/.env
   ExecStart=/home/ec2-user/matamu-env/bin/gunicorn --bind 127.0.0.1:8080 matamu_backend.wsgi:application
   Restart=always

   [Install]
   WantedBy=multi-user.target
   ```
   Then run `sudo systemctl daemon-reload && sudo systemctl enable matamu`.
5. **Nginx media location:** In the active dashboard server block, use an
   exact filesystem alias (the trailing slash is required):
   ```nginx
   location /media/ {
       alias /var/lib/matamu/media/;
       autoindex off;
   }
   ```
   Do not alias `/home/ec2-user/.../media/` and do not use a relative path.
   Validate and reload with:
   ```bash
   sudo nginx -t && sudo systemctl reload nginx
   ```
