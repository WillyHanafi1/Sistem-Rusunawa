#!/bin/bash
# =========================================
# deploy.sh - Script deployment Sistem Rusunawa
# Jalankan di server Droplet: bash deploy.sh
# =========================================

set -e  # Henti jika ada error

PROJECT_DIR="/opt/rusunawa"
COMPOSE_FILE="docker-compose.prod.yml"

echo "🚀 Mulai deployment Sistem Rusunawa..."

# 1. Masuk ke direktori project
cd $PROJECT_DIR

# 2. Pull code terbaru dari GitHub
echo "📥 Mengambil code terbaru dari GitHub..."
git pull origin main

# 3. Build ulang Docker images
echo "🔨 Build Docker images..."
docker compose -f $COMPOSE_FILE build --no-cache

# 4. Restart semua service
echo "🔄 Restart semua container..."
docker compose -f $COMPOSE_FILE up -d

# 5. Cek status
echo "✅ Status container:"
docker compose -f $COMPOSE_FILE ps

echo ""
echo "🎉 Deployment selesai!"
echo "📌 Cek log dengan: docker compose -f $COMPOSE_FILE logs -f"
