import React, { useState, useEffect, useCallback, useRef, useContext } from 'react';
import moment from 'moment';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import 'moment/locale/pt-br';
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


moment.locale('pt-br');

const CustomWeekdayHeader = ({ date, localizer }) => {
    return (
        <span>
            {localizer.format(date, 'dddd', 'pt-br')}
        </span>
    );
};


const DragAndDropCalendar = withDragAndDrop(Calendar);
const localizer = momentLocalizer(moment);

function Calendario() {
    const URL_API = import.meta.env.VITE_API_URL;
    const token = localStorage.getItem("token");

    const [eventos, setEventos] = useState([]);
    const [eventoSelecionado, setEventoSelecionado] = useState(null);
    const rangeRef = useRef({ start: null, end: null });
    const { showEvents, showTasks } = useContext(FilterContext);


    const messages = {
        allDay: 'Dia inteiro',
        previous: 'Anterior',
        next: 'Próximo',
        today: 'Hoje',
        month: 'Mês',
        week: 'Semana',
        work_week: 'Semana útil',
        day: 'Dia',
        agenda: 'Agenda',
        date: 'Data',
        time: 'Hora',
        event: 'Evento',
        noEventsInRange: 'Nenhum evento neste período',
        showMore: total => `+ Ver mais (${total})`,
    };

    // view controls from CalendarContext
    const { currentDate, setCurrentDate, view, setView, showYearView, setShowYearView, year, setYear } = useContext(CalendarContext);


    const formats = {
        weekdayFormat: (date, culture, localizer) =>
            localizer.format(date, 'ddd', culture),
    };


    const mapRowToEvent = (row) => ({
        id: row.id,
        title: row.titulo || row.tarefa,
        start: row.start_date_time ? moment.parseZone(row.start_date_time).toDate() : (row.data ? moment(row.data).startOf('day').toDate() : new Date()),
        end: row.end_date_time ? moment.parseZone(row.end_date_time).toDate() : (row.data ? moment(row.data).endOf('day').toDate() : new Date()),
        description: row.description || '',
        location: row.location || '',
        color: row.color || '#3788d8',
        tipo: row.tarefa ? 'tarefa' : 'evento',
        prioridade: row.prioridade
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
            // fetch eventos
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

            const mappedEvents = eventsData.map(mapRowToEvent);
            const mappedTasks = tasksData.map((t) => ({
                id: t.id,
                title: t.tarefa,
                start: t.data ? moment(t.data).startOf('day').toDate() : new Date(),
                end: t.data ? moment(t.data).endOf('day').toDate() : new Date(),
                description: '',
                color: '#0d6efd',
                tipo: 'tarefa',
                prioridade: t.prioridade,
                concluida: t.concluida,
                raw: t
            }));


            let combined = [];
            if (showEvents) combined = combined.concat(mappedEvents);
            if (showTasks) combined = combined.concat(mappedTasks);

            setEventos(combined);
        } catch (err) {
            console.error('Erro na requisição de eventos/tarefas:', err);
            Swal.fire('Erro', 'Não foi possível carregar os itens', 'error');
        }
    }, [URL_API, token, showEvents, showTasks]);

    useEffect(() => {
        const start = moment().utc().startOf('month').toISOString();
        const end = moment().utc().endOf('month').toISOString();
        rangeRef.current = { start, end };
        fetchEvents(start, end);
    }, [fetchEvents]);

    // Refetch when currentDate changes (e.g., via mini calendar or navigation)
    useEffect(() => {
        const start = moment(currentDate).utc().startOf('month').toISOString();
        const end = moment(currentDate).utc().endOf('month').toISOString();
        rangeRef.current = { start, end };
        fetchEvents(start, end);
    }, [currentDate, fetchEvents]);
    useEffect(() => {

        const { start, end } = rangeRef.current;
        fetchEvents(start, end);
    }, [showEvents, showTasks, fetchEvents]);

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
            tipo: 'evento',
            start,
            end,
            titulo: '',
            description: '',
            color: '#3788d8'
        });
    };

    const prevYear = () => setYear((y) => y - 1);
    const nextYear = () => setYear((y) => y + 1);
    const selectMonth = (monthIndex) => {
        const d = moment({ year, month: monthIndex, day: 1 }).toDate();
        setCurrentDate(d);
        setShowYearView(false);

        const start = moment(d).utc().startOf('month').toISOString();
        const end = moment(d).utc().endOf('month').toISOString();
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
                data: moment(start).format('YYYY-MM-DD'),
                prioridade: event.prioridade || 'baixa'
            };
            await updateItem(event.id, payload, 'tarefa');
        } else {
            const payload = {
                titulo: event.title,
                start_date_time: moment(start).utc().toISOString(),
                end_date_time: moment(end).utc().toISOString(),
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
                {moment(event.start).format('HH:mm')} - {moment(event.end).format('HH:mm')}
            </div>
        </div>
    );







    return (




        <div className="calendar-page">


            <div className="calendar-container">



                {showYearView ? (
                    <CalendarYearView
                        year={year}
                        onPrevYear={prevYear}
                        onNextYear={nextYear}
                        onSelectMonth={selectMonth}
                        onClose={() => setShowYearView(false)}
                    />
                ) : (
                    <DragAndDropCalendar
                        date={currentDate}
                        view={view}
                        onView={(v) => setView(v)}
                        onNavigate={(date) => { setCurrentDate(date); const s = moment(date).utc().startOf('month').toISOString(); const e = moment(date).utc().endOf('month').toISOString(); rangeRef.current = { start: s, end: e }; fetchEvents(s, e); }}
                        defaultView="month"
                        views={['month', 'week', 'day']}
                        events={eventos}
                        localizer={localizer}
                        culture="pt-br"
                        messages={messages}
                        formats={formats}
                        resizable
                        onEventDrop={MoverEvent}
                        onEventResize={MoverEvent}
                        onSelectEvent={handleEventClick}
                        onRangeChange={handleRangeChange}
                        selectable
                        onSelectSlot={(slotInfo) => openCreateModal(slotInfo)}
                        eventPropGetter={eventPropGetter}
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
    )
}

export default Calendario;