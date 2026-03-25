#!/bin/bash

# Blockra Auto-Installation Script
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
echo -e "${GREEN}[1/4] Installing dependencies...${NC}"
apt-get update >/dev/null 2>&1
apt-get install -y curl git build-essential gnupg >/dev/null 2>&1

# 2. Install Node.js (LTS)
echo -e "${GREEN}[2/4] Installing Node.js...${NC}"
if ! command -v node &> /dev/null; then
    mkdir -p /etc/apt/keyrings
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg >/dev/null 2>&1
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list >/dev/null 2>&1
    apt-get update >/dev/null 2>&1
    apt-get install -y nodejs >/dev/null 2>&1
fi

# 3. Application Setup
echo -e "${GREEN}[3/4] Building Application...${NC}"
npm install -g npm@latest >/dev/null 2>&1
npm install >/dev/null 2>&1
npm run build >/dev/null 2>&1

# Create .env
cat <<EOF > .env
PORT=3000
VITE_APPWRITE_ENDPOINT=https://api.angihomelab.com/v1
VITE_APPWRITE_PROJECT_ID=69b3402700309dc6660c
VITE_APPWRITE_DATABASE_ID=69b4036d001f9322929d
VITE_APPWRITE_USERS_COLLECTION_ID=69b40b450023d774f727
VITE_APPWRITE_LICENSES_COLLECTION_ID=69b40b5d000ce0bf77eb
VITE_APPWRITE_SITES_COLLECTION_ID=69b7b49e002e8aebabf6
VITE_APPWRITE_ASSETS_BUCKET_ID=assets
EOF

# 4. Systemd Service
echo -e "${GREEN}[4/4] Creating Service...${NC}"
cat <<EOF > /etc/systemd/system/sitebuilder.service
[Unit]
Description=Blockra
After=network.target

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

systemctl daemon-reload >/dev/null 2>&1
systemctl enable sitebuilder >/dev/null 2>&1
systemctl restart sitebuilder >/dev/null 2>&1

echo -e "${BLUE}------------------------------------------------${NC}"
echo -e "${GREEN}Installation Complete!${NC}"
echo -e "App is running on port 3000"
echo -e "${BLUE}------------------------------------------------${NC}"
