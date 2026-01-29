/**
 * Utility para envio de e-mails usando Resend
 */
const dotenv = require('dotenv');
dotenv.config();

// Tentar usar Resend, se não estiver disponível, usar nodemailer como fallback
let emailProvider = null;

// Tenta usar Resend se a API key estiver disponível
if (process.env.RESEND_API_KEY) {
  try {
    const { Resend } = require('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    emailProvider = 'resend';
    module.exports.resend = resend;
  } catch (err) {
    console.log('Resend não disponível, usando fallback');
  }
}


// Fallback para nodemailer
if (!emailProvider) {
  const nodemailer = require('nodemailer');
  
  let transporter;
  
  // Configuração para AWS SES ou SMTP genérico
  if (process.env.EMAIL_SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SMTP_HOST,
      port: process.env.EMAIL_SMTP_PORT || 587,
      secure: process.env.EMAIL_SMTP_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_SMTP_USER,
        pass: process.env.EMAIL_SMTP_PASS
      }
    });
  }

  emailProvider = 'nodemailer';
  module.exports.transporter = transporter;
}

/**
 * Envia e-mail de lembrete de evento
 */
async function sendReminderEmail(userEmail, event, reminderTime) {
  const emailFrom = process.env.EMAIL_FROM || 'noreply@adaptatasks.com';
  
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
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const eventDate = new Date(event.start_date_time).toLocaleString('pt-BR');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: #fff; padding: 20px; border-radius: 8px; }
        .header { background-color: #3174ad; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { padding: 20px; }
        .event-details { background-color: #f9f9f9; padding: 15px; border-left: 4px solid #3174ad; margin: 20px 0; }
        .footer { text-align: center; color: #999; font-size: 12px; padding-top: 20px; border-top: 1px solid #eee; }
        .button { display: inline-block; padding: 10px 20px; background-color: #3174ad; color: white; text-decoration: none; border-radius: 4px; margin-top: 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⏰ Lembrete do Seu Evento</h1>
        </div>
        <div class="content">
          <p>Olá,</p>
          <p>Aqui está seu lembrete para o evento agendado:</p>
          
          <div class="event-details">
            <h2>${event.titulo}</h2>
            <p><strong>Data e Hora:</strong> ${eventDate}</p>
            ${event.location ? `<p><strong>Local:</strong> ${event.location}</p>` : ''}
            ${event.description ? `<p><strong>Descrição:</strong> ${event.description}</p>` : ''}
          </div>

          <p>Este lembrete foi enviado ${reminderTime} minutos antes do evento.</p>
          
          <a href="${baseUrl}/eventos" class="button">Ver Calendário</a>
        </div>
        
        <div class="footer">
          <p>Este é um e-mail automático do AdaptaTasks. Por favor, não responda.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

module.exports.sendReminderEmail = sendReminderEmail;
module.exports.generateEmailTemplate = generateEmailTemplate;
module.exports.emailProvider = emailProvider;
