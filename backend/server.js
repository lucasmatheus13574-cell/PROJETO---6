const express = require("express");
const cors = require("cors");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const { Pool } = require("pg");
const agenda = require("./Agenda");
const { generateRecurrences } = require("./utils/recurrence");
const { sendReminderEmail } = require("./utils/emailReminder");

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const URL_FRONTEND = process.env.FRONTEND_URL;
const app = express();
const corsOptions = URL_FRONTEND ? { origin: URL_FRONTEND, credentials: true } : { origin: true, credentials: true };

app.use(cors(corsOptions));
app.use(express.json());

const PORT = process.env.PORT || 3000;
const SECRET = process.env.JWT_SECRET;
const TIMEZONE = process.env.TIMEZONE_DEFAULT || 'UTC';

// ===== CRIAR TABELAS =====

pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  )
`);

pool.query(`
  CREATE TABLE IF NOT EXISTS tarefas (
    id SERIAL PRIMARY KEY,
    userId INTEGER NOT NULL,
    tarefa TEXT NOT NULL,
    data TEXT,
    prioridade TEXT,
    concluida INTEGER DEFAULT 0,
    allday BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
  )
`);

pool.query(`
  CREATE TABLE IF NOT EXISTS calendars (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#3174ad',
    is_archived BOOLEAN DEFAULT FALSE,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, name)
  )
`);

pool.query(`
  CREATE TABLE IF NOT EXISTS eventos (
    id SERIAL PRIMARY KEY,
    userId INTEGER NOT NULL,
    calendar_id INTEGER,
    titulo TEXT NOT NULL,
    start_date_time TIMESTAMPTZ NOT NULL,
    end_date_time TIMESTAMPTZ NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#3174ad',
    location TEXT,
    recurrence_rule TEXT,
    recurrence_until DATE,
    recurrence_count INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(calendar_id) REFERENCES calendars(id) ON DELETE CASCADE
  )
`);

pool.query(`
  CREATE TABLE IF NOT EXISTS event_exceptions (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL,
    exception_date_time TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY(event_id) REFERENCES eventos(id) ON DELETE CASCADE,
    UNIQUE(event_id, exception_date_time)
  )
`);

pool.query(`
  CREATE TABLE IF NOT EXISTS reminders (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL,
    method VARCHAR(20) NOT NULL,
    time_offset INTEGER NOT NULL,
    is_sent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP,
    scheduled_job_id TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY(event_id) REFERENCES eventos(id) ON DELETE CASCADE
  )
`);

// Criar índices
(async () => {
  try {
    await pool.query('CREATE INDEX IF NOT EXISTS idx_calendars_user_id ON calendars(user_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_eventos_calendar_id ON eventos(calendar_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_eventos_user_id ON eventos(userId)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_reminders_event_id ON reminders(event_id)');
    console.log('Índices criados com sucesso');
  } catch (err) {
    console.log('Erro ao criar índices:', err.message);
  }
})();

// ===== MIDDLEWARE AUTENTICAÇÃO =====

function autenticarToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ message: "Token ausente!" });

  const token = authHeader.split(" ")[1];
  jwt.verify(token, SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: "Token inválido!" });
    req.userId = decoded.id;
    next();
  });
}

// ===== ROTAS DE AUTENTICAÇÃO =====

app.post("/register", async (req, res) => {
  const { username, password, confirmpassword, email, phone } = req.body;

  if (!username || !password)
    return res.status(400).json({ message: "Nome e senha obrigatórios!" });

  if (password !== confirmpassword)
    return res.status(400).json({ message: "Senhas não coincidem!" });

  if (password.length < 6)
    return res.status(400).json({ message: "A senha deve ter pelo menos 6 caracteres!" });

  try {
    const hashed = await bcryptjs.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (username, password, email, phone) VALUES ($1, $2, $3, $4) RETURNING id, username, email",
      [username, hashed, email || null, phone || null]
    );
    
    // Criar calendário padrão
    await pool.query(
      "INSERT INTO calendars (user_id, name, color, is_default) VALUES ($1, $2, $3, $4)",
      [result.rows[0].id, 'Padrão', '#3174ad', true]
    );

    res.status(201).json({ 
      message: "Usuário registrado com sucesso!", 
      user: result.rows[0]
    });
  } catch (error) {
    console.error("Register error:", error);
    if (error.code === '23505') 
      return res.status(409).json({ message: "Usuário já existe!" });
    res.status(500).json({ message: "Erro no servidor!" });
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
    if (!result || result.rowCount === 0) 
      return res.status(404).json({ message: "Usuário não encontrado!" });
    
    const user = result.rows[0];
    const valid = await bcryptjs.compare(password, user.password);
    if (!valid) 
      return res.status(401).json({ message: "Senha incorreta!" });

    const token = jwt.sign({ id: user.id }, SECRET, { expiresIn: "7d" });

    try {
      const calendarsRes = await pool.query("SELECT * FROM calendars WHERE user_id = $1", [user.id]);
      res.json({ 
        message: "Login OK!", 
        token, 
        user: { id: user.id, username: user.username, email: user.email, phone: user.phone },
        calendars: calendarsRes.rows
      });
    } catch (err) {
      console.error("Erro ao buscar calendários no login:", err);
      res.json({ message: "Login OK!", token, calendars: [] });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Erro no servidor!" });
  }
});

// ===== ROTAS DE CALENDÁRIOS =====

app.get("/calendars", autenticarToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM calendars WHERE user_id = $1 AND is_archived = FALSE ORDER BY is_default DESC, created_at",
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Erro ao buscar calendários:", err);
    res.status(500).json({ message: "Erro ao buscar calendários!" });
  }
});

app.post("/calendars", autenticarToken, async (req, res) => {
  const { name, color } = req.body;

  if (!name || !name.trim())
    return res.status(400).json({ message: "Nome do calendário é obrigatório!" });

  try {
    const result = await pool.query(
      "INSERT INTO calendars (user_id, name, color) VALUES ($1, $2, $3) RETURNING *",
      [req.userId, name, color || '#3174ad']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ message: "Já existe calendário com este nome!" });
    }
    console.error("Erro ao criar calendário:", err);
    res.status(500).json({ message: "Erro ao criar calendário!" });
  }
});

app.put("/calendars/:id", autenticarToken, async (req, res) => {
  const { name, color, is_archived } = req.body;
  const { id } = req.params;

  try {
    const result = await pool.query(
      "UPDATE calendars SET name = COALESCE($1, name), color = COALESCE($2, color), is_archived = COALESCE($3, is_archived), updated_at = NOW() WHERE id = $4 AND user_id = $5 RETURNING *",
      [name || null, color || null, is_archived !== undefined ? is_archived : null, id, req.userId]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "Calendário não encontrado!" });

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Erro ao atualizar calendário:", err);
    res.status(500).json({ message: "Erro ao atualizar calendário!" });
  }
});

app.delete("/calendars/:id", autenticarToken, async (req, res) => {
  const { id } = req.params;

  try {
    // Verificar se é o calendário padrão
    const calResult = await pool.query(
      "SELECT is_default FROM calendars WHERE id = $1 AND user_id = $2",
      [id, req.userId]
    );

    if (calResult.rows.length === 0)
      return res.status(404).json({ message: "Calendário não encontrado!" });

    if (calResult.rows[0].is_default)
      return res.status(400).json({ message: "Não é possível deletar o calendário padrão!" });

    // Mover eventos para calendário padrão
    const defaultCal = await pool.query(
      "SELECT id FROM calendars WHERE user_id = $1 AND is_default = TRUE",
      [req.userId]
    );

    if (defaultCal.rows.length > 0) {
      await pool.query(
        "UPDATE eventos SET calendar_id = $1 WHERE calendar_id = $2",
        [defaultCal.rows[0].id, id]
      );
    }

    await pool.query(
      "DELETE FROM calendars WHERE id = $1 AND user_id = $2",
      [id, req.userId]
    );

    res.json({ message: "Calendário deletado com sucesso!" });
  } catch (err) {
    console.error("Erro ao deletar calendário:", err);
    res.status(500).json({ message: "Erro ao deletar calendário!" });
  }
});

// ===== ROTAS DE TAREFAS =====

app.get("/tarefas", autenticarToken, (req, res) => {
  pool.query("SELECT * FROM tarefas WHERE userId = $1 ORDER BY data ASC", [req.userId], (err, result) => {
    if (err) return res.status(500).json({ message: "Erro ao buscar tarefas!" });
    res.json(result.rows);
  });
});

app.post("/tarefas", autenticarToken, async (req, res) => {
  const { tarefa, data, prioridade, allday } = req.body;

  if (!tarefa || !data)
    return res.status(400).json({ message: "Título e data são obrigatórios!" });

  try {
    const result = await pool.query(
      "INSERT INTO tarefas (userId, tarefa, data, prioridade, allday) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [req.userId, tarefa, data, prioridade || '', !!allday]
    );
    res.status(201).json({ message: "Tarefa adicionada!", tarefa: result.rows[0] });
  } catch (err) {
    console.error("Add tarefa error:", err);
    res.status(500).json({ message: "Erro ao adicionar!" });
  }
});

app.put("/tarefas/:id", autenticarToken, (req, res) => {
  const { tarefa, data, prioridade, allday } = req.body;
  const { id } = req.params;

  pool.query(
    "UPDATE tarefas SET tarefa=$1, data=$2, prioridade=$3, allday=$4 WHERE id=$5 AND userId=$6",
    [tarefa, data, prioridade, !!allday, id, req.userId],
    function (err) {
      if (err) return res.status(500).json({ message: "Erro ao atualizar tarefa!" });
      res.json({ message: "Tarefa atualizada!" });
    }
  );
});

app.delete("/tarefas/:id", autenticarToken, (req, res) => {
  const { id } = req.params;
  pool.query(
    "DELETE FROM tarefas WHERE id=$1 AND userId=$2",
    [id, req.userId],
    function (err) {
      if (err) return res.status(500).json({ message: "Erro ao excluir tarefa!" });
      res.json({ message: "Tarefa removida!" });
    }
  );
});

// ===== ROTAS DE EVENTOS =====

app.post('/eventos', autenticarToken, async (req, res) => {
  const { titulo, start_date_time, end_date_time, description, color, location, calendar_id, recurrence_rule, recurrence_until, recurrence_count } = req.body;
  const userId = req.userId;

  if (!titulo || !titulo.trim())
    return res.status(400).json({ message: "Título é obrigatório!" });

  if (!start_date_time || !end_date_time)
    return res.status(400).json({ message: "Datas são obrigatórias!" });

  if (new Date(start_date_time) >= new Date(end_date_time))
    return res.status(400).json({ message: "Data final deve ser maior que inicial!" });

  try {
    // Se calendar_id não for especificado, usar o calendário padrão
    let calendarId = calendar_id;
    if (!calendarId) {
      const defaultCal = await pool.query(
        "SELECT id FROM calendars WHERE user_id = $1 AND is_default = TRUE LIMIT 1",
        [userId]
      );
      calendarId = defaultCal.rows[0]?.id;
    }

    const result = await pool.query(
      `INSERT INTO eventos (userId, calendar_id, titulo, start_date_time, end_date_time, description, color, location, recurrence_rule, recurrence_until, recurrence_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [userId, calendarId, titulo, start_date_time, end_date_time, description, color || '#3174ad', location || '', recurrence_rule || null, recurrence_until || null, recurrence_count || null]
    );

    const event = result.rows[0];

    // Se houver lembrete, agendar job
    res.status(201).json(event);
  } catch (err) {
    console.error('Erro ao criar evento:', err);
    res.status(500).json({ message: 'Erro ao criar evento!' });
  }
});

app.get('/eventos', autenticarToken, async (req, res) => {
  const userId = req.userId;
  const { start, end, calendar_id } = req.query;

  const isValidDate = (d) => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}(?:T.*)?/.test(d);

  if (start && !isValidDate(start)) 
    return res.status(400).json({ message: "Parâmetro 'start' inválido" });
  if (end && !isValidDate(end)) 
    return res.status(400).json({ message: "Parâmetro 'end' inválido" });

  try {
    let query = 'SELECT * FROM eventos WHERE userId = $1';
    const params = [userId];

    if (calendar_id) {
      query += ` AND calendar_id = $${params.length + 1}`;
      params.push(calendar_id);
    }

    let startDate = start ? new Date(start) : new Date();
    startDate.setHours(0, 0, 0, 0);

    let endDate = end ? new Date(end) : new Date();
    endDate.setHours(23, 59, 59, 999);
    endDate.setDate(endDate.getDate() + 30); // Por padrão, buscar próximos 30 dias

    query += ` AND NOT (end_date_time < $${params.length + 1}::timestamptz OR start_date_time > $${params.length + 2}::timestamptz)`;
    params.push(startDate.toISOString());
    params.push(endDate.toISOString());

    query += ' ORDER BY start_date_time ASC';

    const result = await pool.query(query, params);
    
    // Processar recorrências
    let allEvents = [];
    for (const event of result.rows) {
      if (event.recurrence_rule) {
        const occurrences = generateRecurrences(event, startDate, endDate);
        allEvents.push(...occurrences);
      } else {
        allEvents.push(event);
      }
    }

    res.json(allEvents);
  } catch (err) {
    console.error('Erro ao buscar eventos:', err);
    res.status(500).json({ message: 'Erro ao buscar eventos!' });
  }
});

app.get('/eventos/:id', autenticarToken, async (req, res) => {
  const userId = req.userId;
  const eventoId = req.params.id;
  try {
    const result = await pool.query('SELECT * FROM eventos WHERE id = $1 AND userId = $2', [eventoId, userId]);
    if (result.rows.length === 0) 
      return res.status(404).json({ message: 'Evento não encontrado!' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao buscar evento:', err);
    res.status(500).json({ message: 'Erro ao buscar evento!' });
  }
});

app.put('/eventos/:id', autenticarToken, async (req, res) => {
  const userId = req.userId;
  const eventoId = req.params.id;
  const { titulo, start_date_time, end_date_time, description, color, location, calendar_id, recurrence_rule, recurrence_until, recurrence_count } = req.body;

  if (!titulo || !titulo.trim())
    return res.status(400).json({ message: "Título é obrigatório!" });

  if (new Date(start_date_time) >= new Date(end_date_time))
    return res.status(400).json({ message: "Data final deve ser maior que inicial!" });

  try {
    const result = await pool.query(
      `UPDATE eventos SET titulo=$1, start_date_time=$2, end_date_time=$3, description=$4, color=$5, location=$6, calendar_id=$7, recurrence_rule=$8, recurrence_until=$9, recurrence_count=$10, updated_at=NOW()
       WHERE id=$11 AND userId=$12 RETURNING *`,
      [titulo, start_date_time, end_date_time, description, color, location, calendar_id, recurrence_rule || null, recurrence_until || null, recurrence_count || null, eventoId, userId]
    );

    if (result.rows.length === 0) 
      return res.status(404).json({ message: 'Evento não encontrado!' });

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar evento:', err);
    res.status(500).json({ message: 'Erro ao atualizar evento!' });
  }
});

app.delete('/eventos/:id', autenticarToken, async (req, res) => {
  const userId = req.userId;
  const eventoId = req.params.id;
  try {
    // Deletar lembretes associados
    await pool.query('DELETE FROM reminders WHERE event_id = $1', [eventoId]);
    
    // Deletar exceções
    await pool.query('DELETE FROM event_exceptions WHERE event_id = $1', [eventoId]);
    
    // Deletar evento
    const result = await pool.query('DELETE FROM eventos WHERE id=$1 AND userId=$2 RETURNING *', [eventoId, userId]);
    if (result.rows.length === 0) 
      return res.status(404).json({ message: 'Evento não encontrado!' });

    res.json({ message: 'Evento deletado com sucesso!' });
  } catch (err) {
    console.error('Erro ao deletar evento:', err);
    res.status(500).json({ message: 'Erro ao deletar evento!' });
  }
});

// ===== ROTAS DE LEMBRETES =====

app.post('/reminders', autenticarToken, async (req, res) => {
  const { event_id, method, time_offset } = req.body;

  if (!event_id || !method || time_offset === undefined)
    return res.status(400).json({ message: "Campos obrigatórios: event_id, method, time_offset" });

  if (!['email', 'whatsapp'].includes(method))
    return res.status(400).json({ message: "Método deve ser 'email' ou 'whatsapp'" });

  try {
    // Verificar se o evento pertence ao usuário
    const eventCheck = await pool.query(
      'SELECT * FROM eventos WHERE id = $1 AND userId = $2',
      [event_id, req.userId]
    );

    if (eventCheck.rows.length === 0)
      return res.status(404).json({ message: 'Evento não encontrado!' });

    const result = await pool.query(
      'INSERT INTO reminders (event_id, method, time_offset) VALUES ($1, $2, $3) RETURNING *',
      [event_id, method, time_offset]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao criar lembrete:', err);
    res.status(500).json({ message: 'Erro ao criar lembrete!' });
  }
});

app.get('/events/:event_id/reminders', autenticarToken, async (req, res) => {
  const { event_id } = req.params;

  try {
    const result = await pool.query(
      `SELECT r.* FROM reminders r
       JOIN eventos e ON r.event_id = e.id
       WHERE r.event_id = $1 AND e.userId = $2`,
      [event_id, req.userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar lembretes:', err);
    res.status(500).json({ message: 'Erro ao buscar lembretes!' });
  }
});

app.delete('/reminders/:id', autenticarToken, async (req, res) => {
  const { id } = req.params;

  try {
    const remCheck = await pool.query(
      `SELECT r.* FROM reminders r
       JOIN eventos e ON r.event_id = e.id
       WHERE r.id = $1 AND e.userId = $2`,
      [id, req.userId]
    );

    if (remCheck.rows.length === 0)
      return res.status(404).json({ message: 'Lembrete não encontrado!' });

    await pool.query('DELETE FROM reminders WHERE id = $1', [id]);
    res.json({ message: 'Lembrete deletado com sucesso!' });
  } catch (err) {
    console.error('Erro ao deletar lembrete:', err);
    res.status(500).json({ message: 'Erro ao deletar lembrete!' });
  }
});

// ===== STARTUP =====

(async () => {
  try {
    await agenda.start();
    console.log('Agenda iniciada com sucesso');
  } catch (err) {
    console.log('Aviso: Agenda não iniciada (pode ser esperado em desenvolvimento):', err.message);
  }
})();

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'API funcionando - AdaptaTasks v2.0' });
});

module.exports = app;
