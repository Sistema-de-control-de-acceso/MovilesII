/**
 * Tests unitarios para rate limiting
 */

const rateLimit = require('express-rate-limit');
const {
  loginLimiter,
  authLimiter,
  userCrudLimiter,
  metricsLimiter,
  asistenciaLimiter,
  getRateLimitConfig
} = require('../../utils/rateLimiter');

describe('Rate Limiter Configuration', () => {
  describe('getRateLimitConfig', () => {
    test('debe retornar configuración de desarrollo por defecto', () => {
      const originalEnv = process.env.NODE_ENV;
      delete process.env.NODE_ENV;
      
      const config = getRateLimitConfig();
      expect(config).toBeDefined();
      expect(config.windowMs).toBe(15 * 60 * 1000);
      expect(config.max).toBe(1000);
      
      process.env.NODE_ENV = originalEnv;
    });

    test('debe retornar configuración de staging', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'staging';
      
      const config = getRateLimitConfig();
      expect(config).toBeDefined();
      expect(config.windowMs).toBe(15 * 60 * 1000);
      
      process.env.NODE_ENV = originalEnv;
    });

    test('debe retornar configuración de producción', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const config = getRateLimitConfig();
      expect(config).toBeDefined();
      expect(config.windowMs).toBe(15 * 60 * 1000);
      expect(config.max).toBe(50);
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Login Limiter', () => {
    test('debe tener configuración estricta', () => {
      expect(loginLimiter).toBeDefined();
      // Verificar que el limiter está configurado
      expect(loginLimiter.windowMs).toBe(15 * 60 * 1000);
    });

    test('debe tener límite más bajo en producción', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      // Re-importar para obtener nueva configuración
      delete require.cache[require.resolve('../../utils/rateLimiter')];
      const { loginLimiter: prodLoginLimiter } = require('../../utils/rateLimiter');
      
      expect(prodLoginLimiter.max).toBe(5);
      
      process.env.NODE_ENV = originalEnv;
      delete require.cache[require.resolve('../../utils/rateLimiter')];
    });
  });

  describe('Auth Limiter', () => {
    test('debe estar configurado', () => {
      expect(authLimiter).toBeDefined();
      expect(authLimiter.windowMs).toBe(15 * 60 * 1000);
    });
  });

  describe('User CRUD Limiter', () => {
    test('debe estar configurado', () => {
      expect(userCrudLimiter).toBeDefined();
      expect(userCrudLimiter.windowMs).toBe(15 * 60 * 1000);
    });
  });

  describe('Metrics Limiter', () => {
    test('debe tener ventana más corta', () => {
      expect(metricsLimiter).toBeDefined();
      expect(metricsLimiter.windowMs).toBe(1 * 60 * 1000); // 1 minuto
    });
  });

  describe('Asistencia Limiter', () => {
    test('debe estar configurado', () => {
      expect(asistenciaLimiter).toBeDefined();
      expect(asistenciaLimiter.windowMs).toBe(1 * 60 * 1000); // 1 minuto
    });
  });
});

