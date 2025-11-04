# Script PowerShell para ejecutar tests E2E contra ambiente de staging

Write-Host "🚀 Ejecutando tests E2E contra staging..." -ForegroundColor Cyan

# Verificar que las variables de entorno estén configuradas
if (-not $env:STAGING_API_URL) {
    Write-Host "❌ Error: STAGING_API_URL no está configurada" -ForegroundColor Red
    Write-Host "   Configurar con: `$env:STAGING_API_URL='http://staging-api.example.com'"
    exit 1
}

if (-not $env:STAGING_MONGODB_URI) {
    Write-Host "❌ Error: STAGING_MONGODB_URI no está configurada" -ForegroundColor Red
    Write-Host "   Configurar con: `$env:STAGING_MONGODB_URI='mongodb://staging-db.example.com/asistencia'"
    exit 1
}

# Configurar variables de entorno
$env:NODE_ENV = "staging"
$env:API_URL = $env:STAGING_API_URL
$env:MONGODB_URI = $env:STAGING_MONGODB_URI

Write-Host "✅ Configuración:" -ForegroundColor Green
Write-Host "   API URL: $env:API_URL"
Write-Host "   MongoDB URI: $($env:MONGODB_URI.Substring(0, [Math]::Min(30, $env:MONGODB_URI.Length)))..."
Write-Host "   NODE_ENV: $env:NODE_ENV"
Write-Host ""

# Ejecutar tests E2E
npm run test:e2e

# Ejecutar contract tests
Write-Host ""
Write-Host "📋 Ejecutando contract tests..." -ForegroundColor Cyan
npm run test:contracts

Write-Host ""
Write-Host "✅ Tests E2E completados" -ForegroundColor Green

