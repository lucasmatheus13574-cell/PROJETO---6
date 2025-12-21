import React, { useState, useEffect } from 'react';
import moment from 'moment';
import Swal from 'sweetalert2';

const EventModal = ({ evento, onClose, onSave, onDelete }) => {
    const safeEvento = evento || {};
    const { title, titulo: altTitulo, description: desc, start: startVal, start_date_time, end: endVal, end_date_time, color: colorVal, mode, tipo: tipoVal, id } = safeEvento;
    const isCreate = mode === 'create';

    const toLocalInput = (val) => {
        if (!val) return moment().local().format('YYYY-MM-DDTHH:mm');
        if (moment.isMoment(val)) return val.local().format('YYYY-MM-DDTHH:mm');
        if (typeof val === 'string') return moment.parseZone(val).local().format('YYYY-MM-DDTHH:mm');
        // Date or number
        return moment(val).local().format('YYYY-MM-DDTHH:mm');
    };

    const toUTCISOString = (localDateTimeStr) => moment(localDateTimeStr).utc().toISOString();

    const [tipo, setTipo] = useState(tipoVal || 'evento');
    const [titulo, setTitulo] = useState(title || altTitulo || '');
    const [description, setDescription] = useState(desc || '');
    const [start, setStart] = useState(toLocalInput(startVal || start_date_time || new Date()));
    const [end, setEnd] = useState(toLocalInput(endVal || end_date_time || startVal || start_date_time || new Date()));
    const [color, setColor] = useState(colorVal || '#3788d8');
    const [location, setLocation] = useState(safeEvento.location || '');
    const [priority, setPriority] = useState(safeEvento.prioridade || 'baixa');
    const [loading] = useState(false);

    useEffect(() => {
        setTipo(tipoVal || 'evento');
        setTitulo(title || altTitulo || '');
        setDescription(desc || '');
        setStart(toLocalInput(startVal || start_date_time || new Date()));
        setEnd(toLocalInput(endVal || end_date_time || startVal || start_date_time || new Date()));
        setColor(colorVal || '#3788d8');
        setPriority(safeEvento.prioridade || 'baixa');
    }, [title, altTitulo, desc, startVal, start_date_time, endVal, end_date_time, colorVal, tipoVal, safeEvento.prioridade]);

    const handleSave = async () => {
        if (!onSave) {
            Swal.fire('Erro', 'Ação de salvar não está disponível', 'error');
            return;
        }

        if (!titulo) {
            Swal.fire('Atenção', 'Título é obrigatório', 'warning');
            return;
        }

        const startMoment = moment(start);
        const endMoment = moment(end);

        if (!startMoment.isValid() || !endMoment.isValid()) {
            Swal.fire('Atenção', 'Datas inválidas', 'warning');
            return;
        }

        if (endMoment.isBefore(startMoment)) {
            Swal.fire('Atenção', 'A data de fim deve ser maior ou igual à data de início', 'warning');
            return;
        }

        if (tipo === 'evento') {
            const payload = {
                titulo,
                start_date_time: toUTCISOString(start),
                end_date_time: toUTCISOString(end),
                description,
                color,
                location
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
            // tarefa - map fields
            const payload = {
                tarefa: titulo,
                data: moment(start).format('YYYY-MM-DD'),
                prioridade: priority,
                description
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
    return (
        <div className="event-modal-overlay">
            <div className="event-modal">

                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <input type="radio" name="tipo" value="evento" checked={tipo === 'evento'} onChange={() => setTipo('evento')} /> Evento
                    </label>
                    <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <input type="radio" name="tipo" value="tarefa" checked={tipo === 'tarefa'} onChange={() => setTipo('tarefa')} /> Tarefa
                    </label>
                </div>

                <div className="event-modal-body">
                    <label>Título</label>
                    <input className="event-input" value={titulo} onChange={(e) => setTitulo(e.target.value)} />

                    <label>Descrição</label>
                    <textarea className="event-textarea" value={description} onChange={(e) => setDescription(e.target.value)} />

                    <div className="event-row">
                        <div>
                            <label>Início</label>
                            <input className="event-input" type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
                        </div>
                        <div>
                            <label>Fim</label>
                            <input className="event-input" type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
                        </div>
                    </div>

                    {tipo === 'evento' ? (
                        <div className="event-row">
                            <div>
                                <label>Cor</label>
                                <input className="event-color" type="color" value={color} onChange={(e) => setColor(e.target.value)} />
                            </div>
                            <div>
                                <label>Local</label>
                                <input className="event-input"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    placeholder="Ex: Sala 3, Online, Auditório"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="event-row">
                            <div>
                                <label>Prioridade</label>
                                <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                                    <option value="baixa">Baixa</option>
                                    <option value="media">Média</option>
                                    <option value="alta">Alta</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                <div className="event-modal-footer">
                    <button className="btn-primary" onClick={handleSave} disabled={loading}>
                        {loading ? 'Salvando...' : isCreate ? 'Criar' : 'Salvar'}
                    </button>
                    {!isCreate && onDelete && <button className="btn-danger" onClick={handleDelete} style={{ marginLeft: 8 }}>Deletar</button>}
                    <button className="btn-secondary" onClick={onClose} style={{ marginLeft: 8 }}>Fechar</button>
                </div>
            </div>
        </div>
    );
};

export default EventModal;