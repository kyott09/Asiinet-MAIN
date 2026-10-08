function CalendarHeader({ currentDate, onPreviousMonth, onNextMonth, onToday }) {
  const month = currentDate.toLocaleString("es-ES", {
    month: "long",
  });

  const year = currentDate.getFullYear();

  return (
    <div className="calendar-header">
      <div className="calendar-header-title-group">
        <h2>
          {month.charAt(0).toUpperCase() + month.slice(1)} {year}
        </h2>
      </div>

      <div className="calendar-header-actions">
        {onToday && (
          <button
            className="calendar-header-today-btn"
            onClick={onToday}
            type="button"
          >
            Hoy
          </button>
        )}
        <button
          className="calendar-nav-btn"
          onClick={onPreviousMonth}
          type="button"
          aria-label="Mes anterior"
          title="Mes anterior"
        >
          <i className="fa-solid fa-chevron-left" aria-hidden="true"></i>
        </button>

        <button
          className="calendar-nav-btn"
          onClick={onNextMonth}
          type="button"
          aria-label="Mes siguiente"
          title="Mes siguiente"
        >
          <i className="fa-solid fa-chevron-right" aria-hidden="true"></i>
        </button>
      </div>
    </div>
  );
}

export default CalendarHeader;