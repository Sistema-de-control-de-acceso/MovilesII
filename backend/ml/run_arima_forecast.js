/**
 * Script para ejecutar forecast ARIMA desde línea de comandos
 * 
 * Uso:
 * node run_arima_forecast.js [meses] [intervalo] [pasos_forecast] [orden_p] [orden_d] [orden_q]
 * 
 * Ejemplos:
 * node run_arima_forecast.js 3 hour 24          # Auto-selección de orden ARIMA
 * node run_arima_forecast.js 3 hour 24 1 1 1    # ARIMA(1,1,1)
 * node run_arima_forecast.js 6 day 7 2 1 1      # 6 meses, intervalo diario, 7 días forecast, ARIMA(2,1,1)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const ARIMAForecastService = require('./arima_forecast_service');
const Asistencia = require('../models/Asistencia');

// Configuración
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/asistencia';

// Parsear argumentos de línea de comandos
const args = process.argv.slice(2);
const months = parseInt(args[0]) || 3;
const interval = args[1] || 'hour'; // 'hour', 'day', 'week'
const forecastSteps = parseInt(args[2]) || 24;
const p = args[3] ? parseInt(args[3]) : null;
const d = args[4] ? parseInt(args[4]) : null;
const q = args[5] ? parseInt(args[5]) : null;

const arimaOrder = (p !== null && d !== null && q !== null) ? { p, d, q } : null;

async function main() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    console.log('📊 Configuración del Forecast ARIMA:');
    console.log(`   - Meses de datos: ${months}`);
    console.log(`   - Intervalo: ${interval}`);
    console.log(`   - Pasos de forecast: ${forecastSteps}`);
    if (arimaOrder) {
      console.log(`   - Orden ARIMA: (${arimaOrder.p},${arimaOrder.d},${arimaOrder.q})`);
    } else {
      console.log(`   - Orden ARIMA: Auto-selección`);
    }
    console.log('');

    // Crear servicio
    const forecastService = new ARIMAForecastService(Asistencia);

    // Ejecutar pipeline
    const result = await forecastService.executeForecastPipeline({
      months,
      interval,
      metric: 'count',
      forecastSteps,
      arimaOrder,
      validateForecast: true,
      testSize: 0.2
    });

    // Mostrar resultados
    console.log('\n📈 Resultados del Forecast:');
    console.log('═'.repeat(50));
    
    if (result.seasonality.hasSeasonality) {
      console.log(`✅ Estacionalidad detectada:`);
      console.log(`   - Período: ${result.seasonality.period}`);
      console.log(`   - Fuerza: ${(result.seasonality.strength * 100).toFixed(2)}%`);
    } else {
      console.log('⚠️ No se detectó estacionalidad significativa');
    }

    console.log(`\n📊 Modelo ARIMA(${result.model.order.p},${result.model.order.d},${result.model.order.q}):`);
    console.log(`   - Estacionario: ${result.model.isStationary ? 'Sí' : 'No'}`);
    console.log(`   - AIC: ${result.model.summary.aic?.toFixed(2) || 'N/A'}`);
    console.log(`   - BIC: ${result.model.summary.bic?.toFixed(2) || 'N/A'}`);

    if (result.validation) {
      console.log(`\n✅ Validación de Precisión:`);
      console.log(`   - Precisión: ${(result.validation.accuracy * 100).toFixed(2)}%`);
      console.log(`   - MAE: ${result.validation.mae.toFixed(4)}`);
      console.log(`   - RMSE: ${result.validation.rmse.toFixed(4)}`);
      console.log(`   - MAPE: ${result.validation.mape.toFixed(2)}%`);
      console.log(`   - R²: ${result.validation.r2.toFixed(4)}`);
      console.log(`   - Precisión direccional: ${(result.validation.directionalAccuracy * 100).toFixed(2)}%`);
      
      if (result.validation.meetsMinimumAccuracy) {
        console.log(`   ✅ Cumple con precisión mínima requerida (≥75%)`);
      } else {
        console.log(`   ❌ No cumple con precisión mínima requerida (≥75%)`);
      }
    }

    console.log(`\n🔮 Forecast (próximos ${forecastSteps} pasos):`);
    result.forecast.slice(0, 10).forEach((value, index) => {
      const ci = result.confidenceIntervals[index];
      console.log(`   Paso ${index + 1}: ${value.toFixed(2)} [${ci.lower.toFixed(2)}, ${ci.upper.toFixed(2)}]`);
    });
    if (result.forecast.length > 10) {
      console.log(`   ... (${result.forecast.length - 10} pasos más)`);
    }

    console.log('\n✅ Forecast completado exitosamente\n');

    // Cerrar conexión
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Ejecutar
main();
