# PowerShell test script for Handover API
# Make sure your Next.js server is running first: npm run dev

$baseUrl = "http://localhost:3000"
$testEmail = "admin@gmail.com"
$testPassword = "786@786"
$authToken = ""

Write-Host "🚀 Starting Handover API Tests" -ForegroundColor Cyan
Write-Host "⚠️  Make sure your Next.js server is running on http://localhost:3000`n" -ForegroundColor Yellow

# Test 1: Login
Write-Host "🔐 Testing Login..." -ForegroundColor Cyan
try {
    $loginBody = @{
        email = $testEmail
        password = $testPassword
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    
    if ($loginResponse.token) {
        $authToken = $loginResponse.token
        Write-Host "✅ Login successful" -ForegroundColor Green
        Write-Host "   User: $($loginResponse.user.firstName) $($loginResponse.user.lastName)" -ForegroundColor Gray
        Write-Host "   User ID: $($loginResponse.user.id)`n" -ForegroundColor Gray
    } else {
        Write-Host "❌ Login failed: No token received" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Login error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Message -like "*connection*") {
        Write-Host "   Server is not running. Please start with: npm run dev" -ForegroundColor Yellow
    }
    exit 1
}

# Test 2: Get All Handovers
Write-Host "📋 Testing GET /api/handovers..." -ForegroundColor Cyan
try {
    $headers = @{
        "Authorization" = "Bearer $authToken"
    }
    $handoversResponse = Invoke-RestMethod -Uri "$baseUrl/api/handovers" -Method GET -Headers $headers
    Write-Host "✅ GET handovers successful" -ForegroundColor Green
    Write-Host "   Found $($handoversResponse.data.Count) handover(s)`n" -ForegroundColor Gray
} catch {
    Write-Host "❌ GET handovers error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Status: $($_.Exception.Response.StatusCode.value__)`n" -ForegroundColor Gray
}

# Test 3: Get Handover Data (helper endpoint)
Write-Host "📊 Testing GET /api/handovers/handover-data..." -ForegroundColor Cyan
try {
    $serviceSeekerId = 1
    $date = Get-Date -Format "yyyy-MM-dd"
    $queryParams = "serviceSeekerId=$serviceSeekerId"
    $queryParams = $queryParams + [char]0x26 + "date=$date"  # 0x26 is & in hex
    $handoverDataUrl = "$baseUrl/api/handovers/handover-data?" + $queryParams
    $handoverDataResponse = Invoke-RestMethod -Uri $handoverDataUrl -Method GET -Headers $headers
    Write-Host "✅ GET handover data successful" -ForegroundColor Green
    Write-Host "   Service Seeker ID: $($handoverDataResponse.data.serviceSeekerId)" -ForegroundColor Gray
    Write-Host "   Date: $($handoverDataResponse.data.date)" -ForegroundColor Gray
    Write-Host "   Visits: $($handoverDataResponse.data.visits.Count)`n" -ForegroundColor Gray
} catch {
    Write-Host "❌ GET handover data error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   (This is OK if service seeker ID 1 doesn't exist)`n" -ForegroundColor Gray
}

# Test 4: Test with filters
Write-Host "🔍 Testing GET /api/handovers with date filter..." -ForegroundColor Cyan
try {
    $today = Get-Date -Format "yyyy-MM-dd"
    $filteredResponse = Invoke-RestMethod -Uri "$baseUrl/api/handovers?date=$today" -Method GET -Headers $headers
    Write-Host "✅ GET handovers with date filter successful" -ForegroundColor Green
    Write-Host "   Found $($filteredResponse.data.Count) handover(s) for today`n" -ForegroundColor Gray
} catch {
    Write-Host "❌ GET handovers with filter error: $($_.Exception.Message)`n" -ForegroundColor Red
}

Write-Host "✅ Basic API tests completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Note: To test POST /api/handovers, you'll need:" -ForegroundColor Yellow
Write-Host "   - Valid fromShiftAssignmentId" -ForegroundColor Gray
Write-Host "   - Valid toShiftAssignmentId (must be at same location)" -ForegroundColor Gray
Write-Host "   - Both shift assignments must exist in the database" -ForegroundColor Gray
