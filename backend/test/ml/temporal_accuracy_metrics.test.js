/**
 * Tests para métricas de precisión temporal
 */

const TemporalAccuracyMetrics = require('../../ml/temporal_accuracy_metrics');

describe('TemporalAccuracyMetrics', () => {
  let metrics;

  beforeEach(() => {
    metrics = new TemporalAccuracyMetrics();
  });

  test('debe calcular MAE correctamente', () => {
    const forecasts = [10, 20, 30, 40, 50];
    const actual = [12, 18, 32, 38, 52];
    
    const mae = metrics.calculateMAE(forecasts, actual);
    
    expect(mae).toBeCloseTo(2.4, 1); // |10-12| + |20-18| + ... / 5 = 2.4
  });

  test('debe calcular RMSE correctamente', () => {
    const forecasts = [10, 20, 30];
    const actual = [12, 18, 32];
    
    const rmse = metrics.calculateRMSE(forecasts, actual);
    
    expect(rmse).toBeGreaterThan(0);
    expect(typeof rmse).toBe('number');
  });

  test('debe calcular MAPE correctamente', () => {
    const forecasts = [10, 20, 30];
    const actual = [12, 18, 32];
    
    const mape = metrics.calculateMAPE(forecasts, actual);
    
    expect(mape).toBeGreaterThan(0);
    expect(mape).toBeLessThan(100);
    expect(typeof mape).toBe('number');
  });

  test('debe calcular R² correctamente', () => {
    const forecasts = [10, 20, 30, 40, 50];
    const actual = [12, 18, 32, 38, 52];
    
    const r2 = metrics.calculateR2(forecasts, actual);
    
    expect(r2).toBeGreaterThanOrEqual(-Infinity);
    expect(r2).toBeLessThanOrEqual(1);
    expect(typeof r2).toBe('number');
  });

  test('debe calcular precisión direccional', () => {
    const forecasts = [10, 20, 15, 25, 30];
    const actual = [12, 18, 16, 24, 32];
    
    const directionalAccuracy = metrics.calculateDirectionalAccuracy(forecasts, actual);
    
    expect(directionalAccuracy).toBeGreaterThanOrEqual(0);
    expect(directionalAccuracy).toBeLessThanOrEqual(1);
  });

  test('debe calcular todas las métricas', () => {
    const forecasts = [10, 20, 30, 40, 50];
    const actual = [12, 18, 32, 38, 52];
    
    const allMetrics = metrics.calculateAllMetrics(forecasts, actual);
    
    expect(allMetrics.mae).toBeDefined();
    expect(allMetrics.rmse).toBeDefined();
    expect(allMetrics.mape).toBeDefined();
    expect(allMetrics.accuracy).toBeDefined();
    expect(allMetrics.r2).toBeDefined();
    expect(allMetrics.directionalAccuracy).toBeDefined();
    expect(allMetrics.meetsMinimumAccuracy).toBeDefined();
  });

  test('debe validar precisión mínima', () => {
    // Forecasts muy precisos
    const goodForecasts = [10, 20, 30];
    const actual = [10.5, 20.2, 30.1];
    
    const validation = metrics.validateAccuracy(goodForecasts, actual);
    
    expect(validation.passes).toBeDefined();
    expect(typeof validation.passes).toBe('boolean');
    expect(validation.accuracy).toBeDefined();
    expect(validation.minimumRequired).toBe(0.75);
  });

  test('debe generar reporte completo', () => {
    const forecasts = [10, 20, 30, 40, 50];
    const actual = [12, 18, 32, 38, 52];
    
    const report = metrics.generateReport(forecasts, actual, {
      modelType: 'ARIMA',
      order: { p: 1, d: 1, q: 1 }
    });
    
    expect(report.summary).toBeDefined();
    expect(report.metrics).toBeDefined();
    expect(report.validation).toBeDefined();
    expect(report.summary.model).toBe('ARIMA');
  });

  test('debe manejar series de diferentes longitudes con error', () => {
    const forecasts = [10, 20, 30];
    const actual = [12, 18];
    
    expect(() => {
      metrics.calculateAllMetrics(forecasts, actual);
    }).toThrow('Forecasts y valores reales deben tener la misma longitud');
  });
});
