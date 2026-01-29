import { Resend } from 'resend';

const resend = new Resend('re_9bcSCnJx_JMwnPBZaJLPwLEXJxk7LPBzC');

resend.emails.send({
    from: 'onboarding@resend.dev',
    to: 'lucasmatheus135.74@gmail.com',
    subject: 'Hello World',
    html: '<p>Congrats on sending your <strong>first email</strong>!</p>'
});
