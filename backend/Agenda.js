const Agenda = require('agenda');
const axios = require('axios');
require('dotenv').config();

const agenda = new Agenda({
    db: {
        address: process.env.DATABASE_URL,
        collection: 'agendaJobs'
    }
});

agenda.define('send whatsapp reminder', async job => {
    const {
        nome,
        telefone,
        evento,
        dataEvento,
        minutesBefore
    } = job.attrs.data;

    try {
        await axios.post(process.env.N8N_WEBHOOK_URL, {
            nome,
            telefone,
            evento,
            dataEvento,
            minutesBefore
        });
        console.log('WhatsApp reminder sent successfully');
    } catch (error) {
        console.error('Error sending WhatsApp reminder:', error.message);
    }
});

module.exports = agenda;
