# AdaptaTasks - Sistema de Gerenciamento de Calendários e Lembretes

Um aplicativo full-stack para gerenciamento de eventos, tarefas e lembretes com suporte a múltiplos calendários, eventos recorrentes e notificações por e-mail e WhatsApp.

## Recursos Implementados

### ✅ Múltiplos Calendários
- Criar, editar e deletar calendários por usuário
- Seleção de calendário ativo
- Toggle de visibilidade para filtrar eventos
- Cores personalizadas por calendário

### ✅ Eventos Recorrentes
- Suporte a RRULE (RFC 5545)
- Frequências: Diário, Semanal, Mensal
- Intervalo customizável (a cada N dias/semanas/meses)
- Seleção de dias da semana (para recorrências semanais)
- Condições de término: Nunca, Data específica, Após N ocorrências
- Expansão on-the-fly de eventos (não materializa no banco)


### ✅ Lembretes
- Lembretes por e-mail (via Resend ou Nodemailer)
- Protótipo de lembretes por WhatsApp (links wa.me)
- Múltiplos lembretes por evento
- Offsets de tempo: 5min, 15min, 30min, 1hora, 1dia antes

### ✅ Gerenciamento de Tarefas
- Criar, editar e deletar tarefas
- Prioridades: Baixa, Média, Alta
- Marcar tarefas como concluídas
- Filtros por tipo (Eventos/Tarefas)

## Stack Técnico

### Backend
- **Node.js** + **Express.js** (servidor REST API)
- **PostgreSQL** (banco de dados)
- **Agenda.js** (job scheduler para lembretes)
- **Resend** + **Nodemailer** (envio de e-mails)
- **JWT** (autenticação)
- **bcryptjs** (hash de senhas)

### Frontend
- **React 19** (UI framework)
- **React Router 7** (navegação)
- **React Big Calendar** (visualização de calendário)
- **SweetAlert2** (modals/confirmações)
- **date-fns** (manipulação de datas)
- **Axios** (requisições HTTP)

## Instalação e Setup

### Pré-requisitos
- Node.js v16+
- PostgreSQL 12+
- npm ou yarn

### 1. Clonar o Repositório
```bash
git clone <seu-repositorio>
cd projeto-lucas
```

### 2. Configurar Backend

```bash
cd backend
npm install

# Criar arquivo .env a partir do exemplo
cp .env.example .env

# Editar .env com suas configurações
# DATABASE_URL, JWT_SECRET, EMAIL_FROM, etc.
```

### 3. Configurar Banco de Dados

```bash
# Executar migração SQL
psql -U seu_usuario -d seu_banco -f migrations/001_create_calendars_and_recurrence.sql

# Ou executar via Node.js (se implementado)
node scripts/migrate.js
```

### 4. Configurar Frontend

```bash
cd ../frontend
npm install

# Criar arquivo .env.local
cat > .env.local << EOF
VITE_API_URL=http://localhost:3000
EOF

# Iniciar desenvolvimento
npm run dev
```

### 5. Iniciar Backend

```bash
cd backend
npm start

# Ou com nodemon (desenvolvimento)
npm run dev
```

O servidor rodará em `http://localhost:3000` e o frontend em `http://localhost:5173`.

## Variáveis de Ambiente

### Backend (.env)
```
DATABASE_URL=postgresql://user:password@localhost:5432/adapta_tasks
JWT_SECRET=sua_chave_secreta
PORT=3000
FRONTEND_URL=http://localhost:5173
RESEND_API_KEY=seu_api_key_resend
EMAIL_FROM=noreply@example.com
BASE_URL=http://localhost:3000
TIMEZONE_DEFAULT=UTC
```

### Frontend (.env.local)
```
VITE_API_URL=http://localhost:3000
```

## Estrutura do Projeto

```
projeto-lucas/
├── backend/
│   ├── server.js                    # Express server com todas as rotas
│   ├── Agenda.js                    # Job scheduler para lembretes
│   ├── migrations/
│   │   └── 001_create_calendars_and_recurrence.sql
│   └── utils/
│       ├── recurrence.js            # Lógica de expansão de RRULE
│       ├── emailReminder.js         # Envio de e-mails
│       └── whatsapp.js              # (existente)
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Calendario.jsx       # Página principal do calendário
│   │   │   └── componentes/
│   │   │       ├── CalendarManager.jsx      # Gerenciador de calendários
│   │   │       ├── RecurrenceForm.jsx       # Formulário de recorrência
│   │   │       ├── ReminderForm.jsx         # Formulário de lembretes
│   │   │       ├── EventModal.jsx           # Modal de eventos/tarefas
│   │   │       └── ...outros componentes
│   │   ├── context/
│   │   │   ├── CalendarContext.jsx  # Estado global de calendários
│   │   │   ├── FilterContext.jsx
│   │   │   └── FilterContextValue.js
│   │   └── styles/
│   │       ├── Calendarios.css
│   │       ├── CalendarManager.css
│   │       ├── RecurrenceForm.css
│   │       ├── ReminderForm.css
│   │       └── ...outras styles
│   └── vite.config.js
└── package.json
```

## API Endpoints

### Autenticação
- `POST /auth/register` - Registrar novo usuário
- `POST /auth/login` - Login

### Calendários
- `GET /calendars` - Listar calendários do usuário
- `POST /calendars` - Criar novo calendário
- `PUT /calendars/:id` - Atualizar calendário
- `DELETE /calendars/:id` - Deletar calendário

### Eventos
- `GET /eventos?start=&end=` - Listar eventos por data
- `POST /eventos` - Criar evento (com suporte a recorrência)
- `PUT /eventos/:id` - Atualizar evento
- `DELETE /eventos/:id` - Deletar evento

### Lembretes
- `GET /eventos/:id/reminders` - Listar lembretes de um evento
- `POST /reminders` - Criar lembrete
- `DELETE /reminders/:id` - Deletar lembrete

### Tarefas
- `GET /tarefas` - Listar tarefas
- `POST /tarefas` - Criar tarefa
- `PUT /tarefas/:id` - Atualizar tarefa
- `DELETE /tarefas/:id` - Deletar tarefa
- `PUT /tarefas/:id/conclude` - Marcar tarefa como concluída

## Fluxo de Uso Típico

### 1. Criar Calendário
```
Sidebar → "Meus Calendários" → "+ Novo Calendário"
→ Nome e cor → Criar
```

### 2. Criar Evento Recorrente
```
Clique na data → "Criar" → EventModal
→ Preencher título, data/hora
→ Selecionar calendário
→ RecurrenceForm: "Diariamente" → "Intervalo: 1" → "Até [data]"
→ Confirmar
```

### 3. Adicionar Lembrete
```
EventModal (para evento existente)
→ ReminderForm → Método: "Email"
→ Tempo: "15 minutos antes"
→ Adicionar
```

### 4. Visualizar Eventos
```
Calendario.jsx → Exibe todos os eventos visíveis
→ Clique em evento → EventModal (editar)
→ Múltiplas ocorrências de recorrências aparecem automaticamente
```

## Configuração de E-mail

### Usando Resend (Recomendado)
1. Criar conta em https://resend.com
2. Gerar API Key
3. Adicionar `RESEND_API_KEY` e `EMAIL_FROM` no .env

### Usando Nodemailer (SMTP)
1. Configurar variáveis SMTP:
   ```
   EMAIL_SMTP_HOST=smtp.gmail.com
   EMAIL_SMTP_PORT=587
   EMAIL_SMTP_USER=seu_email@gmail.com
   EMAIL_SMTP_PASS=sua_senha_app
   ```

2. Para Gmail, gerar senha de app:
   - Acessar https://myaccount.google.com/apppasswords
   - Selecionar "Mail" e "Windows"
   - Copiar senha gerada

## Testes

### Testar Fluxo Completo
1. Registrar novo usuário
2. Criar calendário
3. Criar evento recorrente:
   - Título: "Daily Meeting"
   - Frequência: Diariamente
   - Intervalo: 1
   - Até: [data futura]
4. Adicionar lembrete por e-mail (15 min antes)
5. Verificar se o evento aparece múltiplas vezes no calendário
6. Checar console para logs de jobs agendados

### Verificar Envio de E-mail
```bash
# No backend, logs devem mostrar:
# ✓ Job "send email reminder" scheduled for [timestamp]
# ✓ Email sent to user@example.com
```

## Troubleshooting

### Erro: "DATABASE_URL inválida"
- Verificar string de conexão PostgreSQL
- Garantir que PostgreSQL está rodando
- Testar conexão: `psql -U user -d dbname`

### Erro: "VITE_API_URL inválida"
- Adicionar `VITE_API_URL=http://localhost:3000` no `.env.local`
- Reiniciar frontend (npm run dev)

### Lembretes não funcionam
- Verificar `RESEND_API_KEY` ou configuração SMTP
- Checar logs do backend: `node backend/server.js`
- Confirmar que Agenda.js está conectado ao banco

### Eventos recorrentes não expandem
- Verificar que `recurrence_rule` está no formato RRULE
- Exemplo: `FREQ=DAILY;INTERVAL=1`
- Confirmar `recurrence_until` ou `recurrence_count` está definido

## Desenvolvimento

### Adicionar Nova Funcionalidade
1. Criar rota no `backend/server.js`
2. Implementar lógica no contexto (`frontend/src/context/`)
3. Criar componente React em `frontend/src/pages/componentes/`
4. Adicionar estilos em `frontend/src/styles/`
5. Testar e fazer commit

### Padrão de Componente
```jsx
import React, { useState, useContext } from 'react';
import { CalendarContext } from '../../context/CalendarContext';

export default function MeuComponente() {
  const { calendars, activeCalendarId } = useContext(CalendarContext);
  // ... implementação
  return <div>...</div>;
}
```

## Licença

MIT

## Suporte

Para reportar bugs ou solicitar features, crie uma issue no repositório.
