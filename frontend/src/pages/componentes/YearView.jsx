import React, { useState, useMemo, useEffect } from 'react';
import moment from 'moment';

function MonthCell({ monthIndex, year, events, onDrill, maxCount }) {
    const monthStart = moment([year, monthIndex, 1]);
    const monthEnd = monthStart.clone().endOf('month');
    const monthEvents = (events || []).filter(ev => {
        const s = moment(ev.start);
        return s.isBetween(monthStart.startOf('day'), monthEnd.endOf('day'), null, '[]');
    });

    const count = monthEvents.length;
    const intensity = maxCount > 0 ? Math.min(1, count / maxCount) : 0;
    const bg = `rgba(49,116,173,${0.08 + intensity * 0.5})`;

    const tasks = monthEvents.filter(e => String(e.id).startsWith('t-')).length;
    const eventsCount = count - tasks;

    return (
        <div
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onDrill(monthIndex); }}
            onClick={() => onDrill(monthIndex)}
            className="year-month"
            style={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 6, padding: 8, minHeight: 120, boxSizing: 'border-box', background: bg, cursor: 'pointer' }}
            title={monthEvents.slice(0,6).map(m => m.title).join('\n')}
            aria-label={`${monthStart.format('MMMM')}: ${count} items`}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ fontWeight: 700 }}>{monthStart.format('MMMM')}</div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <div style={{ fontSize: 12, color: '#fff', background: 'rgba(0,0,0,0.2)', padding: '2px 8px', borderRadius: 12 }}>{count}</div>
                </div>
            </div>
            <div style={{ fontSize: 12, color: '#333', minHeight: 46 }}>
                {monthEvents.slice(0, 3).map(ev => (<div key={ev.id} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.title}</div>))}
            </div>
            <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12 }}>
                    <span style={{ display: 'inline-block', width: 10, height: 10, background: '#3174ad', borderRadius: 2 }} />
                    <span>{eventsCount}</span>
                    <span style={{ display: 'inline-block', width: 10, height: 10, background: '#6c757d', borderRadius: 2, marginLeft: 8 }} />
                    <span>{tasks}</span>
                </div>
                <div>
                    <button className="btn btn-sm btn-outline-primary" onClick={(e) => { e.stopPropagation(); onDrill(monthIndex); }}>Abrir mês</button>
                </div>
            </div>
        </div>
    );
}

export default function YearView(props) {
    const { date, events = [], onNavigate, onView } = props;
    const initialYear = moment(date).year();
    const [year, setYear] = useState(initialYear);

    useEffect(() => {
        
        const dYear = moment(date).year();
        if (dYear !== year) setYear(dYear);
    }, [date, year]);

    const eventsByMonth = useMemo(() => {
        const map = Array.from({ length: 12 }, () => []);
        events.forEach(ev => {
            const m = moment(ev.start);
            if (m.isValid() && m.year() === year) map[m.month()].push(ev);
        });
        return map;
    }, [events, year]);

    const maxCount = Math.max(...eventsByMonth.map(a => a.length), 0);

    
    useEffect(() => {
        
    }, [year]);

    const handleDrill = (monthIndex) => {
        const monthEvents = eventsByMonth[monthIndex] || [];
        let target;
        if (monthEvents.length > 0) {
            const earliest = monthEvents.reduce((acc, cur) => (moment(cur.start).isBefore(moment(acc.start)) ? cur : acc));
            target = new Date(moment(earliest.start).toDate());
        } else {
            target = new Date(year, monthIndex, 1);
        }
        if (onNavigate) onNavigate('DATE', target);
        if (onView) onView('month');
    };

    const months = Array.from({ length: 12 }, (_, i) => i);

    return (
        <div style={{ padding: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                    <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => {
                        const next = year - 1;
                        setYear(next);
                        const target = new Date(next, 0, 1);
                        onNavigate && onNavigate('DATE', target);
                    }}>←</button>
                    <strong style={{ fontSize: 18 }}>{year}</strong>
                    <button className="btn btn-sm btn-outline-secondary ms-2" onClick={() => {
                        const next = year + 1;
                        setYear(next);
                        const target = new Date(next, 0, 1);
                        onNavigate && onNavigate('DATE', target);
                    }}>→</button>
                    <button className="btn btn-sm btn-outline-secondary ms-2" onClick={() => {
                        const todayYear = moment().year();
                        setYear(todayYear);
                        const target = new Date(todayYear, 0, 1);
                        onNavigate && onNavigate('DATE', target);
                    }}>Hoje</button>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{ fontSize: 12, color: '#666' }}>Legenda:</div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <div style={{ width: 12, height: 12, background: 'rgba(49,116,173,0.1)', borderRadius: 2 }} />
                        <div style={{ fontSize: 12 }}>Poucos</div>
                        <div style={{ width: 12, height: 12, background: 'rgba(49,116,173,0.4)', borderRadius: 2 }} />
                        <div style={{ fontSize: 12 }}>Muitos</div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {months.map(m => (
                    <MonthCell key={m} monthIndex={m} year={year} events={eventsByMonth[m] || []} onDrill={handleDrill} maxCount={maxCount} />
                ))}
            </div>
        </div>
    );
}


YearView.title = (date) => {
    try {
        return `Ano ${moment(date).year()}`;
    } catch {
        return `Ano`;
    }
};
