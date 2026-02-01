const { Pool } = require('pg');
const { sendReminderEmail } = require('./emailReminder');
const { generateWhatsAppLink } = require('./whatsapp');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

/**
 * Processa e envia lembretes pendentes
 */
async function processReminders() {
  try {
    console.log('🔍 Verificando lembretes pendentes...');

    // Buscar lembretes que precisam ser enviados agora
    // time_offset é negativo (ex: -15 significa 15 min antes)
    // Então: event_time + time_offset = tempo de envio
    const query = `
      SELECT 
        r.id as reminder_id,
        r.method,
        r.time_offset,
        e.*,
        u.email as user_email,
        u.phone as user_phone,
        u.username
      FROM reminders r
      JOIN eventos e ON r.event_id = e.id
      JOIN users u ON e.userId = u.id
      WHERE 
        r.is_sent = FALSE
        AND (e.start_date_time + (r.time_offset || ' minutes')::interval) <= NOW()
        AND (e.start_date_time + (r.time_offset || ' minutes')::interval) >= NOW() - interval '5 minutes'
      ORDER BY e.start_date_time ASC
    `;

    const result = await pool.query(query);

    if (result.rows.length === 0) {
      console.log('✅ Nenhum lembrete pendente no momento');
      return;
    }

    console.log(`📬 Encontrados ${result.rows.length} lembrete(s) para enviar`);

    for (const reminder of result.rows) {
      await sendReminder(reminder);
    }
  } catch (err) {
    console.error('❌ Erro ao processar lembretes:', err);
  }
}

/**
 * Envia um lembrete específico
 */
async function sendReminder(reminder) {
  const { 
    reminder_id, 
    method, 
    time_offset,
    user_email, 
    user_phone,
    username
  } = reminder;

  const event = {
    titulo: reminder.titulo,
    description: reminder.description,
    start_date_time: reminder.start_date_time,
    end_date_time: reminder.end_date_time,
    location: reminder.location,
    color: reminder.color
  };

  try {
    console.log(`📤 Enviando lembrete ${method.toUpperCase()} para ${username}...`);

    if (method === 'email') {
      // APENAS EMAIL - não envolve WhatsApp
      if (!user_email) {
        throw new Error('Usuário não tem email cadastrado');
      }
      await sendReminderEmail(user_email, event, Math.abs(time_offset));
      console.log(`✅ Email enviado para ${user_email}`);
      
      // Marcar como enviado
      await pool.query(
        'UPDATE reminders SET is_sent = TRUE, sent_at = NOW() WHERE id = $1',
        [reminder_id]
      );
    } 
    else if (method === 'whatsapp') {
      // APENAS WHATSAPP - gera link e salva no banco (NÃO envia email)
      if (!user_phone) {
        throw new Error('Usuário não tem telefone cadastrado');
      }
      
      // Gerar link do WhatsApp
      const whatsappLink = generateWhatsAppLink({
        phone: user_phone,
        titulo: event.titulo,
        startDateTime: event.start_date_time,
        location: event.location,
        description: event.description,
        reminderTime: Math.abs(time_offset)
      });

      console.log(`📱 Link WhatsApp gerado: ${whatsappLink}`);

      // Salvar link no banco e marcar como enviado
      await pool.query(
        'UPDATE reminders SET is_sent = TRUE, sent_at = NOW(), whatsapp_link = $1 WHERE id = $2',
        [whatsappLink, reminder_id]
      );
      
      console.log(`✅ Link WhatsApp salvo no banco para o usuário acessar`);
    }

    console.log(`✅ Lembrete ${reminder_id} processado com sucesso`);
  } catch (err) {
    console.error(`❌ Erro ao enviar lembrete ${reminder_id}:`, err.message);
  }
}

/**
 * Inicia o scheduler de lembretes
 */
function startReminderScheduler() {
  console.log('🚀 Iniciando scheduler de lembretes...');
  
  // Processar imediatamente
  processReminders();
  
  // Processar a cada 1 minuto
  setInterval(processReminders, 60 * 1000);
  
  console.log('✅ Scheduler de lembretes ativo (verifica a cada 1 minuto)');
}

module.exports = {
  startReminderScheduler,
  processReminders
};
