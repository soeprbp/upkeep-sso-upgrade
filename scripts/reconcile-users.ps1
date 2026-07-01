$ErrorActionPreference = "Stop"

Write-Host "Fetching UpKeep users..."
npm run upkeep:users

Write-Host "Looking up UpKeep user emails in local AD..."
npm run ad:users

Write-Host "Comparing UpKeep users with local AD lookup results..."
npm run users:diff -- --entra-csv data\generated\ad-users.csv

Write-Host "Writing sanitized dashboard summary..."
npm run users:summary

Write-Host "User reconciliation complete. Detailed user files are under data\generated and are git-ignored."
