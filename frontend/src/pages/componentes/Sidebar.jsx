import { NavLink } from 'react-router-dom';
import React, { useState, useContext } from 'react';
import '../../styles/SideBar.css';
import { FilterContext } from '../../context/FilterContext';

function Sidebar() {
    const [open, setOpen] = useState(true);
    const { showEvents, showTasks, setShowEvents, setShowTasks } = useContext(FilterContext);

    return (
        <aside className={`sidebar ${open ? 'open' : 'closed'}`}>
            <div className="sidebar-header">
                <h2 className="sidebar-logo">Meu App</h2>
                <button className="sidebar-toggle" onClick={() => setOpen(!open)} aria-label="Toggle sidebar">
                    {open ? '◀' : '▶'}
                </button>
            </div>

            <nav className="sidebar-menu">
                <NavLink to="/agenda" className="sidebar-link">
                    Agenda
                </NavLink>

                <NavLink to="/livros" className="sidebar-link">
                    Livros
                </NavLink>

                <NavLink to="/perfil" className="sidebar-link">
                    Perfil
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
        </aside>
    );
}

export default Sidebar; 
