/**
 * Servicio de Notificaciones
 * Envía notificaciones por email a usuarios
 */

class NotificationService {
  constructor() {
    // En producción, aquí se integraría con un servicio de email
    // como SendGrid, AWS SES, Nodemailer, etc.
  }

  /**
   * Envía credenciales al nuevo usuario
   */
  async sendCredentialsToUser(userData) {
    try {
      const { email, password, nombre } = userData;

      // Aquí se implementaría el envío real de email
      // Por ahora, solo logueamos la información
      console.log('📧 Enviando credenciales a:', email);
      console.log('Usuario:', nombre);
      console.log('Contraseña:', password);

      // Simulación de envío de email
      // En producción, usar un servicio como:
      // - Nodemailer con SMTP
      // - SendGrid
      // - AWS SES
      // - Mailgun
      
      return {
        success: true,
        message: 'Notificación enviada exitosamente',
        email: email
      };
    } catch (error) {
      console.error('Error enviando notificación:', error);
      throw new Error(`Error enviando notificación: ${error.message}`);
    }
  }

  /**
   * Genera el contenido del email de bienvenida
   */
  generateWelcomeEmailContent(userData) {
    const { nombre, email, password } = userData;

    return {
      subject: 'Bienvenido al Sistema de Control de Acceso',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1976d2; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .credentials { background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Bienvenido al Sistema</h1>
            </div>
            <div class="content">
              <p>Hola ${nombre},</p>
              <p>Has sido registrado como guardia en el Sistema de Control de Acceso.</p>
              <p>Aquí están tus credenciales de acceso:</p>
              <div class="credentials">
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Contraseña:</strong> ${password}</p>
              </div>
              <p><strong>⚠️ Importante:</strong> Por seguridad, cambia tu contraseña después del primer inicio de sesión.</p>
              <p>Si tienes alguna pregunta, contacta al administrador del sistema.</p>
            </div>
            <div class="footer">
              <p>Este es un email automático, por favor no responder.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Bienvenido al Sistema de Control de Acceso
        
        Hola ${nombre},
        
        Has sido registrado como guardia en el Sistema de Control de Acceso.
        
        Aquí están tus credenciales de acceso:
        Email: ${email}
        Contraseña: ${password}
        
        ⚠️ Importante: Por seguridad, cambia tu contraseña después del primer inicio de sesión.
        
        Si tienes alguna pregunta, contacta al administrador del sistema.
      `
    };
  }
}

module.exports = NotificationService;

