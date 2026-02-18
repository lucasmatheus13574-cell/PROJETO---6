# AdaptaTasks  Gerenciador de Tarefas e Calendário

## Descrição

AdaptaTasks é uma aplicação full-stack para gerenciamento de tarefas, eventos e calendários. Permite criar, editar, excluir e marcar como concluídas tarefas e eventos, com suporte a múltiplos calendários, eventos recorrentes, lembretes por e-mail e visualização em calendário interativo.

---

## Tecnologias Utilizadas

### Frontend
| Tecnologia | Versão |
|---|---|
| React | 19.x |
| Vite | 7.x |
| React Router DOM | 7.x |
| React Big Calendar | 1.x |
| date-fns | 4.x |
| Axios | 1.x |
| SweetAlert2 | 11.x |
| Bootstrap / React-Bootstrap | 5.x |

### Backend
| Tecnologia | Versão |
|---|---|
| Node.js | 22.x |
| Express | 5.x |
| PostgreSQL (pg) | 8.x |
| bcryptjs | 3.x |
| jsonwebtoken | 9.x |
| dotenv | 17.x |
| nodemailer | 7.x |
| Agenda.js | 5.x |
| moment-timezone | 0.6.x |
| cors | 2.x |

---

## Funcionalidades

- **Autenticação:** Registro e login de usuários com JWT
- **Tarefas:** Criar, editar, marcar como concluída e excluir tarefas
- **Eventos:** Criar, editar, mover (drag & drop), redimensionar e excluir eventos no calendário
- **Múltiplos Calendários:** Criar, renomear (com seletor de cor), arquivar e excluir calendários por usuário
- **Eventos Recorrentes:** Suporte a regras de recorrência (diário, semanal, mensal, anual) com exceções por data
- **Lembretes:** Envio de lembretes por e-mail antes dos eventos (Nodemailer + Agenda.js)
- **Visualizações do Calendário:** Mensal, semanal, diária e anual
- **Popup de overflow:** Botão "+X mais" no calendário mensal com popup de eventos extras
- **Proteção de rotas:** Todas as rotas de dados são protegidas por JWT

---

## Rotas da API

### Autenticação
| Método | Rota | Descrição |
|---|---|---|
| POST | `/register` | Registrar novo usuário |
| POST | `/login` | Login e geração de token JWT |

### Calendários *(requer JWT)*
| Método | Rota | Descrição |
|---|---|---|
| GET | `/calendars` | Listar calendários do usuário |
| POST | `/calendars` | Criar novo calendário |
| PUT | `/calendars/:id` | Atualizar nome/cor do calendário |
| DELETE | `/calendars/:id` | Excluir calendário |

### Eventos *(requer JWT)*
| Método | Rota | Descrição |
|---|---|---|
| GET | `/eventos` | Listar eventos (com recorrência expandida) |
| POST | `/eventos` | Criar evento |
| GET | `/eventos/:id` | Buscar evento por ID |
| PUT | `/eventos/:id` | Atualizar evento |
| DELETE | `/eventos/:id` | Excluir evento |

### Tarefas *(requer JWT)*
| Método | Rota | Descrição |
|---|---|---|
| GET | `/tarefas` | Listar tarefas do usuário |
| POST | `/tarefas` | Criar tarefa |
| PUT | `/tarefas/:id` | Atualizar tarefa |
| DELETE | `/tarefas/:id` | Excluir tarefa |

### Lembretes *(requer JWT)*
| Método | Rota | Descrição |
|---|---|---|
| POST | `/reminders` | Criar lembrete para um evento |
| GET | `/reminders` | Listar todos os lembretes do usuário |
| GET | `/events/:event_id/reminders` | Listar lembretes de um evento específico |
| DELETE | `/reminders/:id` | Excluir lembrete |

---

## Banco de Dados (PostgreSQL)

### Tabelas
- **users**  id, username, password, email, phone, created_at
- **calendars**  id, user_id, name, color, is_archived, is_default, created_at
- **eventos**  id, user_id, calendar_id, title, start, end, tipo, recurrence_rule, recurrence_until, recurrence_count, location, updated_at
- **event_exceptions**  id, event_id, exception_date_time
- **tarefas**  id, user_id, titulo, concluida, created_at
- **reminders**  id, event_id, method, time_offset, is_sent, sent_at, scheduled_job_id

---

## Como Configurar e Rodar o Projeto

### Pré-requisitos
- Node.js 22.x ou superior
- NPM
- PostgreSQL (banco em nuvem ou local  ex: Neon, Supabase, Railway)

### 1. Clonar o Repositório

```bash
git clone <url-do-repositorio>
cd projeto-lucas
```

### 2. Configurar o Backend

```bash
cd backend
npm install
```

Crie um arquivo `.env` dentro da pasta `backend`:

```env
DATABASE_URL=postgresql://usuario:senha@host:5432/nome_do_banco
JWT_SECRET=sua_chave_secreta_aqui
PORT=3000
FRONTEND_URL=http://localhost:5173
TIMEZONE_DEFAULT=America/Sao_Paulo
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu_email@gmail.com
EMAIL_PASS=sua_senha_de_app
```

Iniciar o servidor:

```bash
node server.js
# Servidor rodando em http://localhost:3000
```

### 3. Configurar o Frontend

```bash
cd frontend
npm install
```

Crie um arquivo `.env` dentro da pasta `frontend`:

```env
VITE_API_URL=http://localhost:3000
```

Iniciar a aplicação:

```bash
npm run dev
# Aplicação disponivel em http://localhost:5173
```

---

## Credenciais de Teste

Nao ha usuario de teste pre-cadastrado. Registre um novo usuario na tela de Registro (`/register`) e depois faca login em `/login`.

Exemplo sugerido:
- **Usuario:** `teste`
- **Senha:** `123456`

---

## Estrutura do Projeto

```
projeto-lucas/
 backend/
    server.js                  # Servidor Express + todas as rotas da API
    Agenda.js                  # Configuracao Agenda.js (agendamento de lembretes)
    Email.js                   # Configuracao Nodemailer
    GerarLink.js               # Geracao de links
    Lembretes.js               # Logica de lembretes
    events.controller.js       # Controller de eventos
    package.json
    migrations/
       001_create_calendars_and_recurrence.sql
    utils/
        emailReminder.js       # Envio de e-mail de lembrete
        recurrence.js          # Geracao de datas recorrentes
        reminderScheduler.js   # Agendador de lembretes
        whatsapp.js
 frontend/
     src/
        App.jsx
        main.jsx
        context/               # CalendarContext, FilterContext
        pages/
           Calendario.jsx     # Pagina principal do calendario (drag & drop)
           tarefas.jsx
           lembretes.jsx
           login.jsx
           register.jsx
           componentes/       # CalendarManager, EventModal, ReminderForm, etc.
        styles/                # CSS por pagina/componente
     package.json
     vite.config.js
```