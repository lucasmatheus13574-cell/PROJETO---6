import React , {useState} from "react";
import "../styles/Eventos.css";
import moment from "moment"
import { Calendar , momentLocalizer} from 'react-big-calendar'
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop'


function Eventos() {
    const [horario] = useState("");
    const [titulo] = useState("");
    const [dataInicio] = useState("");
    const [dataFim] = useState("");
    const [descricao] = useState("");

const DragAndDroppCalendar  = withDragAndDrop(Calendar);
const localizar = momentLocalizer(moment);

    return (
        <div className="eventos-container">
            <h1>Eventos</h1>
            <p>Esta é a página de eventos.</p>


            <div>
            <DragAndDroppCalendar
            defaultDate={moment().toDate()}
            defaultView="month"
            events={[{ horario, titulo, dataInicio, dataFim, descricao }]}
            localizar={localizar}
            resizable
            className="calendar"
            />

            </div>
        </div>
        
        
    );
}



export default  Eventos;