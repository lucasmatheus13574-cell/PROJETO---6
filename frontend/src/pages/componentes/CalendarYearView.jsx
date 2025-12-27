import React from 'react';
import moment from 'moment';
import '../../styles/CalendarYear.css';

const months = moment.months();

export default function CalendarYearView({
    year,
    onPrevYear,
    onNextYear,
    onSelectMonth,
    onClose
}) {
    return (
        <div className="calendar-year">
            <div className="calendar-year-header">
                <button className="year-nav" onClick={onPrevYear}>◀</button>
                <h3>{year}</h3>
                <button className="year-nav" onClick={onNextYear}>▶</button>
                <button className="year-close" onClick={onClose}>Fechar</button>
            </div>

            <div className="calendar-year-grid">
                {months.map((m, idx) => (
                    <div
                        key={m}
                        className="calendar-month-card"
                        onClick={() => onSelectMonth(idx)}
                    >
                        <div className="calendar-month-name">{m}</div>

                        <div className="calendar-month-sample">
                            <div className="weekdays">D S T Q Q S S</div>
                            <div className="sample-dates">
                                {Array.from({ length: 6 }).map((_, r) => (
                                    <div className="sample-row" key={r}>
                                        {Array.from({ length: 7 }).map((_, c) => (
                                            <div className="sample-cell" key={c} />
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
