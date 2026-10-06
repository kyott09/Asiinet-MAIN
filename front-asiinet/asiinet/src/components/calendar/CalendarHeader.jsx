function CalendarHeader({ currentDate, onPreviousMonth, onNextMonth }) {
  const month = currentDate.toLocaleString("es-ES", {
    month: "long",
  });

  const year = currentDate.getFullYear();

  return (
    <div className="calendar-header">
      <button onClick={onPreviousMonth} type="button">
        ←
      </button>

      <h2>
        {month.charAt(0).toUpperCase() + month.slice(1)} {year}
      </h2>

      <button onClick={onNextMonth} type="button">
        →
      </button>
    </div>
  );
}

export default CalendarHeader;