# Developer Neon Branch Setup Script
# Creates a personal Neon branch for local development
# Usage: .\scripts\dev-branch.ps1 [branch-name]

param(
    [string]$BranchName = "dev-$env:USERNAME"
)

$NEON_PROJECT_ID = "polished-sound-81352481"

if (-not $env:NEON_API_KEY) {
    Write-Host "Error: NEON_API_KEY environment variable is not set" -ForegroundColor Red
    Write-Host "Get your API key from: https://console.neon.tech/app/settings/api-keys"
    exit 1
}

Write-Host "Creating Neon branch: $BranchName" -ForegroundColor Cyan

# Create branch using Neon API
$headers = @{
    "Authorization" = "Bearer $env:NEON_API_KEY"
    "Content-Type" = "application/json"
}

$body = @{
    branch = @{
        name = $BranchName
        parent_id = "main"
    }
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "https://console.neon.tech/api/v2/projects/$NEON_PROJECT_ID/branches" `
        -Method POST `
        -Headers $headers `
        -Body $body
    
    $branchId = $response.branch.id
    $connectionString = $response.branch.connection_uri
    
    if (-not $branchId) {
        Write-Host "Error creating branch:" -ForegroundColor Red
        $response | ConvertTo-Json -Depth 10 | Write-Host
        exit 1
    }
    
    Write-Host "✅ Branch created successfully!" -ForegroundColor Green
    Write-Host "Branch ID: $branchId"
    Write-Host "Connection String: $connectionString"
    
    # Run migrations on the new branch
    Write-Host ""
    Write-Host "Running migrations on branch..." -ForegroundColor Cyan
    
    $env:DATABASE_URL = $connectionString
    npm run db:push
    
    Write-Host ""
    Write-Host "✅ Setup complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "To use this branch, run:" -ForegroundColor Yellow
    Write-Host "  `$env:DATABASE_URL = `"$connectionString`""
    Write-Host "  npm run dev"
    Write-Host ""
    Write-Host "Or add to .env.local:" -ForegroundColor Yellow
    Write-Host "  DATABASE_URL=$connectionString"
}
catch {
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}