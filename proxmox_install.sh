#!/usr/bin/env bash

# ==============================================================================
# Proxmox SiteBuilder - Community Script Style Installer
# ==============================================================================
# This script automates the creation of an LXC container and installation of the SiteBuilder.
#
# Usage:
#   bash -c "$(curl -fsSL https://raw.githubusercontent.com/Angelo-builds/blockra/main/proxmox_install.sh)"
# ==============================================================================

set -e

# --- CONFIGURATION (Change these before pushing to GitHub) ---
GITHUB_USER="Angelo-builds"
GITHUB_REPO="blockra"
GITHUB_BRANCH="main"
# -------------------------------------------------------------

# Colors
YW=$(echo "\033[33m")
BL=$(echo "\033[36m")
RD=$(echo "\033[01;31m")
BGN=$(echo "\033[4;64m")
GN=$(echo "\033[1;92m")
DGN=$(echo "\033[32m")
CL=$(echo "\033[m")
CM="${GN}✓${CL}"
CROSS="${RD}✗${CL}"
BFR="\\r\\033[K"
HOLD="-"

function msg_info() {
    local msg="$1"
    echo -ne " ${RC} ${YW}${HOLD}${CL} ${msg}..."
}

function msg_ok() {
    local msg="$1"
    echo -e "${BFR} ${CM} ${GN}${msg}${CL}"
}

function msg_error() {
    local msg="$1"
    echo -e "${BFR} ${CROSS} ${RD}${msg}${CL}"
}

# Check Root
if [[ $EUID -ne 0 ]]; then
    msg_error "This script must be run as root"
    exit 1
fi

# Check Proxmox
if ! command -v pveversion >/dev/null 2>&1; then
    msg_error "This script must be run on a Proxmox VE node"
    exit 1
fi

clear
echo -e "${BL}Proxmox SiteBuilder Installer${CL}"
echo -e "${YW}This script will create a new LXC container and install the SiteBuilder application.${CL}"
echo ""

# --- User Input ---

# Container ID
while true; do
    NEXTID=$(pvesh get /cluster/nextid)
    read -p "Container ID [${NEXTID}]: " CT_ID
    CT_ID=${CT_ID:-$NEXTID}
    if pct status $CT_ID &>/dev/null; then
        echo -e "${RD}Container ID $CT_ID already exists.${CL}"
    else
        break
    fi
done

# Password
read -s -p "Container Root Password [proxmox]: " CT_PASSWORD
CT_PASSWORD=${CT_PASSWORD:-"proxmox"}
echo ""

# Storage
STORAGE_LIST=$(pvesm status -content rootdir | awk 'NR>1 {print $1}')
DEFAULT_STORAGE=$(echo "$STORAGE_LIST" | head -n 1)
read -p "Storage Pool [${DEFAULT_STORAGE}]: " STORAGE
STORAGE=${STORAGE:-$DEFAULT_STORAGE}

# Resources
read -p "Cores [2]: " CORES
CORES=${CORES:-2}

read -p "Memory (MB) [2048]: " MEMORY
MEMORY=${MEMORY:-2048}

read -p "Swap (MB) [512]: " SWAP
SWAP=${SWAP:-512}

echo ""
echo -e "${GN}Configuration:${CL}"
echo -e "  ID:       ${CT_ID}"
echo -e "  Password: (hidden)"
echo -e "  Storage:  ${STORAGE}"
echo -e "  Cores:    ${CORES}"
echo -e "  Memory:   ${MEMORY}MB"
echo -e "  Swap:     ${SWAP}MB"
echo ""
read -p "Proceed with installation? [y/N]: " CONFIRM
if [[ ! "$CONFIRM" =~ ^[yY]$ ]]; then
    msg_error "Installation aborted."
    exit 0
fi

# --- Execution ---

msg_info "Checking for Debian 12 Template"
TEMPLATE="debian-12-standard_12.2-1_amd64.tar.zst"
TEMPLATE_STORAGE="local" # Usually templates are in local
if ! pveam list $TEMPLATE_STORAGE | grep -q "$TEMPLATE"; then
    msg_info "Downloading Debian 12 Template"
    pveam update >/dev/null
    pveam download $TEMPLATE_STORAGE $TEMPLATE >/dev/null || {
        # Fallback to finding available template
        AVAIL_TEMPLATE=$(pveam available --section system | grep "debian-12-standard" | head -n 1 | awk '{print $2}')
        if [ -z "$AVAIL_TEMPLATE" ]; then
            msg_error "Could not find Debian 12 template."
            exit 1
        fi
        pveam download $TEMPLATE_STORAGE $AVAIL_TEMPLATE >/dev/null
        TEMPLATE=$AVAIL_TEMPLATE
    }
fi
msg_ok "Template Ready"

msg_info "Creating LXC Container"
pct create $CT_ID "${TEMPLATE_STORAGE}:vztmpl/${TEMPLATE}" \
    --hostname "sitebuilder-${CT_ID}" \
    --password "$CT_PASSWORD" \
    --storage $STORAGE \
    --rootfs 8 \
    --net0 name=eth0,bridge=vmbr0,ip=dhcp \
    --cores $CORES \
    --memory $MEMORY \
    --swap $SWAP \
    --features nesting=1 \
    --unprivileged 1 \
    --start 1 >/dev/null
msg_ok "Container Created & Started"

msg_info "Waiting for Network"
sleep 5
msg_ok "Network Ready"

msg_info "Installing Dependencies inside Container"
pct exec $CT_ID -- apt-get update >/dev/null
pct exec $CT_ID -- apt-get install -y git curl build-essential gnupg >/dev/null
msg_ok "Dependencies Installed"

msg_info "Cloning Repository"
REPO_URL="https://github.com/${GITHUB_USER}/${GITHUB_REPO}.git"
pct exec $CT_ID -- git clone -b "${GITHUB_BRANCH}" "${REPO_URL}" /opt/sitebuilder >/dev/null
msg_ok "Repository Cloned"

msg_info "Running Installation Script"
# We need to make sure install.sh is executable and run it
pct exec $CT_ID -- chmod +x /opt/sitebuilder/install.sh
# Run install.sh inside the directory so it finds package.json
pct exec $CT_ID -- bash -c "cd /opt/sitebuilder && ./install.sh" >/dev/null
msg_ok "Installation Script Completed"

IP=$(pct exec $CT_ID -- hostname -I | awk '{print $1}')
echo -e "${GN}Success!${CL}"
echo -e "Access your SiteBuilder at: http://${IP}:3000"
