const CustomToolbar = ({ label, onView, onNavigate, onAddEvent }) => {
  return (
    <div className="toolbar-container">
      <h1>{label}</h1>

      <div className="d-flex gap-2">
        <button onClick={() => onView('day')}>Dia</button>
        <button onClick={() => onView('week')}>Semana</button>
        <button onClick={() => onView('month')}>Mês</button>

        <button onClick={() => onNavigate('TODAY')}>Hoje</button>
        <button onClick={() => onNavigate('PREV')}>◀</button>
        <button onClick={() => onNavigate('NEXT')}>▶</button>

        <button className="btn btn-primary" onClick={onAddEvent}>+</button>
      </div>
    </div>
  );
};

export default CustomToolbar;
