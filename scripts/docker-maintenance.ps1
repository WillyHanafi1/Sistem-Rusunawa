# Docker Maintenance Script for Sistem Rusunawa
# Run this script if Docker feels slow or stuck.

Write-Host "--- Stopping all running containers ---" -ForegroundColor Yellow
docker stop $(docker ps -aq)

Write-Host "--- Pruning unused Docker resources ---" -ForegroundColor Yellow
docker system prune -f

Write-Host "--- Cleaning up dangling volumes ---" -ForegroundColor Yellow
docker volume prune -f

Write-Host "--- Restarting Rusunawa Project ---" -ForegroundColor Cyan
docker compose up -d

Write-Host "--- Current Status ---" -ForegroundColor Green
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
