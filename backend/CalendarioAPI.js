const express = require("express");
const cors = require("cors");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

const { Pool } = require("pg");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

const URL_FRONTEND = process.env.FRONTEND_URL;

const app = express();

const corsOptions = URL_FRONTEND
    ? { origin: URL_FRONTEND, credentials: true }
    : { origin: true, credentials: true };
app.use(cors(corsOptions));

app.use(express.json());

const PORT = process.env.PORT || 3000;
const SECRET = process.env.JWT_SECRET;

pool.query(
    `CREATE TABLE IF NOT EXISTS eventos (
        id SERIAL PRIMARY KEY,
        userId INTEGER,
        titulo TEXT,
        start_date_time TIMESTAMPTZ,
        end_date_time TIMESTAMPTZ,
        description TEXT,
        color TEXT,
        FOREIGN KEY(userId) REFERENCES users(id)
    )`
);

pool.query(`
    ALTER TABLE eventos
    ADD COLUMN IF NOT EXISTS location TEXT
`);




(async () => {
    try {
        await pool.query(`
        DO $$
        BEGIN
        IF NOT EXISTS (
            SELECT 1
            FROM pg_constraint
            WHERE conname = 'check_event_dates'
        ) THEN
            ALTER TABLE eventos
            ADD CONSTRAINT check_event_dates
            CHECK (start_date_time <= end_date_time);
        END IF;
        END $$;
    `);
        console.log('Constraint check_event_dates verificada/criada.');
    } catch (err) {
        console.error('Erro ao criar constraint check_event_dates:', err.message);
    }
})();





(async () => {
    try {
        await pool.query(`ALTER TABLE eventos ALTER COLUMN start_date_time TYPE TIMESTAMPTZ USING start_date_time::timestamptz`);
        await pool.query(`ALTER TABLE eventos ALTER COLUMN end_date_time TYPE TIMESTAMPTZ USING end_date_time::timestamptz`);
        console.log('Converted start_date_time/end_date_time to TIMESTAMPTZ (if needed).');
    } catch (err) {
        // ignore if table/columns don't exist yet or conversion not needed
        console.log('No conversion needed for eventos timestamps or conversion failed:', err.message);
    }
})();

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




app.post(["/eventos", "/events"], autenticarToken, async (req, res) => {
    const { titulo, start_date_time, end_date_time, description, color, location } = req.body;
    const userId = req.userId;

    if (!titulo || titulo.trim() === "") {
        return res.status(400).json({ message: "Título é obrigatório" });
    }

    if (new Date(start_date_time) > new Date(end_date_time)) {
        return res.status(400).json({ message: "Data final deve ser maior ou igual à inicial" });
    }

    try {
        const result = await pool.query(
            `INSERT INTO eventos 
        (userId, titulo, start_date_time, end_date_time, description, color, location)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
            [userId, titulo, start_date_time, end_date_time, description, color, location]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erro ao criar evento" });
    }
});



app.get("/eventos", autenticarToken, async (req, res) => {
    const userId = req.userId;
    const { start, end } = req.query;

    try {
        const result = await pool.query(
            `SELECT * FROM eventos WHERE userId = $1 AND 
        start_date_time >= $2 AND end_date_time <= $3
        ORDER BY start_date_time ASC`,
            [userId, start, end]
        );
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erro ao buscar eventos" });
    }
});



app.get("/eventos/:id", autenticarToken, async (req, res) => {
    const userId = req.userId;
    const eventoId = req.params.id;

    try {
        const result = await pool.query(
            `SELECT * FROM eventos WHERE id = $1 AND userId = $2`,
            [eventoId, userId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Evento não encontrado!" });
        }
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erro ao buscar evento!" });
    }
});
app.put(["/eventos/:id", "/events/:id"], autenticarToken, async (req, res) => {
    const { titulo, start_date_time, end_date_time, description, color, location } = req.body;
    const { id } = req.params;
    const userId = req.userId;

    if (!titulo || titulo.trim() === "") {
        return res.status(400).json({ message: "Título é obrigatório" });
    }

    if (new Date(start_date_time) > new Date(end_date_time)) {
        return res.status(400).json({ message: "Data final deve ser maior ou igual à inicial" });
    }

    try {
        const result = await pool.query(
            `UPDATE eventos SET
        titulo=$1,
        start_date_time=$2,
        end_date_time=$3,
        description=$4,
        color=$5,
        location=$6
        WHERE id=$7 AND userId=$8
       RETURNING *`,
            [titulo, start_date_time, end_date_time, description, color, location, id, userId]
        );

        if (!result.rows.length) {
            return res.status(404).json({ message: "Evento não encontrado" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erro ao atualizar evento" });
    }
});


app.delete("/eventos/:id", autenticarToken, async (req, res) => {
    const userId = req.userId;
    const eventoId = req.params.id;
    try {
        const result = await pool.query(
            `DELETE FROM eventos WHERE id=$1 AND userId=$2 RETURNING *`,
            [eventoId, userId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Evento não encontrado!" });
        }
        res.status(200).json({ message: "Evento deletado com sucesso!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erro ao deletar evento!" });
    }
});


app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});