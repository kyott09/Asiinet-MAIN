import CalendarEvent from "./CalendarEvent";

function CalendarDay({ day, events = [], onClick }) {
  return (
    <div
      className={`calendar-day ${day === null ? "empty" : ""}`}
      onClick={day !== null ? onClick : undefined}
    >
      {day && (
        <>
          <span className="calendar-day-number">{day}</span>

          <div className="calendar-events">
            {events.map((event) => (
              <CalendarEvent
                key={event.id}
                title={event.title}
                type={event.type}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default CalendarDay;