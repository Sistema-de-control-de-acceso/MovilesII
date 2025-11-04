/**
 * Servicio de Series Temporales con ARIMA
 * Implementa modelos ARIMA para análisis y forecast de series temporales
 */

const ss = require('simple-statistics');
const { Matrix } = require('ml-matrix');

class TimeSeriesService {
  constructor(AsistenciaModel) {
    this.Asistencia = AsistenciaModel;
    this.minDataPoints = 30; // Mínimo de puntos de datos para ARIMA
  }

  /**
   * Prepara datos temporales agregados por intervalo (hora, día, semana)
   */
  async prepareTimeSeriesData(options = {}) {
    const {
      months = 3,
      interval = 'hour', // 'hour', 'day', 'week'
      metric = 'count', // 'count', 'avg_authorization', etc.
      startDate = null,
      endDate = null
    } = options;

    try {
      // Calcular rango de fechas
      const fechaInicio = startDate || new Date();
      fechaInicio.setMonth(fechaInicio.getMonth() - months);
      const fechaFin = endDate || new Date();

      // Obtener datos históricos
      const asistencias = await this.Asistencia.find({
        fecha_hora: { $gte: fechaInicio, $lte: fechaFin }
      }).sort({ fecha_hora: 1 });

      // Agregar por intervalo
      const timeSeries = this.aggregateByInterval(asistencias, interval, metric);

      return {
        success: true,
        data: timeSeries.values,
        timestamps: timeSeries.timestamps,
        interval,
        metric,
        dateRange: {
          start: fechaInicio,
          end: fechaFin
        },
        totalPoints: timeSeries.values.length
      };
    } catch (error) {
      throw new Error(`Error preparando datos de serie temporal: ${error.message}`);
    }
  }

  /**
   * Agrega datos por intervalo temporal
   */
  aggregateByInterval(asistencias, interval, metric) {
    const grouped = {};
    
    asistencias.forEach(asistencia => {
      const fechaHora = new Date(asistencia.fecha_hora);
      let key;

      switch (interval) {
        case 'hour':
          key = new Date(fechaHora.getFullYear(), fechaHora.getMonth(), 
                        fechaHora.getDate(), fechaHora.getHours()).toISOString();
          break;
        case 'day':
          key = new Date(fechaHora.getFullYear(), fechaHora.getMonth(), 
                        fechaHora.getDate()).toISOString().split('T')[0];
          break;
        case 'week':
          const week = this.getWeekOfYear(fechaHora);
          key = `${fechaHora.getFullYear()}-W${week}`;
          break;
        default:
          key = fechaHora.toISOString();
      }

      if (!grouped[key]) {
        grouped[key] = {
          timestamp: key,
          count: 0,
          authorizationCount: 0,
          total: 0
        };
      }

      grouped[key].count++;
      grouped[key].total++;
      if (asistencia.autorizacion_manual) {
        grouped[key].authorizationCount++;
      }
    });

    // Convertir a arrays ordenados
    const entries = Object.entries(grouped).sort((a, b) => 
      new Date(a[1].timestamp) - new Date(b[1].timestamp)
    );

    const values = [];
    const timestamps = [];

    entries.forEach(([key, data]) => {
      timestamps.push(new Date(data.timestamp));
      
      switch (metric) {
        case 'count':
          values.push(data.count);
          break;
        case 'avg_authorization':
          values.push(data.total > 0 ? data.authorizationCount / data.total : 0);
          break;
        case 'authorization_count':
          values.push(data.authorizationCount);
          break;
        default:
          values.push(data.count);
      }
    });

    return { values, timestamps };
  }

  /**
   * Calcula la semana del año
   */
  getWeekOfYear(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }

  /**
   * Detecta estacionalidad en la serie temporal
   */
  detectSeasonality(timeSeries, maxPeriod = 52) {
    if (timeSeries.length < maxPeriod * 2) {
      return {
        hasSeasonality: false,
        period: null,
        strength: 0,
        message: 'Datos insuficientes para detectar estacionalidad'
      };
    }

    try {
      // Calcular autocorrelación
      const autocorrelations = this.calculateAutocorrelation(timeSeries, maxPeriod);
      
      // Encontrar picos significativos en la autocorrelación
      const peaks = this.findSeasonalPeaks(autocorrelations);
      
      if (peaks.length === 0) {
        return {
          hasSeasonality: false,
          period: null,
          strength: 0,
          autocorrelations
        };
      }

      // El pico más alto después del lag 0 indica la estacionalidad
      const mainPeak = peaks[0];
      const strength = Math.abs(mainPeak.correlation);

      return {
        hasSeasonality: strength > 0.3, // Threshold para considerar estacionalidad significativa
        period: mainPeak.lag,
        strength: parseFloat(strength.toFixed(4)),
        autocorrelations: autocorrelations.slice(0, 20), // Primeros 20 lags
        peaks: peaks.slice(0, 5), // Top 5 picos
        message: strength > 0.3 
          ? `Estacionalidad detectada con período ${mainPeak.lag} (fuerza: ${strength.toFixed(2)})`
          : 'Estacionalidad débil o no significativa'
      };
    } catch (error) {
      throw new Error(`Error detectando estacionalidad: ${error.message}`);
    }
  }

  /**
   * Calcula autocorrelación para diferentes lags
   */
  calculateAutocorrelation(timeSeries, maxLag) {
    const n = timeSeries.length;
    const mean = ss.mean(timeSeries);
    const variance = ss.variance(timeSeries);
    
    if (variance === 0) {
      return Array(maxLag).fill(0);
    }

    const autocorrs = [];
    
    for (let lag = 0; lag <= maxLag && lag < n; lag++) {
      let covariance = 0;
      const validPairs = n - lag;
      
      for (let i = 0; i < validPairs; i++) {
        covariance += (timeSeries[i] - mean) * (timeSeries[i + lag] - mean);
      }
      
      autocorrs.push(covariance / (validPairs * variance));
    }
    
    return autocorrs;
  }

  /**
   * Encuentra picos estacionales en la autocorrelación
   */
  findSeasonalPeaks(autocorrelations) {
    const peaks = [];
    const threshold = 0.2; // Mínimo de correlación para considerar un pico
    
    for (let i = 1; i < autocorrelations.length - 1; i++) {
      const corr = Math.abs(autocorrelations[i]);
      
      // Verificar si es un pico local
      if (corr > threshold && 
          corr > Math.abs(autocorrelations[i - 1]) && 
          corr > Math.abs(autocorrelations[i + 1])) {
        peaks.push({
          lag: i,
          correlation: autocorrelations[i],
          strength: corr
        });
      }
    }
    
    // Ordenar por fuerza descendente
    return peaks.sort((a, b) => b.strength - a.strength);
  }

  /**
   * Descompone la serie temporal en tendencia, estacionalidad y residuos
   */
  decomposeTimeSeries(timeSeries, period = null) {
    if (timeSeries.length < 10) {
      throw new Error('Datos insuficientes para descomposición');
    }

    // Detectar período automáticamente si no se proporciona
    if (!period) {
      const seasonality = this.detectSeasonality(timeSeries);
      period = seasonality.period || 7; // Default: semanal
    }

    // Calcular tendencia usando media móvil
    const trend = this.calculateMovingAverage(timeSeries, Math.min(period, Math.floor(timeSeries.length / 3)));
    
    // Calcular componente estacional
    const seasonal = this.calculateSeasonalComponent(timeSeries, period, trend);
    
    // Calcular residuos
    const residuals = timeSeries.map((value, index) => {
      return value - (trend[index] || value) - (seasonal[index] || 0);
    });

    return {
      original: timeSeries,
      trend,
      seasonal,
      residuals,
      period
    };
  }

  /**
   * Calcula media móvil
   */
  calculateMovingAverage(timeSeries, windowSize) {
    const result = [];
    const halfWindow = Math.floor(windowSize / 2);
    
    for (let i = 0; i < timeSeries.length; i++) {
      const start = Math.max(0, i - halfWindow);
      const end = Math.min(timeSeries.length, i + halfWindow + 1);
      const window = timeSeries.slice(start, end);
      result.push(ss.mean(window));
    }
    
    return result;
  }

  /**
   * Calcula componente estacional
   */
  calculateSeasonalComponent(timeSeries, period, trend) {
    // Remover tendencia
    const detrended = timeSeries.map((value, index) => value - (trend[index] || value));
    
    // Agrupar por posición en el período
    const seasonalGroups = {};
    for (let i = 0; i < detrended.length; i++) {
      const pos = i % period;
      if (!seasonalGroups[pos]) {
        seasonalGroups[pos] = [];
      }
      seasonalGroups[pos].push(detrended[i]);
    }
    
    // Calcular promedio estacional
    const seasonalPattern = {};
    Object.keys(seasonalGroups).forEach(pos => {
      seasonalPattern[pos] = ss.mean(seasonalGroups[pos]);
    });
    
    // Aplicar patrón estacional
    const seasonal = [];
    for (let i = 0; i < timeSeries.length; i++) {
      const pos = i % period;
      seasonal.push(seasonalPattern[pos] || 0);
    }
    
    return seasonal;
  }
}

module.exports = TimeSeriesService;
