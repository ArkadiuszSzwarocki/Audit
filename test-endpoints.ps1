$endpoints = @(
    '/api/users',
    '/api/kaizen',
    '/api/audits',
    '/api/observations',
    '/api/fault-reports',
    '/api/quality-reports',
    '/api/bhp-reports'
)

$results = @()
foreach ($endpoint in $endpoints) {
    try {
        $response = curl.exe -s -w "`n%{http_code}" -b "admin_session=true" "http://localhost:3000$endpoint" 2>$null
        $http_code = $response[-1]
        $body = $response[0..($response.Length-2)] -join "`n"
        
        if ($http_code -eq "200") {
            $data = $body | ConvertFrom-Json
            $count = if ($data -is [array]) { $data.Count } else { 1 }
            $results += "$endpoint - ✅ HTTP $http_code (Count: $count)"
        } else {
            $results += "$endpoint - ❌ HTTP $http_code"
        }
    } catch {
        $results += "$endpoint - ⚠️ Error: $_"
    }
}

$results | ForEach-Object { Write-Host $_ }
