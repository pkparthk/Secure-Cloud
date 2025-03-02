#!/bin/bash
# Deploy FastAPI Backend on AWS EC2

set -e  # Exit on error

echo "[+] Updating system and installing dependencies..."
sudo apt-get update -y && sudo apt-get upgrade -y
sudo apt-get install -y git curl python3 python3-pip docker.io

echo "[+] Enabling and starting Docker service..."
sudo systemctl enable docker
sudo systemctl start docker

# Define variables
APP_DIR="/opt/secure-cloud-access"
REPO_URL="https://github.com/your-repo/secure-cloud-access.git"
BRANCH="main"

echo "[+] Setting up application directory..."
if [ -d "$APP_DIR" ]; then
    echo "[+] Repository exists. Pulling latest changes..."
    cd "$APP_DIR" && git reset --hard && git pull origin "$BRANCH"
else
    echo "[+] Cloning repository..."
    sudo git clone -b "$BRANCH" "$REPO_URL" "$APP_DIR"
fi

cd "$APP_DIR/backend"

echo "[+] Building Docker container for FastAPI backend..."
sudo docker build -t secure-cloud-backend .

echo "[+] Stopping and removing existing backend container (if any)..."
sudo docker stop secure-cloud-backend || true
sudo docker rm secure-cloud-backend || true

echo "[+] Running backend container..."
sudo docker run -d --name secure-cloud-backend \
    -p 8000:8000 \
    --restart always \
    -v "$APP_DIR/backend:/app" \
    secure-cloud-backend

# Systemd service for automatic restart
SERVICE_FILE="/etc/systemd/system/secure-cloud-backend.service"

echo "[+] Creating systemd service for backend..."
sudo bash -c "cat > $SERVICE_FILE" <<EOL
[Unit]
Description=Secure Cloud Backend
After=network.target

[Service]
ExecStart=/usr/bin/docker start -a secure-cloud-backend
ExecStop=/usr/bin/docker stop secure-cloud-backend
Restart=always
User=root

[Install]
WantedBy=multi-user.target
EOL

echo "[+] Reloading systemd and enabling backend service..."
sudo systemctl daemon-reload
sudo systemctl enable secure-cloud-backend
sudo systemctl restart secure-cloud-backend

echo "[✔] Backend deployment completed successfully!"
