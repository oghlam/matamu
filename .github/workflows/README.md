# GitHub Workflows - Mat(a)Mu

## Status

⚠️ **Auto-deploy is temporarily disabled** because the AWS EC2 server is not ready.

## File

- `deploy.yml.disabled` - Disabled EC2 deployment workflow (enable when EC2 is ready)

## Enable Deployment

1. Prepare the EC2 instance.
2. Configure GitHub Secrets:
   - `EC2_SSH_DEPLOY_KEY` - private SSH key for EC2 access
   - `EC2_HOST` - IP/hostname EC2
   - `EC2_USER` - Username (ubuntu/ec2-user)
   - `DEPLOY_PATH` - Deployment path on EC2 (default: /var/www/matamu)
3. Rename `deploy.yml.disabled` to `deploy.yml`.
4. Push to the `main` branch.

## Manual Deployment (Temporary)

Use SSH for temporary manual deployment:

```bash
# SSH to EC2
ssh user@ec2-host

# Pull the latest revision
cd /var/www/matamu
git pull origin main

# Backend
source /home/ec2-user/matamu-env/bin/activate
pip install -r matamu-backend/requirements.txt
python matamu-backend/manage.py migrate
python matamu-backend/manage.py collectstatic --noinput
sudo systemctl restart matamu-backend

# Frontend (build locally, then upload)
cd matamu-frontend
npm run build
# rsync dist/ to EC2
```
