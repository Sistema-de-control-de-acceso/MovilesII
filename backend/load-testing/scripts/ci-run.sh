#!/bin/bash

# Script genérico para ejecutar pruebas de carga en CI/CD
# Uso: ./ci-run.sh [scenario] [base_url] [mongodb_uri]

set -e

SCENARIO=${1:-peak-hours}
BASE_URL=${2:-http://localhost:3000}
MONGODB_URI=${3:-mongodb://localhost:27017/ASISTENCIA}
BUILD_ID=${CI_PIPELINE_ID:-${GITHUB_RUN_ID:-${BUILD_NUMBER:-$(date +%s)}}}

echo "🚀 CI/CD Load Test"
echo "  Scenario: $SCENARIO"
echo "  Base URL: $BASE_URL"
echo "  MongoDB URI: $MONGODB_URI"
echo "  Build ID: $BUILD_ID"
echo ""

# Verificar que K6 esté instalado
if ! command -v k6 &> /dev/null; then
    echo "❌ K6 no está instalado"
    exit 1
fi

# Verificar que Node.js esté instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado"
    exit 1
fi

# Setup de datos de prueba
echo "📝 Configurando datos de prueba..."
cd backend
export MONGODB_URI=$MONGODB_URI
node load-testing/scripts/setup-staging-data.js || echo "⚠️  Setup data failed, continuing..."

# Iniciar servidor en background
echo "🔧 Iniciando servidor..."
MONGODB_URI=$MONGODB_URI NODE_ENV=test PORT=3000 npm start > /tmp/backend.log 2>&1 &
BACKEND_PID=$!

# Esperar a que el servidor esté listo
echo "⏳ Esperando servidor..."
for i in {1..30}; do
    if curl -f -s $BASE_URL/health > /dev/null 2>&1; then
        echo "✅ Servidor listo"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Servidor no respondió después de 30 intentos"
        kill $BACKEND_PID 2>/dev/null || true
        exit 1
    fi
    sleep 1
done

# Ejecutar prueba de carga
echo "🧪 Ejecutando prueba de carga..."
cd load-testing
mkdir -p results

k6 run \
  --env BASE_URL=$BASE_URL \
  --out json=results/${SCENARIO}-${BUILD_ID}.json \
  --out csv=results/${SCENARIO}-${BUILD_ID}.csv \
  scenarios/${SCENARIO}.js || TEST_EXIT_CODE=$?

# Analizar resultados
if [ -f results/${SCENARIO}-${BUILD_ID}.json ]; then
    echo "📊 Analizando resultados..."
    node scripts/analyze-results.js results/${SCENARIO}-${BUILD_ID}.json results/report-${BUILD_ID}.json
    
    # Verificar thresholds
    echo "✅ Verificando thresholds..."
    node -e "
        const report = require('./results/report-${BUILD_ID}.json');
        const issues = report.thresholds.issues || [];
        const critical = issues.filter(i => i.type === 'critical');
        const warnings = issues.filter(i => i.type === 'warning');
        
        if (critical.length > 0) {
            console.error('❌ Critical thresholds failed:');
            critical.forEach(i => console.error('  -', i.message));
            process.exit(1);
        }
        
        if (warnings.length > 0) {
            console.warn('⚠️  Warning thresholds:');
            warnings.forEach(i => console.warn('  -', i.message));
        }
        
        if (issues.length === 0) {
            console.log('✅ All thresholds passed');
        }
    " || THRESHOLD_EXIT_CODE=$?
else
    echo "⚠️  No se encontró archivo de resultados"
    THRESHOLD_EXIT_CODE=1
fi

# Detener servidor
echo "🛑 Deteniendo servidor..."
kill $BACKEND_PID 2>/dev/null || true
wait $BACKEND_PID 2>/dev/null || true

# Exit code
if [ -n "$TEST_EXIT_CODE" ] || [ -n "$THRESHOLD_EXIT_CODE" ]; then
    exit 1
fi

echo "✅ Prueba completada exitosamente"

