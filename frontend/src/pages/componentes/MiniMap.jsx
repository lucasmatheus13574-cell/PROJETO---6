import React from 'react';
import moment from 'moment';
import '../../styles/SideBar.css';

export default function MiniMap({ currentDate, onSelectDate }) {
    const m = moment(currentDate);
    const start = m.clone().startOf('month');
    const end = m.clone().endOf('month');
    let days = []; // will be filled with weeks of 7 days


    // build weeks (Sunday first) - robust iteration with clone to avoid mutation issues
    days = [];
    let day = start.clone().startOf('week');
    const endOfGrid = end.clone().endOf('week');
    while (day.isSameOrBefore(endOfGrid, 'day')) {
        const week = [];
        for (let i = 0; i < 7; i++) {
            week.push(day.clone());
            day.add(1, 'day');
        }
        days.push(week);
    }

    const isSameDay = (a, b) => {
        try {
            return !!(a && b && a.isSame && a.isSame(b, 'day'));
        } catch  {
            return false;
        }
    };

    return (
        <div className="minimap">
            <div className="minimap-header">{m.format('MMMM YYYY')}</div>
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
                                <td key={i} className={`minimap-day ${isSameDay(d, moment()) ? 'today' : ''} ${d.month() !== m.month() ? 'other-month' : ''}`}
                                    onClick={() => onSelectDate(d.toDate())}>
                                    {d.date()}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}