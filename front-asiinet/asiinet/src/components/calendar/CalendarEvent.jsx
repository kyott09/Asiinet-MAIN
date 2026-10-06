function CalendarEvent({ title = "", type = "" }) {
  if (!title) {
    return null;
  }

  const eventLabels = {
    reunion: "Reunión",
    cumpleanos: "Cumpleaños",
    trabajo: "Trabajo",
    otro: "Otro",
  };

  return (
    <div className={`calendar-event ${type}`}>
      <span className="calendar-event-dot"></span>

      <span className="calendar-event-type">
        {eventLabels[type] || "Otro"}
      </span>
    </div>
  );
}

export default CalendarEvent;