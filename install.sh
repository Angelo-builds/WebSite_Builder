#!/bin/bash

# Blockra - One-Click Installation Script
# Author: Angelo
# Description: Installs Docker, Docker-compose, clones Blockra, and sets up the environment.

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}------------------------------------------------------------${NC}"
echo -e "${BLUE}          Blockra - One-Click Installation Script          ${NC}"
echo -e "${BLUE}------------------------------------------------------------${NC}"

# 1. Check if user is Root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Error: Please run this script as root (sudo bash install.sh).${NC}"
  exit 1
fi

# 2. Update packages and install dependencies
echo -e "${GREEN}Step 1: Updating packages and installing dependencies...${NC}"
apt-get update && apt-get install -y curl git apt-transport-https ca-certificates software-properties-common

# 3. Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${GREEN}Step 2: Installing Docker...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl enable --now docker
else
    echo -e "${BLUE}Docker is already installed. Skipping...${NC}"
fi

# 4. Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${GREEN}Step 3: Installing Docker Compose...${NC}"
    LATEST_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
    curl -L "https://github.com/docker/compose/releases/download/${LATEST_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
else
    echo -e "${BLUE}Docker Compose is already installed. Skipping...${NC}"
fi

# 5. Clone the Blockra repository
REPO_DIR="/opt/blockra"
if [ -d "$REPO_DIR" ]; then
    echo -e "${BLUE}Blockra directory already exists at $REPO_DIR. Updating...${NC}"
    cd "$REPO_DIR"
    git pull origin main
else
    echo -e "${GREEN}Step 4: Cloning Blockra repository...${NC}"
    git clone https://github.com/Angelo-builds/WebSite_Builder.git "$REPO_DIR"
    cd "$REPO_DIR"
fi

# 6. Interactive Setup for .env file
echo -e "${GREEN}Step 5: Interactive Environment Setup${NC}"
echo "Please provide your Appwrite configuration details:"

read -p "Appwrite Endpoint (e.g., https://cloud.appwrite.io/v1): " ENDPOINT
read -p "Appwrite Project ID: " PROJECT_ID
read -p "Appwrite Database ID: " DATABASE_ID
read -p "Sites Collection ID: " SITES_COLLECTION_ID
read -p "Assets Bucket ID: " ASSETS_BUCKET_ID
read -p "Users Collection ID: " USERS_COLLECTION_ID

# Create .env file
cat <<EOF > .env
VITE_APPWRITE_ENDPOINT=$ENDPOINT
VITE_APPWRITE_PROJECT_ID=$PROJECT_ID
VITE_DATABASE_ID=$DATABASE_ID
VITE_SITES_COLLECTION_ID=$SITES_COLLECTION_ID
VITE_ASSETS_BUCKET_ID=$ASSETS_BUCKET_ID
VITE_USERS_COLLECTION_ID=$USERS_COLLECTION_ID
NODE_ENV=production
PORT=3000
EOF

echo -e "${GREEN}.env file created successfully.${NC}"

# 7. Run docker-compose
echo -e "${GREEN}Step 6: Building and launching Blockra via Docker...${NC}"
docker-compose up -d --build

# 8. Final Success Message
IP_ADDR=$(hostname -I | awk '{print $1}')
echo -e "${BLUE}------------------------------------------------------------${NC}"
echo -e "${GREEN}       Blockra has been installed successfully!             ${NC}"
echo -e "${BLUE}------------------------------------------------------------${NC}"
echo -e "Access the builder at: ${GREEN}http://$IP_ADDR:3000${NC}"
echo -e "Configuration is stored in: ${BLUE}$REPO_DIR/.env${NC}"
echo -e "${BLUE}------------------------------------------------------------${NC}"
