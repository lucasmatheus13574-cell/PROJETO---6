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

    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [editColor, setEditColor] = useState('#3174ad');

    
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

    const handleRenameCalendar = async (calendarId, currentName, currentColor) => {
        setEditingId(calendarId);
        setEditName(currentName);
        setEditColor(currentColor || '#3174ad');
    };

    const handleSaveRename = async () => {
        if (!editName.trim()) {
            Swal.fire('Erro', 'Nome do calendário é obrigatório', 'error');
            return;
        }
        try {
            await updateCalendar(editingId, { name: editName.trim(), color: editColor });
            setEditingId(null);
        } catch {
            Swal.fire('Erro', 'Erro ao salvar calendário', 'error');
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
                        {editingId === calendar.id ? (
                            <div className="rename-form">
                                <div className="form-input-row">
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') handleSaveRename(); if (e.key === 'Escape') setEditingId(null); }}
                                        autoFocus
                                        placeholder="Nome do calendário"
                                    />
                                    <input
                                        type="color"
                                        value={editColor}
                                        onChange={(e) => setEditColor(e.target.value)}
                                        title="Escolher cor"
                                    />
                                </div>
                                <div className="form-buttons-row">
                                    <button onClick={handleSaveRename} className="btn-save">✓ Salvar</button>
                                    <button onClick={() => setEditingId(null)} className="btn-cancel">✕ Cancelar</button>
                                </div>
                            </div>
                        ) : (
                            <>
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
                                            onClick={() => handleRenameCalendar(calendar.id, calendar.name, calendar.color)}
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
                            </>
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
                    <div className="form-input-row">
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
                            title="Escolher cor"
                        />
                    </div>
                    <div className="form-buttons-row">
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
                </div>
            )}
        </div>
    );
}
