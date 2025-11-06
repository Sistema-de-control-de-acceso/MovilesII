# Script PowerShell para ejecutar todos los tests de accesibilidad y usabilidad

Write-Host "🧪 Ejecutando tests de accesibilidad y usabilidad..." -ForegroundColor Cyan
Write-Host ""

# Tests de accesibilidad
Write-Host "📱 Ejecutando tests de accesibilidad..." -ForegroundColor Yellow
flutter test test/accessibility/accessibility_test.dart
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Tests de accesibilidad fallaron" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Tests de accesibilidad completados" -ForegroundColor Green
Write-Host ""

# Tests de Material Design
Write-Host "🎨 Ejecutando tests de Material Design..." -ForegroundColor Yellow
flutter test test/accessibility/material_design_test.dart
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Tests de Material Design fallaron" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Tests de Material Design completados" -ForegroundColor Green
Write-Host ""

# Tests de integración
Write-Host "🔄 Ejecutando tests de integración..." -ForegroundColor Yellow
flutter test integration_test/app_navigation_test.dart
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Tests de integración fallaron" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Tests de integración completados" -ForegroundColor Green
Write-Host ""

Write-Host "✨ Todos los tests de accesibilidad y usabilidad completados exitosamente" -ForegroundColor Green
