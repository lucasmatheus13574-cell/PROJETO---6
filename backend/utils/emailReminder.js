/**
 * Utility para envio de e-mails usando Resend
 */
const dotenv = require('dotenv');
dotenv.config();



/**
 * Envia e-mail de lembrete de evento
 */
async function sendReminderEmail(userEmail, event, reminderTime) {
  const emailFrom = process.env.EMAIL_FROM || 'noreply@ADAPTTASKS.COM.BR';
  
  const emailContent = {
    to: userEmail,
    from: emailFrom,
    subject: `Lembrete: ${event.titulo}`,
    html: generateEmailTemplate(event, reminderTime)
  };

  try {
    if (emailProvider === 'resend') {
      const { resend } = module.exports;
      const result = await resend.emails.send(emailContent);
      console.log(`E-mail de lembrete enviado para ${userEmail}:`, result);
      return { success: true, result };
    } else if (emailProvider === 'nodemailer') {
      const { transporter } = module.exports;
      if (!transporter) {
        throw new Error('Transporter de e-mail não configurado');
      }
      const result = await transporter.sendMail(emailContent);
      console.log(`E-mail de lembrete enviado para ${userEmail}:`, result);
      return { success: true, result };
    } else {
      throw new Error('Nenhum provedor de e-mail disponível');
    }
  } catch (error) {
    console.error('Erro ao enviar e-mail de lembrete:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Gera template HTML do e-mail de lembrete
 */
function generateEmailTemplate(event, reminderTime) {
  const baseUrl = process.env.FRONTEND_URL || 'https://projeto6-frontend.vercel.app';
  const eventDate = new Date(event.start_date_time).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const reminderMinutes = Math.abs(reminderTime);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background-color: #f5f7fa; 
          margin: 0;
          padding: 20px;
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          background-color: #ffffff; 
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          overflow: hidden;'
        }
        .header { 
          background: linear-gradient(135deg, #3174ad 0%, #1e4a7a 100%);
          color: white; 
          padding: 30px 20px; 
          text-align: center; 
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
        }
        .header p {
          margin: 8px 0 0 0;
          font-size: 14px;
          opacity: 0.9;
        }
        .content { 
          padding: 30px 25px; 
        }
        .greeting {
          font-size: 16px;
          color: #333;
          margin-bottom: 20px;
        }
        .event-details { 
          background-color: #f8f9fa; 
          padding: 20px; 
          border-left: 4px solid #3174ad; 
          border-radius: 8px;
          margin: 20px 0; 
        }
        .event-details h2 {
          margin: 0 0 15px 0;
          color: #1e4a7a;
          font-size: 20px;
        }
        .detail-row {
          display: flex;
          margin: 10px 0;
          font-size: 15px;
        }
        .detail-label {
          font-weight: 600;
          color: #555;
          min-width: 100px;
        }
        .detail-value {
          color: #333;
        }
        .reminder-note {
          background-color: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
          font-size: 14px;
          color: #856404;
        }
        .button-container {
          text-align: center;
          margin: 25px 0;
        }
        .button { 
          display: inline-block; 
          padding: 12px 30px; 
          background: linear-gradient(135deg, #3174ad 0%, #1e4a7a 100%);
          color: white !important; 
          text-decoration: none; 
          border-radius: 6px; 
          font-weight: 600;
          font-size: 15px;
          box-shadow: 0 2px 8px rgba(49, 116, 173, 0.3);
        }
        .button:hover {
          box-shadow: 0 4px 12px rgba(49, 116, 173, 0.5);
        }
        .footer { 
          text-align: center; 
          color: #999; 
          font-size: 12px; 
          padding: 20px;
          border-top: 1px solid #eee;
          background-color: #f8f9fa;
        }
        .footer p {
          margin: 5px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⏰ Lembrete de Evento</h1>
          <p>AdaptaTasks - Seu assistente de organização</p>
        </div>
        <div class="content">
          <div class="greeting">
            <p>Olá,</p>
            <p>Este é um lembrete automático sobre o seu evento agendado:</p>
          </div>
          
          <div class="event-details">
            <h2>📅 ${event.titulo}</h2>
            <div class="detail-row">
              <span class="detail-label">📆 Data/Hora:</span>
              <span class="detail-value">${eventDate}</span>
            </div>
            ${event.location ? `
            <div class="detail-row">
              <span class="detail-label">📍 Local:</span>
              <span class="detail-value">${event.location}</span>
            </div>
            ` : ''}
            ${event.description ? `
            <div class="detail-row">
              <span class="detail-label">📝 Descrição:</span>
              <span class="detail-value">${event.description}</span>
            </div>
            ` : ''}
          </div>

          <div class="reminder-note">
            <strong>⏰ Lembrete:</strong> Este aviso foi enviado <strong>${reminderMinutes} minutos antes</strong> do início do evento para que você possa se preparar.
          </div>

          <div class="button-container">
            <a href="${baseUrl}/eventos" class="button">Ver Meu Calendário</a>
          </div>
        </div>
        
        <div class="footer">
          <p><strong>AdaptaTasks</strong></p>
          <p>Este é um e-mail automático. Por favor, não responda.</p>
          <p>© 2026 AdaptaTasks - Todos os direitos reservados</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

module.exports.sendReminderEmail = sendReminderEmail;
module.exports.generateEmailTemplate = generateEmailTemplate;
module.exports.emailProvider = emailProvider;
