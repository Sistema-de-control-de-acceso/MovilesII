/**
 * Servicio de Forecast ARIMA
 * Integra ARIMA con detección de estacionalidad y validación de precisión
 */

const ARIMAModel = require('./arima_model');
const TimeSeriesService = require('./time_series_service');

class ARIMAForecastService {
  constructor(AsistenciaModel) {
    this.Asistencia = AsistenciaModel;
    this.timeSeriesService = new TimeSeriesService(AsistenciaModel);
    this.minAccuracy = 0.75; // Precisión mínima requerida (75%)
  }

  /**
   * Ejecuta pipeline completo: preparación, detección de estacionalidad, ajuste ARIMA y forecast
   */
  async executeForecastPipeline(options = {}) {
    const {
      months = 3,
      interval = 'hour',
      metric = 'count',
      forecastSteps = 24, // Próximas 24 horas
      arimaOrder = null, // {p, d, q} o null para auto-selección
      validateForecast = true,
      testSize = 0.2
    } = options;

    try {
      console.log('🔄 Iniciando pipeline de forecast ARIMA...');

      // Paso 1: Preparar datos de serie temporal
      console.log('📥 Paso 1: Preparando datos de serie temporal...');
      const timeSeriesData = await this.timeSeriesService.prepareTimeSeriesData({
        months,
        interval,
        metric
      });

      if (timeSeriesData.totalPoints < 30) {
        throw new Error(`Datos insuficientes: ${timeSeriesData.totalPoints} puntos. Se requieren al menos 30.`);
      }

      console.log(`✅ Serie temporal preparada: ${timeSeriesData.totalPoints} puntos`);

      // Paso 2: Detectar estacionalidad
      console.log('🔍 Paso 2: Detectando estacionalidad...');
      const seasonality = this.timeSeriesService.detectSeasonality(timeSeriesData.data);
      console.log(seasonality.hasSeasonality 
        ? `✅ Estacionalidad detectada: período ${seasonality.period} (fuerza: ${seasonality.strength})`
        : '⚠️ No se detectó estacionalidad significativa'
      );

      // Paso 3: Dividir en train/test si se requiere validación
      let trainData, testData, testTimestamps;
      if (validateForecast) {
        const splitIndex = Math.floor(timeSeriesData.data.length * (1 - testSize));
        trainData = timeSeriesData.data.slice(0, splitIndex);
        testData = timeSeriesData.data.slice(splitIndex);
        testTimestamps = timeSeriesData.timestamps.slice(splitIndex);
      } else {
        trainData = timeSeriesData.data;
        testData = null;
      }

      // Paso 4: Seleccionar o ajustar orden ARIMA
      console.log('🎯 Paso 3: Ajustando modelo ARIMA...');
      const order = arimaOrder || await this.selectBestARIMAOrder(trainData);
      console.log(`📊 Orden ARIMA seleccionado: ARIMA(${order.p},${order.d},${order.q})`);

      // Paso 5: Ajustar modelo ARIMA
      const arimaModel = new ARIMAModel(order.p, order.d, order.q);
      const fitResult = arimaModel.fit(trainData);
      console.log(`✅ Modelo ajustado. AIC: ${fitResult.aic?.toFixed(2) || 'N/A'}`);

      // Paso 6: Realizar forecast
      console.log(`📈 Paso 4: Realizando forecast de ${forecastSteps} pasos...`);
      const forecasts = arimaModel.forecast(forecastSteps);
      console.log(`✅ Forecast completado`);

      // Paso 7: Validar precisión si hay datos de test
      let validation = null;
      if (validateForecast && testData && testData.length > 0) {
        console.log('✅ Paso 5: Validando precisión del forecast...');
        const validationSteps = Math.min(forecastSteps, testData.length);
        const testForecasts = arimaModel.forecast(validationSteps);
        validation = this.validateForecastAccuracy(testForecasts, testData.slice(0, validationSteps));
        
        console.log(`📊 Precisión del forecast: ${(validation.accuracy * 100).toFixed(2)}%`);
        
        if (validation.accuracy < this.minAccuracy) {
          console.warn(`⚠️ Precisión (${(validation.accuracy * 100).toFixed(2)}%) menor que el mínimo requerido (${this.minAccuracy * 100}%)`);
        }
      }

      // Paso 8: Generar intervalos de confianza
      const confidenceIntervals = this.calculateConfidenceIntervals(
        forecasts,
        arimaModel.coefficients.variance,
        forecastSteps
      );

      return {
        success: true,
        forecast: forecasts,
        confidenceIntervals,
        model: {
          order,
          summary: arimaModel.getSummary(),
          isStationary: arimaModel.isStationary()
        },
        seasonality,
        validation,
        timeSeriesInfo: {
          totalPoints: timeSeriesData.totalPoints,
          trainSize: trainData.length,
          testSize: testData?.length || 0,
          interval,
          metric
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Error en pipeline de forecast: ${error.message}`);
    }
  }

  /**
   * Selecciona el mejor orden ARIMA usando criterios de información
   */
  async selectBestARIMAOrder(timeSeries, maxP = 3, maxD = 2, maxQ = 3) {
    let bestOrder = { p: 1, d: 0, q: 1 };
    let bestAIC = Infinity;
    
    // Probar diferentes órdenes
    for (let p = 0; p <= maxP; p++) {
      for (let d = 0; d <= maxD; d++) {
        for (let q = 0; q <= maxQ; q++) {
          try {
            const model = new ARIMAModel(p, d, q);
            if (timeSeries.length < model.minDataPoints()) continue;
            
            const fitResult = model.fit([...timeSeries]);
            const aic = fitResult.aic;
            
            if (aic !== null && aic < bestAIC && model.isStationary()) {
              bestAIC = aic;
              bestOrder = { p, d, q };
            }
          } catch (error) {
            // Continuar con siguiente orden si falla
            continue;
          }
        }
      }
    }
    
    return bestOrder;
  }

  /**
   * Valida la precisión del forecast comparando con datos reales
   */
  validateForecastAccuracy(forecasts, actualValues) {
    if (forecasts.length !== actualValues.length) {
      throw new Error('Forecasts y valores reales deben tener la misma longitud');
    }

    const n = forecasts.length;
    
    // Calcular métricas
    const mae = this.calculateMAE(forecasts, actualValues);
    const rmse = this.calculateRMSE(forecasts, actualValues);
    const mape = this.calculateMAPE(forecasts, actualValues);
    const accuracy = 1 - (mape / 100); // Precisión basada en MAPE
    const r2 = this.calculateR2(forecasts, actualValues);
    
    // Calcular precisión direccional (si sube o baja correctamente)
    const directionalAccuracy = this.calculateDirectionalAccuracy(forecasts, actualValues);

    return {
      accuracy: Math.max(0, Math.min(1, accuracy)), // Entre 0 y 1
      mae: parseFloat(mae.toFixed(4)),
      rmse: parseFloat(rmse.toFixed(4)),
      mape: parseFloat(mape.toFixed(4)),
      r2: parseFloat(r2.toFixed(4)),
      directionalAccuracy: parseFloat(directionalAccuracy.toFixed(4)),
      meetsMinimumAccuracy: accuracy >= this.minAccuracy,
      n
    };
  }

  /**
   * Calcula MAE (Mean Absolute Error)
   */
  calculateMAE(forecasts, actual) {
    const errors = forecasts.map((f, i) => Math.abs(f - actual[i]));
    return errors.reduce((sum, e) => sum + e, 0) / errors.length;
  }

  /**
   * Calcula RMSE (Root Mean Squared Error)
   */
  calculateRMSE(forecasts, actual) {
    const squaredErrors = forecasts.map((f, i) => Math.pow(f - actual[i], 2));
    const mse = squaredErrors.reduce((sum, e) => sum + e, 0) / squaredErrors.length;
    return Math.sqrt(mse);
  }

  /**
   * Calcula MAPE (Mean Absolute Percentage Error)
   */
  calculateMAPE(forecasts, actual) {
    const errors = forecasts.map((f, i) => {
      if (actual[i] === 0) return 0; // Evitar división por cero
      return Math.abs((f - actual[i]) / actual[i]) * 100;
    });
    return errors.reduce((sum, e) => sum + e, 0) / errors.length;
  }

  /**
   * Calcula R² (Coeficiente de determinación)
   */
  calculateR2(forecasts, actual) {
    const meanActual = actual.reduce((sum, a) => sum + a, 0) / actual.length;
    const ssRes = forecasts.reduce((sum, f, i) => sum + Math.pow(f - actual[i], 2), 0);
    const ssTot = actual.reduce((sum, a) => sum + Math.pow(a - meanActual, 2), 0);
    return ssTot === 0 ? 0 : 1 - (ssRes / ssTot);
  }

  /**
   * Calcula precisión direccional (si predice correctamente la dirección del cambio)
   */
  calculateDirectionalAccuracy(forecasts, actual) {
    if (forecasts.length < 2) return 0;
    
    let correct = 0;
    for (let i = 1; i < forecasts.length; i++) {
      const forecastDirection = forecasts[i] - forecasts[i - 1];
      const actualDirection = actual[i] - actual[i - 1];
      
      if ((forecastDirection >= 0 && actualDirection >= 0) || 
          (forecastDirection < 0 && actualDirection < 0)) {
        correct++;
      }
    }
    
    return correct / (forecasts.length - 1);
  }

  /**
   * Calcula intervalos de confianza para el forecast
   */
  calculateConfidenceIntervals(forecasts, variance, steps, confidenceLevel = 0.95) {
    const z = 1.96; // Para 95% de confianza
    const intervals = [];
    
    for (let i = 0; i < forecasts.length; i++) {
      // Aumentar incertidumbre con el horizonte de forecast
      const uncertainty = Math.sqrt(variance) * Math.sqrt(1 + i * 0.1);
      const margin = z * uncertainty;
      
      intervals.push({
        forecast: forecasts[i],
        lower: forecasts[i] - margin,
        upper: forecasts[i] + margin,
        confidence: confidenceLevel
      });
    }
    
    return intervals;
  }
}

module.exports = ARIMAForecastService;
