import React, { useState, useEffect } from "react";
import "../styles/Eventos.css";
import moment from "moment";
import { Calendar, momentLocalizer } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";

function Eventos() {
    const token = localStorage.getItem("token");
    const URL_API = import.meta.env.VITE_API_URL;

    const DragAndDropCalendar = withDragAndDrop(Calendar);
    const localizer = momentLocalizer(moment);


    const [eventos, setEventos] = useState([]);

    const [modalOpen, setModalOpen] = useState(false);

    const [horario, setHorario] = useState("");
    const [titulo, setTitulo] = useState("");
    const [dataInicio, setDataInicio] = useState("");
    const [dataFim, setDataFim] = useState("");
    const [descricao, setDescricao] = useState("");


    const fetchEventos = async () => {
        try {
            const response = await fetch(`${URL_API}/eventos`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await response.json();
            setEventos(data);
        } catch (error) {
            console.error("Erro ao buscar eventos:", error);
        }
    };

    useEffect(() => {
        fetchEventos();
    }, []);


    const handleSelectSlot = ({ start, end }) => {
        setDataInicio(moment(start).format("YYYY-MM-DDTHH:mm"));
        setDataFim(moment(end).format("YYYY-MM-DDTHH:mm"));
        setHorario(moment(start).format("HH:mm"));

        setTitulo("");
        setDescricao("");

        setModalOpen(true);
    };

    
    const CriarEvento = async () => {
        if (!titulo || !dataInicio || !dataFim) {
            alert("Preencha os campos obrigatórios");
            return;
        }

        const body = {
            horario,
            titulo,
            dataInicio,
            dataFim,
            descricao,
        };

        const response = await fetch(`${URL_API}/eventos`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(body),
        });

        if (response.ok) {
            setModalOpen(false);
            fetchEventos();
        }
    };

    return (
        <div>
            <h1>Eventos</h1>

            <DragAndDropCalendar
                selectable
                defaultDate={moment().toDate()}
                defaultView="month"
                localizer={localizer}
                events={eventos.map((evento) => ({
                    id: evento.id,
                    title: evento.titulo,
                    start: new Date(evento.dataInicio),
                    end: new Date(evento.dataFim),
                }))}
                onSelectSlot={handleSelectSlot}
                resizable
                className="calendar"
                style={{ height: 600 }}
            />


            {modalOpen && (
                <div className="modal">
                    <div className="modal-content">
                        <h3>Novo evento</h3>

                        <input
                            type="text"
                            placeholder="Título"
                            value={titulo}
                            onChange={(e) => setTitulo(e.target.value)}
                        />

                        <label>Início</label>
                        <input
                            type="datetime-local"
                            value={dataInicio}
                            onChange={(e) => setDataInicio(e.target.value)}
                        />

                        <label>Fim</label>
                        <input
                            type="datetime-local"
                            value={dataFim}
                            onChange={(e) => setDataFim(e.target.value)}
                        />

                        <textarea
                            placeholder="Descrição"
                            value={descricao}
                            onChange={(e) => setDescricao(e.target.value)}
                        />

                        <div className="modal-actions">
                            <button onClick={CriarEvento}>Salvar</button>
                            <button onClick={() => setModalOpen(false)}>Cancelar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Eventos;
