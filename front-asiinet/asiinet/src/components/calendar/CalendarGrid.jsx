import CalendarDay from "./CalendarDay";

const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function CalendarGrid({ currentDate, events = [], onDayClick }) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Ajustamos para que la semana comience el lunes
  const startDay =
    firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

  const daysInMonth = lastDay.getDate();

  const days = [];

  // Días vacíos antes del primer día del mes
  for (let i = 0; i < startDay; i++) {
    days.push(null);
  }

  // Días del mes
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  return (
    <div className="calendar-grid">
      {weekDays.map((day) => (
        <div key={day} className="calendar-weekday">
          {day}
        </div>
      ))}

      {days.map((day, index) => {
        const dayEvents = events.filter((event) => {
          return (
            event.date ===
            `${year}-${String(month + 1).padStart(2, "0")}-${String(
              day
            ).padStart(2, "0")}`
          );
        });

        return (
          <CalendarDay
            key={index}
            day={day}
            events={dayEvents}
            onClick={() => day !== null && onDayClick(day)}
          />
        );
      })}
    </div>
  );
}

export default CalendarGrid;