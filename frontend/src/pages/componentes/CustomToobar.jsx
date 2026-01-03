import React, { useContext, useState, useRef, useEffect } from "react";
import Swal from "sweetalert2";
import { CalendarContext } from "../../context/CalendarContext";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "../../styles/Calendarios.css";
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

export default function CustomToolbar({  onNavigate, onView, view }) {
    const { currentDate, setCurrentDate, setView, showYearView, setShowYearView } = useContext(CalendarContext);

    const navigate = (action) => {
        // react-big-calendar will understand actions like 'TODAY','PREV','NEXT'
        if (action === 'TODAY') {
            setCurrentDate(new Date());
            onNavigate && onNavigate('TODAY');
        } else if (action === 'PREV' || action === 'NEXT') {
            onNavigate && onNavigate(action);
        }
    };

    const handleView = (v) => {
        if (v === 'year') {
            // our app supports a separate year view toggle
            setShowYearView(s => !s);
        } else {
            setShowYearView(false);
            setView && setView(v);
            onView && onView(v);
        }
    };

    const logout = () => {
        Swal.fire({
            title: "Deseja sair?",
            text: "Você será desconectado da sua conta!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sim, sair",
            cancelButtonText: "Cancelar"
        }).then((result) => {
            if (result.isConfirmed) {
                localStorage.removeItem("token");
                Swal.fire({
                    icon: "success",
                    title: "Sessão encerrada!",
                    timer: 1200,
                    showConfirmButton: false
                }).then(() => {
                    window.location.href = "/";
                });
            }
        });
    };

    const [open, setOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const onDocClick = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', onDocClick);
        return () => document.removeEventListener('mousedown', onDocClick);
    }, []);

    const viewLabelMap = { day: 'Dia', week: 'Semana', month: 'Mês', year: 'Ano' };
    const viewsOptions = [
        { value: 'day', label: 'Dia ' , shortcut: 'D' },
        { value: 'week', label: 'Semana',  shortcut: 'W' },
        { value: 'month', label: 'Mês',  shortcut: 'M' },
        { value: 'year', label: 'Ano',  shortcut: 'Y' }
    ];

    const formattedLabel = format(currentDate, 'MMMM yyyy', { locale: ptBR });
    const displayLabel = formattedLabel.charAt(0).toUpperCase() + formattedLabel.slice(1);

    return (
        <div className="rbc-toolbar custom-toolbar" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px' }}>
            <div className="custom-nav" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <button className="nav-btn" aria-label="Prev" onClick={() => navigate('PREV')}>&#9664;</button>
                <button className="btn-secondary" onClick={() => navigate('TODAY')}>Hoje</button>
                <button className="nav-btn" aria-label="Next" onClick={() => navigate('NEXT')}>&#9654;</button>
                <div style={{ marginLeft: 12, fontWeight: 600 }}>{displayLabel}</div>
            </div>

            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center', position: 'relative' }} ref={dropdownRef}>
                <button className={`view-toggle ${showYearView || view === 'year' ? 'active' : ''}`} onClick={() => setOpen(v => !v)} aria-haspopup="menu" aria-expanded={open}>
                    <span className="view-label">{viewLabelMap[view] || 'Mês'}</span>
                    <span className={`caret ${open ? 'open' : ''}`}>▾</span>
                </button>

                {open && (
                    <div className="view-dropdown-menu" role="menu">
                        {viewsOptions.map(opt => (
                            <button key={opt.value} className="view-dropdown-item" onClick={() => { handleView(opt.value); setOpen(false); }}>
                                <span className="item-label">{opt.label}</span>
                                <span className="item-shortcut">{opt.shortcut}</span>
                            </button>
                        ))}
                    </div>
                )}

                <button className="logout-btn" onClick={logout}>🚪 Logout</button>
            </div>
        </div>
    );
}
