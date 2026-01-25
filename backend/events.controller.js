// src/controllers/events.controller.js
import agenda from '../Agenda.js';

export async function createEvent(req, res) {
    const { event, reminder, user } = req.body;

    // 3.1 calcular data do lembrete
    const reminderDate = new Date(
        new Date(event.start_datetime).getTime() -
        reminder.minutes_before * 60 * 1000
    );

    // 3.2 não agendar se já passou
    if (reminderDate <= new Date()) {
        return res.status(400).json({ error: 'Horário do lembrete inválido' });
    }

    // 3.3 agendar o job
    await agenda.schedule(
        reminderDate,
        'send whatsapp reminder',
        {
            nome: user.name,
            telefone: user.phone,
            evento: event.title,
            dataEvento: event.start_datetime,
            minutesBefore: reminder.minutes_before
        }
    );

    res.json({ message: 'Evento criado e lembrete agendado' });
}
