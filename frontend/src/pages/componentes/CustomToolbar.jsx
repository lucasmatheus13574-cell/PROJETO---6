import React, { useState, useRef, useEffect } from 'react';

const CustomToolbar = ({
    label,
    onNavigate,
    onView,
    views,
    onAddEvent,
}) => {
    const [open, setOpen] = useState(false);
    const ref = useRef();

    useEffect(() => {
        const handleDocClick = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('click', handleDocClick);
        return () => document.removeEventListener('click', handleDocClick);
    }, []);

    return (
        <div className="rbc-toolbar custom-toolbar">

            <span className="rbc-btn-group">
                <button onClick={() => onNavigate('PREV')}>Anterior</button>
                <button onClick={() => onNavigate('TODAY')}>Hoje</button>
                <button onClick={() => onNavigate('NEXT')}>Próximo</button>
            </span>


            <span className="rbc-toolbar-label">{label}</span>

            <span className="rbc-btn-group">
                {views.map((view) => {
                    const handleClick = () => {
                        if (view === 'year') {
                            // If consumer provided a 'year' view, use it. Otherwise fallback to navigating to January month.
                            if (onView) {
                                try { onView('year'); return; } catch { /* continue to fallback */ }
                            }
                            try {
                                onView && onView('month');
                                const now = new Date();
                                const jan = new Date(now.getFullYear(), 0, 1);
                                onNavigate && onNavigate('DATE', jan);
                            } catch {
                                onView && onView('month');
                            }
                        } else {
                            onView && onView(view);
                        }
                    };

                    return (
                        <button key={view} onClick={handleClick}>
                            {view === 'month' && 'Mês'}
                            {view === 'week' && 'Semana'}
                            {view === 'day' && 'Dia'}
                            {view === 'year' && 'Ano'}
                        </button>
                    );
                })}
            </span>

            <span className="rbc-btn-group add-dropdown" ref={ref} style={{ position: 'relative' }}>
                <button className="btn btn-primary" onClick={() => setOpen((v) => !v)}>+</button>
                {open && (
                    <div className="custom-dropdown" style={{ position: 'absolute', right: 0, marginTop: 6, background: 'white', border: '1px solid rgba(0,0,0,0.15)', borderRadius: 4, zIndex: 40 }}>
                        <button className="dropdown-item" style={{ display: 'block', padding: '6px 12px', background: 'transparent', border: 'none', width: '100%', textAlign: 'left' }} onClick={() => { setOpen(false); onAddEvent && onAddEvent('event'); }}>Evento</button>
                        <button className="dropdown-item" style={{ display: 'block', padding: '6px 12px', background: 'transparent', border: 'none', width: '100%', textAlign: 'left' }} onClick={() => { setOpen(false); onAddEvent && onAddEvent('task'); }}>Tarefa</button>
                    </div>
                )}
            </span>
        </div>
    );
};

export default CustomToolbar;
