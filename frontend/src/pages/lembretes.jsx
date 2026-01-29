import { useEffect, useState } from "react";
import api from './componentes/LembrestesAPI';
import "../styles/lembretes.css";   

export default function Lembretes() {
    const [lembretes, setLembretes] = useState([]);
    const [carregando, setCarregando] = useState(true);

    useEffect(() => {
        carregarLembretes();
    }, []);

    const carregarLembretes = async () => {
        try {
            setCarregando(true);
            const res = await api.get("/eventos");
            
            // Filtrar apenas eventos que têm reminders
            const eventosComReminders = res.data.filter(e => e.method);
            setLembretes(eventosComReminders);
        } catch (err) {
            console.error("Erro ao carregar lembretes:", err);
            setLembretes([]);
        } finally {
            setCarregando(false);
        }
    };

    return (
        <div className="page">
            <div className="reminders-page">
                <header className="reminders-header">
                    <h1>Meus Lembretes</h1>
                    <p>Gerencie e envie seus lembretes pelo WhatsApp</p>
                </header>
                
                {carregando && <p>Carregando lembretes...</p>}

                <section className="reminders-list">
                    {!carregando && lembretes.length === 0 && (
                        <div className="empty-state">
                            <p>Nenhum lembrete cadastrado.</p>
                        </div>
                    )}

                    {lembretes.map(lembrete => (
                        <div className="reminder-card" key={lembrete.id}>
                            <div className="reminder-info">
                                <h3>{lembrete.titulo}</h3>
                                <p>{lembrete.description}</p>
                                <span>
                                    Início: <strong>{new Date(lembrete.start_date_time).toLocaleString('pt-BR')}</strong>
                                </span>
                                {lembrete.time_offset && (
                                    <span>
                                        Lembrete: <strong>{lembrete.time_offset} minutos antes</strong>
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </section>
            </div>
        </div>
    );
}

