import React from 'react';

const CustomToolbar = ({
    label,
    onNavigate,
    onView,
    views,
    onAddEvent,
}) => {
    return (
        <div className="rbc-toolbar custom-toolbar">

            <span className="rbc-btn-group">
                <button onClick={() => onNavigate('PREV')}>Anterior</button>
                <button onClick={() => onNavigate('TODAY')}>Hoje</button>
                <button onClick={() => onNavigate('NEXT')}>Próximo</button>
            </span>


            <span className="rbc-toolbar-label">{label}</span>

            <span className="rbc-btn-group">
                {views.map((view) => (
                    <button key={view} onClick={() => onView(view)}>
                        {view === 'month' && 'Mês'}
                        {view === 'week' && 'Semana'}
                        {view === 'day' && 'Dia'}
                        {view === 'year' && 'Ano'   }
                    </button>
                ))}
            </span>

        
            <span className="rbc-btn-group add-dropdown">
                <div className="btn-group">
                    <button className="btn btn-primary dropdown-toggle" type="button">+</button>
                    <div className="dropdown-menu" style={{padding: '6px'}}>
                        <button className="dropdown-item" onClick={() => onAddEvent('event')}>Evento</button>
                        <button className="dropdown-item" onClick={() => onAddEvent('task')}>Tarefa</button>
                    </div>
                </div>
            </span>
        </div>
    );
};

export default CustomToolbar;
