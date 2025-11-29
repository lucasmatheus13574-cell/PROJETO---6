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


const app = express();

app.use(cors({ origin: "https://projeto6-frontend.vercel.app" }));
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
      tarefa TEXT,
      data TEXT,
      prioridade TEXT,
      concluida INTEGER DEFAULT 0,
      FOREIGN KEY(userId) REFERENCES users(id)
  )`
);

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


app.post("/register", async (req, res) => {
  const { username, password, confirmpassword } = req.body;

  if (!username || !password)
    return res.status(400).json({ message: "Nome e senha obrigatórios!" });

  if (password !== confirmpassword)
    return res.status(400).json({ message: "Senhas não coincidem!" });

  if (password,confirmpassword.length < 6)
    return res.status(400).json({ message: "A senha deve ter pelo menos 6 caracteres!" });

  

  try {
    const hashed = await bcryptjs.hash(password, 10);
    pool.query("INSERT INTO users (username, password) VALUES ($1, $2)", [username, hashed], (err) => {
      if (err) return res.status(500).json({ message: "Usuário já existe!" });
      res.status(201).json({ message: "Usuário registrado com sucesso!" });
    });
  } catch (error) {
    res.status(500).json({ message: "Erro no servidor!" });
  }
});


app.post("/login", (req, res) => {
  const { username, password } = req.body;

  pool.query("SELECT * FROM users WHERE username = $1", [username], async (err, result) => {
    const user = result.rows[0];
    if (!user) return res.status(404).json({ message: "Usuário não encontrado!" });

    const valid = await bcryptjs.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: "Senha incorreta!" });

    const token = jwt.sign({ id: user.id }, SECRET, { expiresIn: "7d" });
    res.json({ message: "Login OK!", token });
  });
});


app.get("/tarefas", autenticarToken, (req, res) => {
  pool.query("SELECT * FROM tarefas WHERE userId = $1", [req.userId], (err, result) => {
    if (err) return res.status(500).json({ message: "Erro ao buscar tarefas!" });
    res.json(result.rows);
  });
});


app.post("/tarefas", autenticarToken, (req, res) => {
  const { tarefa, data, prioridade } = req.body;

  if (!tarefa || !data || !prioridade)
    return res.status(400).json({ message: "Todos os campos são obrigatórios!" });

  pool.query(
    "INSERT INTO tarefas (userId, tarefa, data, prioridade) VALUES ($1, $2, $3, $4)",
    [req.userId, tarefa, data, prioridade],
    function (err) {
      if (err) return res.status(500).json({ message: "Erro ao adicionar!" });

      res.status(201).json({
        message: "Tarefa adicionada!",
        tarefa: { id: this.lastID, tarefa, data, prioridade, concluida: 0 }
      });
    }
  );
});


app.put("/tarefas/:id", autenticarToken, (req, res) => {
  const { tarefa, data, prioridade } = req.body;
  const { id } = req.params;

  pool.query(
    "UPDATE tarefas SET tarefa=$1, data=$2, prioridade=$3 WHERE id=$4 AND userId=$5",
    [tarefa, data, prioridade, id, req.userId],
    function (err) {
      if (err) return res.status(500).json({ message: "Erro ao atualizar tarefa!" });
      res.json({ message: "Tarefa atualizada!" });
    }
  );
});


app.put("/tarefas/concluir/:id", autenticarToken, (req, res) => {
  const { id } = req.params;

  pool.query(
    "UPDATE tarefas SET concluida=1 WHERE id=$1 AND userId=$2",
    [id, req.userId],
    function (err) {
      if (err) return res.status(500).json({ message: "Erro ao concluir tarefa!" });
      res.json({ message: "Tarefa concluída!" });
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


app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
