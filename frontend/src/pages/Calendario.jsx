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

    const fetchEvents = useCallback(async () => {
        const res = await fetch(`${URL_API}/events`, {
            headers: { authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        const mapped = data.map(e => ({
            id: e.id,
            title: e.titulo,
            start: new Date(e.dataInicio),
            end: new Date(e.dataFim),
            desc: e.descricao,
            tipo: e.tipo,
        }));

        setEventos(mapped);
        setEventosFiltrados(mapped);
    }, [URL_API, token]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const handleCreate = async ({ title, desc, tipo, start, end }) => {
        const body = {
            titulo: title,
            descricao: desc,
            tipo,
            dataInicio: start,
            dataFim: end,
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
            Swal.fire({ icon: 'error', text: 'Erro ao criar evento' });
            return;
        }

        await fetchEvents();
        setShowAddModal(false);
    };

    return (
        <div className="tela">
            <div className="toolbar">
                <FiltroAtividades
                    atividades={eventos}
                    onSelecionarAtividades={setEventosFiltrados}
                />
            </div>

            <div className="calendario">
                <DragAndDropCalendar
                    selectable
                    defaultView="month"
                    views={['month', 'week', 'day']}
                    events={eventosFiltrados}
                    localizer={localizer}
                    onSelectEvent={setEventoSelecionado}
                    onSelectSlot={({ start, end }) => {
                        setSelectedSlot({ start, end });
                        setShowAddModal(true);
                    }}
                    components={{
                        toolbar: (props) => (
                            <CustomToolbar
                                {...props}
                                onAddEvent={() => {
                                    setSelectedSlot({
                                        start: new Date(),
                                        end: new Date(Date.now() + 3600000),
                                    });
                                    setShowAddModal(true);
                                }}
                            />
                        ),
                    }}
                />
            </div>

            {eventoSelecionado && (
                <EventModal
                    evento={eventoSelecionado}
                    onClose={() => setEventoSelecionado(null)}
                />
            )}

            <AddEventModal
                show={showAddModal}
                onClose={() => setShowAddModal(false)}
                defaultStart={selectedSlot?.start}
                defaultEnd={selectedSlot?.end}
                onCreate={handleCreate}
            />
        </div>
    );
}

export default Calendario;
