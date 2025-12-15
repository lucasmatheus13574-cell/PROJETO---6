    import React, { useState, useEffect, useCallback } from 'react';
    import moment from 'moment';
    import 'moment/locale/pt-br';
    import { Calendar, momentLocalizer } from 'react-big-calendar';
    import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
    import YearView from './componentes/YearView';

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
        const [createMode, setCreateMode] = useState('event');

        const token = localStorage.getItem('token');
        const URL_API = import.meta.env.VITE_API_URL;

        moment.locale('pt-br');


        const getFirst = (obj, ...keys) => {
            if (!obj) return undefined;
            for (const k of keys) {
                if (obj[k] !== undefined && obj[k] !== null) return obj[k];
            }
            return undefined;
        };

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
                const [resEvents, resTasks] = await Promise.all([
                    fetch(`${URL_API}/events`, { method: 'GET', headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` } }),
                    fetch(`${URL_API}/tarefas`, { method: 'GET', headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` } }),
                ]);

                if (resEvents.status === 401 || resTasks.status === 401) {
                    localStorage.removeItem('token');
                    window.location.href = '/login';
                    return;
                }

                if (!resEvents.ok || !resTasks.ok) return;
                const dataEvents = await resEvents.json().catch(() => []);
                const dataTasks = await resTasks.json().catch(() => []);
                console.debug('fetchEvents raw events:', dataEvents, 'tasks:', dataTasks);


                const eventsList = Array.isArray(dataEvents) ? dataEvents : (Array.isArray(dataEvents.eventos) ? dataEvents.eventos : []);
                const tasksList = Array.isArray(dataTasks) ? dataTasks : (Array.isArray(dataTasks.tarefas) ? dataTasks.tarefas : []);

                const tasksAsEvents = tasksList.map(t => ({ id: `t-${t.id}`, titulo: t.tarefa, dataInicio: t.data, dataFim: t.data, descricao: t.prioridade || '', tipo: 'Tarefa' }));

                const lista = [...eventsList, ...tasksAsEvents];


                let savedRows = [];
                try {
                    const s = localStorage.getItem('events');
                    if (s) savedRows = JSON.parse(s);
                } catch (err) {
                    console.error('Erro ao ler events salvos para merge:', err);
                }

                const tryParse = (val) => {
                    if (!val) return moment.invalid();
                    // try ISO first, then common SQL format, then native Date
                    let m = moment(val, moment.ISO_8601, true);
                    if (!m.isValid()) m = moment(val, 'YYYY-MM-DD HH:mm:ss', true);
                    if (!m.isValid()) m = moment(new Date(val));
                    return m;
                };

                const normalize = (rows) => rows.map((e) => {
                    const startMoment = tryParse(e.dataInicio);
                    const endMoment = tryParse(e.dataFim);

                    let startDate = startMoment.isValid() ? startMoment.toDate() : null;
                    let endDate = endMoment.isValid() ? endMoment.toDate() : null;

                    const saved = savedRows.find(r => String(r.id) === String(e.id));
                    if (saved) {
                        const savedStart = getFirst(saved, 'dataInicio', 'datainicio', 'data_inicio', 'start');
                        const savedEnd = getFirst(saved, 'dataFim', 'datafim', 'data_fim', 'end');
                        if ((!startDate || !endDate) && saved) {
                            if (!startDate && savedStart) startDate = moment(savedStart).isValid() ? moment(savedStart).toDate() : startDate;
                            if (!endDate && savedEnd) endDate = moment(savedEnd).isValid() ? moment(savedEnd).toDate() : endDate;
                        }
                        // prefer saved color if server didn't include it
                        if (!e.color && saved.color) e.color = saved.color;
                    }


                    if (startMoment.isValid() && startMoment.hours && startMoment.hours() === 0 && startMoment.minutes() === 0) {
                        startDate = moment(startMoment).add(12, 'hours').toDate();
                    }
                    if (endMoment.isValid() && endMoment.hours && endMoment.hours() === 0 && endMoment.minutes() === 0) {
                        endDate = moment(endMoment).add(13, 'hours').toDate();
                    }

                    if (!startDate || !endDate) console.warn('Evento com datas ausentes ou inválidas após tentativa de merge:', e, { startDate, endDate });

                    return {
                        id: e.id,
                        title: e.titulo || 'Sem título',
                        start: startDate || new Date(),
                        end: endDate || new Date(),
                        desc: e.descricao || '',
                        color: e.color,
                        tipo: e.tipo || '',
                    };
                });

                const mapped = normalize(lista);


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

            try {
                const saved = localStorage.getItem('events');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    const normalized = parsed.map((e) => ({
                        id: e.id,
                        title: e.titulo || 'Sem título',
                        start: e.dataInicio ? (moment(e.dataInicio).hours() === 0 ? moment(e.dataInicio).add(12,'hours').toDate() : moment(e.dataInicio).toDate()) : new Date(),
                        end: e.dataFim ? (moment(e.dataFim).hours() === 0 ? moment(e.dataFim).add(13,'hours').toDate() : moment(e.dataFim).toDate()) : new Date(),   
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


            fetchEvents();
        }, [fetchEvents]);

        const handleEventClick = (evento) => {
            setEventoSelecionado(evento);
        };

        const handleEventClose = () => {
            setEventoSelecionado(null);
        };

        const handleUpdateEvent = async ({ id, title, desc, tipo, start, end, color }) => {
            if (!token) return Swal.fire({ icon: 'warning', text: 'Você precisa estar logado' });
            try {
                if (String(id).startsWith('t-')) {
                    const taskId = String(id).slice(2);
                    const res = await fetch(`${URL_API}/tarefas/${taskId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
                        body: JSON.stringify({ tarefa: title, data: start, prioridade: desc }),
                    });
                    if (res.status === 401) { localStorage.removeItem('token'); window.location.href = '/login'; return; }
                    if (!res.ok) { const err = await res.json().catch(() => ({ message: res.statusText })); throw new Error(err.message || 'Erro ao atualizar tarefa'); }
                } else {
                    const res = await fetch(`${URL_API}/events/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
                        body: JSON.stringify({ titulo: title, descricao: desc, dataInicio: start, dataFim: end, tipo, color }),
                    });
                    if (res.status === 401) { localStorage.removeItem('token'); window.location.href = '/login'; return; }
                    if (!res.ok) { const err = await res.json().catch(() => ({ message: res.statusText })); throw new Error(err.message || 'Erro ao atualizar evento'); }
                }
                // Optimistically update local state so color change is immediate
                setEventos(prev => {
                    const updatedEvents = prev.map(ev => ev.id === id ? { ...ev, title, desc, tipo, start: new Date(start), end: new Date(end), color: color || ev.color } : ev);
                    try { const toSave = updatedEvents.map(ev => ({ id: ev.id, titulo: ev.title, dataInicio: ev.start.toISOString(), dataFim: ev.end.toISOString(), descricao: ev.desc || '', tipo: ev.tipo || '', color: ev.color })); localStorage.setItem('events', JSON.stringify(toSave)); } catch (err) { console.error('Erro ao salvar evento atualizado no localStorage:', err); }
                    return updatedEvents;
                });

                await fetchEvents();
            } catch (err) {
                console.error('Erro ao atualizar evento/tarefa:', err);
            }
        };

        const handleDeleteEvent = async (id) => {
            if (!token) return Swal.fire({ icon: 'warning', text: 'Você precisa estar logado' });
            try {
                if (String(id).startsWith('t-')) {
                    const taskId = String(id).slice(2);
                    const res = await fetch(`${URL_API}/tarefas/${taskId}`, {
                        method: 'DELETE',
                        headers: { authorization: `Bearer ${token}` },
                    });
                    if (res.status === 401) { localStorage.removeItem('token'); window.location.href = '/login'; return; }
                    if (!res.ok) { const err = await res.json().catch(() => ({ message: res.statusText })); throw new Error(err.message || 'Erro ao deletar tarefa'); }
                } else {
                    const res = await fetch(`${URL_API}/events/${id}`, {
                        method: 'DELETE',
                        headers: { authorization: `Bearer ${token}` },
                    });
                    if (res.status === 401) { localStorage.removeItem('token'); window.location.href = '/login'; return; }
                    if (!res.ok) { const err = await res.json().catch(() => ({ message: res.statusText })); throw new Error(err.message || 'Erro ao deletar evento'); }
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

            const s = new Date(start);
            const e = end ? new Date(end) : new Date(s.getTime() + 60 * 60 * 1000);

            const isMidnight = (d) => d.getHours() === 0 && d.getMinutes() === 0 && d.getSeconds() === 0;
            if (isMidnight(s) && (end == null || isMidnight(e))) {
                s.setHours(12, 0, 0, 0);
                e.setHours(13, 0, 0, 0);
            }

            console.debug('Selected slot normalized', { start: s, end: e });
            setSelectedSlot({ start: s, end: e });
            setCreateMode('event');
            setShowAddModal(true);
        };

        const handleCreate = async (payload) => {
            const { mode = 'event' } = payload || {};
            if (mode === 'task') {
                const { title, desc, prioridade, data } = payload;
                console.debug('handleCreate TASK sending', { title, desc, prioridade, data });
                try {

                    const m = data instanceof Date ? moment(data) : moment(data, 'YYYY-MM-DD');
                    const dataISO = m.hour(12).minute(0).second(0).millisecond(0).toISOString();
                    const body = { tarefa: title, data: dataISO, prioridade: prioridade || '' };
                    const res = await fetch(`${URL_API}/tarefas`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
                        body: JSON.stringify(body),
                    });
                    if (res.status === 401) { localStorage.removeItem('token'); window.location.href = '/login'; return; }
                    if (!res.ok) {
                        const err = await res.json().catch(() => ({ message: res.statusText }));
                        Swal.fire({ icon: 'error', text: err.message || 'Erro ao criar tarefa' });
                        return;
                    }
                    const created = await res.json();
                    const tarefa = created.tarefa || created;
                    const tarefaMoment = moment(tarefa.data);
                    const startForTask = tarefaMoment.hours() === 0 && tarefaMoment.minutes() === 0 ? tarefaMoment.add(12, 'hours') : tarefaMoment;
                    const newEvent = {
                        id: `t-${tarefa.id}`,
                        title: tarefa.tarefa,
                        start: startForTask.toDate(),
                        end: startForTask.clone().add(1, 'hour').toDate(),
                        desc: tarefa.prioridade || '',
                        tipo: 'Tarefa'
                    };
                    setEventos((prev) => {
                        const updated = [...prev, newEvent];
                        try { const toSave = updated.map(ev => ({ id: ev.id, titulo: ev.title, dataInicio: ev.start.toISOString(), dataFim: ev.end.toISOString(), descricao: ev.desc || '', tipo: ev.tipo || '', color: ev.color })); localStorage.setItem('events', JSON.stringify(toSave)); } catch (err) { console.error('Erro ao salvar evento criado no localStorage:', err); }
                        return updated;
                    });
                    await fetchEvents();
                    setShowAddModal(false);
                    setSelectedSlot(null);
                } catch (err) {
                    console.error('Erro ao criar tarefa:', err);
                    Swal.fire({ icon: 'error', text: 'Erro de conexão ao criar tarefa' });
                }
                return;
            }


            const { title, desc, tipo, start, end } = payload;
            console.debug('handleCreate sending', { title, desc, tipo, start, end });
            try {
                const horario = new Date(start).toTimeString().slice(0, 5);

                const body = {
                    horario,
                    titulo: title,
                    dataInicio: moment(start).format('YYYY-MM-DD HH:mm:ss'),
                    dataFim: moment(end).format('YYYY-MM-DD HH:mm:ss'),
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
                console.debug('Created response:', created);
                const parsedStart = moment(created.dataInicio || body.dataInicio || start, ['YYYY-MM-DD HH:mm:ss', moment.ISO_8601], true);
                const parsedEnd = moment(created.dataFim || body.dataFim || end, ['YYYY-MM-DD HH:mm:ss', moment.ISO_8601], true);
                const fallbackStart = moment(start).isValid() ? moment(start) : (parsedStart.isValid() ? parsedStart : moment());
                const fallbackEnd = moment(end).isValid() ? moment(end) : (parsedEnd.isValid() ? parsedEnd : moment());

                const newEvent = {
                    id: created.id || created.evento?.id || created.rows?.[0]?.id || Math.random(),
                    title: created.titulo || title,
                    start: (parsedStart.isValid() ? parsedStart : fallbackStart).toDate(),
                    end: (parsedEnd.isValid() ? parsedEnd : fallbackEnd).toDate(),
                    desc: created.descricao || desc,
                    tipo: created.tipo || tipo || ''
                };


                setEventos((prev) => {
                    const updated = [...prev, newEvent];
                    console.debug('Optimistic add ->', newEvent);
                    try {
                        const toSave = updated.map(ev => ({ id: ev.id, titulo: ev.title, dataInicio: ev.start.toISOString(), dataFim: ev.end.toISOString(), descricao: ev.desc || '', tipo: ev.tipo || '', color: ev.color }));
                        localStorage.setItem('events', JSON.stringify(toSave));
                    } catch (err) { console.error('Erro ao salvar evento criado no localStorage:', err); }
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
                        views={{ month: true, week: true, day: true, year: YearView }}
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
                                    onAddEvent={(kind) => {
                                        if (kind === 'task') {
                                            
                                            setSelectedSlot({ start: new Date(), end: new Date(Date.now() + 60 * 60 * 1000) });
                                            setCreateMode('task');
                                            setShowAddModal(true);
                                        } else {

                                            setSelectedSlot({ start: new Date(), end: new Date(Date.now() + 60 * 60 * 1000) });
                                            setCreateMode('event');
                                            setShowAddModal(true);
                                        }
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
                            onUpdate={async (edited) => { await handleUpdateEvent({ id: edited.id, title: edited.title, desc: edited.desc, tipo: edited.tipo, start: edited.start.toISOString(), end: edited.end.toISOString(), color: edited.color }); handleEventClose(); }}
                    />
                )}

                <AddEventModal
                    show={showAddModal}
                    mode={createMode}
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
