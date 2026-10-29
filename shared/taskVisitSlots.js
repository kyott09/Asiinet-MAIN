export const NO_TASK_VISIT_LABEL = "A coordinar";

export const TASK_VISIT_TIME_SLOTS = [
  { value: "manana", label: "Mañana" },
  { value: "tarde", label: "Tarde" },
  { value: "noche", label: "Noche" },
];

export function formatTaskVisitDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value ?? "";
  }

  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

export function getTaskVisitTimeSlotLabel(value) {
  return TASK_VISIT_TIME_SLOTS.find((slot) => slot.value === value)?.label ?? "";
}

export function formatTaskVisit(visitDate, visitTimeSlot) {
  if (!visitDate || !visitTimeSlot) return NO_TASK_VISIT_LABEL;
  const timeSlotLabel = getTaskVisitTimeSlotLabel(visitTimeSlot);
  if (!timeSlotLabel) return NO_TASK_VISIT_LABEL;
  return `${formatTaskVisitDate(visitDate)} · ${timeSlotLabel}`;
}
