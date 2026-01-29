// Exemplo de uso do Resend usando variáveis de ambiente
// Não deixe chaves hardcoded em produção. Defina `RESEND_API_KEY` e `EMAIL_FROM` no .env
const dotenv = require('dotenv');
dotenv.config();

let resendClient = null;
try {
    const { Resend } = require('resend');
    if (process.env.RESEND_API_KEY) {
        resendClient = new Resend(process.env.RESEND_API_KEY);
    }
} catch (err) {
    console.warn('Módulo resend não disponível:', err.message);
}

async function sendTestEmail(to) {
    if (!resendClient) throw new Error('Resend client não configurado. Verifique RESEND_API_KEY');
    const from = process.env.EMAIL_FROM || 'onboarding@resend.dev';
    return await resendClient.emails.send({
        from,
        to,
        subject: 'Teste de envio - Resend',
        html: '<p>Este é um e-mail de teste enviado pelo Resend (via backend/Email.js)</p>'
    });
}

module.exports = { sendTestEmail };
