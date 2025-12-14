import React, { useState, useEffect } from 'react';
import moment from 'moment';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';

import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import '../styles/Components-Calendario-css.css';

import EventModal from './componentes/EventModal';
import Adicionar from './componentes/Adicionar';
import CustomToolbar from './componentes/CustomToolbar';
import FiltroAtividades from './componentes/FiltroAtividas';
import AddEventModal from './componentes/AddEventModal';

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


    const eventStyle = (event) => ({
        style: {
            backgroundColor: event.color || '#3174ad',
            borderRadius: '8px',
            border: 'none',
            color: '#fff',
        },
    });

    /* =========================
       MOVER / REDIMENSIONAR EVENTO
    ========================== */
    const moverEventos = ({ event, start, end }) => {
        const updatedEvents = eventos.map((e) =>
            e.id === event.id
                ? { ...e, start: new Date(start), end: new Date(end) }
                : e
        );

        setEventos(updatedEvents);
        setEventosFiltrados(updatedEvents);
    };

    /* =========================
       BUSCAR EVENTOS DA API
    ========================== */
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await fetch(`${URL_API}/events`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        authorization: `Bearer ${token}`,
                    },
                });

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
                }));

                setEventos(mapped);
                setEventosFiltrados(mapped);
            } catch (err) {
                console.error('Erro ao buscar eventos:', err);
            }
        };

        fetchEvents();
    }, [URL_API, token]);

    /* =========================
       HANDLERS
    ========================== */
    const handleEventClick = (evento) => {
        setEventoSelecionado(evento);
    };

    const handleEventClose = () => {
        setEventoSelecionado(null);
    };

    const handleAdicionar = (novoEvento) => {
        setEventos((prev) => {
            const updated = [...prev, { ...novoEvento, id: prev.length + 1 }];
            setEventosFiltrados(updated);
            return updated;
        });
    };

    const handleEventDelete = (eventId) => {
        const updated = eventos.filter((event) => event.id !== eventId);
        setEventos(updated);
        setEventosFiltrados(updated);
        setEventoSelecionado(null);
    };

    const handleEventUpdate = (updatedEvent) => {
        const updated = eventos.map((event) =>
            event.id === updatedEvent.id ? updatedEvent : event
        );
        setEventos(updated);
        setEventosFiltrados(updated);
        setEventoSelecionado(null);
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

            if (!res.ok) {
                const err = await res
                    .json()
                    .catch(() => ({ message: res.statusText }));
                alert(err.message || 'Erro ao criar evento');
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
            alert('Erro de conexão ao criar evento');
        }
    };

    /* =========================
       RENDER
    ========================== */
    return (
        <div className="tela">
            <div
                className="toolbar p-4"
                style={{ maxHeight: '100vh', overflowY: 'auto' }}
            >
                <Adicionar onAdicionar={handleAdicionar} />

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
                    events={eventosFiltrados || []}
                    localizer={localizer}
                    resizable
                    onEventDrop={moverEventos}
                    onEventResize={moverEventos}
                    onSelectEvent={handleEventClick}
                    onSelectSlot={handleSelectSlot}
                    eventPropGetter={eventStyle}
                    components={{ toolbar: CustomToolbar }}
                    className="calendar"
                />
            </div>

            {eventoSelecionado && (
                <EventModal
                    evento={eventoSelecionado}
                    onClose={handleEventClose}
                    onDelete={handleEventDelete}
                    onUpdate={handleEventUpdate}
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
