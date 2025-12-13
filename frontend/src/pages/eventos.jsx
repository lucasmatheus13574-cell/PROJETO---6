import React, { useState, useEffect } from "react";
import moment from "moment";
import "moment/locale/pt-br";
import "../styles/Eventos.css";

import { Calendar, momentLocalizer } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";

moment.locale("pt-br");

const localizer = momentLocalizer(moment);
const DragCalendar = withDragAndDrop(Calendar);

function Eventos() {
    const token = localStorage.getItem("token");
    const API = import.meta.env.VITE_API_URL;

    const [eventos, setEventos] = useState([]);
    const [modal, setModal] = useState(false);
    const [eventoAtual, setEventoAtual] = useState(null);

    const [form, setForm] = useState({
        titulo: "",
        dataInicio: "",
        dataFim: "",
        descricao: "",
    });

    /* ===== BUSCAR ===== */
    const fetchEventos = async () => {
        const res = await fetch(`${API}/events`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setEventos(data);
    };

    useEffect(() => {
        fetchEventos();
    }, []);

    /* ===== CRIAR ===== */
    const handleSelectSlot = ({ start, end }) => {
        setEventoAtual(null);
        setForm({
            titulo: "",
            dataInicio: moment(start).format("YYYY-MM-DDTHH:mm"),
            dataFim: moment(end).format("YYYY-MM-DDTHH:mm"),
            descricao: "",
        });
        setModal(true);
    };

    /* ===== EDITAR ===== */
    const handleSelectEvent = (event) => {
        setEventoAtual(event);
        setForm({
            titulo: event.titulo,
            dataInicio: moment(event.dataInicio).format("YYYY-MM-DDTHH:mm"),
            dataFim: moment(event.dataFim).format("YYYY-MM-DDTHH:mm"),
            descricao: event.descricao,
        });
        setModal(true);
    };

    /* ===== SALVAR ===== */
    const salvar = async () => {
        const method = eventoAtual ? "PUT" : "POST";
        const url = eventoAtual
            ? `${API}/events/${eventoAtual.id}`
            : `${API}/events`;

        await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(form),
        });

        setModal(false);
        fetchEventos();
    };

    /* ===== EXCLUIR ===== */
    const excluir = async () => {
        await fetch(`${API}/events/${eventoAtual.id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        });
        setModal(false);
        fetchEventos();
    };

    return (
        <>
            <DragCalendar
                selectable
                resizable
                longPressThreshold={1}
                localizer={localizer}
                events={eventos.map(e => ({
                    ...e,
                    start: moment(e.dataInicio).toDate(),
                    end: moment(e.dataFim).toDate(),
                    title: e.titulo,
                }))}
                defaultView="month"
                onSelectSlot={handleSelectSlot}
                onSelectEvent={handleSelectEvent}
                style={{ height: 650 }}
                messages={{
                    today: "Hoje",
                    month: "Mês",
                    week: "Semana",
                    day: "Dia",
                    next: "Próximo",
                    previous: "Anterior",
                }}
            />

            {modal && (
                <div className="modal">
                    <div className="modal-content">
                        <h3>{eventoAtual ? "Editar evento" : "Novo evento"}</h3>

                        <input
                            placeholder="Título"
                            value={form.titulo}
                            onChange={e => setForm({ ...form, titulo: e.target.value })}
                        />

                        <input
                            type="datetime-local"
                            value={form.dataInicio}
                            onChange={e => setForm({ ...form, dataInicio: e.target.value })}
                        />

                        <input
                            type="datetime-local"
                            value={form.dataFim}
                            onChange={e => setForm({ ...form, dataFim: e.target.value })}
                        />

                        <textarea
                            placeholder="Descrição"
                            value={form.descricao}
                            onChange={e => setForm({ ...form, descricao: e.target.value })}
                        />

                        <div className="modal-actions">
                            {eventoAtual && <button onClick={excluir}>Excluir</button>}
                            <button onClick={salvar}>Salvar</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default Eventos;
