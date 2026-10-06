function CalendarEventModal({
  selectedDate,
  events = [],
  onClose,
  onSave,
  onAddEvent,
}) {
  const handleSubmit = (event) => {
    event.preventDefault();

    const formData = new FormData(event.target);

    const description = formData.get("description");
    const type = formData.get("type");

    onSave({
      description,
      type,
    });
  };

  return (
    <div className="calendar-modal-overlay">
      <div className="calendar-modal">
        <button
          className="calendar-modal-close"
          onClick={onClose}
          type="button"
        >
          ×
        </button>

        <h2>{events.length > 0 ? "Eventos del día" : "Nuevo evento"}</h2>

        <p className="calendar-modal-date">
          {selectedDate}
        </p>

        {events.length > 0 && (
          <>
            <div className="calendar-event-list">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="calendar-event-detail"
                >
                  <div className="calendar-event-detail-header">
                    <span
                      className={`calendar-event-dot ${event.type}`}
                    ></span>

                    <strong>
                      {event.type === "reunion" && "Reunión"}
                      {event.type === "cumpleanos" && "Cumpleaños"}
                      {event.type === "trabajo" && "Trabajo"}
                      {event.type === "otro" && "Otro"}
                    </strong>
                  </div>

                  <p>{event.title}</p>
                </div>
              ))}
            </div>

            <button
              className="calendar-add-event-button"
              type="button"
              onClick={onAddEvent}
            >
              +
            </button>
          </>
        )}

        {events.length === 0 && (
          <form onSubmit={handleSubmit}>
            <label htmlFor="description">
              Descripción
            </label>

            <textarea
              id="description"
              name="description"
              placeholder="Escribí la descripción del evento..."
              required
            />

            <label htmlFor="type">
              Tipo de evento
            </label>

            <select
              id="type"
              name="type"
              defaultValue="reunion"
            >
              <option value="reunion">Reunión</option>
              <option value="cumpleanos">Cumpleaños</option>
              <option value="trabajo">Trabajo</option>
              <option value="otro">Otro</option>
            </select>

            <div className="calendar-modal-actions">
              <button
                type="button"
                onClick={onClose}
              >
                Cancelar
              </button>

              <button type="submit">
                Guardar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default CalendarEventModal;