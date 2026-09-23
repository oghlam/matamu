# GitHub Workflows - Mat(a)Mu

## Status

⚠️ **Auto-deploy sementara dinonaktifkan** karena server EC2 AWS belum siap.

## File

- `deploy.yml.disabled` - Workflow deploy otomatis ke EC2 (akan diaktifkan setelah EC2 siap)

## Cara Aktifkan Deploy

1. Siapkan EC2 instance
2. Setup secrets di GitHub:
   - `EC2_SSH_DEPLOY_KEY` - Private SSH key untuk akses EC2
   - `EC2_HOST` - IP/hostname EC2
   - `EC2_USER` - Username (ubuntu/ec2-user)
   - `DEPLOY_PATH` - Path deploy di EC2 (default: /var/www/matamu)
3. Rename `deploy.yml.disabled` → `deploy.yml`
4. Push ke `main` branch

## Manual Deploy (Temporary)

Sementara deploy manual via SSH:

```bash
# SSH ke EC2
ssh user@ec2-host

# Pull latest
cd /var/www/matamu
git pull origin main

# Backend
source /home/ec2-user/matamu-env/bin/activate
pip install -r matamu-backend/requirements.txt
python matamu-backend/manage.py migrate
python matamu-backend/manage.py collectstatic --noinput
sudo systemctl restart matamu-backend

# Frontend (build locally, lalu upload)
cd matamu-frontend
npm run build
# rsync dist/ ke EC2
```
