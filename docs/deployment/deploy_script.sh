#!/bin/bash
# Mat(a)Mu Deployment Script (to be kept on EC2 server)
# Path: /home/ec2-user/deploy_matamu.sh

set -e

DEPLOY_PATH="/var/www/matamu"
VENV_PATH="/home/ec2-user/matamu-env"

echo "=== Starting Mat(a)Mu Deployment ==="
cd "$DEPLOY_PATH"

echo "--- Pulling latest code ---"
git fetch origin main
git reset --hard origin/main

echo "--- Installing dependencies ---"
source "$VENV_PATH/bin/activate"
pip install -r requirements.txt

echo "--- Migrating Database ---"
cd matamu-backend
python manage.py migrate
python manage.py collectstatic --noinput

echo "--- Restarting Service ---"
sudo systemctl restart matamu-backend

echo "=== Deployment Finished Successfully ==="
