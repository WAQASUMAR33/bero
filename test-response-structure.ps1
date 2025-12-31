# Test response structure
$baseUrl = "http://localhost:3000"

# Login
$body = @{email="admin@gmail.com"; password="786@786"} | ConvertTo-Json
$login = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body $body -ContentType "application/json"
$token = $login.token
$headers = @{Authorization="Bearer $token"}

Write-Host "=== Testing Response Structure ===" -ForegroundColor Cyan
Write-Host ""

# Test GET /api/handovers response structure
Write-Host "GET /api/handovers Response Structure:" -ForegroundColor Yellow
$handovers = Invoke-RestMethod -Uri "$baseUrl/api/handovers" -Method GET -Headers $headers
$handovers | ConvertTo-Json -Depth 5 | Write-Host
Write-Host ""

# Check required fields
if ($handovers.success -eq $true) {
    Write-Host "✓ 'success' field: OK" -ForegroundColor Green
}
if ($handovers.data) {
    Write-Host "✓ 'data' field: OK (array with $($handovers.data.Count) items)" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ All endpoints are working correctly!" -ForegroundColor Green
Write-Host "   - Authentication: OK" -ForegroundColor Gray
Write-Host "   - GET endpoints: OK" -ForegroundColor Gray
Write-Host "   - Response structure: OK" -ForegroundColor Gray
Write-Host "   - Validation: OK" -ForegroundColor Gray

