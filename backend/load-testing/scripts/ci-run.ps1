# Script PowerShell para ejecutar pruebas de carga en CI/CD
# Uso: .\ci-run.ps1 [scenario] [base_url] [mongodb_uri]

param(
    [string]$Scenario = "peak-hours",
    [string]$BaseUrl = "http://localhost:3000",
    [string]$MongoDbUri = "mongodb://localhost:27017/ASISTENCIA"
)

$ErrorActionPreference = "Stop"

$BuildId = if ($env:CI_PIPELINE_ID) { $env:CI_PIPELINE_ID }
           elseif ($env:GITHUB_RUN_ID) { $env:GITHUB_RUN_ID }
           elseif ($env:BUILD_NUMBER) { $env:BUILD_NUMBER }
           else { Get-Date -Format "yyyyMMddHHmmss" }

Write-Host "🚀 CI/CD Load Test" -ForegroundColor Green
Write-Host "  Scenario: $Scenario" -ForegroundColor Cyan
Write-Host "  Base URL: $BaseUrl" -ForegroundColor Cyan
Write-Host "  MongoDB URI: $MongoDbUri" -ForegroundColor Cyan
Write-Host "  Build ID: $BuildId" -ForegroundColor Cyan
Write-Host ""

# Verificar K6
$k6Path = Get-Command k6 -ErrorAction SilentlyContinue
if (-not $k6Path) {
    Write-Host "❌ K6 no está instalado" -ForegroundColor Red
    exit 1
}

# Verificar Node.js
$nodePath = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodePath) {
    Write-Host "❌ Node.js no está instalado" -ForegroundColor Red
    exit 1
}

# Setup de datos
Write-Host "📝 Configurando datos de prueba..." -ForegroundColor Yellow
Set-Location backend
$env:MONGODB_URI = $MongoDbUri
try {
    node load-testing/scripts/setup-staging-data.js
} catch {
    Write-Host "⚠️  Setup data failed, continuing..." -ForegroundColor Yellow
}

# Iniciar servidor
Write-Host "🔧 Iniciando servidor..." -ForegroundColor Yellow
$env:MONGODB_URI = $MongoDbUri
$env:NODE_ENV = "test"
$env:PORT = "3000"

$backendJob = Start-Job -ScriptBlock {
    param($MongoDbUri, $Port)
    $env:MONGODB_URI = $MongoDbUri
    $env:NODE_ENV = "test"
    $env:PORT = $Port
    Set-Location $using:PWD
    npm start 2>&1 | Out-File -FilePath "$env:TEMP\backend.log" -Encoding utf8
} -ArgumentList $MongoDbUri, "3000"

# Esperar servidor
Write-Host "⏳ Esperando servidor..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
$serverReady = $false

while ($attempt -lt $maxAttempts) {
    try {
        $response = Invoke-WebRequest -Uri "$BaseUrl/health" -Method GET -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Servidor listo" -ForegroundColor Green
            $serverReady = $true
            break
        }
    } catch {
        # Continuar intentando
    }
    Start-Sleep -Seconds 1
    $attempt++
}

if (-not $serverReady) {
    Write-Host "❌ Servidor no respondió después de $maxAttempts intentos" -ForegroundColor Red
    Stop-Job $backendJob -ErrorAction SilentlyContinue
    Remove-Job $backendJob -ErrorAction SilentlyContinue
    exit 1
}

# Ejecutar prueba
Write-Host "🧪 Ejecutando prueba de carga..." -ForegroundColor Yellow
Set-Location load-testing

if (-not (Test-Path "results")) {
    New-Item -ItemType Directory -Path "results" | Out-Null
}

$jsonFile = "results\$Scenario-$BuildId.json"
$csvFile = "results\$Scenario-$BuildId.csv"

$env:BASE_URL = $BaseUrl
k6 run `
  --env BASE_URL=$BaseUrl `
  --out json=$jsonFile `
  --out csv=$csvFile `
  scenarios\$Scenario.js

$testExitCode = $LASTEXITCODE

# Analizar resultados
if (Test-Path $jsonFile) {
    Write-Host "📊 Analizando resultados..." -ForegroundColor Yellow
    $reportFile = "results\report-$BuildId.json"
    node scripts/analyze-results.js $jsonFile $reportFile
    
    # Verificar thresholds
    Write-Host "✅ Verificando thresholds..." -ForegroundColor Yellow
    if (Test-Path $reportFile) {
        $report = Get-Content $reportFile | ConvertFrom-Json
        $critical = $report.thresholds.issues | Where-Object { $_.type -eq "critical" }
        $warnings = $report.thresholds.issues | Where-Object { $_.type -eq "warning" }
        
        if ($critical.Count -gt 0) {
            Write-Host "❌ Critical thresholds failed:" -ForegroundColor Red
            $critical | ForEach-Object { Write-Host "  - $($_.message)" -ForegroundColor Red }
            $thresholdExitCode = 1
        }
        
        if ($warnings.Count -gt 0) {
            Write-Host "⚠️  Warning thresholds:" -ForegroundColor Yellow
            $warnings | ForEach-Object { Write-Host "  - $($_.message)" -ForegroundColor Yellow }
        }
        
        if ($report.thresholds.issues.Count -eq 0) {
            Write-Host "✅ All thresholds passed" -ForegroundColor Green
        }
    }
} else {
    Write-Host "⚠️  No se encontró archivo de resultados" -ForegroundColor Yellow
    $thresholdExitCode = 1
}

# Detener servidor
Write-Host "🛑 Deteniendo servidor..." -ForegroundColor Yellow
Stop-Job $backendJob -ErrorAction SilentlyContinue
Remove-Job $backendJob -ErrorAction SilentlyContinue

# Exit code
if ($testExitCode -ne 0 -or $thresholdExitCode -ne 0) {
    exit 1
}

Write-Host "✅ Prueba completada exitosamente" -ForegroundColor Green

