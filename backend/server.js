const express = require ("express");
const  cors =  require ("cors");
const  bcryptjs = require ("bcryptjs");
const  jwt = require ("jsonwebtoken");
const  dotenv = require ("dotenv");

dotenv.config();

const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});



const URL_FRONTEND = process.env.FRONTEND_URL;

const app = express();

// if FRONTEND_URL is provided, restrict to it; otherwise allow all origins (useful for local dev)
const corsOptions = URL_FRONTEND ? { origin: URL_FRONTEND, credentials: true } : { origin: true, credentials: true };
app.use(cors(corsOptions));

app.use(express.json());

const PORT =  process.env.PORT || 3000;
const SECRET = process.env.JWT_SECRET;




pool.query(
  `CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE,
      password TEXT
  )`
);


pool.query(
  `CREATE TABLE IF NOT EXISTS tarefas (
      id SERIAL PRIMARY KEY,
      userId INTEGER,
      tarefa TEXT UNIQUE NOT NULL,
      data TEXT,
      prioridade TEXT,
      concluida INTEGER DEFAULT 0,
      FOREIGN KEY(userId) REFERENCES users(id)
  )`
);

pool.query(
  `CREATE TABLE IF NOT EXISTS eventos (
      id SERIAL PRIMARY KEY,
      userId INTEGER,
      horario TEXT,
      titulo TEXT,
      dataInicio TEXT,
      dataFim TEXT,
      descricao TEXT,
      FOREIGN KEY(userId) REFERENCES users(id)
  )`
);


function autenticarToken(req, res, next) {
  const authHeader = req.headers[ "authorization" ];
  if (!authHeader) return res.status(401).json({ message: "Token ausente!" });

  const token = authHeader.split(" ")[1];
  jwt.verify(token, SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: "Token inválido!" });

    req.userId = decoded.id;
    next();
  });
}


app.post("/register", async (req, res) => {
  const { username, password, confirmpassword } = req.body;

  if (!username || !password)
    return res.status(400).json({ message: "Nome e senha obrigatórios!" });

  if (password !== confirmpassword)
    return res.status(400).json({ message: "Senhas não coincidem!" });

  if (password.length < 6)
    return res.status(400).json({ message: "A senha deve ter pelo menos 6 caracteres!" });

  try {
    const hashed = await bcryptjs.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id",
      [username, hashed]
    );
    res.status(201).json({ message: "Usuário registrado com sucesso!", id: result.rows[0].id });
  } catch (error) {
    console.error("Register error:", error);
    if (error && error.code === '23505') return res.status(409).json({ message: "Usuário já existe!" });
    res.status(500).json({ message: "Erro no servidor!" });
  }
});


app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
    if (!result || result.rowCount === 0) return res.status(404).json({ message: "Usuário não encontrado!" });
    const user = result.rows[0];

    const valid = await bcryptjs.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: "Senha incorreta!" });

    const token = jwt.sign({ id: user.id }, SECRET, { expiresIn: "7d" });
    res.json({ message: "Login OK!", token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Erro no servidor!" });
  }
});


app.get("/login", autenticarToken, (req, res) => {
  res.json({ message: "Token válido!, Rota funcionando " });
});


app.get("/tarefas", autenticarToken, (req, res) => {
  pool.query("SELECT * FROM tarefas WHERE userId = $1", [req.userId], (err, result) => {
    if (err) return res.status(500).json({ message: "Erro ao buscar tarefas!" });
    res.json(result.rows);
  });
});



app.post("/tarefas", autenticarToken, async (req, res) => {
  const { tarefa, data, prioridade } = req.body;

  if (!tarefa || !data || !prioridade)
    return res.status(400).json({ message: "Todos os campos são obrigatórios!" });

  try {
    const result = await pool.query(
      "INSERT INTO tarefas (userId, tarefa, data, prioridade) VALUES ($1, $2, $3, $4) RETURNING id",
      [req.userId, tarefa, data, prioridade]
    );
    res.status(201).json({
      message: "Tarefa adicionada!",
      tarefa: { id: result.rows[0].id, tarefa, data, prioridade, concluida: 0 }
    });
  } catch (err) {
    console.error("Add tarefa error:", err);
    res.status(500).json({ message: "Erro ao adicionar!" });
  }
});


app.put("/tarefas/:id", autenticarToken, (req, res) => {
  const { tarefa, data, prioridade } = req.body;
  const { id } = req.params;


app.get("/events", autenticarToken, async (req, res) => {
  const { start, end } = req.query;

  try {
    let query = "SELECT * FROM eventos WHERE userId = $1";
    const params = [req.userId];

    if (start && end) {
      query += " AND dataInicio >= $2 AND dataFim <= $3";
      params.push(start, end);
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("Erro ao buscar events:", err);
    res.status(500).json({ message: "Erro ao buscar eventos!" });
  }
});
    }
  );
;


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

app.post("/events", autenticarToken, async (req, res) => {
  const { horario, titulo, dataInicio, dataFim, descricao } = req.body;

  if (!titulo || !dataInicio || !dataFim)
    return res.status(400).json({ message: "Campos obrigatórios!" });

  try {
    const result = await pool.query(
      `
      INSERT INTO eventos (userId, horario, titulo, dataInicio, dataFim, descricao)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *
      `,
      [req.userId, horario, titulo, dataInicio, dataFim, descricao]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Add event error:", err);
    res.status(500).json({ message: "Erro ao adicionar evento!" });
  }
});


app.get("/eventos", autenticarToken, (req, res) => {
  pool.query("SELECT * FROM eventos WHERE userId = $1", [req.userId], (err, result) => {
    if (err) return res.status(500).json({ message: "Erro ao buscar eventos!" });
    res.json(result.rows);
  });
});


app.get("/events", autenticarToken, async (req, res) => {
  const { start, end } = req.query;

  try {
    let query = "SELECT * FROM eventos WHERE userId = $1";
    const params = [req.userId];

    if (start && end) {
      query += " AND dataInicio >= $2 AND dataFim <= $3";
      params.push(start, end);
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("Erro ao buscar events:", err);
    res.status(500).json({ message: "Erro ao buscar eventos!" });
  }
});




app.get("/events", autenticarToken, async (req, res) => {
  const { start, end } = req.query;

  try {
    let query = "SELECT * FROM eventos WHERE userId = $1";
    const params = [req.userId];

    if (start && end) {
      query += " AND dataInicio >= $2 AND dataFim <= $3";
      params.push(start, end);
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("Erro ao buscar events:", err);
    res.status(500).json({ message: "Erro ao buscar eventos!" });
  }
});




app.get("/events/:id", autenticarToken, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "SELECT * FROM eventos WHERE id = $1 AND userId = $2",
      [id, req.userId]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "Evento não encontrado!" });

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Erro ao buscar event:", err);
    res.status(500).json({ message: "Erro ao buscar evento!" });
  }
});



app.put("/events/:id", autenticarToken, async (req, res) => {
  const { titulo, dataInicio, dataFim, descricao } = req.body;
  const { id } = req.params;

  try {
    await pool.query(
      `
      UPDATE eventos
      SET titulo=$1, dataInicio=$2, dataFim=$3, descricao=$4
      WHERE id=$5 AND userId=$6
      `,
      [titulo, dataInicio, dataFim, descricao, id, req.userId]
    );

    res.json({ message: "Evento atualizado!" });
  } catch (err) {
    console.error("Update event error:", err);
    res.status(500).json({ message: "Erro ao atualizar evento!" });
  }
});


app.delete("/events/:id", autenticarToken, async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query(
      "DELETE FROM eventos WHERE id=$1 AND userId=$2",
      [id, req.userId]
    );

    res.status(204).send();
  } catch (err) {
    console.error("Delete event error:", err);
    res.status(500).json({ message: "Erro ao excluir evento!" });
  }
});





app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});


app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'API funcionando' });
});
