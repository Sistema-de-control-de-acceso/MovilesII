#!/bin/bash

# Script para ejecutar todos los tests de accesibilidad y usabilidad

set -e

echo "🧪 Ejecutando tests de accesibilidad y usabilidad..."
echo ""

# Tests de accesibilidad
echo "📱 Ejecutando tests de accesibilidad..."
flutter test test/accessibility/accessibility_test.dart
echo "✅ Tests de accesibilidad completados"
echo ""

# Tests de Material Design
echo "🎨 Ejecutando tests de Material Design..."
flutter test test/accessibility/material_design_test.dart
echo "✅ Tests de Material Design completados"
echo ""

# Tests de integración
echo "🔄 Ejecutando tests de integración..."
flutter test integration_test/app_navigation_test.dart
echo "✅ Tests de integración completados"
echo ""

echo "✨ Todos los tests de accesibilidad y usabilidad completados exitosamente"
