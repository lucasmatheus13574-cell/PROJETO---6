import React, { useState, useEffect, useCallback, useRef } from 'react';
import moment from 'moment';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import 'sweetalert2/dist/sweetalert2.min.css';
import '../styles/Calendarios.css';
import Swal from 'sweetalert2';


import EventModal from './componentes/EventModal';

const DragAndDropCalendar = withDragAndDrop(Calendar);
const localizer = momentLocalizer(moment);

function Calendario() {
    const URL_API = import.meta.env.VITE_API_URL;
    const token = localStorage.getItem("token");

    const [eventos, setEventos] = useState([]);
    const [eventoSelecionado, setEventoSelecionado] = useState(null);
    const rangeRef = useRef({ start: null, end: null });

    const mapRowToEvent = (row) => ({
        id: row.id,
        title: row.titulo,
        start: moment.parseZone(row.start_date_time).toDate(),
        end: moment.parseZone(row.end_date_time).toDate(),
        description: row.description,
        location: row.location,
        color: row.color
    });


    const fetchEvents = useCallback(async (startDate, endDate) => {
        if (!token) {
            console.warn('Nenhum token encontrado; ignorando fetch de eventos.');
            return;
        }


        if (!URL_API || !(URL_API.startsWith('http://') || URL_API.startsWith('https://'))) {
            console.error('VITE_API_URL inválida ou sem protocolo:', URL_API);
            Swal.fire('Erro', 'URL da API inválida. Verifique VITE_API_URL no arquivo de ambiente.', 'error');
            return;
        }

        try {
            const params = new URLSearchParams();
            if (startDate) params.append('start', startDate);
            if (endDate) params.append('end', endDate);

            const url = `${URL_API}/eventos?${params.toString()}`;
            const res = await fetch(url, {
                headers: { 'authorization': `Bearer ${token}` }
            });

            if (!res.ok) {
                const bodyText = await res.text().catch(() => null);
                console.error('Erro ao buscar eventos:', res.status, bodyText, url);
                Swal.fire('Erro', `Erro ao buscar eventos (status ${res.status})`, 'error');
                return;
            }

            const data = await res.json();
            setEventos(data.map(mapRowToEvent));
        } catch (err) {
            console.error('Erro na requisição de eventos:', err);
            Swal.fire('Erro', 'Não foi possível carregar os eventos', 'error');
        }
    }, [URL_API, token]);

    useEffect(() => {

        const start = moment().utc().startOf('month').toISOString();
        const end = moment().utc().endOf('month').toISOString();
        rangeRef.current = { start, end };
        fetchEvents(start, end);
    }, [fetchEvents]);

    const handleRangeChange = (range) => {
        let start, end;
        if (Array.isArray(range)) {
            start = moment(range[0]).utc().startOf('day').toISOString();
            end = moment(range[range.length - 1]).utc().endOf('day').toISOString();
        } else if (range.start && range.end) {
            start = moment(range.start).utc().startOf('day').toISOString();
            end = moment(range.end).utc().endOf('day').toISOString();
        } else {
            start = moment().utc().startOf('month').toISOString();
            end = moment().utc().endOf('month').toISOString();
        }
        rangeRef.current = { start, end };
        fetchEvents(start, end);
    };

    const openCreateModal = ({ start, end }) => {
        setEventoSelecionado({
            mode: 'create',
            start,
            end,
            titulo: '',
            description: '',
            color: '#3788d8'
        });
    };

    const handleEventClick = (event) => {
        setEventoSelecionado({ mode: 'edit', ...event });
    }

    const handleEventClose = () => {
        setEventoSelecionado(null);
    }

    const createEvent = async (payload) => {
        try {
            // ensure payload timestamps are UTC ISO
            payload.start_date_time = moment(payload.start_date_time).utc().toISOString();
            payload.end_date_time = moment(payload.end_date_time).utc().toISOString();

            const res = await fetch(`${URL_API}/eventos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error('Erro ao criar evento');
            const data = await res.json();
            Swal.fire('Criado', 'Evento criado com sucesso', 'success');
            // atualizar lista
            fetchEvents(rangeRef.current.start, rangeRef.current.end);
            setEventoSelecionado(null);
            return data;
        } catch (err) {
            console.error(err);
            Swal.fire('Erro', 'Não foi possível criar o evento', 'error');
        }
    };

    const updateEvent = async (id, payload) => {
        try {
            // ensure payload timestamps are UTC ISO
            payload.start_date_time = moment(payload.start_date_time).utc().toISOString();
            payload.end_date_time = moment(payload.end_date_time).utc().toISOString();

            const res = await fetch(`${URL_API}/eventos/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error('Erro ao atualizar evento');
            const data = await res.json();
            Swal.fire('Atualizado', 'Evento atualizado com sucesso', 'success');
            fetchEvents(rangeRef.current.start, rangeRef.current.end);
            setEventoSelecionado(null);
            return data;
        } catch (err) {
            console.error(err);
            Swal.fire('Erro', 'Não foi possível atualizar o evento', 'error');
        }
    };

    const deleteEvent = async (id) => {
        try {
            const res = await fetch(`${URL_API}/eventos/${id}`, {
                method: 'DELETE',
                headers: { 'authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Erro ao deletar evento');
            Swal.fire('Deletado', 'Evento deletado com sucesso', 'success');
            fetchEvents(rangeRef.current.start, rangeRef.current.end);
            setEventoSelecionado(null);
            return true;
        } catch (err) {
            console.error(err);
            Swal.fire('Erro', 'Não foi possível deletar o evento', 'error');
            return false;
        }
    };

    const MoverEvent = async (data) => {
        const { event, start, end } = data;
        // enviar atualização para a API (UTC)
        const payload = {
            titulo: event.title,
            start_date_time: moment(start).utc().toISOString(),
            end_date_time: moment(end).utc().toISOString(),
            description: event.description || '',
            color: event.color || '#3788d8'
        };
        await updateEvent(event.id, payload);
    };

    const eventPropGetter = (event) => ({
        style: { backgroundColor: event.color || '#3788d8', borderRadius: '4px', color: 'white' }
    });

    const EventTooltip = ({ event }) => (
        <div>
            <strong>{event.title}</strong>
            {event.location && <div>{event.location}</div>}
            <div>
                {moment(event.start).format('HH:mm')} - {moment(event.end).format('HH:mm')}
            </div>
        </div>
    );



    return (
        <div>
            <DragAndDropCalendar
                defaultDate={moment().toDate()}
                defaultView="month"
                events={eventos}
                localizer={localizer}
                resizable
                onEventDrop={MoverEvent}
                onEventResize={MoverEvent}
                onSelectEvent={handleEventClick}
                onRangeChange={handleRangeChange}
                selectable
                onSelectSlot={(slotInfo) => openCreateModal(slotInfo)}
                eventPropGetter={eventPropGetter}
                components={{ event: EventTooltip }}
                className="calendar"
            />

            {eventoSelecionado && (
                <EventModal
                    evento={eventoSelecionado}
                    onClose={handleEventClose}
                    onSave={eventoSelecionado.mode === 'create' ? createEvent : (payload) => updateEvent(eventoSelecionado.id, payload)}
                    onDelete={eventoSelecionado.mode === 'edit' ? () => deleteEvent(eventoSelecionado.id) : null}
                />
            )}
        </div>
    )
}

export default Calendario;