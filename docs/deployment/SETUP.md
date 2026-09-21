# Deployment Instructions

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
