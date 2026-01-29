const dotenv = require('dotenv');
dotenv.config();

const { sendReminderEmail } = require('./utils/emailReminder');

const to = process.env.EMAIL_TEST_TO || process.env.EMAIL_FROM;
if (!to) {
    console.error('Defina EMAIL_TEST_TO ou EMAIL_FROM no backend/.env para testar.');
    process.exit(1);
}

const sampleEvent = {
    titulo: 'Evento de Teste',
    start_date_time: new Date().toISOString(),
    location: 'Online',
    description: 'Teste automático de envio de lembrete'
};

(async () => {
    console.log(`Enviando email de teste para ${to} usando sendReminderEmail...`);
    const result = await sendReminderEmail(to, sampleEvent, 10);
    console.log('Resultado:', result);
    process.exit(result && result.success ? 0 : 1);
})();
