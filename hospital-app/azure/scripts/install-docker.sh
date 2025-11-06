#!/usr/bin/env bash
set -euo pipefail

echo "Installing Docker..."
curl -fsSL https://get.docker.com | sh

echo "Adding current user to docker group..."
sudo usermod -aG docker "$USER" || true

echo "Installing docker compose plugin..."
sudo apt-get update -y
sudo apt-get install -y docker-compose-plugin

echo "Docker versions:"
docker --version || true
docker compose version || true

echo "Done. You may need to log out/in for group changes to take effect."


