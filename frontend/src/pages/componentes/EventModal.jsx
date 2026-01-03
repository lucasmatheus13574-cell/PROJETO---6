import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import '../../styles/EventModal.css';
import { format, parse, parseISO, isValid, isBefore, startOfDay, endOfDay, add } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

const EventModal = ({ evento, onClose, onSave, onDelete, onConclude }) => {
    const safeEvento = evento || {};
    const { title, titulo: altTitulo, description: desc, start: startVal, start_date_time, end: endVal, end_date_time, color: colorVal, mode, tipo: tipoVal, id } = safeEvento;
    const isCreate = mode === 'create';

    const toLocalInput = (val) => {
        // produce a local datetime string 'yyyy-MM-ddTHH:mm'
        if (!val) return format(new Date(), "yyyy-MM-dd'T'HH:mm");
        if (val instanceof Date) return format(val, "yyyy-MM-dd'T'HH:mm");
        if (typeof val === 'string') {
            // Try ISO parse first
            const parsed = parseISO(val);
            if (isValid(parsed)) return format(parsed, "yyyy-MM-dd'T'HH:mm");
            // fallback to parsing a local datetime string
            const p = parse(val, "yyyy-MM-dd'T'HH:mm", new Date());
            if (isValid(p)) return format(p, "yyyy-MM-dd'T'HH:mm");
            // last resort
            const d = new Date(val);
            return format(d, "yyyy-MM-dd'T'HH:mm");
        }
        // number
        return format(new Date(val), "yyyy-MM-dd'T'HH:mm");
    };

    const toUTCISOString = (localDateTimeStr) => {
        const dt = parse(localDateTimeStr, "yyyy-MM-dd'T'HH:mm", new Date());
        return dt.toISOString();
    };

    const [tipo, setTipo] = useState(tipoVal || 'evento');
    const [titulo, setTitulo] = useState(title || altTitulo || '');
    const [description, setDescription] = useState(desc || '');
    const [start, setStart] = useState(toLocalInput(startVal || start_date_time || new Date()));
    const [end, setEnd] = useState(toLocalInput(endVal || end_date_time || startVal || start_date_time || new Date()));
    const [color, setColor] = useState(colorVal || '#3788d8');
    const [location, setLocation] = useState(safeEvento.location || '');
    const [priority, setPriority] = useState(safeEvento.prioridade || 'baixa');
    const [loading] = useState(false);
    const [allDay, setAllDay] = useState(safeEvento.allDay || false);

    // support multiple time slots in the modal UI (visual only).
    const [slots, setSlots] = useState([{ start: toLocalInput(startVal || start_date_time || new Date()), end: toLocalInput(endVal || end_date_time || startVal || start_date_time || new Date()) }]);


    useEffect(() => {
        setTipo(tipoVal || 'evento');
        setTitulo(title || altTitulo || '');
        setDescription(desc || '');
        setStart(toLocalInput(startVal || start_date_time || new Date()));
        setEnd(toLocalInput(endVal || end_date_time || startVal || start_date_time || new Date()));
        setColor(colorVal || '#3788d8');
        setPriority(safeEvento.prioridade || 'baixa');
        setAllDay(safeEvento.allDay || safeEvento.allday || false);
        // initialize slots to reflect current start/end
        setSlots([{ start: toLocalInput(startVal || start_date_time || new Date()), end: toLocalInput(endVal || end_date_time || startVal || start_date_time || new Date()) }]);
    }, [title, altTitulo, desc, startVal, start_date_time, endVal, end_date_time, colorVal, tipoVal, safeEvento.prioridade, safeEvento.allday, safeEvento.allDay]);

    const handleSave = async () => {
        if (!onSave) {
            Swal.fire('Erro', 'Ação de salvar não está disponível', 'error');
            return;
        }

        if (!titulo) {
            Swal.fire('Atenção', 'Título é obrigatório', 'warning');
            return;
        }

        // Use the first slot for saving the event's start/end
        const slotStart = slots[0]?.start || start;
        const slotEnd = slots[0]?.end || end;

        const startDt = parse(slotStart, "yyyy-MM-dd'T'HH:mm", new Date());
        const endDt = parse(slotEnd, "yyyy-MM-dd'T'HH:mm", new Date());

        if (!isValid(startDt) || !isValid(endDt)) {
            Swal.fire('Atenção', 'Datas inválidas', 'warning');
            return;
        }

        if (isBefore(endDt, startDt)) {
            Swal.fire('Atenção', 'A data de fim deve ser maior ou igual à data de início', 'warning');
            return;
        }

        if (tipo === 'evento') {
            let s = slotStart;
            let e = slotEnd;
            if (allDay) {
                s = format(startOfDay(startDt), "yyyy-MM-dd'T'HH:mm");
                e = format(endOfDay(startDt), "yyyy-MM-dd'T'HH:mm");
            }

            const payload = {
                titulo,
                start_date_time: toUTCISOString(s),
                end_date_time: toUTCISOString(e),
                description,
                color,
                location,
                allDay: !!allDay
            };
            try {
                const result = await onSave(payload, 'evento', id);
                if (result === false) {
                    Swal.fire('Erro', 'Não foi possível salvar o evento', 'error');
                    return;
                }
                onClose && onClose();
            } catch (err) {
                console.error(err);
                Swal.fire('Erro', 'Não foi possível salvar o evento', 'error');
            }
        } else {

            const payload = {
                tarefa: titulo,
                data: format(parse(start, "yyyy-MM-dd'T'HH:mm", new Date()), 'yyyy-MM-dd'),
                prioridade: priority,
                description,
                allday: !!allDay
            };
            try {
                const result = await onSave(payload, 'tarefa', id);
                if (result === false) {
                    Swal.fire('Erro', 'Não foi possível salvar a tarefa', 'error');
                    return;
                }
                onClose && onClose();
            } catch (err) {
                console.error(err);
                Swal.fire('Erro', 'Não foi possível salvar a tarefa', 'error');
            }
        }
    };

    const handleDelete = async () => {
        if (!onDelete) {
            Swal.fire('Erro', 'Ação de deletar não está disponível', 'error');
            return;
        }

        const result = await Swal.fire({
            title: 'Deletar item?',
            text: 'Tem certeza que deseja excluir?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sim, deletar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                const r = await onDelete(id, tipo);
                if (r === false) {
                    Swal.fire('Erro', 'Não foi possível deletar', 'error');
                    return;
                }
                onClose && onClose();
            } catch (err) {
                console.error(err);
                Swal.fire('Erro', 'Não foi possível deletar', 'error');
            }
        }
    };

    const handleConclude = async () => {
        if (!onConclude) {
            Swal.fire('Erro', 'Ação de concluir não está disponível', 'error');
            return;
        }

        const result = await Swal.fire({
            title: 'Concluir tarefa?',
            text: 'Deseja marcar esta tarefa como concluída?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sim, concluir',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                const r = await onConclude(id, tipo);
                if (r === false) {
                    Swal.fire('Erro', 'Não foi possível concluir', 'error');
                    return;
                }
                onClose && onClose();
            } catch (err) {
                console.error(err);
                Swal.fire('Erro', 'Não foi possível concluir', 'error');
            }
        }
    };
    return (
        <div className="event-modal-overlay">
            <div className="event-modal">

                <div className="event-modal-header">
                    <div className="header-left">
                        <div className="tipo-toggle" role="radiogroup" aria-label="Tipo">
                            <label className={`tipo-option ${tipo === 'evento' ? 'active' : ''}`}>
                                <input type="radio" name="tipo" value="evento" checked={tipo === 'evento'} onChange={() => setTipo('evento')} />
                                Evento
                            </label>
                            <label className={`tipo-option ${tipo === 'tarefa' ? 'active' : ''}`}>
                                <input type="radio" name="tipo" value="tarefa" checked={tipo === 'tarefa'} onChange={() => setTipo('tarefa')} />
                                Tarefa
                            </label>
                        </div>
                        <div className="modal-title">
                            <h2>{isCreate ? 'Criar' : 'Editar'} <span className="muted">{tipo === 'evento' ? 'Evento' : 'Tarefa'}</span></h2>
                            <div className="modal-subtitle">{format(parse(start, "yyyy-MM-dd'T'HH:mm", new Date()), 'dd/MM/yyyy HH:mm')} — {format(parse(end, "yyyy-MM-dd'T'HH:mm", new Date()), 'dd/MM/yyyy HH:mm')}</div>
                        </div>
                    </div>
                    <div className="header-actions">
                        <button className="modal-close" onClick={onClose} aria-label="Fechar">&times;</button>
                    </div>
                </div>

                <div className="event-modal-body">
                    <div className="event-field">
                        <label>Título</label>
                        <input className="event-input" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
                    </div>

                    <div className="event-field">
                        <label>Descrição</label>
                        <textarea className="event-textarea" value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>

                                    {tipo === 'tarefa' ? (
                        <div className="event-field">
                            <label>Data</label>
                            <input
                                className="event-input"
                                type="date"
                                value={format(parse(start, "yyyy-MM-dd'T'HH:mm", new Date()), 'yyyy-MM-dd')}
                                onChange={(e) => setStart(e.target.value)}
                            />

                            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                                <label className="all-day-toggle" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <span className="switch">
                                        <input aria-label="Dia inteiro" type="checkbox" checked={allDay} onChange={() => setAllDay(!allDay)} />
                                        <span className="slider" />
                                    </span>
                                    <span style={{ fontWeight: 600, color: '#374151' }}>Dia inteiro</span>
                                </label>

                                {/* show a small helper only when creating */}
                                {isCreate && <small style={{ color: '#6b7280' }}>Marque para criar tarefa no dia inteiro</small>}
                            </div>
                        </div>
                    ) : (
                        <div className="event-times">
<div className="date-block">{format(parse(slots[0].start, "yyyy-MM-dd'T'HH:mm", new Date()), "EEEE, d 'de' MMMM", { locale: ptBR })}</div>

                                    {!allDay ? (
                                        <div className="times-list">
                                            {slots.map((s, idx) => (
                                                <div className="time-row" key={idx}>
                                                    <div className="time-block">
                                                        <input className="time-input" type="time" value={format(parse(s.start, "yyyy-MM-dd'T'HH:mm", new Date()), 'HH:mm')} onChange={(e) => {
                                                            const newSlots = [...slots];
                                                            const datePart = format(parse(s.start, "yyyy-MM-dd'T'HH:mm", new Date()), 'yyyy-MM-dd');
                                                            const newStart = `${datePart}T${e.target.value}`;
                                                            newSlots[idx].start = newStart;
                                                            setSlots(newSlots);
                                                }} />
                                                    </div>

                                                    <div className="dash">—</div>

                                                    <div className="time-block">
                                                        <input className="time-input" type="time" value={format(parse(s.end, "yyyy-MM-dd'T'HH:mm", new Date()), 'HH:mm')} onChange={(e) => {
                                                            const newSlots = [...slots];
                                                            const datePart = format(parse(s.end, "yyyy-MM-dd'T'HH:mm", new Date()), 'yyyy-MM-dd');
                                                            const newEnd = `${datePart}T${e.target.value}`;
                                                            newSlots[idx].end = newEnd;
                                                            setSlots(newSlots);
                                                        }} />
                                                    </div>

                                                    {idx > 0 && <button className="remove-slot" onClick={() => setSlots(slots.filter((_, i) => i !== idx))}>Remover</button>}
                                                </div>
                                            ))}

                                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
                                                <div className="date-summary" style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
                                                    <div className="summary-card">
                                                        <div className="summary-title">{format(parse(slots[0].start, "yyyy-MM-dd'T'HH:mm", new Date()), "EEEE, d 'de' MMMM", { locale: ptBR })}</div>
                                                        <div className="summary-sub">Não se repete</div>
                                                    </div>
                                                    <div style={{ marginLeft: 'auto' }}>
                                                        <button className="add-time-btn primary" onClick={() => setSlots([...slots, { start: slots[slots.length-1].end, end: format(add(parse(slots[slots.length-1].end, "yyyy-MM-dd'T'HH:mm", new Date()), { hours: 1 }), "yyyy-MM-dd'T'HH:mm") }])}>Adicionar horário</button>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                                    <div className="summary-card">
                                        <div className="summary-title">{format(parse(slots[0].start, "yyyy-MM-dd'T'HH:mm", new Date()), "EEEE, d 'de' MMMM", { locale: ptBR })}</div>
                                        <div className="summary-sub">Não se repete</div>
                                    </div>
                                    <div style={{ marginLeft: 'auto' }}>
                                        <button className="add-time-btn primary" disabled>Adicionar horário</button>
                                    </div>
                                </div>
                            )}

                            <div style={{ marginTop: 10 }}>
                                <label className="all-day-toggle" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                    <input aria-label="Dia inteiro" type="checkbox" checked={allDay} onChange={() => setAllDay(!allDay)} />
                                    <span style={{ fontWeight: 600 }}>Dia inteiro</span>
                                </label>
                                <a href="#" style={{ marginLeft: 12, color: '#1a73e8', textDecoration: 'none' }}>Fuso horário</a>
                            </div>
                        </div>
                    )}



                    {tipo === 'evento' ? (
                        <div className="event-row">
                            <div className="event-field color-field">
                                <label>Cor</label>
                                <input className="event-color" type="color" value={color} onChange={(e) => setColor(e.target.value)} />
                            </div>
                            <div className="event-field">
                                <label>Local</label>
                                <input className="event-input"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    placeholder="Ex: Sala 3, Online, Auditório"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="priority-field">
                            <div className="event-field">
                                <label>Prioridade</label>
                                <select className='priority-select' value={priority} onChange={(e) => setPriority(e.target.value)}>
                                    <option value="baixa">Baixa</option>
                                    <option value="media">Média</option>
                                    <option value="alta">Alta</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                <div className="event-modal-footer">
                    <div className="footer-left">
                        {/* show conclude only for tarefa and in edit mode */}
                        {!isCreate && tipo === 'tarefa' && onConclude && !safeEvento.concluida && (
                            <button className="btn-secondary" onClick={handleConclude}>Concluir</button>
                        )}

                        {!isCreate && onDelete && <button className="btn-danger" onClick={handleDelete}>Deletar</button>}
                    </div>

                    <div className="footer-right">
                        <button className="btn-secondary" onClick={onClose}>Fechar</button>
                        <button className="btn-primary" onClick={handleSave} disabled={loading}>{loading ? 'Salvando...' : isCreate ? 'Criar' : 'Salvar'}</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventModal;