import { NavLink } from 'react-router-dom';
import React, { useState, useContext } from 'react';
import '../../styles/SideBar.css';
import { FilterContext } from '../../context/FilterContextValue';
import MiniMap from './MiniMap';
import { CalendarContext } from '../../context/CalendarContext';
import CalendarManager from './CalendarManager';

function Sidebar() {
    const [open, setOpen] = useState(true);
    const { showEvents, showTasks, setShowEvents, setShowTasks } = useContext(FilterContext);
    const { currentDate, setCurrentDate } = useContext(CalendarContext);

    const onSelectDate = (date) => {
        setCurrentDate(date);
    };

    return (
        <>
        {!open && (
            <button
                className="sidebar-reopen-float"
                onClick={() => setOpen(true)}
                aria-label="Abrir sidebar"
            >
                ☰
            </button>
        )}
        <aside className={`sidebar ${open ? 'open' : 'closed'}`}>
            <div className="sidebar-header">
                <h2 className="sidebar-logo">📅 Agenda</h2>
                <button className="sidebar-toggle" onClick={() => setOpen(!open)} aria-label="Toggle sidebar">
                    ◀
                </button>
            </div>

            <div className="sidebar-inner">
                <p className="sidebar-section-title">Navegação</p>
                <nav className="sidebar-menu">
                    <NavLink to="/eventos" className="sidebar-link">
                        📆 Calendário
                    </NavLink>
                    <NavLink to="/lembretes" className="sidebar-link">
                        🔔 Lembretes
                    </NavLink>
                </nav>

                <p className="sidebar-section-title">Exibir</p>
                <div className="sidebar-filters">
                    <label className="filter-row">
                        <input type="checkbox" checked={showEvents} onChange={(e) => setShowEvents(e.target.checked)} />
                        Eventos
                    </label>
                    <label className="filter-row">
                        <input type="checkbox" checked={showTasks} onChange={(e) => setShowTasks(e.target.checked)} />
                        Tarefas
                    </label>
                </div>

                <p className="sidebar-section-title">Meus Calendários</p>
                <div className="sidebar-calendars">
                    <CalendarManager />
                </div>

                <div className="sidebar-minimap">
                    <MiniMap currentDate={currentDate} onSelectDate={onSelectDate} />
                </div>
            </div>
        </aside>
        </>
    );
}

export default Sidebar;

