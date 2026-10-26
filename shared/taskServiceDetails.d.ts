export type TaskServiceName = "Instalación" | "Reconexión" | "Servicio técnico" | "Desconexión";

export type TaskServiceDetailOption = {
  value: string;
  label: string;
};

export type TaskServiceDetailField = {
  name: string;
  label: string;
  type: "select" | "multiSelect" | "equipmentList";
  required: boolean;
  maxLength?: number;
  minItems?: number;
  maxItems?: number;
  minQuantity?: number;
  maxQuantity?: number;
  options: TaskServiceDetailOption[];
};

export const SERVICE_DETAIL_OPTIONS: Record<TaskServiceName, TaskServiceDetailField[]>;

export function validateTaskServiceDetails(service: TaskServiceName, details: unknown): Record<string, string>;

export function getTaskServiceDetailEntries(
  service: TaskServiceName,
  details: Record<string, unknown> | null | undefined
): Array<{ label: string; value: string }>;
