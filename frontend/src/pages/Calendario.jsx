import React, { useState, useEffect, useCallback } from 'react';
import moment from 'moment';
import 'moment/locale/pt-br';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';

import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import '../styles/Components-Calendario-css.css';

import EventModal from './componentes/EventModal';
import CustomToolbar from './componentes/CustomToolbar';
import FiltroAtividades from './componentes/FiltroAtividas';
import AddEventModal from './componentes/AddEventModal';
import Swal from 'sweetalert2';

const DragAndDropCalendar = withDragAndDrop(Calendar);
const localizer = momentLocalizer(moment);

function Calendario() {
    const [eventos, setEventos] = useState([]);
    const [eventosFiltrados, setEventosFiltrados] = useState([]);
    const [eventoSelecionado, setEventoSelecionado] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState(null);

    const token = localStorage.getItem('token');
    const URL_API = import.meta.env.VITE_API_URL;


    moment.locale('pt-br');

    const messages = {
        allDay: 'Dia inteiro',
        previous: 'Anterior',
        next: 'Próximo',
        today: 'Hoje',
        month: 'Mês',
        Sunday: 'Domingo',
        Monday: 'Segunda',
        Tuesday: 'Terça',
        Wednesday: 'Quarta',
        Thursday: 'Quinta',
        Friday: 'Sexta',
        Saturday: 'Sábado',
        week: 'Semana',
        day: 'Dia',
        agenda: 'Agenda',
        date: 'Data',
        time: 'Horário',
        event: 'Evento',
        noEventsInRange: 'Nenhum evento nesse período.',
        showMore: (total) => `+${total} mais`,
    };

    const eventStyle = (event) => ({
        style: {
            backgroundColor: event.color || '#3174ad',
            borderRadius: '8px',
            border: 'none',
            color: '#fff',
        },
    });


const moverEventos = async ({ event, start, end }) => {
    const updatedEvents = eventos.map((e) =>
        e.id === event.id
            ? { ...e, start: new Date(start), end: new Date(end) }
            : e
    );

    setEventos(updatedEvents);
    setEventosFiltrados(updatedEvents);

    try {
        await fetch(`${URL_API}/events/${event.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                dataInicio: start,
                dataFim: end,
            }),
        });
    } catch (err) {
        console.error('Erro ao salvar drag & drop:', err);
    }
};

    const fetchEvents = useCallback(async () => {
        try {
            const res = await fetch(`${URL_API}/events`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    authorization: `Bearer ${token}`,
                },
            });

            if (res.status === 401) {
                localStorage.removeItem('token');
                window.location.href = '/login';
                return;
            }

            if (!res.ok) return;

            const data = await res.json();

            const lista = Array.isArray(data)
                ? data
                : Array.isArray(data.eventos)
                    ? data.eventos
                    : [];

            const mapped = lista.map((e) => ({
                id: e.id,
                title: e.titulo || 'Sem título',
                start: new Date(e.dataInicio),
                end: new Date(e.dataFim),
                desc: e.descricao || '',
                color: e.color,
                tipo: e.tipo || '',
            }));

            setEventos(mapped);
            setEventosFiltrados(mapped);
        } catch (err) {
            console.error('Erro ao buscar eventos:', err);
        }
    }, [URL_API, token]);

    // fetch events on mount
    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);


    const handleEventClick = (evento) => {
        setEventoSelecionado(evento);
    };

    const handleEventClose = () => {
        setEventoSelecionado(null);
    };



    const handleUpdateEvent = async ({ id, title, desc, tipo, start, end }) => {
        if (!token) return Swal.fire({ icon: 'warning', text: 'Você precisa estar logado' });
        try {
            const res = await fetch(`${URL_API}/events/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
                body: JSON.stringify({ titulo: title, descricao: desc, dataInicio: start, dataFim: end, tipo }),
            });
            if (res.status === 401) {
                localStorage.removeItem('token');
                window.location.href = '/login';
                return;
            }
            if (!res.ok) {
                const err = await res.json().catch(() => ({ message: res.statusText }));
                throw new Error(err.message || 'Erro ao atualizar evento');
            }
            // refresh from server to get authoritative data
            await fetchEvents();
            
        } catch (err) {
            console.error('Erro ao atualizar evento:', err);
            throw err;
        }
    };

    const handleDeleteEvent = async (id) => {
        if (!token) return Swal.fire({ icon: 'warning', text: 'Você precisa estar logado' });
        try {
            const res = await fetch(`${URL_API}/events/${id}`, {
                method: 'DELETE',
                headers: { authorization: `Bearer ${token}` },
            });
            if (res.status === 401) {
                localStorage.removeItem('token');
                window.location.href = '/login';
                return;
            }
            if (!res.ok) {
                const err = await res.json().catch(() => ({ message: res.statusText }));
                throw new Error(err.message || 'Erro ao deletar evento');
            }
            // refresh list from server
            await fetchEvents();
            
            
        } catch (err) {
            console.error('Erro ao deletar evento:', err);
            throw err;
        }
    };




    const handleSelecionarAtividades = (atividadesSelecionadas) => {
        setEventosFiltrados(atividadesSelecionadas || []);
    };

    const handleSelectSlot = ({ start, end }) => {
        const defaultEnd =
            end || new Date(new Date(start).getTime() + 60 * 60 * 1000);

        setSelectedSlot({ start, end: defaultEnd });
        setShowAddModal(true);
    };

    const handleCreate = async ({ title, desc, start, end }) => {
        try {
            const horario = new Date(start).toTimeString().slice(0, 5);

            const body = {
                horario,
                titulo: title,
                dataInicio: start,
                dataFim: end,
                descricao: desc,
            };

            const res = await fetch(`${URL_API}/events`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            });

            if (res.status === 401) {
                localStorage.removeItem('token');
                window.location.href = '/login';
                return;
            }

            if (!res.ok) {
                const err = await res
                    .json()
                    .catch(() => ({ message: res.statusText }));
                Swal.fire({ icon: 'error', text: err.message || 'Erro ao criar evento' });
                return;
            }

            const created = await res.json();

            const newEvent = {
                id:
                    created.id ||
                    created.evento?.id ||
                    created.rows?.[0]?.id ||
                    Math.random(),
                title: created.titulo || title,
                start: new Date(created.dataInicio || start),
                end: new Date(created.dataFim || end),
                desc: created.descricao || desc,
            };

            setEventos((prev) => {
                const updated = [...prev, newEvent];
                setEventosFiltrados(updated);
                return updated;
            });

            setShowAddModal(false);
            setSelectedSlot(null);
        } catch (err) {
            console.error('Erro ao criar evento:', err);
            Swal.fire({ icon: 'error', text: 'Erro de conexão ao criar evento' });
        }
    };


    return (
        <div className="tela">
            <div
                className="toolbar p-4"
                style={{ maxHeight: '100vh', overflowY: 'auto' }}
            >
                <FiltroAtividades
                    atividades={eventos}
                    onSelecionarAtividades={handleSelecionarAtividades}
                />
            </div>

            <div className="calendario">
                <DragAndDropCalendar
                    selectable
                    defaultDate={moment().toDate()}
                    defaultView="month"
                    views={["month", "week", "day"]}
                    events={eventosFiltrados || []}
                    localizer={localizer}
                    resizable
                    onEventDrop={moverEventos}
                    onEventResize={moverEventos}
                    onSelectEvent={handleEventClick}
                    onSelectSlot={handleSelectSlot}
                    eventPropGetter={eventStyle}
                    components={{
                        toolbar: (props) => (
                            <CustomToolbar
                                {...props}
                                onAddEvent={() => {
                                    setSelectedSlot({
                                        start: new Date(),
                                        end: new Date(Date.now() + 60 * 60 * 1000),
                                    });
                                    setShowAddModal(true);
                                }}
                            />
                        )
                    }}

                    messages={messages}
                    className="calendar"
                />
            </div>

            {eventoSelecionado && (
                <EventModal
                    evento={eventoSelecionado}
                    onClose={handleEventClose}
                    onDelete={async (id) => { await handleDeleteEvent(id); handleEventClose(); }}
                    onUpdate={async (edited) => { await handleUpdateEvent({ id: edited.id, title: edited.title, desc: edited.desc, tipo: edited.tipo, start: edited.start.toISOString(), end: edited.end.toISOString() }); handleEventClose(); }}
                />
            )}

            <AddEventModal
                show={showAddModal}
                onClose={() => {
                    setShowAddModal(false);
                    setSelectedSlot(null);
                }}
                defaultStart={selectedSlot?.start}
                defaultEnd={selectedSlot?.end}
                onCreate={handleCreate}
            />
        </div>
    );
}

export default Calendario;