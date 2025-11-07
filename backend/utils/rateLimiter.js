/**
 * Configuración de Rate Limiting
 * 
 * Proporciona rate limiting configurable por endpoint y entorno
 * con respuestas HTTP 429 y headers explicativos
 */

const rateLimit = require('express-rate-limit');
const { logger } = require('./logger');

/**
 * Obtener configuración de rate limiting según entorno
 */
const getRateLimitConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  const stagingConfig = require('../config/staging');
  
  // Configuración base según entorno
  const baseConfig = {
    development: {
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 1000, // Muy permisivo en desarrollo
      standardHeaders: true,
      legacyHeaders: false,
    },
    staging: stagingConfig.RATE_LIMIT || {
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 100, // 100 requests por ventana
      standardHeaders: true,
      legacyHeaders: false,
    },
    production: {
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 50, // Más restrictivo en producción
      standardHeaders: true,
      legacyHeaders: false,
    }
  };

  return baseConfig[env] || baseConfig.development;
};

/**
 * Handler personalizado para cuando se excede el límite
 */
const rateLimitHandler = (req, res) => {
  const retryAfter = Math.ceil(req.rateLimit.resetTime / 1000);
  
  // Log del evento
  const requestLogger = req.logger || logger;
  requestLogger.warn('Rate limit excedido', {
    ip: req.ip,
    endpoint: req.path,
    method: req.method,
    limit: req.rateLimit.limit,
    remaining: req.rateLimit.remaining,
    resetTime: new Date(req.rateLimit.resetTime).toISOString(),
    metadata: {
      clientType: req.clientType,
      deviceId: req.deviceId
    }
  });

  // Headers estándar
  res.setHeader('Retry-After', retryAfter);
  res.setHeader('X-RateLimit-Limit', req.rateLimit.limit);
  res.setHeader('X-RateLimit-Remaining', req.rateLimit.remaining);
  res.setHeader('X-RateLimit-Reset', new Date(req.rateLimit.resetTime).toISOString());

  res.status(429).json({
    error: 'Demasiadas solicitudes',
    message: 'Has excedido el límite de solicitudes permitidas. Por favor, intenta nuevamente más tarde.',
    retryAfter: retryAfter,
    resetTime: new Date(req.rateLimit.resetTime).toISOString(),
    limit: req.rateLimit.limit,
    windowMs: req.rateLimit.windowMs
  });
};

/**
 * Rate limiter general (para endpoints no críticos)
 */
const generalLimiter = rateLimit({
  ...getRateLimitConfig(),
  handler: rateLimitHandler,
  skip: (req) => {
    // Saltar rate limiting en desarrollo si está configurado
    return process.env.NODE_ENV === 'development' && process.env.SKIP_RATE_LIMIT === 'true';
  }
});

/**
 * Rate limiter estricto para login
 * Más restrictivo para prevenir ataques de fuerza bruta
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === 'production' ? 5 : 10, // 5 intentos en producción, 10 en otros ambientes
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skipSuccessfulRequests: false, // Contar todos los intentos, incluso los exitosos
  keyGenerator: (req) => {
    // Usar IP + email si está disponible para tracking más preciso
    const email = req.body?.email || '';
    return `${req.ip}:${email}`;
  }
});

/**
 * Rate limiter para endpoints de autenticación
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === 'production' ? 20 : 50,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler
});

/**
 * Rate limiter para CRUD de usuarios
 * Endpoints sensibles que requieren protección
 */
const userCrudLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === 'production' ? 30 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler
});

/**
 * Rate limiter para endpoints de métricas/dashboard
 * Pueden ser costosos computacionalmente
 */
const metricsLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto (ventana más corta)
  max: process.env.NODE_ENV === 'production' ? 30 : 100, // Por minuto
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler
});

/**
 * Rate limiter para endpoints de asistencias
 * Endpoints críticos que reciben muchos requests
 */
const asistenciaLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: process.env.NODE_ENV === 'production' ? 60 : 200, // Por minuto
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler
});

/**
 * Rate limiter para endpoints de ML (Machine Learning)
 * Operaciones computacionalmente costosas
 */
const mlLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: process.env.NODE_ENV === 'production' ? 10 : 50,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler
});

/**
 * Middleware para deshabilitar rate limiting en tests
 */
const skipInTests = (req, res, next) => {
  if (process.env.NODE_ENV === 'test') {
    return next();
  }
  return generalLimiter(req, res, next);
};

module.exports = {
  generalLimiter,
  loginLimiter,
  authLimiter,
  userCrudLimiter,
  metricsLimiter,
  asistenciaLimiter,
  mlLimiter,
  skipInTests,
  getRateLimitConfig
};

