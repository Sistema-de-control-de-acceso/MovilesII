# Script PowerShell para ejecutar pruebas de carga
# Uso: .\run-load-test.ps1 [scenario] [base_url]

param(
    [string]$Scenario = "peak-hours",
    [string]$BaseUrl = "http://localhost:3000"
)

Write-Host "🚀 Ejecutando prueba de carga: $Scenario" -ForegroundColor Green
Write-Host "📍 URL base: $BaseUrl" -ForegroundColor Cyan
Write-Host ""

# Verificar que K6 esté instalado
$k6Path = Get-Command k6 -ErrorAction SilentlyContinue
if (-not $k6Path) {
    Write-Host "❌ K6 no está instalado" -ForegroundColor Red
    Write-Host "📦 Instalar con: choco install k6 (Windows) o descargar desde https://k6.io" -ForegroundColor Yellow
    exit 1
}

# Crear directorio de resultados si no existe
$resultsDir = "results"
if (-not (Test-Path $resultsDir)) {
    New-Item -ItemType Directory -Path $resultsDir | Out-Null
}

# Generar nombre de archivo con timestamp
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$jsonFile = "$resultsDir\$Scenario-$timestamp.json"
$csvFile = "$resultsDir\$Scenario-$timestamp.csv"

# Ejecutar prueba
Write-Host "⏳ Ejecutando prueba..." -ForegroundColor Yellow
k6 run `
  --env BASE_URL=$BaseUrl `
  --out json=$jsonFile `
  --out csv=$csvFile `
  scenarios/$Scenario.js

Write-Host ""
Write-Host "✅ Prueba completada" -ForegroundColor Green
Write-Host "📊 Resultados guardados en: $resultsDir" -ForegroundColor Cyan

