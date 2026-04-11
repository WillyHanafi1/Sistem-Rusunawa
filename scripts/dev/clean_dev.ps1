$port3000Pids = (Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue).OwningProcess
if ($port3000Pids) {
    Write-Host "Killing processes on port 3000: $port3000Pids"
    Stop-Process -Id $port3000Pids -Force -ErrorAction SilentlyContinue
} else {
    Write-Host "No processes found on port 3000."
}

Write-Host "Cleaning .next cache directory..."
Remove-Item -Recurse -Force "rusun-frontend\.next" -ErrorAction SilentlyContinue

Write-Host "Done! You can now run 'npm run dev' safely."
