import React, { useState, useContext } from 'react';
import { CalendarContext } from '../../context/CalendarContext';
import Swal from 'sweetalert2';
import './CalendarManager.css';

export default function CalendarManager() {
    const {
        calendars,
        activeCalendarId,
        setActiveCalendarId,
        visibleCalendars,
        toggleCalendarVisibility,
        createCalendar,
        updateCalendar,
        deleteCalendar
    } = useContext(CalendarContext);

    const [isCreating, setIsCreating] = useState(false);
    const [newCalendarName, setNewCalendarName] = useState('');
    const [newCalendarColor, setNewCalendarColor] = useState('#3174ad');

    
    const handleCreateCalendar = async () => {
        if (!newCalendarName.trim()) {
            Swal.fire('Erro', 'Nome do calendário é obrigatório', 'error');
            return;
        }

        try {
            await createCalendar(newCalendarName, newCalendarColor);
            Swal.fire('Sucesso', 'Calendário criado!', 'success');
            setNewCalendarName('');
            setNewCalendarColor('#3174ad');
            setIsCreating(false);
        } catch (error) {
            Swal.fire('Erro', error.response?.data?.message || 'Erro ao criar calendário', 'error');
        }
    };

    const handleDeleteCalendar = async (calendarId) => {
        const result = await Swal.fire({
            title: 'Deletar calendário?',
            text: 'Seus eventos serão movidos para o calendário padrão',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sim, deletar'
        });

        if (result.isConfirmed) {
            try {
                await deleteCalendar(calendarId);
                Swal.fire('Sucesso', 'Calendário deletado!', 'success');
            } catch (error) {
                Swal.fire('Erro', error.response?.data?.message || 'Erro ao deletar', 'error');
            }
        }
    };

    const handleRenameCalendar = async (calendarId, currentName) => {
        const result = await Swal.fire({
            title: 'Renomear calendário',
            input: 'text',
            inputValue: currentName,
            showCancelButton: true
        });

        if (result.isConfirmed && result.value) {
            try {
                await updateCalendar(calendarId, { name: result.value });
                Swal.fire('Sucesso', 'Calendário renomeado!', 'success');
            } catch (error) {
                console.error('Erro ao renomear calendário:', error);
                Swal.fire('Erro', 'Erro ao renomear calendário', 'error');
            }
        }
    };

    return (
        <div className="calendar-manager">
            <h3>📅 Meus Calendários</h3>

            <div className="calendars-list">
                {calendars.map(calendar => (
                    <div
                        key={calendar.id}
                        className={`calendar-item ${activeCalendarId === calendar.id ? 'active' : ''}`}
                    >
                        <div className="calendar-info">
                            <input
                                type="checkbox"
                                checked={visibleCalendars.includes(calendar.id)}
                                onChange={() => toggleCalendarVisibility(calendar.id)}
                                title="Mostrar/Ocultar calendário"
                            />
                            <div
                                className="calendar-color"
                                style={{ backgroundColor: calendar.color }}
                                title="Cor do calendário"
                            />
                            <span
                                className="calendar-name"
                                onClick={() => setActiveCalendarId(calendar.id)}
                                role="button"
                                tabIndex="0"
                            >
                                {calendar.name}
                            </span>
                            {calendar.is_default && <span className="badge-default">Padrão</span>}
                        </div>

                        {!calendar.is_default && (
                            <div className="calendar-actions">
                                <button
                                    onClick={() => handleRenameCalendar(calendar.id, calendar.name)}
                                    title="Renomear"
                                    className="btn-rename"
                                >
                                    ✏️
                                </button>
                                <button
                                    onClick={() => handleDeleteCalendar(calendar.id)}
                                    title="Deletar"
                                    className="btn-delete"
                                >
                                    🗑️
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {!isCreating && (
                <button
                    onClick={() => setIsCreating(true)}
                    className="btn-create-calendar"
                >
                    + Novo Calendário
                </button>
            )}

            {isCreating && (
                <div className="create-calendar-form">
                    <input
                        type="text"
                        placeholder="Nome do calendário"
                        value={newCalendarName}
                        onChange={(e) => setNewCalendarName(e.target.value)}
                    />
                    <input
                        type="color"
                        value={newCalendarColor}
                        onChange={(e) => setNewCalendarColor(e.target.value)}
                    />
                    <button onClick={handleCreateCalendar} className="btn-save">
                        ✓ Criar
                    </button>
                    <button
                        onClick={() => {
                            setIsCreating(false);
                            setNewCalendarName('');
                        }}
                        className="btn-cancel"
                    >
                        ✕ Cancelar
                    </button>
                </div>
            )}
        </div>
    );
}
