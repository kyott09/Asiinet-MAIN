import CalendarEvent from "./CalendarEvent";

function CalendarDay({ day, isToday, events = [], onClick }) {
  if (day === null) {
    return <div className="calendar-day empty" aria-hidden="true" />;
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick?.();
    }
  };

  const countText =
    events.length === 0
      ? "sin eventos"
      : `${events.length} evento${events.length === 1 ? "" : "s"}`;

  return (
    <div
      className={`calendar-day ${isToday ? "today" : ""} ${events.length > 0 ? "has-events" : ""}`}
      tabIndex={0}
      role="button"
      onClick={onClick}
      onKeyDown={handleKeyDown}
      aria-label={`Día ${day}${isToday ? ", hoy" : ""}, ${countText}. Clic para ver o agregar eventos`}
    >
      <div className="calendar-day-header">
        <span className={`calendar-day-number ${isToday ? "today-badge" : ""}`}>
          {day}
        </span>
        {events.length > 3 && (
          <span className="calendar-more-badge">+{events.length - 3}</span>
        )}
      </div>

      <div className="calendar-events">
        {events.slice(0, 3).map((event) => (
          <CalendarEvent key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}

export default CalendarDay;