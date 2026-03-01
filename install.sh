#!/bin/bash

# Proxmox SiteBuilder Auto-Installation Script
# This script runs INSIDE the LXC container.

set -e

# Non-interactive mode for apt
export DEBIAN_FRONTEND=noninteractive

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Starting Installation inside LXC...${NC}"

# 1. Install Basic Dependencies
echo -e "${GREEN}[1/6] Installing dependencies...${NC}"
apt-get update
apt-get install -y curl git build-essential gnupg

# 2. Install Node.js (LTS)
echo -e "${GREEN}[2/6] Installing Node.js...${NC}"
if ! command -v node &> /dev/null; then
    mkdir -p /etc/apt/keyrings
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list
    apt-get update
    apt-get install -y nodejs
fi

# 3. Install MariaDB
echo -e "${GREEN}[3/6] Installing MariaDB...${NC}"
apt-get install -y mariadb-server
service mariadb start

# 4. Configure Database
echo -e "${GREEN}[4/6] Configuring Database...${NC}"
DB_NAME="sitebuilder"
DB_USER="sitebuilder"
DB_PASS="proxmox_sitebuilder_secret" # Fixed password for auto-install

# Secure MariaDB installation (basic)
mysql -e "CREATE DATABASE IF NOT EXISTS ${DB_NAME};"
mysql -e "CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';"
mysql -e "GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"

# Import Schema
if [ -f "schema.sql" ]; then
    mysql ${DB_NAME} < schema.sql
    echo "Schema imported."
fi

# 5. Application Setup
echo -e "${GREEN}[5/6] Building Application...${NC}"
npm install
npm run build

# Create .env
cat <<EOF > .env
DB_HOST=localhost
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASS}
DB_NAME=${DB_NAME}
JWT_SECRET=$(openssl rand -hex 32)
PORT=3000
EOF

# 6. Systemd Service
echo -e "${GREEN}[6/6] Creating Service...${NC}"
cat <<EOF > /etc/systemd/system/sitebuilder.service
[Unit]
Description=Proxmox SiteBuilder
After=network.target mariadb.service

[Service]
Type=simple
User=root
WorkingDirectory=$(pwd)
ExecStart=/usr/bin/npm start
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable sitebuilder
systemctl restart sitebuilder

echo -e "${BLUE}------------------------------------------------${NC}"
echo -e "${GREEN}Installation Complete!${NC}"
echo -e "App is running on port 3000"
echo -e "${BLUE}------------------------------------------------${NC}"
