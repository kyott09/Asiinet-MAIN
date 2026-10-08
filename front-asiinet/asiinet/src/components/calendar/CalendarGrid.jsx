import CalendarDay from "./CalendarDay";

const weekDays = [
  { short: "Lun", full: "Lunes" },
  { short: "Mar", full: "Martes" },
  { short: "Mié", full: "Miércoles" },
  { short: "Jue", full: "Jueves" },
  { short: "Vie", full: "Viernes" },
  { short: "Sáb", full: "Sábado" },
  { short: "Dom", full: "Domingo" },
];

function CalendarGrid({ currentDate, events = [], onDayClick }) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Semanas comenzando lunes (0: domingo -> 6; 1: lunes -> 0)
  const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  const daysInMonth = lastDay.getDate();

  const days = [];
  for (let i = 0; i < startDay; i++) {
    days.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  const today = new Date();
  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() === month;
  const todayDate = isCurrentMonth ? today.getDate() : -1;

  return (
    <div className="calendar-grid" role="region" aria-label="Grilla del calendario">
      {weekDays.map((day) => (
        <div
          key={day.short}
          className="calendar-weekday"
          aria-label={day.full}
        >
          {day.short}
        </div>
      ))}

      {days.map((day, index) => {
        if (day === null) {
          return <CalendarDay key={`empty-${index}`} day={null} />;
        }

        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
          day
        ).padStart(2, "0")}`;

        const dayEvents = events.filter((event) => {
          const evDate = event.fecha || event.date;
          return evDate === dateStr;
        });

        return (
          <CalendarDay
            key={`day-${day}`}
            day={day}
            isToday={day === todayDate}
            events={dayEvents}
            onClick={() => onDayClick(day, dateStr)}
          />
        );
      })}
    </div>
  );
}

export default CalendarGrid;