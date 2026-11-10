# 一键启动本机后端：PostgreSQL 17（便携版）+ Express API
# 用法：powershell -ExecutionPolicy Bypass -File scripts\start-server.ps1
$ErrorActionPreference = 'Stop'

$toolchain = Join-Path $env:LOCALAPPDATA 'campus-toolchain'
$pgBin = Join-Path $toolchain 'pg\pgsql\bin'
$pgData = Join-Path $toolchain 'pgdata'
$apiDir = Join-Path (Split-Path -Parent $PSScriptRoot) 'server'
$logDir = Join-Path $toolchain 'logs'

New-Item -ItemType Directory -Force -Path $logDir | Out-Null

function Test-Listening([int]$Port) {
    return [bool](Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue)
}

function Wait-Port([int]$Port, [int]$Seconds = 30) {
    for ($i = 0; $i -lt $Seconds; $i++) {
        if (Test-Listening $Port) { return $true }
        Start-Sleep -Seconds 1
    }
    return $false
}

# 1. PostgreSQL
if (Test-Listening 5432) {
    Write-Host '[db ] 5432 已在监听，跳过启动'
} else {
    Write-Host '[db ] 启动 PostgreSQL...'
    Start-Process -FilePath (Join-Path $pgBin 'postgres.exe') `
        -ArgumentList '-D', $pgData, '-p', '5432', '-c', 'listen_addresses=0.0.0.0' `
        -WindowStyle Hidden
    if (-not (Wait-Port 5432 30)) { throw 'PostgreSQL 未能在 30 秒内监听 5432，检查 pgdata 与日志' }
    Write-Host '[db ] 5432 就绪'
}

# 2. API
if (Test-Listening 3000) {
    Write-Host '[api] 3000 已在监听，跳过启动'
} else {
    Write-Host '[api] 启动 Express（tsx watch）...'
    Start-Process -FilePath 'npm.cmd' -ArgumentList 'run', 'dev' `
        -WorkingDirectory $apiDir -WindowStyle Hidden `
        -RedirectStandardOutput (Join-Path $logDir 'api.out.log') `
        -RedirectStandardError (Join-Path $logDir 'api.err.log')
    if (-not (Wait-Port 3000 60)) { throw "API 未能在 60 秒内监听 3000，见 $logDir\api.err.log" }
    Write-Host '[api] 3000 就绪'
}

# 3. 健康检查与访问地址
try {
    $health = Invoke-RestMethod 'http://127.0.0.1:3000/api/health' -TimeoutSec 10
    $state = if ($health.success) { 'ok' } else { 'failed' }
} catch {
    $state = "unreachable: $($_.Exception.Message)"
}
Write-Host "[api] /api/health => $state"

$lan = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
    Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' -and $_.IPAddress -notlike '198.18.*' } |
    Select-Object -ExpandProperty IPAddress

Write-Host ''
Write-Host '本机访问:  http://127.0.0.1:3000/api/health'
foreach ($ip in $lan) { Write-Host "局域网:    http://${ip}:3000/api/health" }
Write-Host ''
Write-Host '提示: Windows 防火墙处于 Public 配置时会拦截入站 3000；手机访问前需以管理员身份放行：'
Write-Host '  netsh advfirewall firewall add rule name="campus-team api" dir=in action=allow protocol=TCP localport=3000'
