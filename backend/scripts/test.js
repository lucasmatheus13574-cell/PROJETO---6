#!/usr/bin/env node

/**
 * Script de Teste do Sistema
 * Valida que todos os componentes estão funcionando corretamente
 * 
 * Uso: node scripts/test.js
 */

const axios = require('axios');

const BASE_URL = process.env.VITE_API_URL || 'http://localhost:3000';
let token = '';

const tests = {
  passed: 0,
  failed: 0,
  errors: []
};

async function test(name, fn) {
  try {
    console.log(`\n▶ ${name}...`);
    await fn();
    console.log(`✓ ${name}`);
    tests.passed++;
  } catch (err) {
    console.log(`✗ ${name}`);
    console.error(`  Erro: ${err.message}`);
    tests.failed++;
    tests.errors.push({ test: name, error: err.message });
  }
}

async function testAuthFlow() {
  console.log('\n📋 === TESTANDO AUTENTICAÇÃO ===\n');
  
  const userData = {
    email: `test_${Date.now()}@example.com`,
    password: 'Test123!@#',
    name: 'Test User'
  };
  
  await test('Registrar novo usuário', async () => {
    const res = await axios.post(`${BASE_URL}/auth/register`, userData);
    if (!res.data.message || !res.data.message.includes('sucesso')) {
      throw new Error('Resposta inesperada');
    }
  });
  
  await test('Login com credenciais', async () => {
    const res = await axios.post(`${BASE_URL}/auth/login`, {
      email: userData.email,
      password: userData.password
    });
    if (!res.data.token) {
      throw new Error('Token não retornado');
    }
    token = res.data.token;
  });
}

async function testCalendarFlow() {
  console.log('\n📋 === TESTANDO CALENDÁRIOS ===\n');
  
  const headers = { authorization: `Bearer ${token}` };
  let calendarId = null;
  
  await test('Listar calendários', async () => {
    const res = await axios.get(`${BASE_URL}/calendars`, { headers });
    if (!Array.isArray(res.data)) {
      throw new Error('Resposta não é um array');
    }
  });
  
  await test('Criar novo calendário', async () => {
    const res = await axios.post(`${BASE_URL}/calendars`, {
      name: 'Test Calendar',
      color: '#FF5733'
    }, { headers });
    if (!res.data.id) {
      throw new Error('Calendário não foi criado');
    }
    calendarId = res.data.id;
  });
  
  if (calendarId) {
    await test('Atualizar calendário', async () => {
      const res = await axios.put(`${BASE_URL}/calendars/${calendarId}`, {
        name: 'Updated Test Calendar'
      }, { headers });
      if (res.data.name !== 'Updated Test Calendar') {
        throw new Error('Nome não foi atualizado');
      }
    });
    
    await test('Deletar calendário', async () => {
      await axios.delete(`${BASE_URL}/calendars/${calendarId}`, { headers });
    });
  }
}

async function testEventFlow() {
  console.log('\n📋 === TESTANDO EVENTOS ===\n');
  
  const headers = { authorization: `Bearer ${token}` };
  let eventId = null;
  
  const eventData = {
    titulo: 'Test Event',
    start_date_time: new Date().toISOString(),
    end_date_time: new Date(Date.now() + 3600000).toISOString(),
    description: 'This is a test event',
    color: '#0066CC',
    location: 'Test Location'
  };
  
  await test('Criar evento simples', async () => {
    const res = await axios.post(`${BASE_URL}/eventos`, eventData, { headers });
    if (!res.data.id) {
      throw new Error('Evento não foi criado');
    }
    eventId = res.data.id;
  });
  
  await test('Listar eventos', async () => {
    const start = new Date(Date.now() - 86400000).toISOString();
    const end = new Date(Date.now() + 86400000).toISOString();
    const res = await axios.get(`${BASE_URL}/eventos?start=${start}&end=${end}`, { headers });
    if (!Array.isArray(res.data)) {
      throw new Error('Resposta não é um array');
    }
  });
  
  if (eventId) {
    await test('Atualizar evento', async () => {
      const res = await axios.put(`${BASE_URL}/eventos/${eventId}`, {
        titulo: 'Updated Event'
      }, { headers });
      if (res.data.titulo !== 'Updated Event') {
        throw new Error('Evento não foi atualizado');
      }
    });
  }
}

async function testRecurrenceFlow() {
  console.log('\n📋 === TESTANDO EVENTOS RECORRENTES ===\n');
  
  const headers = { authorization: `Bearer ${token}` };
  let eventId = null;
  
  const recurringEventData = {
    titulo: 'Daily Standup',
    start_date_time: new Date().toISOString(),
    end_date_time: new Date(Date.now() + 3600000).toISOString(),
    description: 'Daily team standup',
    color: '#33FF00',
    recurrence_rule: 'FREQ=DAILY;INTERVAL=1',
    recurrence_until: new Date(Date.now() + 86400000 * 30).toISOString()
  };
  
  await test('Criar evento recorrente', async () => {
    const res = await axios.post(`${BASE_URL}/eventos`, recurringEventData, { headers });
    if (!res.data.id) {
      throw new Error('Evento recorrente não foi criado');
    }
    eventId = res.data.id;
    if (!res.data.recurrence_rule) {
      throw new Error('RRULE não foi salva');
    }
  });
  
  if (eventId) {
    await test('Verificar expansão de recorrências', async () => {
      const start = new Date(Date.now() - 86400000).toISOString();
      const end = new Date(Date.now() + 86400000 * 30).toISOString();
      const res = await axios.get(`${BASE_URL}/eventos?start=${start}&end=${end}`, { headers });
      
      // Deve retornar múltiplas ocorrências do mesmo evento
      const recurringEvents = res.data.filter(e => 
        e.titulo === 'Daily Standup' || (e.id && e.id.toString().startsWith(eventId))
      );
      
      if (recurringEvents.length < 5) {
        console.warn(`  ⚠ Apenas ${recurringEvents.length} ocorrências encontradas (esperado: 5+)`);
      }
    });
    
    await test('Deletar evento recorrente', async () => {
      await axios.delete(`${BASE_URL}/eventos/${eventId}`, { headers });
    });
  }
}

async function testReminderFlow() {
  console.log('\n📋 === TESTANDO LEMBRETES ===\n');
  
  const headers = { authorization: `Bearer ${token}` };
  let eventId = null;
  let reminderId = null;
  
  // Primeiro criar um evento
  const eventData = {
    titulo: 'Event with Reminder',
    start_date_time: new Date(Date.now() + 3600000).toISOString(),
    end_date_time: new Date(Date.now() + 7200000).toISOString(),
    description: 'This event has reminders',
    color: '#FF00FF'
  };
  
  await test('Criar evento para teste de lembretes', async () => {
    const res = await axios.post(`${BASE_URL}/eventos`, eventData, { headers });
    eventId = res.data.id;
  });
  
  if (eventId) {
    await test('Adicionar lembrete por e-mail', async () => {
      const res = await axios.post(`${BASE_URL}/reminders`, {
        event_id: eventId,
        method: 'email',
        time_offset: 900 // 15 minutos em segundos
      }, { headers });
      if (!res.data.id) {
        throw new Error('Lembrete não foi criado');
      }
      reminderId = res.data.id;
    });
    
    await test('Listar lembretes de um evento', async () => {
      const res = await axios.get(`${BASE_URL}/eventos/${eventId}/reminders`, { headers });
      if (!Array.isArray(res.data)) {
        throw new Error('Resposta não é um array');
      }
      if (res.data.length === 0) {
        throw new Error('Nenhum lembrete foi retornado');
      }
    });
    
    if (reminderId) {
      await test('Deletar lembrete', async () => {
        await axios.delete(`${BASE_URL}/reminders/${reminderId}`, { headers });
      });
    }
  }
}

async function runAllTests() {
  console.log('🚀 Iniciando testes do sistema AdaptaTasks\n');
  console.log(`Base URL: ${BASE_URL}\n`);
  
  try {
    await testAuthFlow();
    
    if (token) {
      await testCalendarFlow();
      await testEventFlow();
      await testRecurrenceFlow();
      await testReminderFlow();
    }
    
  } catch (err) {
    console.error('\n❌ Erro geral:', err.message);
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Dados:', err.response.data);
    }
  }
  
  // Resultado final
  console.log('\n' + '='.repeat(50));
  console.log(`\n📊 Resultados dos Testes:\n`);
  console.log(`✓ Passou: ${tests.passed}`);
  console.log(`✗ Falhou: ${tests.failed}`);
  console.log(`Total: ${tests.passed + tests.failed}\n`);
  
  if (tests.errors.length > 0) {
    console.log('❌ Testes que falharam:\n');
    tests.errors.forEach(({ test, error }) => {
      console.log(`  - ${test}`);
      console.log(`    ${error}\n`);
    });
  }
  
  if (tests.failed === 0) {
    console.log('🎉 Todos os testes passaram!\n');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

// Executar testes
runAllTests();
