/**
 * Rutas para monitoreo de app mobile
 * 
 * Endpoints para recibir métricas y eventos de la app mobile
 */

const express = require('express');
const router = express.Router();
const MobileAlertService = require('../services/mobile_alert_service');
const { logger } = require('../utils/logger');

// Instancia del servicio (debe ser la misma que en index.js)
// En producción, esto debería venir de un singleton o dependency injection
let mobileAlertServiceInstance = null;

function setMobileAlertService(service) {
  mobileAlertServiceInstance = service;
}

// Middleware para validar datos
function validateMobileData(req, res, next) {
  const { deviceId, appVersion, platform } = req.body;
  
  if (!deviceId || !appVersion) {
    return res.status(400).json({
      error: 'deviceId y appVersion son requeridos',
    });
  }
  
  req.mobileContext = { deviceId, appVersion, platform };
  next();
}

// Endpoint para reportar crash
router.post('/crash', validateMobileData, async (req, res) => {
  const requestLogger = req.logger || logger;
  
  try {
    const { error, stackTrace, context } = req.body;
    
    if (!mobileAlertServiceInstance) {
      return res.status(503).json({ error: 'Mobile alert service no disponible' });
    }

    await mobileAlertServiceInstance.recordCrash({
      error: error || 'Unknown error',
      stackTrace,
      context: { ...req.mobileContext, ...context },
    });

    requestLogger.warn('Crash reportado desde mobile', {
      deviceId: req.mobileContext.deviceId,
      appVersion: req.mobileContext.appVersion,
    });

    res.json({ success: true });
  } catch (err) {
    requestLogger.error('Error registrando crash', err);
    res.status(500).json({ error: err.message });
  }
});

// Endpoint para reportar error
router.post('/error', validateMobileData, async (req, res) => {
  const requestLogger = req.logger || logger;
  
  try {
    const { error, stackTrace, operation, context } = req.body;
    
    if (!mobileAlertServiceInstance) {
      return res.status(503).json({ error: 'Mobile alert service no disponible' });
    }

    await mobileAlertServiceInstance.recordError({
      error: error || 'Unknown error',
      stackTrace,
      operation,
      context: { ...req.mobileContext, ...context },
    });

    requestLogger.warn('Error reportado desde mobile', {
      deviceId: req.mobileContext.deviceId,
      operation,
    });

    res.json({ success: true });
  } catch (err) {
    requestLogger.error('Error registrando error mobile', err);
    res.status(500).json({ error: err.message });
  }
});

// Endpoint para reportar latencia
router.post('/latency', validateMobileData, async (req, res) => {
  try {
    const { operation, milliseconds } = req.body;
    
    if (!mobileAlertServiceInstance) {
      return res.status(503).json({ error: 'Mobile alert service no disponible' });
    }

    if (!operation || typeof milliseconds !== 'number') {
      return res.status(400).json({
        error: 'operation y milliseconds son requeridos',
      });
    }

    await mobileAlertServiceInstance.recordLatency(operation, milliseconds);

    res.json({ success: true });
  } catch (err) {
    logger.error('Error registrando latencia mobile', err);
    res.status(500).json({ error: err.message });
  }
});

// Endpoint para reportar ANR
router.post('/anr', validateMobileData, async (req, res) => {
  const requestLogger = req.logger || logger;
  
  try {
    const { reason, context } = req.body;
    
    if (!mobileAlertServiceInstance) {
      return res.status(503).json({ error: 'Mobile alert service no disponible' });
    }

    await mobileAlertServiceInstance.recordANR({
      reason: reason || 'Unknown',
      context: { ...req.mobileContext, ...context },
    });

    requestLogger.error('ANR reportado desde mobile', {
      deviceId: req.mobileContext.deviceId,
      reason,
    });

    res.json({ success: true });
  } catch (err) {
    requestLogger.error('Error registrando ANR mobile', err);
    res.status(500).json({ error: err.message });
  }
});

// Endpoint para reportar sesión
router.post('/session', validateMobileData, async (req, res) => {
  try {
    const { sessionId, startTime, endTime } = req.body;
    
    if (!mobileAlertServiceInstance) {
      return res.status(503).json({ error: 'Mobile alert service no disponible' });
    }

    mobileAlertServiceInstance.recordSession({
      sessionId,
      startTime,
      endTime,
      ...req.mobileContext,
    });

    res.json({ success: true });
  } catch (err) {
    logger.error('Error registrando sesión mobile', err);
    res.status(500).json({ error: err.message });
  }
});

// Endpoint para obtener métricas
router.get('/metrics', async (req, res) => {
  try {
    if (!mobileAlertServiceInstance) {
      return res.status(503).json({ error: 'Mobile alert service no disponible' });
    }

    const metrics = mobileAlertServiceInstance.getMetrics();
    res.json(metrics);
  } catch (err) {
    logger.error('Error obteniendo métricas mobile', err);
    res.status(500).json({ error: err.message });
  }
});

// Endpoint para configurar umbrales
router.post('/thresholds', async (req, res) => {
  const requestLogger = req.logger || logger;
  
  try {
    if (!mobileAlertServiceInstance) {
      return res.status(503).json({ error: 'Mobile alert service no disponible' });
    }

    const thresholds = req.body;
    mobileAlertServiceInstance.setThresholds(thresholds);

    requestLogger.info('Umbrales mobile actualizados', { thresholds });

    res.json({
      success: true,
      thresholds: mobileAlertServiceInstance.thresholds,
    });
  } catch (err) {
    requestLogger.error('Error actualizando umbrales mobile', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = { router, setMobileAlertService };

