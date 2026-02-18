import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import api from './componentes/LembrestesAPI';
import "../styles/lembretes.css";
import "../styles/index.css";

export default function Lembretes() {
    const [lembretes, setLembretes] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        carregarLembretes();
    }, []);

    const carregarLembretes = async () => {
        try {
            setCarregando(true);
            const res = await api.get("/reminders");
            setLembretes(res.data);
        } catch (err) {
            console.error("Erro ao carregar lembretes:", err);
            setLembretes([]);
            Swal.fire({
                icon: "error",
                title: "Erro ao carregar",
                text: "Não foi possível buscar seus lembretes.",
            });
        } finally {
            setCarregando(false);
        }
    };

    const excluirLembrete = async (reminderId) => {
        const result = await Swal.fire({
            title: "Excluir lembrete?",
            text: "Esta ação não pode ser desfeita.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sim, excluir",
            cancelButtonText: "Cancelar",
        });

        if (!result.isConfirmed) return;

        try {
            await api.delete(`/reminders/${reminderId}`);
            Swal.fire({
                icon: "success",
                title: "Excluído!",
                text: "Lembrete removido com sucesso.",
                timer: 1800,
                showConfirmButton: false,
            });
            carregarLembretes();
        } catch (err) {
            console.error("Erro ao excluir lembrete:", err);
            Swal.fire({
                icon: "error",
                title: "Erro",
                text: "Não foi possível excluir o lembrete.",
            });
        }
    };

    const formatarTempo = (offset) => {
        const minutos = Math.abs(offset);
        if (minutos >= 60) {
            const horas = Math.floor(minutos / 60);
            const minutosRestantes = minutos % 60;
            return minutosRestantes > 0
                ? `${horas}h ${minutosRestantes}min antes`
                : `${horas}h antes`;
        }
        return `${minutos} minutos antes`;
    };

    return (
        <div className="reminders-page">
            <header className="reminders-header">
                <button className="back-button" onClick={() => navigate('/eventos')}>
                    ← Voltar
                </button>
                <div>
                    <h1>Meus Lembretes</h1>
                    <p>Gerencie seus lembretes de e-mail e WhatsApp</p>
                </div>
            </header>

            {carregando && (
                <div className="reminders-loading">
                    <div className="reminders-spinner" />
                    <span>Carregando lembretes…</span>
                </div>
            )}

            <section className="reminders-list">
                {!carregando && lembretes.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-state-icon">🔔</div>
                        <h3>Nenhum lembrete ainda</h3>
                        <p>Crie eventos no calendário e adicione lembretes a eles!</p>
                    </div>
                )}

                {lembretes.map(lembrete => (
                    <div className="reminder-card" key={lembrete.reminder_id}>
                        <div className="reminder-card-top">
                            <h3 className="reminder-title">{lembrete.titulo}</h3>
                            <span className={`method-badge ${lembrete.method}`}>
                                {lembrete.method === 'email' ? '📧 E-mail' : '📱 WhatsApp'}
                            </span>
                        </div>

                        {lembrete.description && (
                            <p className="reminder-desc">{lembrete.description}</p>
                        )}

                        <div className="reminder-details">
                            <div className="reminder-detail-item">
                                <span className="detail-icon">📅</span>
                                <span>{new Date(lembrete.start_date_time).toLocaleString('pt-BR')}</span>
                            </div>
                            {lembrete.location && (
                                <div className="reminder-detail-item">
                                    <span className="detail-icon">📍</span>
                                    <span>{lembrete.location}</span>
                                </div>
                            )}
                            <div className="reminder-detail-item">
                                <span className="detail-icon">⏰</span>
                                <span>Enviar <strong>{formatarTempo(lembrete.time_offset)}</strong></span>
                            </div>
                            {lembrete.is_sent && lembrete.sent_at ? (
                                <div className="reminder-detail-item status-sent">
                                    <span className="detail-icon">✅</span>
                                    <span>Enviado em {new Date(lembrete.sent_at).toLocaleString('pt-BR')}</span>
                                </div>
                            ) : (
                                <div className="reminder-detail-item status-pending">
                                    <span className="detail-icon">⏳</span>
                                    <span>Aguardando envio…</span>
                                </div>
                            )}
                        </div>

                        <div className="reminder-actions">
                            {lembrete.method === 'whatsapp' && lembrete.whatsapp_link && (
                                <a
                                    href={lembrete.whatsapp_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="whatsapp-btn"
                                >
                                    📱 Abrir WhatsApp
                                </a>
                            )}
                            <button
                                className="delete-btn"
                                onClick={() => excluirLembrete(lembrete.reminder_id)}
                            >
                                🗑️ Excluir
                            </button>
                        </div>
                    </div>
                ))}
            </section>
        </div>
    );
}

