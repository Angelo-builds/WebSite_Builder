#!/bin/bash

# Web Builder Update Script
# This script checks for updates from the git repository and applies them
# without deleting your local database or projects.

echo "======================================="
echo "   Web Builder - Update Utility"
echo "======================================="
echo ""

# Ensure we are in the right directory
cd "$(dirname "$0")"

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install git to use the update feature."
    echo "Run: apt-get install git"
    exit 1
fi

# Check if this is a git repository
if [ ! -d ".git" ]; then
    echo "❌ This directory is not a git repository."
    echo "To use automatic updates, you need to clone the project via git instead of downloading a ZIP."
    echo "Example: git clone <your-repo-url> ."
    exit 1
fi

echo "🔄 Checking for updates..."
git fetch origin

LOCAL=$(git rev-parse @)
REMOTE=$(git rev-parse @{u})

if [ "$LOCAL" = "$REMOTE" ]; then
    echo "✅ Your system is already up to date!"
    exit 0
fi

echo "✨ An update is available!"
echo ""
read -p "Do you want to update now? Your projects and database will NOT be deleted. (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📦 Stashing any local modifications..."
    git stash

    echo "⬇️  Pulling latest version..."
    git pull origin main

    echo "⚙️  Installing dependencies..."
    npm install

    echo "🏗️  Building application..."
    npm run build

    echo "✅ Update complete!"
    echo ""
    echo "🔄 Please restart your server to apply the changes."
    if command -v pm2 &> /dev/null; then
        echo "Detected PM2. Restarting..."
        pm2 restart all
    else
        echo "If you are running via systemd, run: sudo systemctl restart your-service-name"
        echo "If you are running manually, stop the process (Ctrl+C) and run: npm start"
    fi
else
    echo "❌ Update cancelled."
fi
