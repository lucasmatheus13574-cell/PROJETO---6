import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useEffect, useState } from "react";


const localizer = momentLocalizer(moment);


export default function Calendario() {
    const [events, setEvents] = useState([]);


    useEffect(() => {
        fetch(import.meta.env.VITE_API_URL + "/events", {
            headers: { Authorization: "Bearer " + localStorage.getItem("token") }
        })
            .then(res => res.json())
            .then(data => {
                setEvents(data.map(e => ({
                    id: e.id,
                    title: e.title,
                    start: new Date(e.start_date_time),
                    end: new Date(e.end_date_time)
                })));
            });
    }, []);


    return (
        <div style={{ height: "100vh", padding: 20 }}>
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                views={["month", "week", "day"]}
            />
        </div>
    );
}