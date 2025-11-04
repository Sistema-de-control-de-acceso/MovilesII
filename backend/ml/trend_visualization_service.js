/**
 * Servicio de Visualización de Tendencias
 * Genera datos estructurados para visualización de patrones y tendencias
 */

const FlowPatternAnalyzer = require('./flow_pattern_analyzer');
const TimeSeriesService = require('./time_series_service');

class TrendVisualizationService {
  constructor(AsistenciaModel) {
    this.Asistencia = AsistenciaModel;
    this.patternAnalyzer = new FlowPatternAnalyzer(AsistenciaModel);
    this.timeSeriesService = new TimeSeriesService(AsistenciaModel);
  }

  /**
   * Genera datos completos para visualización de tendencias
   */
  async generateTrendVisualization(options = {}) {
    const {
      months = 3,
      granularity = 'hour',
      includePatterns = true,
      includeForecast = false,
      forecastSteps = 24
    } = options;

    try {
      // 1. Analizar patrones de flujo
      const patterns = await this.patternAnalyzer.analyzeFlowPatterns({
        months,
        granularity,
        includeAnomalies: true,
        includeTrends: true,
        includeSeasonality: true
      });

      // 2. Preparar datos de serie temporal
      const timeSeriesData = await this.timeSeriesService.prepareTimeSeriesData({
        months,
        interval: granularity,
        metric: 'count'
      });

      // 3. Generar datos para gráficos
      const chartData = this.prepareChartData(patterns, timeSeriesData);

      // 4. Generar forecast si está habilitado
      let forecastData = null;
      if (includeForecast) {
        forecastData = await this.generateForecastData(timeSeriesData, forecastSteps);
      }

      // 5. Generar resumen ejecutivo
      const summary = this.generateExecutiveSummary(patterns, timeSeriesData);

      return {
        success: true,
        dateRange: {
          start: patterns.dateRange.start,
          end: patterns.dateRange.end
        },
        granularity,
        chartData,
        patterns: includePatterns ? patterns.patterns : null,
        forecast: forecastData,
        summary,
        rawData: {
          timeSeries: timeSeriesData.data,
          timestamps: timeSeriesData.timestamps
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Error generando visualización de tendencias: ${error.message}`);
    }
  }

  /**
   * Prepara datos para gráficos de diferentes tipos
   */
  prepareChartData(patterns, timeSeriesData) {
    return {
      // Gráfico de línea temporal
      timeSeriesLine: this.prepareTimeSeriesLineChart(patterns, timeSeriesData),
      
      // Gráfico de barras por hora
      hourlyBar: this.prepareHourlyBarChart(patterns),
      
      // Gráfico de barras por día de semana
      dailyBar: this.prepareDailyBarChart(patterns),
      
      // Gráfico de distribución de flujo
      flowDistribution: this.prepareFlowDistributionChart(patterns),
      
      // Gráfico de tendencia
      trendLine: this.prepareTrendLineChart(patterns),
      
      // Gráfico de anomalías
      anomalies: this.prepareAnomaliesChart(patterns),
      
      // Gráfico de calor (heatmap)
      heatmap: this.prepareHeatmapChart(patterns)
    };
  }

  /**
   * Prepara datos para gráfico de línea temporal
   */
  prepareTimeSeriesLineChart(patterns, timeSeriesData) {
    const data = timeSeriesData.data.map((value, index) => ({
      x: timeSeriesData.timestamps[index].getTime(),
      y: value,
      timestamp: timeSeriesData.timestamps[index]
    }));

    return {
      type: 'line',
      data: data,
      labels: timeSeriesData.timestamps.map(t => t.toISOString()),
      title: 'Evolución Temporal del Flujo de Estudiantes'
    };
  }

  /**
   * Prepara datos para gráfico de barras por hora
   */
  prepareHourlyBarChart(patterns) {
    if (!patterns.patterns.temporal.hourly) {
      return null;
    }

    const hourly = patterns.patterns.temporal.hourly;
    const data = Object.keys(hourly)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map(hour => ({
        hour: parseInt(hour),
        label: `${hour}:00`,
        average: hourly[hour].average,
        median: hourly[hour].median,
        min: hourly[hour].min,
        max: hourly[hour].max
      }));

    return {
      type: 'bar',
      data: data,
      title: 'Distribución de Flujo por Hora del Día'
    };
  }

  /**
   * Prepara datos para gráfico de barras por día de semana
   */
  prepareDailyBarChart(patterns) {
    if (!patterns.patterns.temporal.daily) {
      return null;
    }

    const daily = patterns.patterns.temporal.daily;
    const dayOrder = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    
    const data = dayOrder
      .filter(day => daily[day])
      .map(day => ({
        day,
        average: daily[day].average,
        median: daily[day].median,
        stdDev: daily[day].stdDev
      }));

    return {
      type: 'bar',
      data: data,
      title: 'Distribución de Flujo por Día de la Semana'
    };
  }

  /**
   * Prepara datos para gráfico de distribución de flujo
   */
  prepareFlowDistributionChart(patterns) {
    const distribution = patterns.patterns.flowDistribution;

    return {
      type: 'pie',
      data: [
        {
          label: 'Entradas',
          value: distribution.entries.count,
          percentage: distribution.entries.percentage
        },
        {
          label: 'Salidas',
          value: distribution.exits.count,
          percentage: distribution.exits.percentage
        }
      ],
      title: 'Distribución Entradas vs Salidas'
    };
  }

  /**
   * Prepara datos para gráfico de tendencia
   */
  prepareTrendLineChart(patterns) {
    if (!patterns.patterns.trends) {
      return null;
    }

    const trend = patterns.patterns.trends;
    const rawData = patterns.rawData;

    // Calcular línea de tendencia
    const trendLine = rawData.map((item, index) => {
      const predicted = trend.slope * index + trend.intercept;
      return {
        x: item.timestamp.getTime(),
        y: predicted,
        timestamp: item.timestamp
      };
    });

    return {
      type: 'line',
      data: trendLine,
      trend: {
        direction: trend.direction,
        slope: trend.slope,
        strength: trend.strength
      },
      title: 'Tendencia General del Flujo'
    };
  }

  /**
   * Prepara datos para gráfico de anomalías
   */
  prepareAnomaliesChart(patterns) {
    if (!patterns.patterns.anomalies || patterns.patterns.anomalies.anomalies.length === 0) {
      return null;
    }

    const anomalies = patterns.patterns.anomalies.anomalies.map(anomaly => ({
      x: anomaly.timestamp.getTime(),
      y: anomaly.count,
      type: anomaly.type,
      deviation: anomaly.deviation,
      timestamp: anomaly.timestamp
    }));

    return {
      type: 'scatter',
      data: anomalies,
      bounds: patterns.patterns.anomalies.bounds,
      title: 'Anomalías Detectadas'
    };
  }

  /**
   * Prepara datos para gráfico de calor (heatmap)
   */
  prepareHeatmapChart(patterns) {
    if (!patterns.patterns.temporal.hourly) {
      return null;
    }

    const hourly = patterns.patterns.temporal.hourly;
    const daily = patterns.patterns.temporal.daily;
    const dayOrder = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

    // Crear matriz de calor: días x horas
    const heatmapData = dayOrder.map(day => {
      const dayData = daily[day];
      const dayAvg = dayData ? dayData.average : 0;
      
      return Object.keys(hourly)
        .sort((a, b) => parseInt(a) - parseInt(b))
        .map(hour => {
          const hourAvg = hourly[hour].average;
          // Combinar promedio de día y hora
          return parseFloat((dayAvg * 0.3 + hourAvg * 0.7).toFixed(2));
        });
    });

    return {
      type: 'heatmap',
      data: heatmapData,
      labels: {
        rows: dayOrder,
        columns: Object.keys(hourly).sort((a, b) => parseInt(a) - parseInt(b)).map(h => `${h}:00`)
      },
      title: 'Heatmap de Flujo: Día x Hora'
    };
  }

  /**
   * Genera datos de forecast para visualización
   */
  async generateForecastData(timeSeriesData, forecastSteps) {
    // Usar ARIMA para forecast si está disponible
    try {
      const ARIMAForecastService = require('./arima_forecast_service');
      const forecastService = new ARIMAForecastService(this.Asistencia);
      
      const forecast = await forecastService.executeForecastPipeline({
        months: 3,
        interval: 'hour',
        forecastSteps,
        validateForecast: false
      });

      return {
        forecasts: forecast.forecast,
        confidenceIntervals: forecast.confidenceIntervals,
        model: forecast.model.order
      };
    } catch (error) {
      // Si falla ARIMA, usar extrapolación simple
      return this.simpleForecast(timeSeriesData, forecastSteps);
    }
  }

  /**
   * Forecast simple usando extrapolación lineal
   */
  simpleForecast(timeSeriesData, steps) {
    const data = timeSeriesData.data;
    if (data.length < 2) {
      return null;
    }

    // Calcular tendencia
    const lastValues = data.slice(-10);
    const slope = (lastValues[lastValues.length - 1] - lastValues[0]) / lastValues.length;
    const lastValue = data[data.length - 1];
    const lastTimestamp = timeSeriesData.timestamps[timeSeriesData.timestamps.length - 1];

    const forecasts = [];
    for (let i = 1; i <= steps; i++) {
      const forecastValue = lastValue + (slope * i);
      const forecastTimestamp = new Date(lastTimestamp);
      
      // Ajustar según granularidad
      if (timeSeriesData.interval === 'hour') {
        forecastTimestamp.setHours(forecastTimestamp.getHours() + i);
      } else if (timeSeriesData.interval === 'day') {
        forecastTimestamp.setDate(forecastTimestamp.getDate() + i);
      }

      forecasts.push({
        timestamp: forecastTimestamp,
        value: Math.max(0, forecastValue), // No permitir valores negativos
        confidence: 0.7 // Confianza baja para extrapolación simple
      });
    }

    return {
      forecasts,
      method: 'linear_extrapolation'
    };
  }

  /**
   * Genera resumen ejecutivo
   */
  generateExecutiveSummary(patterns, timeSeriesData) {
    const stats = patterns.patterns.statistics;
    const trends = patterns.patterns.trends;
    const seasonality = patterns.patterns.seasonality;

    return {
      overview: {
        totalFlow: stats.total,
        averagePerPeriod: stats.mean,
        peakPeriod: patterns.patterns.peaks.length > 0 
          ? patterns.patterns.peaks[0] 
          : null
      },
      trends: {
        direction: trends ? trends.direction : 'stable',
        strength: trends ? trends.strength : 0,
        message: trends 
          ? `Tendencia ${trends.direction} con fuerza ${(trends.strength * 100).toFixed(1)}%`
          : 'Tendencia estable'
      },
      seasonality: {
        hasSeasonality: seasonality ? seasonality.hasSeasonality : false,
        peakDays: seasonality && seasonality.weekly 
          ? seasonality.weekly.peakDays 
          : [],
        peakHours: seasonality && seasonality.daily && seasonality.daily.peakHours
          ? seasonality.daily.peakHours
          : []
      },
      anomalies: {
        count: patterns.patterns.anomalies ? patterns.patterns.anomalies.count : 0,
        message: patterns.patterns.anomalies && patterns.patterns.anomalies.count > 0
          ? `${patterns.patterns.anomalies.count} anomalías detectadas`
          : 'No se detectaron anomalías significativas'
      },
      flowDistribution: patterns.patterns.flowDistribution,
      recommendations: this.generateRecommendations(patterns)
    };
  }

  /**
   * Genera recomendaciones basadas en los patrones detectados
   */
  generateRecommendations(patterns) {
    const recommendations = [];
    const trends = patterns.patterns.trends;
    const peaks = patterns.patterns.peaks;
    const seasonality = patterns.patterns.seasonality;

    // Recomendaciones basadas en tendencias
    if (trends && trends.direction === 'increasing' && trends.strength > 0.5) {
      recommendations.push({
        type: 'resource_allocation',
        priority: 'high',
        message: 'Tendencia creciente detectada. Considerar aumentar recursos en períodos pico.',
        action: 'Aumentar personal o recursos en horarios identificados como pico'
      });
    }

    // Recomendaciones basadas en horarios pico
    if (peaks && peaks.length > 5) {
      recommendations.push({
        type: 'peak_management',
        priority: 'medium',
        message: 'Múltiples períodos pico identificados. Optimizar distribución de carga.',
        action: 'Implementar estrategias de distribución de carga en horarios pico'
      });
    }

    // Recomendaciones basadas en estacionalidad
    if (seasonality && seasonality.hasSeasonality) {
      if (seasonality.weekly && seasonality.weekly.peakDays.length > 0) {
        recommendations.push({
          type: 'scheduling',
          priority: 'medium',
          message: `Días pico identificados: ${seasonality.weekly.peakDays.join(', ')}`,
          action: 'Ajustar horarios y recursos según días de mayor actividad'
        });
      }
    }

    // Recomendaciones basadas en anomalías
    if (patterns.patterns.anomalies && patterns.patterns.anomalies.count > 10) {
      recommendations.push({
        type: 'monitoring',
        priority: 'high',
        message: 'Múltiples anomalías detectadas. Revisar causas y patrones.',
        action: 'Investigar causas de anomalías y mejorar sistema de monitoreo'
      });
    }

    return recommendations;
  }
}

module.exports = TrendVisualizationService;
