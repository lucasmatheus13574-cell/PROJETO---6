import Agenda from 'agenda';
import axios from 'axios';

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

    await axios.post(process.env.N8N_WEBHOOK_URL, {
        nome,
        telefone,
        evento,
        dataEvento,
        minutesBefore
    });
});







export default agenda;
