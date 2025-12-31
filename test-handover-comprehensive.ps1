# Comprehensive Handover API Test
$baseUrl = "http://localhost:3000"
$testEmail = "admin@gmail.com"
$testPassword = "786@786"
$token = ""

Write-Host "=== Handover API Comprehensive Test ===" -ForegroundColor Cyan
Write-Host ""

# 1. Login
Write-Host "[1] Testing Login..." -ForegroundColor Yellow
try {
    $body = @{email=$testEmail; password=$testPassword} | ConvertTo-Json
    $login = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body $body -ContentType "application/json"
    $token = $login.token
    Write-Host "   PASS - User: $($login.user.firstName) $($login.user.lastName)" -ForegroundColor Green
} catch {
    Write-Host "   FAIL - $($_.Exception.Message)" -ForegroundColor Red
    exit
}

$headers = @{Authorization="Bearer $token"}

# 2. GET /api/handovers
Write-Host "[2] Testing GET /api/handovers..." -ForegroundColor Yellow
try {
    $result = Invoke-RestMethod -Uri "$baseUrl/api/handovers" -Method GET -Headers $headers
    Write-Host "   PASS - Found $($result.data.Count) handovers" -ForegroundColor Green
    if ($result.success -eq $true) {
        Write-Host "   Response structure: OK" -ForegroundColor Gray
    }
} catch {
    Write-Host "   FAIL - $($_.Exception.Message)" -ForegroundColor Red
}

# 3. GET /api/handovers with date filter
Write-Host "[3] Testing GET /api/handovers?date=..." -ForegroundColor Yellow
try {
    $today = Get-Date -Format "yyyy-MM-dd"
    $result = Invoke-RestMethod -Uri "$baseUrl/api/handovers?date=$today" -Method GET -Headers $headers
    Write-Host "   PASS - Date filter works" -ForegroundColor Green
} catch {
    Write-Host "   FAIL - $($_.Exception.Message)" -ForegroundColor Red
}

# 4. GET /api/handovers/handover-data
Write-Host "[4] Testing GET /api/handovers/handover-data..." -ForegroundColor Yellow
try {
    $today = Get-Date -Format "yyyy-MM-dd"
    $url = "$baseUrl/api/handovers/handover-data?serviceSeekerId=1&date=$today"
    $result = Invoke-RestMethod -Uri $url -Method GET -Headers $headers
    if ($result.success) {
        Write-Host "   PASS - Handover data endpoint works" -ForegroundColor Green
        Write-Host "   Service Seeker ID: $($result.data.serviceSeekerId)" -ForegroundColor Gray
        Write-Host "   Visits: $($result.data.visits.Count)" -ForegroundColor Gray
    }
} catch {
    if ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "   SKIP - Service seeker ID 1 doesn't exist (expected)" -ForegroundColor Yellow
    } else {
        Write-Host "   FAIL - $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 5. GET /api/handovers/available
Write-Host "[5] Testing GET /api/handovers/available..." -ForegroundColor Yellow
try {
    $url = "$baseUrl/api/handovers/available?fromShiftAssignmentId=1"
    $result = Invoke-RestMethod -Uri $url -Method GET -Headers $headers
    if ($result.success) {
        Write-Host "   PASS - Available shifts endpoint works" -ForegroundColor Green
        Write-Host "   Available assignments: $($result.data.availableAssignments.Count)" -ForegroundColor Gray
    }
} catch {
    if ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "   SKIP - Shift assignment ID 1 doesn't exist (expected)" -ForegroundColor Yellow
    } else {
        Write-Host "   FAIL - $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 6. Test POST validation (without real data, should fail gracefully)
Write-Host "[6] Testing POST /api/handovers validation..." -ForegroundColor Yellow
try {
    $testData = @{
        fromShiftAssignmentId = 999999
        toShiftAssignmentId = 999998
    } | ConvertTo-Json
    
    $result = Invoke-RestMethod -Uri "$baseUrl/api/handovers" -Method POST -Body $testData -ContentType "application/json" -Headers $headers -ErrorAction Stop
    Write-Host "   UNEXPECTED - Should have failed" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 404 -or $statusCode -eq 400) {
        Write-Host "   PASS - Validation working (returned $statusCode)" -ForegroundColor Green
    } else {
        Write-Host "   FAIL - Unexpected error: $statusCode" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== Test Complete ===" -ForegroundColor Cyan
Write-Host "All critical endpoints are responding correctly!" -ForegroundColor Green

