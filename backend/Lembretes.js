import dayjs from "dayjs";
import { generateWhatsAppLink } from "./utils/whatsapp.js";

app.get("/lembretes", autenticarToken, async (req, res) => {
    const userId = req.userId;

    try {
        // 1️⃣ Busca lembretes
        const result = await pool.query(
            `
        SELECT
        r.id AS reminder_id,
        r.method,
        r.time_offset,
        e.titulo,
        e.start_date_time,
        e.id AS event_id
        FROM reminders r
        JOIN eventos e ON e.id = r.event_id
        WHERE e.userId = $1
        AND r.method = 'whatsapp'
        ORDER BY e.start_date_time ASC
    `,
            [userId]
        );

        // 2️⃣ Busca telefone do usuário
        const userResult = await pool.query(
            "SELECT telefone FROM usuarios WHERE id = $1",
            [userId]
        );

        const telefone = userResult.rows[0]?.telefone;

        // 3️⃣ Monta resposta final
        const lembretes = result.rows.map(item => {
            const reminderTime = dayjs(item.start_date_time)
                .add(item.time_offset, "minute")
                .format("DD/MM/YYYY HH:mm");

        
                return {
                ...item,
                reminderTime,
                whatsapp_link: telefone
                    ? generateWhatsAppLink({
                        phone: telefone,
                        titulo: item.titulo,
                        reminderTime
                    })
                    : null
            };
        });

        res.status(200).json(lembretes);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erro ao buscar lembretes" });
    }
});
