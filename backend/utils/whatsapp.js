/**
 * Gera mensagem formatada para WhatsApp
 */
function generateWhatsAppMessage({ titulo, startDateTime, location, description, reminderTime }) {
  const eventDate = new Date(startDateTime).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  let message = `🔔 *LEMBRETE DE EVENTO* 🔔\n\n`;
  message += `📌 *${titulo}*\n\n`;
  message += `📅 *Data/Hora:* ${eventDate}\n`;
  
  if (location) {
    message += `📍 *Local:* ${location}\n`;
  }
  
  if (description) {
    message += `📝 *Descrição:* ${description}\n`;
  }
  
  message += `\n⏰ Este lembrete foi enviado ${reminderTime} minutos antes do evento.\n\n`;
  message += `_Enviado via AdaptaTasks_`;
  
  return message;
}

/**
 * Gera link do WhatsApp com mensagem
 */
export function generateWhatsAppLink({ phone, titulo, reminderTime, startDateTime, location, description }) {
  const message = generateWhatsAppMessage({ titulo, startDateTime, location, description, reminderTime });
  const cleanPhone = phone.replace(/\D/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Envia lembrete via WhatsApp (gera link para envio manual)
 */
export async function sendWhatsAppReminder(userPhone, event, reminderTimeMinutes) {
  if (!userPhone) {
    throw new Error('Telefone do usuário não configurado');
  }

  const link = generateWhatsAppLink({
    phone: userPhone,
    titulo: event.titulo,
    startDateTime: event.start_date_time,
    location: event.location,
    description: event.description,
    reminderTime: Math.abs(reminderTimeMinutes)
  });

  return {
    success: true,
    method: 'whatsapp',
    link,
    message: 'Link do WhatsApp gerado com sucesso'
  };
}

module.exports = {
  generateWhatsAppLink,
  generateWhatsAppMessage,
  sendWhatsAppReminder
};