/**
 * Modelo ARIMA (AutoRegressive Integrated Moving Average)
 * Implementa modelo ARIMA para forecasting de series temporales
 */

const ss = require('simple-statistics');
const { Matrix } = require('ml-matrix');

class ARIMAModel {
  constructor(p = 1, d = 0, q = 1) {
    this.p = p; // Orden autoregresivo
    this.d = d; // Orden de diferenciación
    this.q = q; // Orden de media móvil
    this.isFitted = false;
    this.coefficients = null;
    this.residuals = [];
    this.differencedSeries = null;
  }

  /**
   * Ajusta el modelo ARIMA a los datos
   */
  fit(timeSeries, options = {}) {
    if (timeSeries.length < this.minDataPoints()) {
      throw new Error(`Datos insuficientes. Se requieren al menos ${this.minDataPoints()} puntos.`);
    }

    try {
      // Paso 1: Diferenciación si d > 0
      let series = [...timeSeries];
      if (this.d > 0) {
        this.differencedSeries = this.difference(series, this.d);
        series = this.differencedSeries[this.differencedSeries.length - 1];
      }

      // Paso 2: Ajustar parámetros AR
      const arParams = this.fitAR(series, this.p);
      
      // Paso 3: Ajustar parámetros MA
      const maParams = this.fitMA(series, this.q, arParams);
      
      // Paso 4: Calcular residuos
      this.residuals = this.calculateResiduals(series, arParams, maParams);
      
      // Almacenar coeficientes
      this.coefficients = {
        ar: arParams,
        ma: maParams,
        variance: ss.variance(this.residuals),
        mean: ss.mean(this.residuals)
      };

      this.isFitted = true;
      this.originalSeries = timeSeries;
      
      return {
        success: true,
        coefficients: this.coefficients,
        residuals: this.residuals.slice(-20), // Últimos 20 residuos
        aic: this.calculateAIC(),
        bic: this.calculateBIC()
      };
    } catch (error) {
      throw new Error(`Error ajustando modelo ARIMA: ${error.message}`);
    }
  }

  /**
   * Realiza diferenciación de la serie
   */
  difference(series, order) {
    const result = [];
    let currentSeries = [...series];
    
    for (let i = 0; i < order; i++) {
      const diff = [];
      for (let j = 1; j < currentSeries.length; j++) {
        diff.push(currentSeries[j] - currentSeries[j - 1]);
      }
      result.push(currentSeries); // Guardar serie antes de diferenciar
      currentSeries = diff;
    }
    result.push(currentSeries); // Serie final diferenciada
    
    return result;
  }

  /**
   * Ajusta parámetros autoregresivos (AR)
   */
  fitAR(series, p) {
    if (p === 0) return [];
    
    // Usar método de Yule-Walker simplificado
    const n = series.length;
    const mean = ss.mean(series);
    const centeredSeries = series.map(x => x - mean);
    
    // Calcular autocorrelaciones
    const autocorr = [];
    for (let lag = 0; lag <= p; lag++) {
      let sum = 0;
      for (let i = 0; i < n - lag; i++) {
        sum += centeredSeries[i] * centeredSeries[i + lag];
      }
      autocorr.push(sum / n);
    }
    
    // Resolver ecuaciones de Yule-Walker
    const arParams = [];
    if (autocorr[0] === 0) {
      return Array(p).fill(0);
    }
    
    // Para p=1, solución simple
    if (p === 1) {
      arParams.push(autocorr[1] / autocorr[0]);
    } else {
      // Para p>1, usar método iterativo simplificado
      // Implementación básica: usar autocorrelación normalizada
      for (let i = 1; i <= p; i++) {
        if (autocorr[i] !== undefined && autocorr[0] !== 0) {
          arParams.push(autocorr[i] / autocorr[0]);
        } else {
          arParams.push(0);
        }
      }
      // Limitar valores a rango razonable
      arParams.forEach((param, idx) => {
        if (Math.abs(param) > 0.99) {
          arParams[idx] = param > 0 ? 0.99 : -0.99;
        }
      });
    }
    
    return arParams;
  }

  /**
   * Ajusta parámetros de media móvil (MA)
   */
  fitMA(series, q, arParams) {
    if (q === 0) return [];
    
    // Calcular residuos de AR primero
    const arResiduals = this.calculateARResiduals(series, arParams);
    
    // Ajustar MA en los residuos de AR
    const mean = ss.mean(arResiduals);
    const centeredResiduals = arResiduals.map(x => x - mean);
    
    // Calcular autocorrelación de residuos
    const autocorr = [];
    for (let lag = 0; lag <= q; lag++) {
      let sum = 0;
      for (let i = 0; i < centeredResiduals.length - lag; i++) {
        sum += centeredResiduals[i] * centeredResiduals[i + lag];
      }
      autocorr.push(sum / centeredResiduals.length);
    }
    
    // Para MA simplificado, usar aproximación
    const maParams = [];
    for (let i = 1; i <= q; i++) {
      if (autocorr[i] !== undefined && autocorr[0] !== 0) {
        maParams.push(autocorr[i] / autocorr[0]);
      } else {
        maParams.push(0);
      }
    }
    
    return maParams;
  }

  /**
   * Calcula residuos del componente AR
   */
  calculateARResiduals(series, arParams) {
    const residuals = [];
    const mean = ss.mean(series);
    
    for (let i = 0; i < series.length; i++) {
      let predicted = mean;
      for (let j = 0; j < arParams.length && i - j - 1 >= 0; j++) {
        predicted += arParams[j] * (series[i - j - 1] - mean);
      }
      residuals.push(series[i] - predicted);
    }
    
    return residuals;
  }

  /**
   * Calcula residuos totales del modelo ARIMA
   */
  calculateResiduals(series, arParams, maParams) {
    const residuals = [];
    const mean = ss.mean(series);
    
    // Predicciones AR
    const arPredictions = [];
    for (let i = 0; i < series.length; i++) {
      let predicted = mean;
      for (let j = 0; j < arParams.length && i - j - 1 >= 0; j++) {
        predicted += arParams[j] * (series[i - j - 1] - mean);
      }
      arPredictions.push(predicted);
    }
    
    // Ajustar con MA
    const maResiduals = series.map((value, idx) => value - arPredictions[idx]);
    
    for (let i = 0; i < series.length; i++) {
      let maComponent = 0;
      for (let j = 0; j < maParams.length && i - j - 1 >= 0; j++) {
        maComponent += maParams[j] * maResiduals[i - j - 1];
      }
      residuals.push(maResiduals[i] - maComponent);
    }
    
    return residuals;
  }

  /**
   * Realiza forecast de n pasos adelante
   */
  forecast(steps = 1) {
    if (!this.isFitted) {
      throw new Error('El modelo debe ser ajustado antes de hacer forecast');
    }

    const forecasts = [];
    const mean = this.coefficients.mean;
    const arParams = this.coefficients.ar || [];
    const maParams = this.coefficients.ma || [];
    
    // Usar los últimos valores de la serie original
    let series = this.differencedSeries 
      ? this.differencedSeries[this.differencedSeries.length - 1]
      : [...this.originalSeries];
    
    // Normalizar
    const seriesMean = ss.mean(series);
    const normalizedSeries = series.map(x => x - seriesMean);
    
    // Forecast
    for (let step = 0; step < steps; step++) {
      let forecast = 0;
      
      // Componente AR
      for (let i = 0; i < arParams.length; i++) {
        const idx = normalizedSeries.length - 1 - i;
        if (idx >= 0) {
          forecast += arParams[i] * normalizedSeries[idx];
        }
      }
      
      // Componente MA (usar residuos históricos)
      for (let i = 0; i < maParams.length && this.residuals.length - 1 - i >= 0; i++) {
        const residualIdx = this.residuals.length - 1 - i;
        forecast += maParams[i] * (this.residuals[residualIdx] || 0);
      }
      
      forecasts.push(forecast + seriesMean);
      
      // Agregar forecast a la serie para el siguiente paso
      normalizedSeries.push(forecast);
    }
    
    // Revertir diferenciación si es necesario
    if (this.d > 0 && this.differencedSeries) {
      return this.undifference(forecasts);
    }
    
    return forecasts;
  }

  /**
   * Revierte la diferenciación
   */
  undifference(forecasts) {
    let result = [...forecasts];
    
    // Revertir en orden inverso
    for (let i = this.differencedSeries.length - 2; i >= 0; i--) {
      const previousSeries = this.differencedSeries[i];
      const lastValue = previousSeries[previousSeries.length - 1];
      
      result = result.map((val, idx) => {
        if (idx === 0) {
          return val + lastValue;
        }
        return val + result[idx - 1];
      });
    }
    
    return result;
  }

  /**
   * Calcula AIC (Akaike Information Criterion)
   */
  calculateAIC() {
    if (!this.isFitted) return null;
    
    const n = this.residuals.length;
    const k = this.p + this.q + 1; // Número de parámetros
    const logLikelihood = -n * Math.log(2 * Math.PI * this.coefficients.variance) / 2 - 
                          this.residuals.reduce((sum, r) => sum + r * r, 0) / (2 * this.coefficients.variance);
    
    return 2 * k - 2 * logLikelihood;
  }

  /**
   * Calcula BIC (Bayesian Information Criterion)
   */
  calculateBIC() {
    if (!this.isFitted) return null;
    
    const n = this.residuals.length;
    const k = this.p + this.q + 1;
    const logLikelihood = -n * Math.log(2 * Math.PI * this.coefficients.variance) / 2 - 
                          this.residuals.reduce((sum, r) => sum + r * r, 0) / (2 * this.coefficients.variance);
    
    return k * Math.log(n) - 2 * logLikelihood;
  }

  /**
   * Retorna el número mínimo de puntos de datos requeridos
   */
  minDataPoints() {
    return Math.max(30, (this.p + this.d + this.q) * 3);
  }

  /**
   * Valida si los parámetros son estacionarios
   */
  isStationary() {
    if (!this.isFitted) return false;
    
    // Verificar que las raíces del polinomio AR estén dentro del círculo unitario
    const arParams = this.coefficients.ar || [];
    if (arParams.length === 1) {
      return Math.abs(arParams[0]) < 1;
    }
    
    // Para p>1, verificación más compleja (simplificada)
    return arParams.every(param => Math.abs(param) < 1);
  }

  /**
   * Obtiene resumen del modelo
   */
  getSummary() {
    if (!this.isFitted) {
      return { message: 'Modelo no ajustado aún' };
    }

    return {
      order: { p: this.p, d: this.d, q: this.q },
      coefficients: this.coefficients,
      isStationary: this.isStationary(),
      aic: this.calculateAIC(),
      bic: this.calculateBIC(),
      residualVariance: this.coefficients.variance,
      residualMean: this.coefficients.mean
    };
  }
}

module.exports = ARIMAModel;
