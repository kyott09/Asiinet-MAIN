export type TaskFormPayload = {
  clientId?: string | number;
  employeeId?: string | number;
  dueDate?: string;
  description: string;
  service: string;
  priority?: string;
  status?: string;
  serviceDetails?: unknown;
};

export function buildTaskPayload(input: {
  role: string;
  editingId: number | string | null;
  form: TaskFormPayload;
}): Record<string, unknown> | null;
