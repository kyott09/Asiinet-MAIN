import { useState } from "react";
import DashboardSidebar from "../components/dashboard/DashboardSidebar";
import AccountActions from "../components/dashboard/AccountActions";
import CalendarHeader from "../components/calendar/CalendarHeader";
import CalendarGrid from "../components/calendar/CalendarGrid";
import CalendarEventModal from "../components/calendar/CalendarEventModal";
import "../components/calendar/Calendar.css";

function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [events, setEvents] = useState([]);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const handlePreviousMonth = () => {
    setCurrentDate(
      new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - 1,
        1
      )
    );

    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        1
      )
    );

    setSelectedDay(null);
  };

  const handleDayClick = (day) => {
    setSelectedDay(day);
    setShowEventModal(true);
    setShowEventForm(false);
  };

  const handleCloseModal = () => {
    setShowEventModal(false);
    setShowEventForm(false);
  };

  const handleAddEvent = () => {
    setShowEventForm(true);
  };

  const handleSaveEvent = (eventData) => {
    const eventDate = `${currentDate.getFullYear()}-${String(
      currentDate.getMonth() + 1
    ).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`;

    const newEvent = {
      id: Date.now(),
      date: eventDate,
      title: eventData.description,
      type: eventData.type,
    };

    setEvents((previousEvents) => [
      ...previousEvents,
      newEvent,
    ]);

    setShowEventModal(false);
    setShowEventForm(false);

    // Mostrar mensaje de confirmación
    setShowSuccessMessage(true);

    // Ocultar el mensaje después de 3 segundos
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 4000);
  };

  const selectedDate =
    selectedDay !== null
      ? new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          selectedDay
        ).toLocaleDateString("es-ES", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "";

  const selectedEvents = events.filter((event) => {
    const eventDate = `${currentDate.getFullYear()}-${String(
      currentDate.getMonth() + 1
    ).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`;

    return event.date === eventDate;
  });

  return (
    <div className="dashboard-layout">
      <DashboardSidebar />

      <main className="dashboard-content calendar-page">
        <AccountActions />
        <h1>Calendario</h1>

        <div className="calendar-container">
          <CalendarHeader
            currentDate={currentDate}
            onPreviousMonth={handlePreviousMonth}
            onNextMonth={handleNextMonth}
          />

          <CalendarGrid
            currentDate={currentDate}
            events={events}
            onDayClick={handleDayClick}
          />
        </div>

        {showEventModal && (
          <CalendarEventModal
            selectedDate={selectedDate}
            events={showEventForm ? [] : selectedEvents}
            onClose={handleCloseModal}
            onSave={handleSaveEvent}
            onAddEvent={handleAddEvent}
          />
        )}

        {showEventForm && (
          <CalendarEventModal
            selectedDate={selectedDate}
            events={[]}
            onClose={handleCloseModal}
            onSave={handleSaveEvent}
            onAddEvent={handleAddEvent}
          />
        )}

        {showSuccessMessage && (
          <div className="calendar-success-message">
            ✓ El evento se agregó correctamente.
          </div>
        )}
      </main>
    </div>
  );
}

export default Calendar;