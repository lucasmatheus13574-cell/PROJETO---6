import { NavLink } from 'react-router-dom';
import React, { useState, useContext } from 'react';
import '../../styles/SideBar.css';
import { FilterContext } from '../../context/FilterContextValue';
import MiniMap from './MiniMap';
import { CalendarContext } from '../../context/CalendarContext';

function Sidebar() {
    const [open, setOpen] = useState(true);
    const { showEvents, showTasks, setShowEvents, setShowTasks } = useContext(FilterContext);
    const { currentDate, setCurrentDate } = useContext(CalendarContext);

    const onSelectDate = (date) => {
        setCurrentDate(date);
    };

    return (
        <aside className={`sidebar ${open ? 'open' : 'closed'}`}>
            <div className="sidebar-header">
                <h2 className="sidebar-logo">Meu App</h2>
                <button className="sidebar-toggle" onClick={() => setOpen(!open)} aria-label="Toggle sidebar">
                    {open ? '◀' : '☰'}
                </button>
            </div>

            <nav className="sidebar-menu">
                <NavLink to="/eventos" className="sidebar-link">
                    Agenda
                </NavLink>
            </nav>

            <div className="sidebar-filters">
                <h3>Filtros</h3>
                <label className="filter-row">
                    <input type="checkbox" checked={showEvents} onChange={(e) => setShowEvents(e.target.checked)} /> Eventos
                </label>
                <label className="filter-row">
                    <input type="checkbox" checked={showTasks} onChange={(e) => setShowTasks(e.target.checked)} /> Tarefas
                </label>
            </div>

            <div className="sidebar-minimap">
                <MiniMap currentDate={currentDate} onSelectDate={onSelectDate} />
            </div>
        </aside>
    );
}

export default Sidebar; 
