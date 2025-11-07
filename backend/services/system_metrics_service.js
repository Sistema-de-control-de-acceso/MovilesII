/**
 * Servicio de Métricas del Sistema
 * 
 * Proporciona métricas de CPU, memoria y disco del sistema
 */

const os = require('os');
const process = require('process');

class SystemMetricsService {
  constructor() {
    this.startTime = Date.now();
    this.lastCpuUsage = process.cpuUsage();
    this.lastCpuTime = Date.now();
  }

  /**
   * Obtener métricas de CPU
   */
  getCpuMetrics() {
    const cpus = os.cpus();
    const cpuUsage = process.cpuUsage(this.lastCpuUsage);
    const currentTime = Date.now();
    const elapsedTime = (currentTime - this.lastCpuTime) / 1000; // en segundos
    
    // Calcular porcentaje de CPU usado por el proceso
    const totalCpuTime = (cpuUsage.user + cpuUsage.system) / 1000000; // convertir a segundos
    const cpuPercent = (totalCpuTime / elapsedTime) * 100;
    
    // Actualizar para próxima llamada
    this.lastCpuUsage = process.cpuUsage();
    this.lastCpuTime = currentTime;

    // CPU promedio del sistema
    const loadAvg = os.loadavg();
    const cpuCount = cpus.length;
    const systemLoadPercent = (loadAvg[0] / cpuCount) * 100;

    return {
      process: {
        usage: Math.min(cpuPercent, 100), // Limitar a 100%
        user: cpuUsage.user / 1000000, // segundos
        system: cpuUsage.system / 1000000 // segundos
      },
      system: {
        loadAverage: {
          '1min': loadAvg[0],
          '5min': loadAvg[1],
          '15min': loadAvg[2]
        },
        loadPercent: Math.min(systemLoadPercent, 100),
        cores: cpuCount,
        model: cpus[0]?.model || 'Unknown'
      }
    };
  }

  /**
   * Obtener métricas de memoria
   */
  getMemoryMetrics() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsagePercent = (usedMemory / totalMemory) * 100;

    // Memoria del proceso Node.js
    const processMemory = process.memoryUsage();
    const processMemoryMB = {
      rss: processMemory.rss / 1024 / 1024, // Resident Set Size
      heapTotal: processMemory.heapTotal / 1024 / 1024,
      heapUsed: processMemory.heapUsed / 1024 / 1024,
      external: processMemory.external / 1024 / 1024,
      arrayBuffers: processMemory.arrayBuffers / 1024 / 1024
    };

    return {
      system: {
        total: totalMemory,
        totalMB: totalMemory / 1024 / 1024,
        free: freeMemory,
        freeMB: freeMemory / 1024 / 1024,
        used: usedMemory,
        usedMB: usedMemory / 1024 / 1024,
        usagePercent: memoryUsagePercent
      },
      process: {
        rss: processMemoryMB.rss,
        heapTotal: processMemoryMB.heapTotal,
        heapUsed: processMemoryMB.heapUsed,
        external: processMemoryMB.external,
        arrayBuffers: processMemoryMB.arrayBuffers,
        heapUsagePercent: (processMemoryMB.heapUsed / processMemoryMB.heapTotal) * 100
      }
    };
  }

  /**
   * Obtener métricas de disco (si está disponible)
   */
  async getDiskMetrics() {
    // En Node.js, obtener métricas de disco requiere módulos adicionales
    // Por ahora, retornamos información básica del sistema
    const platform = os.platform();
    const arch = os.arch();
    const hostname = os.hostname();
    const uptime = os.uptime();

    return {
      platform,
      arch,
      hostname,
      uptime: {
        seconds: uptime,
        formatted: this.formatUptime(uptime)
      },
      // Nota: Métricas detalladas de disco requerirían módulo adicional como 'node-disk-info'
      note: 'Métricas detalladas de disco requieren módulo adicional'
    };
  }

  /**
   * Formatear tiempo de actividad
   */
  formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    return `${days}d ${hours}h ${minutes}m ${secs}s`;
  }

  /**
   * Obtener métricas de uptime del proceso
   */
  getProcessUptime() {
    const uptime = process.uptime();
    return {
      seconds: uptime,
      formatted: this.formatUptime(uptime),
      startTime: new Date(this.startTime).toISOString()
    };
  }

  /**
   * Obtener todas las métricas del sistema
   */
  async getAllMetrics() {
    const cpu = this.getCpuMetrics();
    const memory = this.getMemoryMetrics();
    const disk = await this.getDiskMetrics();
    const processUptime = this.getProcessUptime();

    return {
      cpu,
      memory,
      disk,
      process: {
        uptime: processUptime,
        pid: process.pid,
        version: process.version,
        platform: process.platform,
        arch: process.arch
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Verificar si el sistema está saludable
   */
  async checkHealth(thresholds = {}) {
    const defaults = {
      cpuPercent: 90,
      memoryPercent: 90,
      heapPercent: 90
    };

    const config = { ...defaults, ...thresholds };
    const metrics = await this.getAllMetrics();
    
    const issues = [];
    let status = 'healthy';

    // Verificar CPU
    if (metrics.cpu.process.usage > config.cpuPercent) {
      issues.push({
        type: 'cpu',
        severity: 'warning',
        message: `CPU usage is ${metrics.cpu.process.usage.toFixed(2)}% (threshold: ${config.cpuPercent}%)`,
        value: metrics.cpu.process.usage,
        threshold: config.cpuPercent
      });
      status = 'degraded';
    }

    // Verificar memoria del sistema
    if (metrics.memory.system.usagePercent > config.memoryPercent) {
      issues.push({
        type: 'memory',
        severity: 'warning',
        message: `System memory usage is ${metrics.memory.system.usagePercent.toFixed(2)}% (threshold: ${config.memoryPercent}%)`,
        value: metrics.memory.system.usagePercent,
        threshold: config.memoryPercent
      });
      status = 'degraded';
    }

    // Verificar heap del proceso
    if (metrics.memory.process.heapUsagePercent > config.heapPercent) {
      issues.push({
        type: 'heap',
        severity: 'warning',
        message: `Process heap usage is ${metrics.memory.process.heapUsagePercent.toFixed(2)}% (threshold: ${config.heapPercent}%)`,
        value: metrics.memory.process.heapUsagePercent,
        threshold: config.heapPercent
      });
      status = 'degraded';
    }

    return {
      status,
      metrics,
      issues,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = SystemMetricsService;

