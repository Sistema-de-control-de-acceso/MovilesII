#!/bin/bash

# Script para ejecutar pruebas de carga
# Uso: ./run-load-test.sh [scenario] [base_url]

SCENARIO=${1:-peak-hours}
BASE_URL=${2:-http://localhost:3000}

echo "🚀 Ejecutando prueba de carga: $SCENARIO"
echo "📍 URL base: $BASE_URL"
echo ""

# Verificar que K6 esté instalado
if ! command -v k6 &> /dev/null; then
    echo "❌ K6 no está instalado"
    echo "📦 Instalar con: brew install k6 (macOS) o descargar desde https://k6.io"
    exit 1
fi

# Ejecutar prueba
k6 run \
  --env BASE_URL=$BASE_URL \
  --out json=results/${SCENARIO}-$(date +%Y%m%d-%H%M%S).json \
  --out csv=results/${SCENARIO}-$(date +%Y%m%d-%H%M%S).csv \
  scenarios/${SCENARIO}.js

echo ""
echo "✅ Prueba completada"
echo "📊 Resultados guardados en: results/"

