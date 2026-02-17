// /**
//  * Script de Teste Completo do Sistema de Lembretes
//  * Executa testes automatizados de Email e WhatsApp
//  */

// require('dotenv').config();
// const { Pool } = require('pg');
// const { sendReminderEmail } = require('./utils/emailReminder');
// const { generateWhatsAppLink } = require('./utils/whatsapp');

// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
//   ssl: { rejectUnauthorized: false }
// });

// // Dados de teste
// const testEvent = {
//   titulo: 'Reunião de Teste',
//   description: 'Esta é uma reunião de teste para validar o sistema de lembretes',
//   start_date_time: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
//   end_date_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
//   location: 'Sala 3, Online',
//   color: '#3174ad'
// };

// const reminderTime = 15; // 15 minutos antes

// console.log('🧪 ===== TESTE DO SISTEMA DE LEMBRETES =====\n');

// // Teste 1: Email
// async function testEmail() {
//   console.log('📧 TESTE 1: Lembrete por Email');
//   console.log('─'.repeat(50));
  
//   const testEmail = process.env.TEST_EMAIL || 'test@example.com';
//   console.log(`Destinatário: ${testEmail}`);
//   console.log(`Evento: ${testEvent.titulo}`);
//   console.log(`Horário: ${new Date(testEvent.start_date_time).toLocaleString('pt-BR')}`);
  
//   try {
//     const result = await sendReminderEmail(testEmail, testEvent, reminderTime);
    
//     if (result.success) {
//       console.log('✅ Email enviado com sucesso!');
//       console.log('   Resultado:', JSON.stringify(result.result, null, 2));
//     } else {
//       console.log('❌ Falha no envio:');
//       console.log('   Erro:', result.error);
//     }
//   } catch (err) {
//     console.log('❌ Erro inesperado:', err.message);
//   }
//   console.log('');
// }

// // Teste 2: WhatsApp
// function testWhatsApp() {
//   console.log('📱 TESTE 2: Lembrete por WhatsApp');
//   console.log('─'.repeat(50));
  
//   const testPhone = process.env.TEST_PHONE || '5511999999999';
//   console.log(`Telefone: ${testPhone}`);
//   console.log(`Evento: ${testEvent.titulo}`);
  
//   try {
//     const link = generateWhatsAppLink({
//       phone: testPhone,
//       titulo: testEvent.titulo,
//       startDateTime: testEvent.start_date_time,
//       location: testEvent.location,
//       description: testEvent.description,
//       reminderTime: reminderTime
//     });
    
//     console.log('✅ Link gerado com sucesso!');
//     console.log('');
//     console.log('🔗 Link do WhatsApp:');
//     console.log(link);
//     console.log('');
//     console.log('📝 Para testar: Copie o link acima e abra no navegador');
//   } catch (err) {
//     console.log('❌ Erro ao gerar link:', err.message);
//   }
//   console.log('');
// }

// // Teste 3: Banco de Dados
// async function testDatabase() {
//   console.log('🗄️  TESTE 3: Consultas ao Banco de Dados');
//   console.log('─'.repeat(50));
  
//   try {
//     // Verificar tabelas
//     console.log('Verificando estrutura das tabelas...');
    
//     const tables = await pool.query(`
//       SELECT table_name 
//       FROM information_schema.tables 
//       WHERE table_schema = 'public' 
//       AND table_name IN ('users', 'eventos', 'reminders', 'calendars')
//       ORDER BY table_name
//     `);
    
//     console.log(`✅ Tabelas encontradas: ${tables.rows.map(r => r.table_name).join(', ')}`);
    
//     // Verificar colunas da tabela reminders
//     const reminderColumns = await pool.query(`
//       SELECT column_name, data_type 
//       FROM information_schema.columns 
//       WHERE table_name = 'reminders'
//       ORDER BY ordinal_position
//     `);
    
//     console.log('\n📋 Colunas da tabela reminders:');
//     reminderColumns.rows.forEach(col => {
//       console.log(`   - ${col.column_name} (${col.data_type})`);
//     });
    
//     // Verificar lembretes pendentes
//     const pendingReminders = await pool.query(`
//       SELECT 
//         r.id,
//         r.method,
//         r.time_offset,
//         r.is_sent,
//         e.titulo,
//         e.start_date_time
//       FROM reminders r
//       JOIN eventos e ON r.event_id = e.id
//       WHERE r.is_sent = FALSE
//       LIMIT 5
//     `);
    
//     console.log(`\n⏳ Lembretes pendentes: ${pendingReminders.rows.length}`);
//     if (pendingReminders.rows.length > 0) {
//       pendingReminders.rows.forEach(rem => {
//         const sendTime = new Date(new Date(rem.start_date_time).getTime() + rem.time_offset * 60000);
//         console.log(`   - ID ${rem.id}: ${rem.titulo} (${rem.method}) - Enviar em: ${sendTime.toLocaleString('pt-BR')}`);
//       });
//     }
    
//     console.log('\n✅ Banco de dados funcionando corretamente');
//   } catch (err) {
//     console.log('❌ Erro no banco:', err.message);
//   }
//   console.log('');
// }

// // Teste 4: Verificar Configurações
// function testConfig() {
//   console.log('⚙️  TESTE 4: Configurações do Sistema');
//   console.log('─'.repeat(50));
  
//   const configs = {
//     'RESEND_API_KEY': process.env.RESEND_API_KEY ? '✅ Configurado' : '❌ Não configurado',
//     'EMAIL_FROM': process.env.EMAIL_FROM || '⚠️  Usando padrão',
//     'DATABASE_URL': process.env.DATABASE_URL ? '✅ Configurado' : '❌ Não configurado',
//     'FRONTEND_URL': process.env.FRONTEND_URL || '⚠️  Não configurado',
//     'TEST_EMAIL': process.env.TEST_EMAIL || '⚠️  Não configurado (use para testes)',
//     'TEST_PHONE': process.env.TEST_PHONE || '⚠️  Não configurado (use para testes)'
//   };
  
//   Object.entries(configs).forEach(([key, value]) => {
//     console.log(`   ${key}: ${value}`);
//   });
//   console.log('');
// }

// // Executar todos os testes
// async function runAllTests() {
//   testConfig();
//   await testDatabase();
//   await testEmail();
//   testWhatsApp();
  
//   console.log('🏁 ===== TESTES CONCLUÍDOS =====');
//   console.log('\n📝 Próximos Passos:');
//   console.log('   1. Se o email falhou, verifique o domínio no Resend');
//   console.log('   2. Teste o link do WhatsApp abrindo no navegador');
//   console.log('   3. Crie um evento de teste no sistema com lembrete');
//   console.log('   4. Aguarde o scheduler processar (a cada 1 minuto)');
  
//   process.exit(0);
// }

// runAllTests().catch(err => {
//   console.error('❌ Erro fatal:', err);
//   process.exit(1);
// });
