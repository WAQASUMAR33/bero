# Simple PowerShell test for Handover API
# Run: npm run dev first, then: powershell -ExecutionPolicy Bypass -File test-handover-api-simple.ps1

$baseUrl = "http://localhost:3000"
$testEmail = "admin@gmail.com"
$testPassword = "786@786"

Write-Host "Testing Handover API..." -ForegroundColor Cyan

# Login
try {
    $body = @{email=$testEmail; password=$testPassword} | ConvertTo-Json
    $login = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body $body -ContentType "application/json"
    $token = $login.token
    Write-Host "Login OK - User: $($login.user.firstName)" -ForegroundColor Green
} catch {
    Write-Host "Login FAILED: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

# Get Handovers
try {
    $headers = @{Authorization="Bearer $token"}
    $handovers = Invoke-RestMethod -Uri "$baseUrl/api/handovers" -Method GET -Headers $headers
    Write-Host "GET /api/handovers OK - Found $($handovers.data.Count) handovers" -ForegroundColor Green
} catch {
    Write-Host "GET handovers FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Test complete!" -ForegroundColor Cyan

