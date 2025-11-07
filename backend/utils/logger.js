/**
 * Servicio de Logging Centralizado
 * 
 * Proporciona logging estructurado en formato JSON con:
 * - Request ID para correlación
 * - Niveles de log configurables
 * - Integración con sistemas de logging centralizados
 * - Formato estándar para ELK/Datadog/Cloud Logging
 */

const winston = require('winston');
const { v4: uuidv4 } = require('uuid');

// Configuración de niveles de log
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue'
};

winston.addColors(logColors);

// Formato JSON estructurado para logging centralizado
const jsonFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf((info) => {
    const logEntry = {
      timestamp: info.timestamp,
      level: info.level,
      message: info.message,
      service: 'moviles2-backend',
      environment: process.env.NODE_ENV || 'development',
      requestId: info.requestId || null,
      userId: info.userId || null,
      endpoint: info.endpoint || null,
      method: info.method || null,
      statusCode: info.statusCode || null,
      duration: info.duration || null,
      error: info.error ? {
        name: info.error.name,
        message: info.error.message,
        stack: info.error.stack
      } : null,
      metadata: info.metadata || {}
    };

    // Limpiar campos nulos para reducir tamaño
    Object.keys(logEntry).forEach(key => {
      if (logEntry[key] === null || (typeof logEntry[key] === 'object' && Object.keys(logEntry[key]).length === 0)) {
        delete logEntry[key];
      }
    });

    return JSON.stringify(logEntry);
  })
);

// Formato para consola (más legible)
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf((info) => {
    const requestId = info.requestId ? `[${info.requestId.substring(0, 8)}]` : '';
    const endpoint = info.endpoint ? ` ${info.method} ${info.endpoint}` : '';
    const duration = info.duration ? ` (${info.duration}ms)` : '';
    return `${info.timestamp} ${info.level} ${requestId}${endpoint}${duration}: ${info.message}`;
  })
);

// Determinar nivel de log según ambiente
const getLogLevel = () => {
  const env = process.env.NODE_ENV || 'development';
  const configLevel = process.env.LOG_LEVEL || 'info';
  
  if (env === 'production') {
    return 'info';
  } else if (env === 'staging') {
    return configLevel === 'debug' ? 'debug' : 'info';
  } else {
    return configLevel;
  }
};

// Crear transportes según ambiente
const transports = [];

// Transporte para consola (siempre activo)
transports.push(
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'production' ? jsonFormat : consoleFormat,
    level: getLogLevel()
  })
);

// Transporte para archivo (opcional, para desarrollo/staging)
if (process.env.LOG_FILE_PATH) {
  transports.push(
    new winston.transports.File({
      filename: process.env.LOG_FILE_PATH,
      format: jsonFormat,
      level: getLogLevel(),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  );
}

// Crear logger principal
const logger = winston.createLogger({
  levels: logLevels,
  level: getLogLevel(),
  format: jsonFormat,
  transports: transports,
  exitOnError: false
});

/**
 * Middleware para agregar request ID a cada request
 */
const requestIdMiddleware = (req, res, next) => {
  // Obtener request ID del header o generar uno nuevo
  req.requestId = req.headers['x-request-id'] || uuidv4();
  
  // Agregar request ID al header de respuesta
  res.setHeader('X-Request-ID', req.requestId);
  
  // Agregar request ID al objeto req para uso en logs
  // Obtener userId si está disponible (después de autenticación)
  const userId = req.user ? req.user._id : null;
  req.logger = createRequestLogger(req.requestId, userId);
  
  next();
};

/**
 * Crea un logger con contexto de request
 */
const createRequestLogger = (requestId, userId = null) => {
  return {
    error: (message, error = null, metadata = {}) => {
      logger.error(message, {
        requestId,
        userId,
        error: error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : null,
        metadata
      });
    },
    warn: (message, metadata = {}) => {
      logger.warn(message, { requestId, userId, metadata });
    },
    info: (message, metadata = {}) => {
      logger.info(message, { requestId, userId, metadata });
    },
    http: (message, metadata = {}) => {
      logger.http(message, { requestId, userId, ...metadata });
    },
    debug: (message, metadata = {}) => {
      logger.debug(message, { requestId, userId, metadata });
    }
  };
};

/**
 * Middleware para logging de requests HTTP
 */
const httpLoggerMiddleware = (req, res, next) => {
  const startTime = Date.now();
  const requestId = req.requestId || uuidv4();
  
  // Log de request entrante
  logger.http('Incoming request', {
    requestId,
    method: req.method,
    endpoint: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });

  // Interceptar respuesta
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - startTime;
    
    // Log de respuesta solo si no es un endpoint de health check o estático
    if (!req.path.includes('/health') && !req.path.includes('/public')) {
      logger.http('Outgoing response', {
        requestId,
        method: req.method,
        endpoint: req.path,
        statusCode: res.statusCode,
        duration,
        userId: req.user ? req.user._id.toString() : null
      });
    }

    originalSend.call(this, data);
  };

  next();
};

/**
 * Logger global (sin contexto de request)
 */
const globalLogger = {
  error: (message, error = null, metadata = {}) => {
    logger.error(message, {
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : null,
      metadata
    });
  },
  warn: (message, metadata = {}) => {
    logger.warn(message, { metadata });
  },
  info: (message, metadata = {}) => {
    logger.info(message, { metadata });
  },
  http: (message, metadata = {}) => {
    logger.http(message, metadata);
  },
  debug: (message, metadata = {}) => {
    logger.debug(message, { metadata });
  }
};

module.exports = {
  logger: globalLogger,
  requestIdMiddleware,
  httpLoggerMiddleware,
  createRequestLogger
};

