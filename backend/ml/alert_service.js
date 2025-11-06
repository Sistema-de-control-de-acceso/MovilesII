// Servicio de Alertas de Congestión
// backend/ml/alert_service.js

const nodemailer = require('nodemailer');

class CongestionAlertService {
    /**
     * @param {Object} options
     * @param {number} options.threshold - Umbral de congestión
     */
    constructor(options = {}) {
        // Permite configurar el threshold por parámetro o variable de entorno
        this.threshold = options.threshold || parseInt(process.env.CONGESTION_THRESHOLD) || 50;
    }

    // Método para detectar congestión y generar alertas
    generateAlerts(controlPointsData, notify = true) {
        const alerts = [];
        for (const point of controlPointsData) {
            if (point.count > this.threshold) {
                const alert = {
                    pointId: point.id,
                    message: `Congestión detectada en punto ${point.name}`,
                    timestamp: new Date(),
                };
                alerts.push(alert);
                if (notify) {
                    this.notifyChannels(alert);
                }
            }
        }
        return alerts;
    }

    // Notifica por consola y email
    async notifyChannels(alert) {
        // Consola
        console.log(`[ALERTA] ${alert.message} (${alert.timestamp})`);

        // Email (ejemplo básico, requiere configuración real)
        if (process.env.ALERT_EMAIL) {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.ALERT_EMAIL,
                    pass: process.env.ALERT_EMAIL_PASS
                }
            });
            await transporter.sendMail({
                from: process.env.ALERT_EMAIL,
                to: process.env.ALERT_EMAIL,
                subject: 'Alerta de Congestión',
                text: `${alert.message} (${alert.timestamp})`
            });
        }
        // Aquí se pueden agregar otros canales (push, SMS, etc.)
    }
}

module.exports = CongestionAlertService;
