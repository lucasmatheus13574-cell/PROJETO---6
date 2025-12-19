import React, {useState ,useEffect } from 'react';
import moment from 'moment';
import Swal from 'sweetalert2';

const EventModal = ({ evento, onClose, onSave, onDelete }) => {
    if (!evento) return null;

    const isCreate = evento.mode === 'create';

    
    const toLocalInput = (val) => {
        if (!val) return moment().local().format('YYYY-MM-DDTHH:mm');
        if (moment.isMoment(val)) return val.local().format('YYYY-MM-DDTHH:mm');
        if (typeof val === 'string') return moment.parseZone(val).local().format('YYYY-MM-DDTHH:mm');
        // Date or number
        return moment(val).local().format('YYYY-MM-DDTHH:mm');
    };

    const toUTCISOString = (localDateTimeStr) => moment(localDateTimeStr).utc().toISOString();

    const [titulo, setTitulo] = useState(evento.title || evento.titulo || '');
    const [description, setDescription] = useState(evento.description || '');
    const [start, setStart] = useState(toLocalInput(evento.start || evento.start_date_time || new Date()));
    const [end, setEnd] = useState(toLocalInput(evento.end || evento.end_date_time || evento.start || evento.start_date_time || new Date()));
    const [color, setColor] = useState(evento.color || '#3788d8');

    useEffect(() => {
        
        setTitulo(evento.title || evento.titulo || '');
        setDescription(evento.description || '');
        setStart(toLocalInput(evento.start || evento.start_date_time || new Date()));
        setEnd(toLocalInput(evento.end || evento.end_date_time || evento.start || evento.start_date_time || new Date()));
        setColor(evento.color || '#3788d8');
    }, [evento]);

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

        const payload = {
            titulo,
            start_date_time: toUTCISOString(start),
            end_date_time: toUTCISOString(end),
            description,
            color
        };

        try {
            const result = await onSave(payload);
            // If parent returns false or throws, handle accordingly. If success, close modal.
            if (result === false) {
                Swal.fire('Erro', 'Não foi possível salvar o evento', 'error');
                return;
            }
            onClose && onClose();
        } catch (err) {
            console.error(err);
            Swal.fire('Erro', 'Não foi possível salvar o evento', 'error');
        }
    };

    const handleDelete = async () => {
        if (!onDelete) {
            Swal.fire('Erro', 'Ação de deletar não está disponível', 'error');
            return;
        }

        const result = await Swal.fire({
            title: 'Deletar evento?',
            text: 'Tem certeza que deseja excluir este evento?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sim, deletar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                const r = await onDelete();
                if (r === false) {
                    Swal.fire('Erro', 'Não foi possível deletar o evento', 'error');
                    return;
                }
                onClose && onClose();
            } catch (err) {
                console.error(err);
                Swal.fire('Erro', 'Não foi possível deletar o evento', 'error');
            }
        }
    };
    return (
        <div className="modal">
            <div className="modal-content">
                <span className="close" onClick={onClose}>&times;</span>

                <h2>{isCreate ? 'Criar evento' : 'Editar evento'}</h2>

                <label>Título</label>
                <input value={titulo} onChange={(e) => setTitulo(e.target.value)} />

                <label>Descrição</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} />

                <label>Início</label>
                <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />

                <label>Fim</label>
                <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />

                <label>Cor</label>
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />

                <div style={{ marginTop: 12 }}>
                    <button onClick={handleSave}>{isCreate ? 'Criar' : 'Salvar'}</button>
                    {!isCreate && onDelete && <button onClick={handleDelete} style={{ marginLeft: 8 }}>Deletar</button>}
                    <button onClick={onClose} style={{ marginLeft: 8 }}>Fechar</button>
                </div>
            </div>
        </div>
    );
};

export default EventModal;