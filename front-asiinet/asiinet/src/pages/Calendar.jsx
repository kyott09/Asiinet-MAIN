import { useCallback, useEffect, useState } from "react";
import AccountActions from "../components/dashboard/AccountActions";
import DashboardSidebar from "../components/dashboard/DashboardSidebar";
import CalendarHeader from "../components/calendar/CalendarHeader";
import CalendarGrid from "../components/calendar/CalendarGrid";
import CalendarEventModal from "../components/calendar/CalendarEventModal";
import { calendarService } from "../services/calendarService";
import { EVENT_TYPE_LIST } from "../constants/calendarTypes";
import "../components/calendar/Calendar.css";
import "./Calendar.css";

function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalInitialMode, setModalInitialMode] = useState("list");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const currentYear = currentDate.getFullYear();
  const currentMonthNum = currentDate.getMonth() + 1;
  const currentMonthStr = `${currentYear}-${String(currentMonthNum).padStart(2, "0")}`;

  const refreshEvents = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let active = true;

    calendarService
      .getEvents(currentMonthStr)
      .then((data) => {
        if (!active) return;
        setEvents(Array.isArray(data) ? data : []);
        setFetchError("");
      })
      .catch((err) => {
        if (!active) return;
        setFetchError(
          err.message || "No se pudieron cargar los eventos del calendario."
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [currentMonthStr, refreshTrigger]);

  const showToast = (message) => {
    setFeedbackMessage(message);
    setTimeout(() => {
      setFeedbackMessage("");
    }, 4000);
  };

  const handlePreviousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
    setSelectedDateStr("");
    setShowModal(false);
  };

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
    setSelectedDateStr("");
    setShowModal(false);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    setSelectedDateStr("");
    setShowModal(false);
  };

  const handleDayClick = (_day, dateStr) => {
    setSelectedDateStr(dateStr);
    const dayEvents = events.filter((e) => (e.fecha || e.date) === dateStr);
    setModalInitialMode(dayEvents.length === 0 ? "create" : "list");
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleSaveEvent = async (eventData, editId) => {
    if (editId) {
      await calendarService.updateEvent(editId, eventData);
      showToast("Evento actualizado correctamente.");
    } else {
      await calendarService.createEvent(eventData);
      showToast("Evento creado correctamente.");
    }
    refreshEvents();
  };

  const handleDeleteEvent = async (id) => {
    await calendarService.deleteEvent(id);
    showToast("Evento eliminado correctamente.");
    refreshEvents();
  };

  const formattedSelectedDate = selectedDateStr
    ? new Date(`${selectedDateStr}T00:00:00`).toLocaleDateString("es-ES", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  const selectedDayEvents = events.filter(
    (event) => (event.fecha || event.date) === selectedDateStr
  );

  return (
    <div className="dashboard-layout">
      <DashboardSidebar />

      <main className="dashboard-content calendar-page" id="main-content">
        <AccountActions />

        <div className="calendar-page-header">
          <div>
            <h1>Calendario</h1>
            <p className="calendar-page-subtitle">
              Planificación y eventos internos del equipo operativo
            </p>
          </div>
        </div>

        {/* Leyenda de tipos */}
        <div className="calendar-legend" aria-label="Tipos de eventos">
          <span className="calendar-legend-title">Tipos de evento:</span>
          <div className="calendar-legend-items">
            {EVENT_TYPE_LIST.map((t) => (
              <div key={t.id} className="calendar-legend-item">
                <span
                  className="calendar-legend-dot"
                  style={{ backgroundColor: t.color }}
                  aria-hidden="true"
                />
                <span className="calendar-legend-label">{t.label}</span>
              </div>
            ))}
          </div>
        </div>

        {fetchError && (
          <div className="calendar-alert calendar-alert-error" role="alert">
            <i className="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
            <span>{fetchError}</span>
            <button
              type="button"
              className="calendar-alert-retry"
              onClick={refreshEvents}
            >
              Reintentar
            </button>
          </div>
        )}

        <div className="calendar-container">
          <CalendarHeader
            currentDate={currentDate}
            onPreviousMonth={handlePreviousMonth}
            onNextMonth={handleNextMonth}
            onToday={handleToday}
          />

          {loading ? (
            <div className="calendar-loading-skeleton" aria-live="polite">
              <span className="calendar-loading-spinner" aria-hidden="true" />
              <span>Cargando eventos…</span>
            </div>
          ) : (
            <CalendarGrid
              currentDate={currentDate}
              events={events}
              onDayClick={handleDayClick}
            />
          )}
        </div>

        {showModal && (
          <CalendarEventModal
            selectedDate={formattedSelectedDate}
            dateStr={selectedDateStr}
            events={selectedDayEvents}
            initialMode={modalInitialMode}
            onClose={handleCloseModal}
            onSave={handleSaveEvent}
            onDelete={handleDeleteEvent}
          />
        )}

        {feedbackMessage && (
          <div
            className="calendar-success-message"
            role="status"
            aria-live="polite"
          >
            <i className="fa-solid fa-check" aria-hidden="true"></i>{" "}
            {feedbackMessage}
          </div>
        )}
      </main>
    </div>
  );
}

export default Calendar;