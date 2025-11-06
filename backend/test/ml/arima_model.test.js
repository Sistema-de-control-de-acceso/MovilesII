/**
 * Tests para modelo ARIMA
 */

const ARIMAModel = require('../../ml/arima_model');

describe('ARIMAModel', () => {
  let model;

  beforeEach(() => {
    model = new ARIMAModel(1, 0, 1); // ARIMA(1,0,1)
  });

  test('debe crear instancia con parámetros correctos', () => {
    expect(model.p).toBe(1);
    expect(model.d).toBe(0);
    expect(model.q).toBe(1);
    expect(model.isFitted).toBe(false);
  });

  test('debe calcular número mínimo de puntos de datos', () => {
    const minPoints = model.minDataPoints();
    expect(minPoints).toBeGreaterThanOrEqual(30);
  });

  test('debe diferenciar serie correctamente', () => {
    const series = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const diff = model.difference(series, 1);
    
    expect(diff.length).toBe(2); // Original + diferenciada
    expect(diff[1].length).toBe(series.length - 1);
    expect(diff[1][0]).toBe(1); // 2 - 1
  });

  test('debe ajustar modelo con datos suficientes', () => {
    // Generar serie temporal sintética
    const timeSeries = [];
    let value = 10;
    for (let i = 0; i < 50; i++) {
      value += Math.sin(i / 10) * 2 + (Math.random() - 0.5) * 0.5;
      timeSeries.push(value);
    }

    const result = model.fit(timeSeries);
    
    expect(result.success).toBe(true);
    expect(model.isFitted).toBe(true);
    expect(model.coefficients).toBeDefined();
    expect(model.coefficients.ar).toBeDefined();
    expect(model.coefficients.ma).toBeDefined();
  });

  test('debe fallar con datos insuficientes', () => {
    const shortSeries = [1, 2, 3, 4, 5];
    
    expect(() => {
      model.fit(shortSeries);
    }).toThrow();
  });

  test('debe hacer forecast después de ajustar', () => {
    const timeSeries = [];
    let value = 10;
    for (let i = 0; i < 50; i++) {
      value += Math.sin(i / 10) * 2 + (Math.random() - 0.5) * 0.5;
      timeSeries.push(value);
    }

    model.fit(timeSeries);
    const forecasts = model.forecast(5);
    
    expect(forecasts.length).toBe(5);
    expect(forecasts.every(f => typeof f === 'number')).toBe(true);
  });

  test('debe fallar forecast sin ajustar modelo', () => {
    expect(() => {
      model.forecast(5);
    }).toThrow('El modelo debe ser ajustado antes de hacer forecast');
  });

  test('debe calcular AIC y BIC', () => {
    const timeSeries = [];
    let value = 10;
    for (let i = 0; i < 50; i++) {
      value += Math.sin(i / 10) * 2 + (Math.random() - 0.5) * 0.5;
      timeSeries.push(value);
    }

    model.fit(timeSeries);
    const aic = model.calculateAIC();
    const bic = model.calculateBIC();
    
    expect(aic).toBeDefined();
    expect(bic).toBeDefined();
    expect(typeof aic).toBe('number');
    expect(typeof bic).toBe('number');
  });

  test('debe retornar resumen del modelo', () => {
    const timeSeries = [];
    let value = 10;
    for (let i = 0; i < 50; i++) {
      value += Math.sin(i / 10) * 2 + (Math.random() - 0.5) * 0.5;
      timeSeries.push(value);
    }

    model.fit(timeSeries);
    const summary = model.getSummary();
    
    expect(summary.order).toEqual({ p: 1, d: 0, q: 1 });
    expect(summary.coefficients).toBeDefined();
    expect(typeof summary.isStationary).toBe('boolean');
  });
});
