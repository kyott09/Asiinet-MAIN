import { getEventTypeInfo } from "../../constants/calendarTypes";

function CalendarEvent({ event }) {
  if (!event) return null;

  const typeInfo = getEventTypeInfo(event.tipo || event.type);
  const title = event.titulo || event.title || typeInfo.label;

  return (
    <div
      className={`calendar-event ${event.esPropio ? "own-event" : ""}`}
      title={`${typeInfo.label}: ${title}${event.esPropio ? " (Creado por vos)" : ""}`}
    >
      <span
        className="calendar-event-dot"
        style={{ backgroundColor: typeInfo.color }}
        aria-hidden="true"
      />
      <span className="calendar-event-text">{title}</span>
    </div>
  );
}

export default CalendarEvent;