/**
 * Analizador de Patrones de Flujo de Estudiantes
 * Detecta automáticamente patrones, tendencias y anomalías en el flujo de estudiantes
 */

const ss = require('simple-statistics');

class FlowPatternAnalyzer {
  constructor(AsistenciaModel) {
    this.Asistencia = AsistenciaModel;
  }

  /**
   * Analiza patrones de flujo completos para un período
   */
  async analyzeFlowPatterns(options = {}) {
    const {
      startDate = null,
      endDate = null,
      months = 3,
      granularity = 'hour', // 'hour', 'day', 'week'
      includeAnomalies = true,
      includeTrends = true,
      includeSeasonality = true
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

      // Agregar datos por granularidad
      const aggregatedData = this.aggregateByGranularity(asistencias, granularity);

      // Analizar patrones
      const patterns = {
        temporal: this.analyzeTemporalPatterns(aggregatedData, granularity),
        peaks: this.detectPeakPeriods(aggregatedData),
        trends: includeTrends ? this.analyzeTrends(aggregatedData) : null,
        seasonality: includeSeasonality ? this.analyzeSeasonality(aggregatedData, granularity) : null,
        anomalies: includeAnomalies ? this.detectAnomalies(aggregatedData) : null,
        flowDistribution: this.analyzeFlowDistribution(aggregatedData),
        statistics: this.calculateStatistics(aggregatedData)
      };

      return {
        success: true,
        dateRange: {
          start: fechaInicio,
          end: fechaFin
        },
        granularity,
        dataPoints: aggregatedData.length,
        patterns,
        rawData: aggregatedData.slice(0, 100), // Primeros 100 puntos para referencia
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Error analizando patrones de flujo: ${error.message}`);
    }
  }

  /**
   * Agrega datos por granularidad temporal
   */
  aggregateByGranularity(asistencias, granularity) {
    const grouped = {};
    
    asistencias.forEach(asistencia => {
      const fechaHora = new Date(asistencia.fecha_hora);
      let key;

      switch (granularity) {
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
          date: new Date(fechaHora.getFullYear(), fechaHora.getMonth(), 
                        fechaHora.getDate()),
          count: 0,
          entries: 0,
          exits: 0,
          authorizations: 0,
          hours: granularity === 'hour' ? fechaHora.getHours() : null,
          dayOfWeek: fechaHora.getDay()
        };
      }

      grouped[key].count++;
      if (asistencia.tipo === 'entrada') {
        grouped[key].entries++;
      } else {
        grouped[key].exits++;
      }
      if (asistencia.autorizacion_manual) {
        grouped[key].authorizations++;
      }
    });

    // Convertir a array ordenado
    const entries = Object.entries(grouped).sort((a, b) => 
      new Date(a[1].timestamp) - new Date(b[1].timestamp)
    );

    return entries.map(([key, data]) => ({
      ...data,
      timestamp: new Date(data.timestamp)
    }));
  }

  /**
   * Analiza patrones temporales
   */
  analyzeTemporalPatterns(data, granularity) {
    const patterns = {
      hourly: {},
      daily: {},
      weekly: {}
    };

    // Patrones por hora
    if (granularity === 'hour' || granularity === 'day') {
      const hourlyCounts = {};
      data.forEach(item => {
        if (item.hours !== null) {
          if (!hourlyCounts[item.hours]) {
            hourlyCounts[item.hours] = [];
          }
          hourlyCounts[item.hours].push(item.count);
        }
      });

      Object.keys(hourlyCounts).forEach(hour => {
        const counts = hourlyCounts[hour];
        patterns.hourly[hour] = {
          average: ss.mean(counts),
          median: ss.median(counts),
          stdDev: ss.standardDeviation(counts),
          min: Math.min(...counts),
          max: Math.max(...counts)
        };
      });
    }

    // Patrones por día de semana
    const dailyCounts = {};
    data.forEach(item => {
      const dayName = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][item.dayOfWeek];
      if (!dailyCounts[dayName]) {
        dailyCounts[dayName] = [];
      }
      dailyCounts[dayName].push(item.count);
    });

    Object.keys(dailyCounts).forEach(day => {
      const counts = dailyCounts[day];
      patterns.daily[day] = {
        average: ss.mean(counts),
        median: ss.median(counts),
        stdDev: ss.standardDeviation(counts)
      };
    });

    return patterns;
  }

  /**
   * Detecta períodos pico
   */
  detectPeakPeriods(data) {
    if (data.length === 0) return [];

    const counts = data.map(d => d.count);
    const mean = ss.mean(counts);
    const stdDev = ss.standardDeviation(counts);
    const threshold = mean + (stdDev * 1.5); // 1.5 desviaciones estándar

    const peaks = [];
    data.forEach((item, index) => {
      if (item.count >= threshold) {
        peaks.push({
          timestamp: item.timestamp,
          count: item.count,
          deviation: ((item.count - mean) / stdDev).toFixed(2),
          type: item.count >= mean + (stdDev * 2) ? 'extreme' : 'normal',
          context: {
            hour: item.hours,
            dayOfWeek: item.dayOfWeek,
            entries: item.entries,
            exits: item.exits
          }
        });
      }
    });

    // Ordenar por count descendente
    return peaks.sort((a, b) => b.count - a.count);
  }

  /**
   * Analiza tendencias en el tiempo
   */
  analyzeTrends(data) {
    if (data.length < 2) {
      return {
        direction: 'stable',
        slope: 0,
        strength: 0
      };
    }

    const counts = data.map(d => d.count);
    const indices = counts.map((_, i) => i);

    // Calcular regresión lineal simple
    const slope = this.calculateSlope(indices, counts);
    const intercept = ss.mean(counts) - slope * ss.mean(indices);

    // Determinar dirección
    let direction = 'stable';
    if (slope > 0.1) direction = 'increasing';
    else if (slope < -0.1) direction = 'decreasing';

    // Calcular fuerza de la tendencia (R²)
    const yMean = ss.mean(counts);
    const ssRes = counts.reduce((sum, y, i) => {
      const predicted = slope * i + intercept;
      return sum + Math.pow(y - predicted, 2);
    }, 0);
    const ssTot = counts.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
    const r2 = ssTot === 0 ? 0 : 1 - (ssRes / ssTot);

    return {
      direction,
      slope: parseFloat(slope.toFixed(4)),
      intercept: parseFloat(intercept.toFixed(4)),
      strength: parseFloat(Math.abs(r2).toFixed(4)),
      r2: parseFloat(r2.toFixed(4))
    };
  }

  /**
   * Calcula pendiente de regresión lineal
   */
  calculateSlope(x, y) {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  }

  /**
   * Analiza estacionalidad
   */
  analyzeSeasonality(data, granularity) {
    if (data.length < 14) {
      return {
        hasSeasonality: false,
        message: 'Datos insuficientes para detectar estacionalidad'
      };
    }

    const counts = data.map(d => d.count);
    
    // Detectar estacionalidad semanal
    const weeklyPattern = this.detectWeeklyPattern(data);
    
    // Detectar estacionalidad diaria (si hay datos por hora)
    const dailyPattern = granularity === 'hour' ? this.detectDailyPattern(data) : null;

    return {
      hasSeasonality: weeklyPattern.hasPattern || (dailyPattern && dailyPattern.hasPattern),
      weekly: weeklyPattern,
      daily: dailyPattern,
      strength: Math.max(
        weeklyPattern.strength || 0,
        (dailyPattern && dailyPattern.strength) || 0
      )
    };
  }

  /**
   * Detecta patrón semanal
   */
  detectWeeklyPattern(data) {
    const dayGroups = {};
    
    data.forEach(item => {
      const dayName = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][item.dayOfWeek];
      if (!dayGroups[dayName]) {
        dayGroups[dayName] = [];
      }
      dayGroups[dayName].push(item.count);
    });

    const dayAverages = {};
    Object.keys(dayGroups).forEach(day => {
      dayAverages[day] = ss.mean(dayGroups[day]);
    });

    const overallMean = ss.mean(Object.values(dayAverages));
    const variance = ss.variance(Object.values(dayAverages));
    const coefficientOfVariation = overallMean === 0 ? 0 : Math.sqrt(variance) / overallMean;

    return {
      hasPattern: coefficientOfVariation > 0.2,
      strength: Math.min(1, coefficientOfVariation),
      dayAverages,
      overallMean,
      peakDays: Object.entries(dayAverages)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([day]) => day)
    };
  }

  /**
   * Detecta patrón diario (por horas)
   */
  detectDailyPattern(data) {
    const hourGroups = {};
    
    data.forEach(item => {
      if (item.hours !== null) {
        if (!hourGroups[item.hours]) {
          hourGroups[item.hours] = [];
        }
        hourGroups[item.hours].push(item.count);
      }
    });

    if (Object.keys(hourGroups).length < 5) {
      return null;
    }

    const hourAverages = {};
    Object.keys(hourGroups).forEach(hour => {
      hourAverages[hour] = ss.mean(hourGroups[hour]);
    });

    const overallMean = ss.mean(Object.values(hourAverages));
    const variance = ss.variance(Object.values(hourAverages));
    const coefficientOfVariation = overallMean === 0 ? 0 : Math.sqrt(variance) / overallMean;

    return {
      hasPattern: coefficientOfVariation > 0.3,
      strength: Math.min(1, coefficientOfVariation),
      hourAverages,
      overallMean,
      peakHours: Object.entries(hourAverages)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([hour]) => parseInt(hour))
    };
  }

  /**
   * Detecta anomalías usando método estadístico
   */
  detectAnomalies(data) {
    if (data.length < 10) {
      return {
        anomalies: [],
        message: 'Datos insuficientes para detectar anomalías'
      };
    }

    const counts = data.map(d => d.count);
    const mean = ss.mean(counts);
    const stdDev = ss.standardDeviation(counts);

    // Usar regla de 3-sigma
    const upperBound = mean + (3 * stdDev);
    const lowerBound = mean - (3 * stdDev);

    const anomalies = [];
    data.forEach((item, index) => {
      if (item.count > upperBound || item.count < lowerBound) {
        anomalies.push({
          timestamp: item.timestamp,
          count: item.count,
          type: item.count > upperBound ? 'high' : 'low',
          deviation: ((item.count - mean) / stdDev).toFixed(2),
          context: {
            hour: item.hours,
            dayOfWeek: item.dayOfWeek
          }
        });
      }
    });

    return {
      anomalies: anomalies.sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation)),
      bounds: {
        upper: parseFloat(upperBound.toFixed(2)),
        lower: parseFloat(lowerBound.toFixed(2)),
        mean: parseFloat(mean.toFixed(2))
      },
      count: anomalies.length
    };
  }

  /**
   * Analiza distribución de flujo (entradas vs salidas)
   */
  analyzeFlowDistribution(data) {
    const totalEntries = data.reduce((sum, d) => sum + d.entries, 0);
    const totalExits = data.reduce((sum, d) => sum + d.exits, 0);
    const total = totalEntries + totalExits;

    return {
      entries: {
        count: totalEntries,
        percentage: total > 0 ? parseFloat(((totalEntries / total) * 100).toFixed(2)) : 0
      },
      exits: {
        count: totalExits,
        percentage: total > 0 ? parseFloat(((totalExits / total) * 100).toFixed(2)) : 0
      },
      ratio: totalExits > 0 ? parseFloat((totalEntries / totalExits).toFixed(2)) : 0,
      authorizations: {
        count: data.reduce((sum, d) => sum + d.authorizations, 0),
        percentage: total > 0 ? parseFloat(((data.reduce((sum, d) => sum + d.authorizations, 0) / total) * 100).toFixed(2)) : 0
      }
    };
  }

  /**
   * Calcula estadísticas descriptivas
   */
  calculateStatistics(data) {
    const counts = data.map(d => d.count);
    
    return {
      total: counts.reduce((a, b) => a + b, 0),
      mean: parseFloat(ss.mean(counts).toFixed(2)),
      median: parseFloat(ss.median(counts).toFixed(2)),
      stdDev: parseFloat(ss.standardDeviation(counts).toFixed(2)),
      min: Math.min(...counts),
      max: Math.max(...counts),
      q1: parseFloat(ss.quantile(counts, 0.25).toFixed(2)),
      q3: parseFloat(ss.quantile(counts, 0.75).toFixed(2)),
      iqr: parseFloat((ss.quantile(counts, 0.75) - ss.quantile(counts, 0.25)).toFixed(2))
    };
  }

  /**
   * Calcula semana del año
   */
  getWeekOfYear(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }
}

module.exports = FlowPatternAnalyzer;
