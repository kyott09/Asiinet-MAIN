export const NO_TASK_VISIT_LABEL: "A coordinar";

export const TASK_VISIT_TIME_SLOTS: readonly [
  { readonly value: "manana"; readonly label: "Mañana" },
  { readonly value: "tarde"; readonly label: "Tarde" },
  { readonly value: "noche"; readonly label: "Noche" },
];

export type TaskVisitTimeSlot = typeof TASK_VISIT_TIME_SLOTS[number]["value"];

export function formatTaskVisitDate(value: string | null | undefined): string;
export function getTaskVisitTimeSlotLabel(value: TaskVisitTimeSlot | null | undefined): string;
export function formatTaskVisit(
  visitDate: string | null | undefined,
  visitTimeSlot: TaskVisitTimeSlot | null | undefined
): string;
