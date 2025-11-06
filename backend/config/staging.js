// Configuración para ambiente de staging
module.exports = {
  // URL de la base de datos de staging
  MONGODB_URI: process.env.MONGODB_URI_STAGING || process.env.MONGODB_URI,
  
  // Puerto para staging
  PORT: process.env.PORT_STAGING || 3001,
  
  // Configuración de tests
  NODE_ENV: 'staging',
  
  // Timeouts para tests E2E
  E2E_TIMEOUT: 30000, // 30 segundos
  
  // Configuración de rate limiting para staging
  RATE_LIMIT: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // 100 requests por ventana
    standardHeaders: true,
    legacyHeaders: false
  },
  
  // Configuración específica por tipo de endpoint
  RATE_LIMIT_BY_ENDPOINT: {
    login: {
      windowMs: 15 * 60 * 1000,
      max: 10 // Más permisivo en staging para testing
    },
    auth: {
      windowMs: 15 * 60 * 1000,
      max: 50
    },
    userCrud: {
      windowMs: 15 * 60 * 1000,
      max: 100
    },
    metrics: {
      windowMs: 1 * 60 * 1000, // 1 minuto
      max: 100
    },
    asistencia: {
      windowMs: 1 * 60 * 1000,
      max: 200
    }
  },
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'debug',
};

