import nodemailer from 'nodemailer';

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });
  }

  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: 'ethereal.user@ethereal.email',
      pass: 'ethereal.pass'
    }
  });
}

export async function send2FAEmail(to: string, code: string, username?: string): Promise<boolean> {
  const from = process.env.SMTP_FROM || '"RCManager Seguridad" <security@rcmanager.app>';
  const subject = `🔒 Tu código de verificación RCManager: ${code}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Código de Verificación RCManager</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
        .container { max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 24px; padding: 36px 28px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
        .logo-area { text-align: center; margin-bottom: 24px; }
        .logo-title { font-size: 22px; font-weight: 900; color: #2563eb; letter-spacing: -0.5px; margin: 0; }
        .badge { display: inline-block; background: #eff6ff; color: #2563eb; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 12px; margin-top: 6px; }
        .content { text-align: center; }
        .title { font-size: 20px; font-weight: 800; color: #0f172a; margin: 16px 0 8px; }
        .desc { font-size: 14px; color: #64748b; line-height: 1.5; margin-bottom: 24px; }
        .code-box { background: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 16px; padding: 18px 24px; display: inline-block; margin-bottom: 24px; }
        .code { font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #0f172a; margin: 0; }
        .expires { font-size: 12px; color: #94a3b8; margin-top: 6px; }
        .warning { font-size: 12px; color: #ef4444; background: #fef2f2; border: 1px solid #fee2e2; border-radius: 12px; padding: 12px; margin-top: 20px; text-align: left; }
        .footer { text-align: center; margin-top: 28px; font-size: 11px; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo-area">
          <div class="logo-title">🎢 RCManager</div>
          <div class="badge">SEGURIDAD EN DOS PASOS</div>
        </div>
        <div class="content">
          <div class="title">Hola${username ? ` @${username}` : ''},</div>
          <div class="desc">Usa el siguiente código de verificación de 6 dígitos para completar tu inicio de sesión o configuración de seguridad:</div>
          <div class="code-box">
            <div class="code">${code}</div>
            <div class="expires">⏱️ Válido durante 10 minutos</div>
          </div>
          <div class="warning">
            <strong>⚠️ ¿No has sido tú?</strong> Si no has solicitado este código, por favor ignora este correo o cambia tu contraseña inmediatamente.
          </div>
        </div>
        <div class="footer">
          RCManager &copy; ${new Date().getFullYear()} - Plataforma de Parques y Coasters.<br>
          Este es un correo automático de seguridad, por favor no respondas a este mensaje.
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const transporter = getTransporter();
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text: `Tu código de verificación de 6 dígitos para RCManager es: ${code} (Válido por 10 minutos).`,
      html
    });
    console.log(`[Mailer] 2FA email sent to ${to} (MessageId: ${info.messageId || 'simulated'})`);
    return true;
  } catch (error) {
    console.error('[Mailer] Error sending 2FA email:', error);
    console.log(`[Mailer DEV FALLBACK] 2FA Code for ${to}: ${code}`);
    return false;
  }
}
