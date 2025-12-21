const CustomToolbar = ({
    label,
    onView,
    view
}) => {
    return (
        <div className="calendar-toolbar">

            {/* Navegação */}
            <div className="calendar-toolbar-nav">
            </div>

            {/* Mês / Ano */}
            <div className="calendar-toolbar-label">
                {label}
            </div>

            {/* Views */}
            <div className="calendar-toolbar-views">
                <button
                    className={view === 'month' ? 'active' : ''}
                    onClick={() => onView('month')}
                >
                    Mês
                </button>

                <button
                    className={view === 'week' ? 'active' : ''}
                    onClick={() => onView('week')}
                >
                    Semana
                </button>

                <button
                    className={view === 'day' ? 'active' : ''}
                    onClick={() => onView('day')}
                >
                    Dia
                </button>
            </div>
        </div>
    );
};

export default CustomToolbar;
