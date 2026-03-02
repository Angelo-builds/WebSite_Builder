#!/usr/bin/env bash

# ==============================================================================
# Proxmox SiteBuilder - Installer
# ==============================================================================
# Usage:
#   bash -c "$(curl -fsSL https://raw.githubusercontent.com/Angelo-builds/blockra/main/proxmox_install.sh)"
# ==============================================================================

set -e

# --- CONFIGURATION ---
GITHUB_USER="Angelo-builds"
GITHUB_REPO="blockra"
GITHUB_BRANCH="main"
# ---------------------

# Colors
YW=$(echo "\033[33m")
BL=$(echo "\033[36m")
RD=$(echo "\033[01;31m")
GN=$(echo "\033[1;92m")
CL=$(echo "\033[m")
CM="${GN}✓${CL}"
CROSS="${RD}✗${CL}"
BFR="\\r\\033[K"
HOLD="-"

function msg_info() {
    local msg="$1"
    echo -ne " ${YW}${HOLD}${CL} ${msg}..."
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

# Check for whiptail
if ! command -v whiptail >/dev/null 2>&1; then
    apt-get update && apt-get install -y whiptail
fi

clear

# --- DEFAULTS ---
CT_ID=$(pvesh get /cluster/nextid)
CT_NAME="blockra"
CT_PASSWORD=""
STORAGE="local-lvm"
CORES=2
MEMORY=2048
SWAP=512
NET_MODE="dhcp"
IP_ADDRESS=""
GATEWAY=""

# --- MENU ---
CHOICE=$(whiptail --title "Proxmox SiteBuilder Installer" --menu "Choose Installation Type" 12 60 2 \
"1" "Default (DHCP, 2GB RAM, ID: $CT_ID)" \
"2" "Advanced (Static IP, Custom Resources)" 3>&1 1>&2 2>&3)

exitstatus=$?
if [ $exitstatus != 0 ]; then
    msg_error "Installation aborted."
    exit 0
fi

if [ "$CHOICE" == "1" ]; then
    # Default Mode - Ask for password if empty
    if [ -z "$CT_PASSWORD" ]; then
        CT_PASSWORD=$(whiptail --passwordbox "Set Root Password" 8 40 --title "Container Password" 3>&1 1>&2 2>&3)
    fi
fi

if [ "$CHOICE" == "2" ]; then
    # Advanced Mode
    
    # 1. Container ID
    CT_ID=$(whiptail --inputbox "Container ID" 8 40 "$CT_ID" --title "Container Configuration" 3>&1 1>&2 2>&3)
    
    # 2. Hostname
    CT_NAME=$(whiptail --inputbox "Hostname" 8 40 "$CT_NAME" --title "Container Configuration" 3>&1 1>&2 2>&3)
    
    # 3. Password
    CT_PASSWORD=$(whiptail --passwordbox "Root Password" 8 40 "$CT_PASSWORD" --title "Container Configuration" 3>&1 1>&2 2>&3)
    
    # 4. Resources
    CORES=$(whiptail --inputbox "Cores" 8 40 "$CORES" --title "System Resources" 3>&1 1>&2 2>&3)
    MEMORY=$(whiptail --inputbox "Memory (MB)" 8 40 "$MEMORY" --title "System Resources" 3>&1 1>&2 2>&3)
    
    # 5. Network
    NET_CHOICE=$(whiptail --menu "Network Configuration" 10 40 2 \
    "dhcp" "DHCP (Auto)" \
    "static" "Static IP" 3>&1 1>&2 2>&3)
    
    if [ "$NET_CHOICE" == "static" ]; then
        NET_MODE="static"
        IP_ADDRESS=$(whiptail --inputbox "IP Address (CIDR, e.g. 192.168.1.100/24)" 8 50 --title "Network Configuration" 3>&1 1>&2 2>&3)
        GATEWAY=$(whiptail --inputbox "Gateway (e.g. 192.168.1.1)" 8 50 --title "Network Configuration" 3>&1 1>&2 2>&3)
    fi
fi

# Ensure Password is not empty
if [ -z "$CT_PASSWORD" ]; then
    msg_error "Password cannot be empty."
    exit 1
fi

# --- CONFIRMATION ---
clear
echo -e "${BL}--------------------------------------${CL}"
echo -e "${GN}Summary:${CL}"
echo -e "  ID:       ${CT_ID}"
echo -e "  Hostname: ${CT_NAME}"
echo -e "  Cores:    ${CORES}"
echo -e "  Memory:   ${MEMORY}MB"
if [ "$NET_MODE" == "static" ]; then
    echo -e "  IP:       ${IP_ADDRESS}"
    echo -e "  Gateway:  ${GATEWAY}"
else
    echo -e "  Network:  DHCP"
fi
echo -e "${BL}--------------------------------------${CL}"

read -p "Proceed? [y/N]: " CONFIRM
if [[ ! "$CONFIRM" =~ ^[yY]$ ]]; then
    exit 0
fi

# --- EXECUTION ---

msg_info "Checking for Debian 12 Template"
# Find valid storage for templates
TEMPLATE_STORAGE=$(pvesm status -content vztmpl | awk 'NR>1 {print $1}' | head -n 1)
if [ -z "$TEMPLATE_STORAGE" ]; then TEMPLATE_STORAGE="local"; fi

# Check if template exists (partial match)
if pveam list $TEMPLATE_STORAGE | grep -q "debian-12-standard"; then
    # Template exists, get the full VolID
    TEMPLATE_VOLID=$(pveam list $TEMPLATE_STORAGE | grep "debian-12-standard" | head -n 1 | awk '{print $1}')
    msg_ok "Using existing template: $TEMPLATE_VOLID"
else
    # Template does not exist, download it
    msg_info "Downloading Debian 12 Template"
    pveam update >/dev/null
    # Find available template name
    AVAIL_TEMPLATE=$(pveam available --section system | grep "debian-12-standard" | head -n 1 | awk '{print $2}')
    if [ -z "$AVAIL_TEMPLATE" ]; then
        msg_error "Could not find Debian 12 template."
        exit 1
    fi
    pveam download $TEMPLATE_STORAGE $AVAIL_TEMPLATE >/dev/null
    # Re-fetch VolID after download
    TEMPLATE_VOLID=$(pveam list $TEMPLATE_STORAGE | grep "debian-12-standard" | head -n 1 | awk '{print $1}')
    msg_ok "Template Downloaded: $TEMPLATE_VOLID"
fi

msg_info "Creating LXC Container"
# Construct Network String
if [ "$NET_MODE" == "static" ]; then
    NET_STRING="name=eth0,bridge=vmbr0,ip=${IP_ADDRESS},gw=${GATEWAY}"
else
    NET_STRING="name=eth0,bridge=vmbr0,ip=dhcp"
fi

# Find valid storage for rootfs
ROOTFS_STORAGE=$(pvesm status -content rootdir | awk 'NR>1 {print $1}' | head -n 1)
if [ -z "$ROOTFS_STORAGE" ]; then ROOTFS_STORAGE="local-lvm"; fi

pct create $CT_ID "$TEMPLATE_VOLID" \
    --hostname "$CT_NAME" \
    --password "$CT_PASSWORD" \
    --storage $ROOTFS_STORAGE \
    --rootfs 8 \
    --net0 "$NET_STRING" \
    --cores $CORES \
    --memory $MEMORY \
    --swap $SWAP \
    --features nesting=1 \
    --unprivileged 1 \
    --start 1 >/dev/null
msg_ok "Container Created & Started"

msg_info "Waiting for Network"
sleep 10
msg_ok "Network Ready"

msg_info "Installing Dependencies inside Container"
pct exec $CT_ID -- bash -c "export LC_ALL=C; export DEBIAN_FRONTEND=noninteractive; apt-get update" >/dev/null
pct exec $CT_ID -- bash -c "export LC_ALL=C; export DEBIAN_FRONTEND=noninteractive; apt-get install -y git curl build-essential gnupg openssh-server" >/dev/null
# Enable Root Login for SSH
pct exec $CT_ID -- sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin yes/' /etc/ssh/sshd_config
pct exec $CT_ID -- systemctl enable ssh >/dev/null
pct exec $CT_ID -- systemctl restart ssh >/dev/null
msg_ok "Dependencies Installed & SSH Configured"

msg_info "Cloning Repository"
REPO_URL="https://github.com/${GITHUB_USER}/${GITHUB_REPO}.git"
# Ensure directory is empty/clean
pct exec $CT_ID -- rm -rf /opt/sitebuilder
# Verbose clone to see errors
if ! pct exec $CT_ID -- git clone -b "${GITHUB_BRANCH}" "${REPO_URL}" /opt/sitebuilder; then
    msg_error "Failed to clone repository. Check internet connection or repo URL."
    exit 1
fi
msg_ok "Repository Cloned"

msg_info "Running Installation Script"
# Check if install.sh exists
if ! pct exec $CT_ID -- test -f /opt/sitebuilder/install.sh; then
    msg_error "install.sh not found in /opt/sitebuilder!"
    echo "Listing directory contents:"
    pct exec $CT_ID -- ls -la /opt/sitebuilder
    echo -e "${YW}NOTE: Ensure you have pushed the latest files (including install.sh) to your GitHub repository.${CL}"
    exit 1
fi

pct exec $CT_ID -- chmod +x /opt/sitebuilder/install.sh
pct exec $CT_ID -- bash -c "export LC_ALL=C; cd /opt/sitebuilder && ./install.sh" >/dev/null
msg_ok "Installation Script Completed"

if [ "$NET_MODE" == "dhcp" ]; then
    IP=$(pct exec $CT_ID -- hostname -I | awk '{print $1}')
else
    IP=${IP_ADDRESS%/*} # Remove CIDR
fi

echo -e "${GN}Success!${CL}"
echo -e "Access your SiteBuilder at: http://${IP}:3000"
