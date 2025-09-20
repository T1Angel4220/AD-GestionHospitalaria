import nodemailer from 'nodemailer';

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false, // true para 465, false para otros puertos
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async sendPasswordResetEmail(email, resetToken, userName) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: `"Sistema Hospitalario" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Recuperación de Contraseña - Sistema Hospitalario',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Recuperación de Contraseña</h2>
          <p>Hola ${userName},</p>
          <p>Has solicitado recuperar tu contraseña para el Sistema Hospitalario.</p>
          <p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Restablecer Contraseña
            </a>
          </div>
          <p>Este enlace expirará en 1 hora por seguridad.</p>
          <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #7f8c8d; font-size: 12px;">
            Sistema de Gestión Hospitalaria<br>
            Este es un correo automático, por favor no responder.
          </p>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Email de recuperación enviado a: ${email}`);
      return true;
    } catch (error) {
      console.error('Error enviando email:', error);
      return false;
    }
  }

  async sendWelcomeEmail(email, userName, password) {
    const mailOptions = {
      from: `"Sistema Hospitalario" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Bienvenido al Sistema Hospitalario',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">¡Bienvenido al Sistema Hospitalario!</h2>
          <p>Hola ${userName},</p>
          <p>Tu cuenta ha sido creada exitosamente en el Sistema de Gestión Hospitalaria.</p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #495057; margin-top: 0;">Credenciales de acceso:</h3>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Contraseña temporal:</strong> ${password}</p>
          </div>
          <p>Por seguridad, te recomendamos cambiar tu contraseña en tu primer inicio de sesión.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/login" 
               style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Iniciar Sesión
            </a>
          </div>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #7f8c8d; font-size: 12px;">
            Sistema de Gestión Hospitalaria<br>
            Este es un correo automático, por favor no responder.
          </p>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Email de bienvenida enviado a: ${email}`);
      return true;
    } catch (error) {
      console.error('Error enviando email de bienvenida:', error);
      return false;
    }
  }
}

export default new EmailService();
