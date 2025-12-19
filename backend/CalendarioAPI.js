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

// Attempt to convert existing text columns to timestamptz if needed (safe to run)
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




app.post("/eventos", autenticarToken, async(req, res) => {
    const { titulo, start_date_time, end_date_time, description, color } = req.body;
    const userId = req.userId;

    try {
        const result = await pool.query(
            `INSERT INTO eventos (userId, titulo, start_date_time, end_date_time, description, color)
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [userId, titulo, start_date_time, end_date_time, description, color]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erro ao criar evento!" });
    }
});


app.get("/eventos", autenticarToken, async (req, res) => {
    const userId = req.userId;
    const { start, end } = req.query;


    const isValidDate = (d) => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(d);
    const isDateOnly = (d) => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d);

    if (start && !isValidDate(start)) return res.status(400).json({ message: "Parâmetro 'start' inválido. Use YYYY-MM-DD ou ISO 8601." });
    if (end && !isValidDate(end)) return res.status(400).json({ message: "Parâmetro 'end' inválido. Use YYYY-MM-DD ou ISO 8601." });

    try {

        let baseQuery = 'SELECT * FROM eventos WHERE userId = $1';
        const params = [userId];

        // convert date-only params to UTC day boundaries
        let startParam = start;
        let endParam = end;
        if (start && isDateOnly(start)) startParam = `${start}T00:00:00Z`;
        if (end && isDateOnly(end)) endParam = `${end}T23:59:59.999Z`;

        if (startParam && endParam) {

            params.push(startParam);
            params.push(endParam);
            baseQuery += ` AND NOT (end_date_time < $${params.length - 1}::timestamptz OR start_date_time > $${params.length}::timestamptz)`;
        } else if (startParam) {

            params.push(startParam);
            baseQuery += ` AND end_date_time >= $${params.length}::timestamptz`;
        } else if (endParam) {

            params.push(endParam);
            baseQuery += ` AND start_date_time <= $${params.length}::timestamptz`;
        }

        baseQuery += ' ORDER BY start_date_time';

        const result = await pool.query(baseQuery, params);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erro ao buscar eventos!" });
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

app.put("/eventos/:id", autenticarToken, async (req, res) => {
    const userId = req.userId;
    const eventoId = req.params.id;
    const { titulo, start_date_time, end_date_time, description, color } = req.body;
    try {
        const result = await pool.query(
            `UPDATE eventos SET titulo=$1, start_date_time=$2, end_date_time=$3, description=$4, color=$5
            WHERE id=$6 AND userId=$7 RETURNING *`,
            [titulo, start_date_time, end_date_time, description, color, eventoId, userId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Evento não encontrado!" });
        }
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erro ao atualizar evento!" });
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