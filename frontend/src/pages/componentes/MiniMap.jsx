import React from 'react';
import '../../styles/SideBar.css';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameDay, format, getMonth, getDate } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

export default function MiniMap({ currentDate, onSelectDate }) {
    const m = currentDate instanceof Date ? currentDate : new Date(currentDate);
    const start = startOfMonth(m);
    const end = endOfMonth(m);
    let days = []; 


    days = [];
    let day = startOfWeek(start, { weekStartsOn: 0 });
    const endOfGrid = endOfWeek(end, { weekStartsOn: 0 });
    while (day <= endOfGrid) {
        const week = [];
        for (let i = 0; i < 7; i++) {
            week.push(day);
            day = addDays(day, 1);
        }
        days.push(week);
    }

    
    return (
        <div className="minimap">
            <div className="minimap-header">{format(m, 'MMMM yyyy', { locale: ptBR })}</div>
            <table className="minimap-table">
                <thead>
                    <tr>
                        {['D','S','T','Q','Q','S','S'].map((d,i) => <th key={i}>{d}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {days.map((week, idx) => (
                        <tr key={idx}>
                            {week.map((d,i) => (
                                <td key={i} className={`minimap-day ${isSameDay(d, new Date()) ? 'today' : ''} ${getMonth(d) !== getMonth(m) ? 'other-month' : ''}`}
                                    onClick={() => onSelectDate(d)}>
                                    {getDate(d)}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}