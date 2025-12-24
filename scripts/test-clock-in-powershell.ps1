# PowerShell script to test Clock-In API (like Postman)
# Usage: .\scripts\test-clock-in-powershell.ps1 -Email "your-email@example.com" -Password "your-password"

param(
    [string]$Email = "admin@example.com",
    [string]$Password = "password",
    [string]$BaseUrl = "http://localhost:3000"
)

$separator = "=" * 70
$dash = "-" * 70

Write-Host "🧪 Testing Clock-In API (Postman-style)" -ForegroundColor Cyan
Write-Host $separator
Write-Host ""

# Step 1: Login
Write-Host "📋 Step 1: Login" -ForegroundColor Yellow
Write-Host $dash

$loginBody = @{
    email = $Email
    password = $Password
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    
    if ($loginResponse.success -and $loginResponse.token) {
        $token = $loginResponse.token
        $userId = $loginResponse.user.id
        Write-Host "✅ Login successful!" -ForegroundColor Green
        Write-Host "   User ID: $userId"
        Write-Host "   Email: $($loginResponse.user.email)"
        Write-Host "   Token: $($token.Substring(0, 20))..."
        Write-Host ""
    } else {
        Write-Host "❌ Login failed: $($loginResponse.error)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Login error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "   Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    exit 1
}

# Step 2: Get Shifts
Write-Host "📋 Step 2: Get Available Shifts" -ForegroundColor Yellow
Write-Host $dash

$today = Get-Date -Format "yyyy-MM-dd"
$headers = @{
    "Authorization" = "Bearer $token"
}

try {
    $shiftsResponse = Invoke-RestMethod -Uri "$BaseUrl/api/clock-in-out/my-shifts?date=$today" -Method Get -Headers $headers
    
    if ($shiftsResponse.success) {
        $shifts = $shiftsResponse.data
        Write-Host "✅ Found $($shifts.Count) shift(s) for $today" -ForegroundColor Green
        
        if ($shifts.Count -eq 0) {
            Write-Host "⚠️  No shifts found. Please create a shift first." -ForegroundColor Yellow
            exit 1
        }
        
        # Display shifts
        foreach ($shift in $shifts) {
            Write-Host "   Shift:" -ForegroundColor Cyan
            Write-Host "     Shift Assignment ID: $($shift.shiftAssignmentId)"
            Write-Host "     Shift ID: $($shift.shiftId)"
            Write-Host "     Service Seeker: $($shift.serviceSeeker.preferredName) $($shift.serviceSeeker.lastName)"
            Write-Host "     Time: $($shift.startTime) - $($shift.endTime)"
            Write-Host "     Status: $($shift.status)"
            Write-Host "     Already Clocked In: $($shift.clockedIn)"
            Write-Host ""
        }
    } else {
        Write-Host "❌ Failed to fetch shifts: $($shiftsResponse.error)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error fetching shifts: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 3: Test Clock-In
Write-Host "📋 Step 3: Test Clock-In" -ForegroundColor Yellow
Write-Host $dash

$firstShift = $shifts[0]
Write-Host "Using first shift:" -ForegroundColor Cyan
Write-Host "  Shift Assignment ID: $($firstShift.shiftAssignmentId)"
Write-Host "  Shift ID: $($firstShift.shiftId)"
Write-Host ""

# Check if already clocked in
if ($firstShift.clockedIn) {
    Write-Host "⚠️  Already clocked in for this shift. Clock out first to test clock-in again." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Testing clock-out instead..." -ForegroundColor Cyan
    
    if ($firstShift.clockInOutId) {
        $clockOutBody = @{
            clockInOutId = $firstShift.clockInOutId
            location = "51.5074,-0.1278"
            notes = "Test clock out"
        } | ConvertTo-Json
        
        try {
            $clockOutResponse = Invoke-RestMethod -Uri "$BaseUrl/api/clock-in-out/clock-out" -Method Post -Body $clockOutBody -ContentType "application/json" -Headers $headers
            Write-Host "✅ Clock-out successful!" -ForegroundColor Green
            Write-Host ($clockOutResponse | ConvertTo-Json -Depth 5)
            exit 0
        } catch {
            Write-Host "❌ Clock-out error: $($_.Exception.Message)" -ForegroundColor Red
            exit 1
        }
    }
}

# Clock-in request body
$clockInBody = @{
    shiftAssignmentId = $firstShift.shiftAssignmentId
    shiftId = $firstShift.shiftId
    serviceSeekerId = $firstShift.serviceSeeker.id
    date = $today
    workType = "REGULAR"
    location = "51.5074,-0.1278"
    notes = "Test clock-in from PowerShell script"
} | ConvertTo-Json

Write-Host "Request Body:" -ForegroundColor Cyan
Write-Host ($clockInBody | ConvertFrom-Json | ConvertTo-Json -Depth 3)
Write-Host ""

try {
    $clockInResponse = Invoke-RestMethod -Uri "$BaseUrl/api/clock-in-out/clock-in" -Method Post -Body $clockInBody -ContentType "application/json" -Headers $headers
    
    Write-Host "✅ Clock-in successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Cyan
    Write-Host ($clockInResponse | ConvertTo-Json -Depth 5)
    Write-Host ""
    
    if ($clockInResponse.success) {
        Write-Host "Details:" -ForegroundColor Cyan
        Write-Host "  Clock In Record ID: $($clockInResponse.data.id)"
        Write-Host "  Shift Assignment ID: $($clockInResponse.data.shiftAssignmentId)"
        Write-Host "  Clock In Time: $($clockInResponse.data.clockInTime)"
        Write-Host "  Is Late: $($clockInResponse.data.isLate)"
        Write-Host "  Message: $($clockInResponse.message)"
        Write-Host ""
        Write-Host "🎉 Test completed successfully!" -ForegroundColor Green
    }
    
} catch {
    Write-Host "❌ Clock-in failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "Response:" -ForegroundColor Yellow
        Write-Host ($errorDetails | ConvertTo-Json -Depth 3)
    }
    exit 1
}

Write-Host $separator

