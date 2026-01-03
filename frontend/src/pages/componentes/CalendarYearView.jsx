import React, { useState } from 'react';
import '../../styles/CalendarYear.css';
import { getDaysInMonth, getDay, format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

const weekdays = ['D','S','T','Q','Q','S','S'];
export default function CalendarYearView({ year, onPrevYear, onNextYear, onClose, onDayClick }) {

    const [expandedMonth, setExpandedMonth] = useState(null);

    const getMonthMatrix = (y, mIdx) => {
        const first = new Date(y, mIdx, 1);
        const daysInMonth = getDaysInMonth(first);
        const startDow = getDay(first); // 0 = Sunday
        const weeks = [];
        let day = 1 - startDow;
        for (let r = 0; r < 6; r++) {
            const week = [];
            for (let c = 0; c < 7; c++) {
                if (day > 0 && day <= daysInMonth) {
                    week.push(day);
                } else {
                    week.push(null);
                }
                day++;
            }
            weeks.push(week);
        }
        return weeks;
    }

    const handleMonthClick = (idx) => {
        // Expand the month so the user can pick a day
        setExpandedMonth(idx);
    }

    const handleDayClick = (mIdx, d) => {
        const date = new Date(year, mIdx, d);
        if (onDayClick) onDayClick(date);
    }

    return (
        <div className="calendar-year dark">
            <div className="calendar-year-header">
                <div className="year-controls">
                    <button className="year-nav" onClick={onPrevYear}>◀</button>
                    <h3>{year}</h3>
                    <button className="year-nav" onClick={onNextYear}>▶</button>
                </div>
                <button className="year-close" onClick={onClose}>Fechar</button>
            </div>

            {!Number.isInteger(expandedMonth) ? (
                <div className="calendar-year-grid">
                    {Array.from({length:12}).map((_, idx) => {
                        const mName = format(new Date(year, idx, 1), 'MMMM', { locale: ptBR });
                        const matrix = getMonthMatrix(year, idx);
                        const today = new Date();
                        return (
                            <div key={idx} className="calendar-month-card" onClick={() => handleMonthClick(idx)}>
                                <div className="calendar-month-name">{mName}</div>

                                <div className="calendar-month-sample">
                                    <div className="weekdays">
                                        {weekdays.map((w, i) => <div key={i} className="weekday">{w}</div>)}
                                    </div>

                                    <div className="sample-dates">
                                        {matrix.map((week, r) => (
                                            <div className="sample-row" key={r}>
                                                {week.map((d, c) => {
                                                    const isToday = d && today.getFullYear() === year && today.getMonth() === idx && today.getDate() === d;
                                                    return (
                                                        <div key={c} className={`sample-cell ${d ? 'has-day' : 'empty'} ${isToday ? 'today' : ''}`}>
                                                            {d ? <span className="day-number">{d}</span> : null}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        ))}
                                    </div>

                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="expanded-month">
                    <div className="expanded-month-header">
                        <button className="year-nav" onClick={() => setExpandedMonth(null)}>◀ Voltar</button>
                        <h4>{format(new Date(year, expandedMonth, 1), 'MMMM', { locale: ptBR })} {year}</h4>
                    </div>

                    <div className="expanded-month-grid">
                        <div className="weekdays">
                            {weekdays.map((w, i) => <div key={i} className="weekday">{w}</div>)}
                        </div>

                        {getMonthMatrix(year, expandedMonth).map((week, r) => (
                            <div className="sample-row" key={r}>
                                {week.map((d, c) => (
                                    <div key={c} className={`sample-cell ${d ? 'has-day' : 'empty'}`} onClick={() => d && handleDayClick(expandedMonth, d)}>
                                        {d ? <span className="day-number">{d}</span> : null}
                                    </div>
                                ))}
                            </div>
                        ))}

                    </div>
                </div>
            )}
        </div>
    )
}
