#!/bin/bash

# ==============================================================================
# Blockra - One-Click Deployment Script
# ==============================================================================
# This script is designed to be run on a Proxmox VE node.
# It clones the repository and initiates the LXC container creation and setup.
#
# Usage:
#   bash <(curl -s https://raw.githubusercontent.com/<USER>/<REPO>/main/deploy.sh) [CT_ID] [PASSWORD]
# ==============================================================================

set -e

# --- CONFIGURATION (UPDATE BEFORE COMMITTING TO GITHUB) ---
GITHUB_USER="YOUR_GITHUB_USERNAME" # <--- CHANGE THIS
GITHUB_REPO="blockra"              # <--- CHANGE THIS IF REPO NAME IS DIFFERENT
GITHUB_BRANCH="main"
# ----------------------------------------------------------

REPO_URL="https://github.com/${GITHUB_USER}/${GITHUB_REPO}.git"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}=== Blockra Installer ===${NC}"

# Check if running on Proxmox
if ! command -v pveversion >/dev/null 2>&1; then
    echo -e "${RED}Error: This script must be run on a Proxmox VE node.${NC}"
    exit 1
fi

# Install git if missing
if ! command -v git >/dev/null 2>&1; then
    echo -e "${BLUE}Installing git...${NC}"
    apt-get update >/dev/null
    apt-get install -y git >/dev/null
fi

# Create temporary directory
TEMP_DIR=$(mktemp -d)
echo -e "${BLUE}Working in ${TEMP_DIR}...${NC}"

# Clone repository
echo -e "${BLUE}Cloning repository from ${REPO_URL}...${NC}"
if ! git clone -b "${GITHUB_BRANCH}" "${REPO_URL}" "${TEMP_DIR}/sitebuilder"; then
    echo -e "${RED}Failed to clone repository. Please check the URL and your internet connection.${NC}"
    rm -rf "${TEMP_DIR}"
    exit 1
fi

# Make scripts executable
chmod +x "${TEMP_DIR}/sitebuilder/setup_proxmox_lxc.sh"
chmod +x "${TEMP_DIR}/sitebuilder/install.sh"

# Run the setup script
# Pass arguments (CT_ID, PASSWORD) to the setup script
cd "${TEMP_DIR}/sitebuilder"
./setup_proxmox_lxc.sh "$@"

# Cleanup
echo -e "${BLUE}Cleaning up...${NC}"
rm -rf "${TEMP_DIR}"

echo -e "${GREEN}Installer finished.${NC}"
