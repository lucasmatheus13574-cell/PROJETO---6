import React, { useState, useEffect, useCallback, useRef, useContext } from 'react';
import ptBR from 'date-fns/locale/pt-BR';

import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import 'sweetalert2/dist/sweetalert2.min.css';
import '../styles/Calendarios.css';
import Swal from 'sweetalert2';
import { FilterContext } from '../context/FilterContextValue';


import CustomToolbar from './componentes/CustomToobar';
import EventModal from './componentes/EventModal';
import CalendarYearView from './componentes/CalendarYearView';
import { CalendarContext } from '../context/CalendarContext';
import '../styles/CalendarYear.css';
import {
    format,
    parseISO,
    startOfDay,
    endOfDay,
    startOfMonth,
    endOfMonth,
    isSameDay,
    startOfWeek,
    getDay
} from 'date-fns';

const locales = {
    'pt-BR': ptBR,
};

const localizer = dateFnsLocalizer({
    format,
    parse: parseISO,
    startOfWeek: (date) => startOfWeek(date, { locale: ptBR }),
    getDay,
    locales,
});




const CustomWeekdayHeader = ({ date }) => {
    return (
        <span>
            {format(date, 'EEEE', { locale: ptBR })}
        </span>
    );
};


const DragAndDropCalendar = withDragAndDrop(Calendar);

function Calendario() {
    const URL_API = import.meta.env.VITE_API_URL;
    const token = localStorage.getItem("token");

    const [eventos, setEventos] = useState([]);
    const [eventoSelecionado, setEventoSelecionado] = useState(null);
    const rangeRef = useRef({ start: null, end: null });
    const { showEvents, showTasks } = useContext(FilterContext);
    const { currentDate: ctxCurrentDate, setCurrentDate: ctxSetCurrentDate, view: ctxView, setView: ctxSetView, showYearView: ctxShowYearView, setShowYearView: ctxSetShowYearView, year: ctxYear, setYear: ctxSetYear, visibleCalendars } = useContext(CalendarContext);



    const mapRowToEvent = (row) => ({
        id: row.id,
        title: row.titulo || row.tarefa,
        start: row.start_date_time
            ? parseISO(row.start_date_time)
            : (row.data ? startOfDay(parseISO(row.data)) : new Date()),

        end: row.end_date_time
            ? parseISO(row.end_date_time)
            : (row.data ? endOfDay(parseISO(row.data)) : new Date()),

        description: row.description || '',
        location: row.location || '',
        color: row.color || '#3788d8',
        tipo: row.tarefa ? 'tarefa' : 'evento',
        prioridade: row.prioridade,
        allDay: !!(row.allday || row.allDay)
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

            const urlEvents = `${URL_API}/eventos?${params.toString()}`;
            const resEvents = await fetch(urlEvents, { headers: { 'authorization': `Bearer ${token}` } });
            if (!resEvents.ok) throw new Error('Erro ao buscar eventos');
            const eventsData = await resEvents.json();


            const resTasks = await fetch(`${URL_API}/tarefas`, { headers: { 'authorization': `Bearer ${token}` } });
            if (!resTasks.ok) throw new Error('Erro ao buscar tarefas');
            const tasksData = await resTasks.json();

            const mappedEvents = eventsData
                .filter(e => !e.calendar_id || visibleCalendars.includes(e.calendar_id))
                .map(mapRowToEvent);
            const mappedTasks = tasksData.map((t) => ({
                id: t.id,
                title: t.tarefa,
                start: t.data ? startOfDay(parseISO(t.data)) : new Date(),
                end: t.data ? endOfDay(parseISO(t.data)) : new Date(),
                description: '',
                color: '#0d6efd',
                tipo: 'tarefa',
                prioridade: t.prioridade,
                concluida: t.concluida,
                allDay: !!t.allday,
                raw: t
            }));


            let combined = [];
            if (showEvents) combined = combined.concat(mappedEvents);
            if (showTasks) combined = combined.concat(mappedTasks);

            combined.sort((a, b) => {
                const aDay = startOfDay(a.start).getTime();
                const bDay = startOfDay(b.start).getTime();

                if (aDay !== bDay) return aDay - bDay;
                const aAll = a.raw && a.raw.allday;
                const bAll = b.raw && b.raw.allday;
                if (aAll && !bAll) return -1;
                if (!aAll && bAll) return 1;
                return 0;
            });

            setEventos(combined);
        } catch (err) {
            console.error('Erro na requisição de eventos/tarefas:', err);
            Swal.fire('Erro', 'Não foi possível carregar os itens', 'error');
        }
    }, [URL_API, token, showEvents, showTasks, visibleCalendars]);

    useEffect(() => {
        const start = startOfMonth(new Date()).toISOString();
        const end = endOfMonth(new Date()).toISOString();

        rangeRef.current = { start, end };
        fetchEvents(start, end);
    }, [fetchEvents]);

    useEffect(() => {
        const start = startOfMonth(ctxCurrentDate).toISOString();
        const end = endOfMonth(ctxCurrentDate).toISOString();

        rangeRef.current = { start, end };
        fetchEvents(start, end);
    }, [ctxCurrentDate, fetchEvents]);
    useEffect(() => {

        const { start, end } = rangeRef.current;
        fetchEvents(start, end);
    }, [showEvents, showTasks, fetchEvents]);

    const handleRangeChange = (range) => {
        let start, end;

        if (Array.isArray(range)) {
            start = startOfDay(range[0]).toISOString();
            end = endOfDay(range[range.length - 1]).toISOString();
        } else if (range?.start && range?.end) {
            start = startOfDay(range.start).toISOString();
            end = endOfDay(range.end).toISOString();
        } else {
            start = startOfMonth(new Date()).toISOString();
            end = endOfMonth(new Date()).toISOString();
        }

        rangeRef.current = { start, end };
        fetchEvents(start, end);
    };


    const openCreateModal = ({ start, end }) => {
        setEventoSelecionado({
            mode: 'create',
            tipo: 'evento',
            start,
            end,
            titulo: '',
            description: '',
            color: '#3788d8'
        });
    };

    const prevYear = () => ctxSetYear((y) => y - 1);
    const nextYear = () => ctxSetYear((y) => y + 1);
    const selectMonth = (monthIndex) => {
        const date = new Date(ctxYear, monthIndex, 1);

        ctxSetCurrentDate(date);
        ctxSetShowYearView(false);

        const start = startOfMonth(date).toISOString();
        const end = endOfMonth(date).toISOString();

        rangeRef.current = { start, end };
        fetchEvents(start, end);
    };


    const handleEventClick = (event) => {

        setEventoSelecionado({ mode: 'edit', ...event });
    }

    const handleEventClose = () => {
        setEventoSelecionado(null);
    }

    const createItem = async (payload, tipo) => {
        try {
            if (tipo === 'evento') {

                payload.start_date_time = new Date(payload.start_date_time).toISOString();
                payload.end_date_time = new Date(payload.end_date_time).toISOString();


                const res = await fetch(`${URL_API}/eventos`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                });
                if (!res.ok) throw new Error('Erro ao criar evento');
                await res.json();
                Swal.fire('Criado', 'Evento criado com sucesso', 'success');
            } else {
                const res = await fetch(`${URL_API}/tarefas`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                });
                if (!res.ok) throw new Error('Erro ao criar tarefa');
                await res.json();
                Swal.fire('Criado', 'Tarefa criada com sucesso', 'success');
            }

            fetchEvents(rangeRef.current.start, rangeRef.current.end);
            setEventoSelecionado(null);
            return true;
        } catch (err) {
            console.error(err);
            Swal.fire('Erro', 'Não foi possível criar o item', 'error');
            return false;
        }
    };

    const updateItem = async (id, payload, tipo) => {
        try {
            if (tipo === 'evento') {
                payload.start_date_time = new Date(payload.start_date_time).toISOString();
                payload.end_date_time = new Date(payload.end_date_time).toISOString();

                const res = await fetch(`${URL_API}/eventos/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                });
                if (!res.ok) throw new Error('Erro ao atualizar evento');
                Swal.fire('Atualizado', 'Evento atualizado com sucesso', 'success');
            } else {
                const res = await fetch(`${URL_API}/tarefas/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                });
                if (!res.ok) throw new Error('Erro ao atualizar tarefa');
                Swal.fire('Atualizado', 'Tarefa atualizada com sucesso', 'success');
            }

            fetchEvents(rangeRef.current.start, rangeRef.current.end);
            setEventoSelecionado(null);
            return true;
        } catch (err) {
            console.error(err);
            Swal.fire('Erro', 'Não foi possível atualizar o item', 'error');
            return false;
        }
    };

    const deleteItem = async (id, tipo) => {
        try {
            if (tipo === 'evento') {
                const res = await fetch(`${URL_API}/eventos/${id}`, {
                    method: 'DELETE',
                    headers: { 'authorization': `Bearer ${token}` }
                });
                if (!res.ok) throw new Error('Erro ao deletar evento');
                Swal.fire('Deletado', 'Evento deletado com sucesso', 'success');
            } else {
                const res = await fetch(`${URL_API}/tarefas/${id}`, {
                    method: 'DELETE',
                    headers: { 'authorization': `Bearer ${token}` }
                });
                if (!res.ok) throw new Error('Erro ao deletar tarefa');
                Swal.fire('Deletado', 'Tarefa deletada com sucesso', 'success');
            }

            fetchEvents(rangeRef.current.start, rangeRef.current.end);
            setEventoSelecionado(null);
            return true;
        } catch (err) {
            console.error(err);
            Swal.fire('Erro', 'Não foi possível deletar o item', 'error');
            return false;
        }
    };

    const concludeItem = async (id, tipo) => {
        if (tipo !== 'tarefa') return false;
        try {
            const res = await fetch(`${URL_API}/tarefas/concluir/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Erro ao concluir tarefa');
            await res.json();
            Swal.fire('Concluído', 'Tarefa marcada como concluída', 'success');
            fetchEvents(rangeRef.current.start, rangeRef.current.end);
            setEventoSelecionado(null);
            return true;
        } catch (err) {
            console.error(err);
            Swal.fire('Erro', 'Não foi possível concluir a tarefa', 'error');
            return false;
        }
    };

    const MoverEvent = async (data) => {
        const { event, start, end } = data;
        if (event.tipo === 'tarefa') {
            // Update tarefa - change date
            const payload = {
                tarefa: event.title,
                data: format(start, 'yyyy-MM-dd'),
                prioridade: event.prioridade || 'baixa'
            };
            await updateItem(event.id, payload, 'tarefa');
        } else {
            const payload = {
                titulo: event.title,
                start_date_time: new Date(start).toISOString(),
                end_date_time: new Date(end).toISOString(),
                description: event.description || '',
                color: event.color || '#3788d8'
            };
            await updateItem(event.id, payload, 'evento');
        }
    };

    const eventPropGetter = (event) => {
        const isTask = event.tipo === 'tarefa';
        const isConcluded = event.concluida === 1 || (event.raw && event.raw.concluida === 1);
        const background = isTask ? (isConcluded ? '#83b5ff' : (event.color || '#0d6efd')) : (event.color || '#3788d8');
        const style = { backgroundColor: background, borderRadius: '4px', color: 'white' };
        if (isConcluded) style.opacity = 0.7;
        if (isTask && isConcluded) style.textDecoration = 'line-through';
        return { style };
    };

    const EventTooltip = ({ event }) => (
        <div>
            <strong>{event.title}</strong>
            {event.location && <div>{event.location}</div>}
            <div>
                {format(event.start, 'HH:mm')} - {format(event.end, 'HH:mm')}

            </div>
        </div>
    );





    console.log(
        format(new Date(), 'EEEE, MMMM', { locale: ptBR })
    );



    return (




        <div className="calendar-page">


            <div className="calendar-container">


                <div className='calendar-wrapper'>

                    {ctxShowYearView ? (
                        <CalendarYearView
                            year={ctxYear}
                            onPrevYear={prevYear}
                            onNextYear={nextYear}
                            onSelectMonth={selectMonth}
                            onClose={() => ctxSetShowYearView(false)}
                            onDayClick={async (date) => {

                                try {
                                    const start = endOfDay(new Date(date).utc().startOf('day').toISOString());
                                    const end = startOfDay(new Date(date).utc().endOf('day').toISOString());

                                    const urlEvents = `${URL_API}/eventos?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`;
                                    const resEvents = await fetch(urlEvents, { headers: { 'authorization': `Bearer ${token}` } });
                                    const eventsData = resEvents.ok ? await resEvents.json() : [];

                                    const resTasks = await fetch(`${URL_API}/tarefas`, { headers: { 'authorization': `Bearer ${token}` } });
                                    const tasksData = resTasks.ok ? await resTasks.json() : [];
                                    const tasksForDay = tasksData.filter(t => t.data && isSameDay(parseISO(t.data), date))


                                    const items = [];
                                    (eventsData || []).forEach(ev => items.push({ type: 'evento', title: ev.titulo || ev.title, start: ev.start_date_time, end: ev.end_date_time }));
                                    tasksForDay.forEach(t => items.push({ type: 'tarefa', title: t.tarefa, start: t.data, end: t.data }));

                                    let html = '<div style="text-align:left">';
                                    if (items.length === 0) html += '<div>Nenhum evento ou tarefa neste dia.</div>';
                                    else {
                                        html += '<ul style="padding-left:16px;">';
                                        items.forEach(it => {
                                            if (it.type === 'evento') {
                                                const time = it.start ? format(parseISO(it.start), 'HH:mm', { locale: ptBR }) + ' - ' + format(parseISO(it.end), 'HH:mm', { locale: ptBR }) : '';
                                                html += `<li><strong>${time}</strong> ${it.title}</li>`;
                                            } else {
                                                html += `<li><strong>Tarefa</strong> ${it.title}</li>`;
                                            }
                                        });
                                        html += '</ul>';
                                    }
                                    html += '</div>';

                                    const { isConfirmed } = await Swal.fire({
                                        title: format(date, "EEEE, d 'de' MMMM yyyy", { locale: ptBR }),
                                        html,
                                        showCancelButton: true,
                                        confirmButtonText: 'Abrir dia',
                                        cancelButtonText: 'Fechar',
                                        width: 520
                                    });

                                    if (isConfirmed) {
                                        ctxSetCurrentDate(date);
                                        ctxSetShowYearView(false);
                                        ctxSetView('day');

                                        const s = startOfMonth(date).toISOString();
                                        const e = endOfMonth(date).toISOString();

                                        rangeRef.current = { start: s, end: e };
                                        fetchEvents(s, e);
                                    }

                                } catch (err) {
                                    console.error('Erro ao carregar dia:', err);
                                    Swal.fire('Erro', 'Não foi possível carregar os itens desse dia', 'error');
                                }
                            }}
                        />
                ) : (
                    <DragAndDropCalendar
                    date={ctxCurrentDate}
                    view={ctxView}
                    onView={(v) => ctxSetView(v)}
                    onNavigate={(date) => { ctxSetCurrentDate(date); const s = startOfMonth(date).toISOString(); const e = endOfMonth(date).toISOString(); rangeRef.current = { start: s, end: e }; fetchEvents(s, e); }}
                    defaultView="month"
                    views={['month', 'week', 'day']}
                    events={eventos}
                    localizer={localizer}
                    messages={messages}
                    resizable
                    onEventDrop={MoverEvent}
                    onEventResize={MoverEvent}
                    onSelectEvent={handleEventClick}
                    onRangeChange={handleRangeChange}
                    selectable
                    onSelectSlot={(slotInfo) => openCreateModal(slotInfo)}
                    eventPropGetter={eventPropGetter}
                    formats={{

                        weekdayFormat: (date) => {
                            const s = format(date, 'EEEE', { locale: ptBR });
                            return s.charAt(0).toUpperCase() + s.slice(1);
                        },

                        dayHeaderFormat: (date) => {
                            const s = format(date, "EEEE d", { locale: ptBR });
                            return s.charAt(0).toUpperCase() + s.slice(1);
                        },

                        dayFormat: (date) => {
                            const s = format(date, "EEEE d", { locale: ptBR });
                            return s.charAt(0).toUpperCase() + s.slice(1);
                        }
                    }}
                    components={{
                        month: { header: CustomWeekdayHeader },
                        toolbar: CustomToolbar,
                        event: EventTooltip
                    }}
                    className="calendar"
                />
                )}
                </div>

            {eventoSelecionado && (
                <EventModal
                    evento={eventoSelecionado}
                    onClose={handleEventClose}
                    onSave={eventoSelecionado.mode === 'create' ? createItem : (payload, tipo, id) => updateItem(id || eventoSelecionado.id, payload, tipo || eventoSelecionado.tipo)}
                    onDelete={eventoSelecionado.mode === 'edit' ? (id, tipo) => deleteItem(id || eventoSelecionado.id, tipo || eventoSelecionado.tipo) : null}
                    onConclude={eventoSelecionado.mode === 'edit' ? (id, tipo) => concludeItem(id || eventoSelecionado.id, tipo || eventoSelecionado.tipo) : null}
                />
            )}
        </div>
    </div>
    );
}

export default Calendario;