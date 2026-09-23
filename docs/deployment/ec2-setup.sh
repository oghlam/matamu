#!/bin/bash
# ============================================================
# Mat(a)Mu — EC2 krusetre (t2.small) One-shot Setup
# OS: Ubuntu 22.04 / Amazon Linux 2023 — auto-detect
# Run: chmod +x ec2-setup.sh && ./ec2-setup.sh
# ============================================================
set -e
echo "=== Mat(a)Mu EC2 Setup ==="

# --- 1. System update ---
if command -v apt &>/dev/null; then
  sudo apt update && sudo apt upgrade -y
  sudo apt install -y python3.12 python3.12-venv python3-pip postgresql postgresql-contrib postgis postgresql-16-postgis-3 git curl
else
  sudo yum update -y
  sudo yum install -y python3.12 git postgresql15-server postgis curl
  sudo postgresql-setup --initdb || true
  sudo systemctl enable --now postgresql
fi

# --- 2. Postgres + PostGIS ---
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='matamu'" | grep -q 1 || sudo -u postgres createuser matamu --pwprompt
sudo -u postgres createdb matamu --owner=matamu 2>/dev/null || echo "DB matamu already exists"
sudo -u postgres psql matamu -c "CREATE EXTENSION IF NOT EXISTS postgis;"

# --- 3. Python venv + pip deps ---
python3.12 -m venv /home/$(whoami)/matamu-env
source /home/$(whoami)/matamu-env/bin/activate
pip install --upgrade pip
pip install opencv-python==5.0.0.93 ultralytics Django==5.1 django-ninja==1.3.0 psycopg[binary] boto3 litellm Pillow requests gunicorn django-cors-headers python-dotenv

# --- 4. Smoke test ---
python -c "import cv2; print('cv2', cv2.__version__)"
python -c "from ultralytics import YOLO; print('ultralytics OK')"
python -c "import django; print('django', django.VERSION)"
python -c "import psycopg; print('psycopg OK')"

echo ""
echo "=== DONE — EC2 setup complete ==="
echo "Next: test LiteLLM proxy, create S3 bucket (done), django-admin startproject"
