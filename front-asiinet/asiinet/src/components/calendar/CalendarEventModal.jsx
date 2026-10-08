import { useEffect, useRef, useState } from "react";
import { EVENT_TYPE_LIST, getEventTypeInfo } from "../../constants/calendarTypes";

function CalendarEventModal({
  selectedDate,
  dateStr,
  events = [],
  initialMode = "list", // "list" | "create"
  onClose,
  onSave,
  onDelete,
}) {
  const [mode, setMode] = useState(
    events.length === 0 ? "create" : initialMode
  );
  const [editingEvent, setEditingEvent] = useState(null);
  const [deletingEvent, setDeletingEvent] = useState(null);
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState("reunion");
  const [descripcion, setDescripcion] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const modalRef = useRef(null);
  const firstInputRef = useRef(null);
  const headingRef = useRef(null);

  // Manejo de foco y Escape
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        if (mode === "delete_confirm") {
          setDeletingEvent(null);
          setMode("list");
        } else if (mode === "edit" || (mode === "create" && events.length > 0)) {
          setMode("list");
          setErrorMsg("");
        } else {
          onClose();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mode, events.length, onClose]);

  // Enfocar al cambiar de modo
  useEffect(() => {
    if (mode === "create" || mode === "edit") {
      firstInputRef.current?.focus();
    } else {
      headingRef.current?.focus();
    }
  }, [mode]);

  const handleStartCreate = () => {
    setTitulo("");
    setTipo("reunion");
    setDescripcion("");
    setErrorMsg("");
    setEditingEvent(null);
    setMode("create");
  };

  const handleStartEdit = (event) => {
    if (!event.esPropio) return;
    setEditingEvent(event);
    setTitulo(event.titulo || event.title || "");
    setTipo(event.tipo || event.type || "reunion");
    setDescripcion(event.descripcion || "");
    setErrorMsg("");
    setMode("edit");
  };

  const handleStartDelete = (event) => {
    if (!event.esPropio) return;
    setDeletingEvent(event);
    setMode("delete_confirm");
  };

  const handleCancelForm = () => {
    setErrorMsg("");
    if (events.length > 0) {
      setMode("list");
      setEditingEvent(null);
    } else {
      onClose();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanTitle = titulo.trim();
    if (!cleanTitle) {
      setErrorMsg("El título del evento es obligatorio.");
      return;
    }
    if (cleanTitle.length > 120) {
      setErrorMsg("El título no puede superar los 120 caracteres.");
      return;
    }
    if (descripcion && descripcion.length > 500) {
      setErrorMsg("La descripción no puede superar los 500 caracteres.");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg("");

      const payload = {
        titulo: cleanTitle,
        tipo,
        fecha: dateStr,
        descripcion: descripcion.trim() || null,
      };

      if (mode === "edit" && editingEvent) {
        await onSave(payload, editingEvent.id);
      } else {
        await onSave(payload);
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.message || "Error al guardar el evento.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingEvent) return;
    try {
      setSubmitting(true);
      await onDelete(deletingEvent.id);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || "Error al eliminar el evento.");
      setMode("list");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="calendar-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div
        className="calendar-modal"
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="calendar-modal-title"
      >
        <button
          className="calendar-modal-close"
          onClick={onClose}
          type="button"
          aria-label="Cerrar modal"
          disabled={submitting}
        >
          ×
        </button>

        {/* MODO LISTA */}
        {mode === "list" && (
          <>
            <h2 id="calendar-modal-title" ref={headingRef} tabIndex={-1}>
              Eventos del día
            </h2>
            <p className="calendar-modal-date">{selectedDate}</p>

            {errorMsg && (
              <div className="calendar-modal-error" role="alert">
                {errorMsg}
              </div>
            )}

            <div className="calendar-event-list">
              {events.map((event) => {
                const typeInfo = getEventTypeInfo(event.tipo || event.type);
                const creatorName =
                  event.creador?.nombre ||
                  event.creador?.email ||
                  (event.esPropio ? "Vos" : "Otro usuario");

                return (
                  <div
                    key={event.id}
                    className={`calendar-event-card ${
                      event.esPropio ? "own-card" : "other-card"
                    }`}
                  >
                    <div className="calendar-event-card-header">
                      <div className="calendar-event-card-type-tag">
                        <span
                          className="calendar-event-dot"
                          style={{ backgroundColor: typeInfo.color }}
                          aria-hidden="true"
                        />
                        <span className="calendar-event-type-label">
                          {typeInfo.label}
                        </span>
                      </div>

                      {event.esPropio ? (
                        <div className="calendar-event-card-actions">
                          <button
                            type="button"
                            className="calendar-event-icon-btn edit-btn"
                            onClick={() => handleStartEdit(event)}
                            title="Editar mi evento"
                            aria-label={`Editar evento: ${event.titulo || event.title}`}
                          >
                            <i className="fa-solid fa-pen" aria-hidden="true"></i>
                          </button>
                          <button
                            type="button"
                            className="calendar-event-icon-btn delete-btn"
                            onClick={() => handleStartDelete(event)}
                            title="Eliminar mi evento"
                            aria-label={`Eliminar evento: ${event.titulo || event.title}`}
                          >
                            <i className="fa-solid fa-trash" aria-hidden="true"></i>
                          </button>
                        </div>
                      ) : (
                        <span
                          className="calendar-readonly-badge"
                          title="Solo lectura: este evento fue creado por otro usuario"
                        >
                          <i className="fa-solid fa-lock" aria-hidden="true"></i> Solo lectura
                        </span>
                      )}
                    </div>

                    <h3 className="calendar-event-card-title">
                      {event.titulo || event.title}
                    </h3>

                    {event.descripcion && (
                      <p className="calendar-event-card-desc">
                        {event.descripcion}
                      </p>
                    )}

                    <div className="calendar-event-card-footer">
                      <span className="calendar-event-creator-tag">
                        <i className="fa-solid fa-user" aria-hidden="true"></i>{" "}
                        {event.esPropio ? "Creado por vos" : `Creado por ${creatorName}`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="calendar-modal-list-actions">
              <button
                className="calendar-btn calendar-btn-primary"
                type="button"
                onClick={handleStartCreate}
              >
                <i className="fa-solid fa-plus" aria-hidden="true"></i> Nuevo evento
              </button>
              <button
                className="calendar-btn calendar-btn-secondary"
                type="button"
                onClick={onClose}
              >
                Cerrar
              </button>
            </div>
          </>
        )}

        {/* MODO FORMULARIO: CREAR O EDITAR */}
        {(mode === "create" || mode === "edit") && (
          <form onSubmit={handleSubmit} noValidate>
            <h2 id="calendar-modal-title" ref={headingRef} tabIndex={-1}>
              {mode === "edit" ? "Editar evento" : "Nuevo evento"}
            </h2>
            <p className="calendar-modal-date">{selectedDate}</p>

            {errorMsg && (
              <div className="calendar-modal-error" role="alert">
                {errorMsg}
              </div>
            )}

            <div className="calendar-form-group">
              <label htmlFor="event-titulo">
                Título del evento <span className="calendar-required">*</span>
              </label>
              <input
                id="event-titulo"
                type="text"
                ref={firstInputRef}
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                maxLength={120}
                placeholder="Ej. Reunión de equipo, Cumpleaños de Lucas..."
                required
                disabled={submitting}
              />
            </div>

            <div className="calendar-form-group">
              <label htmlFor="event-tipo">Tipo de evento</label>
              <div className="calendar-type-selector">
                <select
                  id="event-tipo"
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  disabled={submitting}
                >
                  {EVENT_TYPE_LIST.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <span
                  className="calendar-type-preview-dot"
                  style={{ backgroundColor: getEventTypeInfo(tipo).color }}
                  aria-hidden="true"
                />
              </div>
              <p className="calendar-field-hint">
                El color está predeterminado por el tipo de evento elegido.
              </p>
            </div>

            <div className="calendar-form-group">
              <label htmlFor="event-descripcion">Descripción (opcional)</label>
              <textarea
                id="event-descripcion"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                maxLength={500}
                placeholder="Detalles adicionales, temario o notas..."
                rows={3}
                disabled={submitting}
              />
            </div>

            <div className="calendar-modal-actions">
              <button
                type="button"
                className="calendar-btn calendar-btn-secondary"
                onClick={handleCancelForm}
                disabled={submitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="calendar-btn calendar-btn-primary"
                disabled={submitting}
              >
                {submitting
                  ? "Guardando…"
                  : mode === "edit"
                  ? "Guardar cambios"
                  : "Crear evento"}
              </button>
            </div>
          </form>
        )}

        {/* MODO CONFIRMACIÓN DE ELIMINACIÓN */}
        {mode === "delete_confirm" && (
          <div className="calendar-delete-confirm">
            <h2 id="calendar-modal-title" ref={headingRef} tabIndex={-1}>
              Eliminar evento
            </h2>
            <p className="calendar-delete-warning">
              ¿Estás seguro de que querés eliminar el evento{" "}
              <strong>“{deletingEvent?.titulo || deletingEvent?.title}”</strong>?
            </p>
            <p className="calendar-field-hint">
              Esta acción no se puede deshacer. Solo vos podés eliminar este evento.
            </p>

            {errorMsg && (
              <div className="calendar-modal-error" role="alert">
                {errorMsg}
              </div>
            )}

            <div className="calendar-modal-actions">
              <button
                type="button"
                className="calendar-btn calendar-btn-secondary"
                onClick={() => {
                  setErrorMsg("");
                  setMode("list");
                }}
                disabled={submitting}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="calendar-btn calendar-btn-danger"
                onClick={handleConfirmDelete}
                disabled={submitting}
              >
                {submitting ? "Eliminando…" : "Eliminar evento"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CalendarEventModal;