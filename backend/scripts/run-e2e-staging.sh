#!/bin/bash

# Script para ejecutar tests E2E contra ambiente de staging

echo "🚀 Ejecutando tests E2E contra staging..."

# Verificar que las variables de entorno estén configuradas
if [ -z "$STAGING_API_URL" ]; then
    echo "❌ Error: STAGING_API_URL no está configurada"
    echo "   Configurar con: export STAGING_API_URL=http://staging-api.example.com"
    exit 1
fi

if [ -z "$STAGING_MONGODB_URI" ]; then
    echo "❌ Error: STAGING_MONGODB_URI no está configurada"
    echo "   Configurar con: export STAGING_MONGODB_URI=mongodb://staging-db.example.com/asistencia"
    exit 1
fi

# Configurar variables de entorno
export NODE_ENV=staging
export API_URL=$STAGING_API_URL
export MONGODB_URI=$STAGING_MONGODB_URI

echo "✅ Configuración:"
echo "   API URL: $API_URL"
echo "   MongoDB URI: ${STAGING_MONGODB_URI:0:30}..."
echo "   NODE_ENV: $NODE_ENV"
echo ""

# Ejecutar tests E2E
npm run test:e2e

# Ejecutar contract tests
echo ""
echo "📋 Ejecutando contract tests..."
npm run test:contracts

echo ""
echo "✅ Tests E2E completados"

