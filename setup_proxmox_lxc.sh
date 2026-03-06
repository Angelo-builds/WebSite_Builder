#!/bin/bash

# Proxmox Host Setup Script
# Run this script on your Proxmox VE Node to create an LXC container and deploy the SiteBuilder.

set -e

# Configuration
CT_ID=${1:-105} # Default Container ID
CT_PASS=${2:-"proxmox"} # Default Root Password
TEMPLATE="local:vztmpl/debian-12-standard_12.2-1_amd64.tar.zst" # Adjust if needed
STORAGE="local-lvm"
BRIDGE="vmbr0"
CORES=4
MEMORY=4096
SWAP=1024
HOSTNAME="sitebuilder-lxc"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}=== Proxmox SiteBuilder Deployment ===${NC}"
echo -e "Container ID: ${GREEN}${CT_ID}${NC}"
echo -e "Hostname: ${GREEN}${HOSTNAME}${NC}"

# Check if template exists
if ! pveam list local | grep -q "debian-12-standard"; then
    echo -e "${BLUE}Downloading Debian 12 template...${NC}"
    pveam update
    # Attempt to download the latest Debian 12 template
    TEMPLATE_NAME=$(pveam available --section system | grep "debian-12-standard" | head -n 1 | awk '{print $2}')
    if [ -z "$TEMPLATE_NAME" ]; then
        echo -e "${RED}Error: Debian 12 template not found in available list.${NC}"
        exit 1
    fi
    pveam download local $TEMPLATE_NAME
    TEMPLATE="local:vztmpl/$TEMPLATE_NAME"
else
    # Use existing template
    TEMPLATE_NAME=$(pveam list local | grep "debian-12-standard" | head -n 1 | awk '{print $2}')
    TEMPLATE="local:vztmpl/$TEMPLATE_NAME"
fi

# Create LXC
echo -e "${BLUE}Creating LXC Container...${NC}"
pct create $CT_ID $TEMPLATE \
    --hostname $HOSTNAME \
    --password $CT_PASS \
    --storage $STORAGE \
    --rootfs 20 \
    --net0 name=eth0,bridge=$BRIDGE,ip=dhcp \
    --cores $CORES \
    --memory $MEMORY \
    --swap $SWAP \
    --features nesting=1 \
    --unprivileged 1 \
    --start 1

echo -e "${GREEN}Container started. Waiting for network...${NC}"
sleep 10

# Prepare Application Files
echo -e "${BLUE}Packaging application files...${NC}"
# Exclude node_modules and dist to save time/space
tar --exclude='node_modules' --exclude='dist' --exclude='.git' -cf sitebuilder.tar .

# Upload and Install
echo -e "${BLUE}Uploading and Installing...${NC}"
pct exec $CT_ID -- mkdir -p /root/sitebuilder
pct push $CT_ID sitebuilder.tar /root/sitebuilder/sitebuilder.tar
pct exec $CT_ID -- tar -xf /root/sitebuilder/sitebuilder.tar -C /root/sitebuilder
pct exec $CT_ID -- bash /root/sitebuilder/install.sh

# Cleanup
rm sitebuilder.tar

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Deployment Successful!${NC}"
echo -e "Container ID: $CT_ID"
echo -e "IP Address: $(pct exec $CT_ID -- hostname -I | awk '{print $1}')"
echo -e "Access the app at: http://<CONTAINER-IP>:3000"
echo -e "${BLUE}========================================${NC}"
