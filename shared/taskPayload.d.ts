export type TaskFormPayload = {
  clientId?: string | number;
  employeeId?: string | number | null;
  dueDate?: string;
  description: string;
  service: string;
  priority?: string;
  status?: string;
  serviceDetails?: unknown;
  visitDate?: string | null;
  visitTimeSlot?: string | null;
};

export function buildTaskPayload(input: {
  role: string;
  editingId: number | string | null;
  form: TaskFormPayload;
  canWriteVisit?: boolean;
}): Record<string, unknown> | null;
