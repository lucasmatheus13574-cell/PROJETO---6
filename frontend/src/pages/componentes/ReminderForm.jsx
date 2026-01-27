import React, { useState, useEffect } from 'react';
import api from './LembrestesAPI';
import Swal from 'sweetalert2';
import './ReminderForm.css';

export default function ReminderForm({ eventId, onReminderAdded, onClose }) {
    const [reminders, setReminders] = useState([]);
    const [method, setMethod] = useState('email');
    const [timeOffset, setTimeOffset] = useState(-15);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (eventId) {
            fetchReminders();
        }
    }, [eventId]);

    const fetchReminders = async () => {
        try {
            const response = await api.get(`/events/${eventId}/reminders`);
            setReminders(response.data);
        } catch (error) {
            console.error('Erro ao buscar lembretes:', error);
        }
    };

    const handleAddReminder = async () => {
        try {
            setLoading(true);
            const response = await api.post('/reminders', {
                event_id: eventId,
                method,
                time_offset: timeOffset
            });

            setReminders([...reminders, response.data]);
            Swal.fire('Sucesso', 'Lembrete adicionado!', 'success');

            if (onReminderAdded) {
                onReminderAdded(response.data);
            }

            // Resetar form
            setMethod('email');
            setTimeOffset(-15);
        } catch (error) {
            Swal.fire('Erro', 'Erro ao adicionar lembrete', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteReminder = async (reminderId) => {
        try {
            await api.delete(`/reminders/${reminderId}`);
            setReminders(reminders.filter(r => r.id !== reminderId));
            Swal.fire('Sucesso', 'Lembrete removido!', 'success');
        } catch (error) {
            Swal.fire('Erro', 'Erro ao remover lembrete', 'error');
        }
    };

    const formatTimeOffset = (minutes) => {
        const absMin = Math.abs(minutes);
        if (absMin < 60) return `${absMin} minutos antes`;
        const hours = Math.floor(absMin / 60);
        const mins = absMin % 60;
        if (mins === 0) return `${hours} hora${hours > 1 ? 's' : ''} antes`;
        return `${hours}h ${mins}m antes`;
    };

    const getMethodLabel = (method) => {
        return method === 'email' ? '📧 E-mail' : '💬 WhatsApp';
    };

    return (
        <div className="reminder-form">
            <div className="reminder-header">
                <h4>🔔 Lembretes do Evento</h4>
                {onClose && (
                    <button onClick={onClose} className="btn-close">✕</button>
                )}
            </div>

            <div className="current-reminders">
                {reminders.length === 0 ? (
                    <p className="no-reminders">Nenhum lembrete configurado</p>
                ) : (
                    <ul className="reminders-list">
                        {reminders.map(reminder => (
                            <li key={reminder.id} className="reminder-item">
                                <span className="reminder-method">{getMethodLabel(reminder.method)}</span>
                                <span className="reminder-time">{formatTimeOffset(reminder.time_offset)}</span>
                                {reminder.is_sent && <span className="badge-sent">✓ Enviado</span>}
                                <button
                                    onClick={() => handleDeleteReminder(reminder.id)}
                                    className="btn-remove"
                                    title="Remover lembrete"
                                >
                                    🗑️
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="add-reminder">
                <h5>Adicionar Novo Lembrete</h5>

                <div className="form-group">
                    <label>Método:</label>
                    <select value={method} onChange={(e) => setMethod(e.target.value)}>
                        <option value="email">📧 E-mail</option>
                        <option value="whatsapp">💬 WhatsApp (protótipo)</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Quando:</label>
                    <select value={timeOffset} onChange={(e) => setTimeOffset(parseInt(e.target.value))}>
                        <option value={-5}>5 minutos antes</option>
                        <option value={-15}>15 minutos antes</option>
                        <option value={-30}>30 minutos antes</option>
                        <option value={-60}>1 hora antes</option>
                        <option value={-120}>2 horas antes</option>
                        <option value={-1440}>1 dia antes</option>
                    </select>
                </div>

                <button
                    onClick={handleAddReminder}
                    disabled={loading}
                    className="btn-add-reminder"
                >
                    {loading ? '⏳ Adicionando...' : '➕ Adicionar Lembrete'}
                </button>
            </div>

            {method === 'whatsapp' && (
                <div className="info-box">
                    <p><strong>ℹ️ Protótipo WhatsApp:</strong> Um link será gerado para você enviar uma mensagem de lembrete para si mesmo via WhatsApp. Integração completa virá em breve!</p>
                </div>
            )}
        </div>
    );
}
