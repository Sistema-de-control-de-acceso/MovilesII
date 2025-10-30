/**
 * Servicio de Jobs Automáticos para Actualización Semanal
 * Configura y ejecuta jobs programados
 */

const WeeklyModelUpdateService = require('./weekly_model_update_service');
const ModelDriftMonitor = require('./model_drift_monitor');

class AutomaticUpdateScheduler {
  constructor(AsistenciaModel) {
    this.updateService = new WeeklyModelUpdateService(AsistenciaModel);
    this.driftMonitor = new ModelDriftMonitor();
    this.scheduledJobs = [];
    this.isRunning = false;
  }

  /**
   * Configura job semanal automático
   */
  scheduleWeeklyUpdate(config = {}) {
    const {
      dayOfWeek = 0, // Domingo
      hour = 2, // 2 AM
      interval = 7, // días
      enabled = true
    } = config;

    this.updateService.configureSchedule({
      enabled,
      dayOfWeek,
      hour,
      interval
    });

    // En un entorno real, aquí se configuraría un cron job
    // Por ahora, simulamos con un intervalo simple
    if (enabled && !this.isRunning) {
      this.startScheduler();
    }

    return {
      success: true,
      schedule: {
        enabled,
        dayOfWeek,
        hour,
        interval,
        nextRun: this.calculateNextRun(dayOfWeek, hour)
      }
    };
  }

  /**
   * Inicia el scheduler
   */
  startScheduler() {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    const schedule = this.updateService.getScheduleConfig();

    if (!schedule.enabled) {
      return;
    }

    // Calcular intervalo hasta próxima ejecución
    const nextRun = this.calculateNextRun(schedule.dayOfWeek, schedule.hour);
    const msUntilNext = nextRun - Date.now();

    console.log(`⏰ Job semanal programado para: ${new Date(nextRun).toISOString()}`);

    // Programar primera ejecución
    setTimeout(() => {
      this.executeScheduledUpdate();
      // Programar ejecuciones periódicas
      this.scheduleInterval(schedule.interval);
    }, msUntilNext);
  }

  /**
   * Programa ejecuciones periódicas
   */
  scheduleInterval(intervalDays) {
    const intervalMs = intervalDays * 24 * 60 * 60 * 1000;

    setInterval(() => {
      this.executeScheduledUpdate();
    }, intervalMs);
  }

  /**
   * Calcula próxima ejecución
   */
  calculateNextRun(dayOfWeek, hour) {
    const now = new Date();
    const next = new Date();

    // Establecer día y hora
    next.setDate(now.getDate() + ((dayOfWeek - now.getDay() + 7) % 7));
    next.setHours(hour, 0, 0, 0);

    // Si ya pasó hoy, programar para próxima semana
    if (next < now) {
      next.setDate(next.getDate() + 7);
    }

    return next.getTime();
  }

  /**
   * Ejecuta actualización programada
   */
  async executeScheduledUpdate() {
    try {
      console.log('🔄 Ejecutando actualización semanal programada...');

      const result = await this.updateService.executeWeeklyUpdate({
        incremental: true,
        validatePerformance: true,
        checkDrift: true,
        targetR2: 0.7
      });

      console.log('✅ Actualización semanal completada:', result);

      // Registrar ejecución
      await this.recordScheduledExecution(result);

      return result;
    } catch (error) {
      console.error('❌ Error en actualización programada:', error);
      await this.recordScheduledExecution({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Registra ejecución programada
   */
  async recordScheduledExecution(result) {
    try {
      const fs = require('fs').promises;
      const path = require('path');
      const historyDir = path.join(__dirname, '../data/scheduled_updates');

      await fs.mkdir(historyDir, { recursive: true });

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `scheduled_${timestamp}.json`;
      const filepath = path.join(historyDir, filename);

      await fs.writeFile(
        filepath,
        JSON.stringify({
          ...result,
          scheduled: true,
          timestamp: new Date().toISOString()
        }, null, 2)
      );

      return filepath;
    } catch (error) {
      console.warn('Error registrando ejecución programada:', error.message);
      return null;
    }
  }

  /**
   * Obtiene estado del scheduler
   */
  getSchedulerStatus() {
    const schedule = this.updateService.getScheduleConfig();

    return {
      enabled: schedule.enabled && this.isRunning,
      isRunning: this.isRunning,
      schedule: {
        dayOfWeek: schedule.dayOfWeek,
        hour: schedule.hour,
        interval: schedule.interval,
        nextRun: this.calculateNextRun(schedule.dayOfWeek, schedule.hour)
      }
    };
  }

  /**
   * Detiene el scheduler
   */
  stopScheduler() {
    this.isRunning = false;
    this.updateService.configureSchedule({ enabled: false });

    return {
      success: true,
      message: 'Scheduler detenido'
    };
  }

  /**
   * Ejecuta actualización manual
   */
  async executeManualUpdate(options = {}) {
    return await this.updateService.executeWeeklyUpdate({
      incremental: true,
      validatePerformance: true,
      checkDrift: true,
      ...options
    });
  }

  /**
   * Monitorea drift del modelo
   */
  async monitorModelDrift() {
    try {
      const currentModel = await this.updateService.loadCurrentModel();
      if (!currentModel) {
        throw new Error('No hay modelo actual para monitorear');
      }

      const newData = await this.updateService.collectNewData(7);

      const driftResults = await this.driftMonitor.monitorDrift(
        currentModel,
        newData
      );

      return {
        driftDetected: driftResults.overall.detected,
        severity: driftResults.overall.severity,
        score: driftResults.overall.score,
        details: driftResults,
        report: this.driftMonitor.generateDriftReport(driftResults),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Error monitoreando drift: ${error.message}`);
    }
  }
}

module.exports = AutomaticUpdateScheduler;

