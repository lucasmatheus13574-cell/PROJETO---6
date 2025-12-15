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

    // Atualiza localStorage para persistir alteração imediata
    try {
        const toSave = updatedEvents.map(ev => ({ id: ev.id, titulo: ev.title, dataInicio: ev.start.toISOString(), dataFim: ev.end.toISOString(), descricao: ev.desc || '', tipo: ev.tipo || '', color: ev.color }));
        localStorage.setItem('events', JSON.stringify(toSave));
    } catch (err) {
        console.error('Erro ao atualizar events no localStorage:', err);
    }

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
        console.error('Erro ao salvar movimentação:', err);
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

            const normalize = (rows) => rows.map((e) => ({
                id: e.id,
                title: e.titulo || 'Sem título',
                start: e.dataInicio ? new Date(e.dataInicio) : new Date(),
                end: e.dataFim ? new Date(e.dataFim) : new Date(),
                desc: e.descricao || '',
                color: e.color,
                tipo: e.tipo || '',
            }));

            const mapped = normalize(lista);

            // Atualiza cópia local para persistir entre reloads
            try { localStorage.setItem('events', JSON.stringify(lista)); } catch (err) { console.error('Erro ao salvar eventos no localStorage:', err); }

            setEventos(mapped);
            setEventosFiltrados(mapped);
            console.debug('fetchEvents ->', mapped.map(ev => ({ id: ev.id, title: ev.title })));
            return mapped;
        } catch (err) {
            console.error('Erro ao buscar eventos:', err);
            return [];
        }
    }, [URL_API, token]);

    useEffect(() => {
        // Carrega eventos salvos no localStorage imediatamente (para não desaparecerem no refresh)
        try {
            const saved = localStorage.getItem('events');
            if (saved) {
                const parsed = JSON.parse(saved);
                const normalized = parsed.map((e) => ({
                    id: e.id,
                    title: e.titulo || 'Sem título',
                    start: e.dataInicio ? new Date(e.dataInicio) : new Date(),
                    end: e.dataFim ? new Date(e.dataFim) : new Date(),
                    desc: e.descricao || '',
                    color: e.color,
                    tipo: e.tipo || '',
                }));
                setEventos(normalized);
                setEventosFiltrados(normalized);
            }
        } catch (err) {
            console.error('Erro ao ler eventos do localStorage:', err);
        }

        // Atualiza com os eventos do servidor
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
            await fetchEvents();    
        } catch (err) {
            console.error('Erro ao atualizar evento:', err);
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
            await fetchEvents();
        } catch (err) {
            console.error('Erro ao deletar evento:', err);
        }
    };

    const handleSelecionarAtividades = (atividadesSelecionadas) => {
        setEventosFiltrados(atividadesSelecionadas || []);
    };

    const handleSelectSlot = ({ start, end }) => {
        const defaultEnd = end || new Date(new Date(start).getTime() + 60 * 60 * 1000);

        setSelectedSlot({ start, end: defaultEnd });
        setShowAddModal(true);
    };

    const handleCreate = async ({ title, desc, tipo, start, end }) => {
        try {
            const horario = new Date(start).toTimeString().slice(0, 5);

            const body = {
                horario,
                titulo: title,
                dataInicio: start,
                dataFim: end,
                descricao: desc,
                tipo: tipo || ''
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
                id: created.id || created.evento?.id || created.rows?.[0]?.id || Math.random(),
                title: created.titulo || title,
                start: new Date(created.dataInicio || start),
                end: new Date(created.dataFim || end),
                desc: created.descricao || desc,
                tipo: created.tipo || tipo || ''
            };

            setEventos((prev) => {
                const updated = [...prev, newEvent];
                console.debug('Optimistic add ->', newEvent);
                return updated;
            });

            const fresh = await fetchEvents();
            const existsOnServer = fresh.some(f => String(f.id) === String(created.id));
            if (!existsOnServer) {
                console.warn('Evento criado não apareceu no servidor após POST', created);
                Swal.fire({ icon: 'warning', text: 'Evento criado localmente, mas não encontrado no servidor. Tente novamente.' });
            }

            setShowAddModal(false);
            setSelectedSlot(null);
        } catch (err) {
            console.error('Erro ao criar evento:', err);
            Swal.fire({ icon: 'error', text: 'Erro de conexão ao criar evento' });
        }
    };

    return (
        <div className="tela">
            <div className="toolbar p-4" style={{ maxHeight: '100vh', overflowY: 'auto' }}>
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
                    views={['month', 'week', 'day']}
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
                        ),
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
