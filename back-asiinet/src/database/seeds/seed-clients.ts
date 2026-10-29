import bcrypt from "bcrypt";
import { SERVICE_DETAIL_OPTIONS, type TaskServiceName } from "../../../../shared/taskServiceDetails.js";
import { TASK_VISIT_TIME_SLOTS } from "../../../../shared/taskVisitSlots.js";
import { parseTaskCreateInput, type TaskInput } from "../../modules/task/task.controller.js";
import { createTaskService } from "../../modules/task/task.service.js";
import type { User } from "../../modules/user/user.entity.js";
import { addDaysToDateOnly } from "./seed-runtime.js";

// La clave es exclusiva para desarrollo; --apply exige NODE_ENV no productivo, host local y confirmación de base.
export const SEED_DEV_PASSWORD = "Seed-Dev-2026!";
const SEED_MARKER = "[SEED-DEV]";
const SERVICES = Object.keys(SERVICE_DETAIL_OPTIONS) as TaskServiceName[];
const DESCRIPTION_FRAGMENTS = [
  "Revisar la conexión del servicio solicitado",
  "Coordinar asistencia para el equipo de red",
  "Verificar el funcionamiento de la instalación",
  "Atender una consulta técnica del servicio",
  "Preparar la solicitud para el equipo operativo",
];

export type ClientSeedPlan = {
  clients: Array<{ index: number; nombre: string; email: string }>;
  requests: Array<{
    clientIndex: number;
    body: {
      description: string;
      service: TaskServiceName;
      serviceDetails: Record<string, unknown>;
      visitDate?: string;
      visitTimeSlot?: string;
    };
  }>;
};

const fieldOptions = (service: TaskServiceName, fieldName: string) => {
  const field = SERVICE_DETAIL_OPTIONS[service].find(({ name }) => name === fieldName);
  if (!field) throw new Error(`Falta la opción compartida ${service}.${fieldName}.`);
  return field;
};

const optionAt = (service: TaskServiceName, fieldName: string, index: number) => {
  const options = fieldOptions(service, fieldName).options;
  if (options.length === 0) throw new Error(`No hay opciones para ${service}.${fieldName}.`);
  return options[index % options.length].value;
};

const buildServiceDetails = (service: TaskServiceName, index: number) => {
  if (service === "Instalación") {
    const equipment = fieldOptions(service, "equipment");
    return {
      equipment: [{
        type: optionAt(service, "equipment", index),
        quantity: (equipment.minQuantity ?? 1) + (index % (
          (equipment.maxQuantity ?? 1) - (equipment.minQuantity ?? 1) + 1
        )),
      }],
      speed: optionAt(service, "speed", index),
      propertyType: optionAt(service, "propertyType", index),
    };
  }
  if (service === "Reconexión") {
    const availableEquipment = fieldOptions(service, "availableEquipment");
    return {
      reason: optionAt(service, "reason", index),
      availableEquipment: index % 2 === 0
        ? [availableEquipment.options[index % availableEquipment.options.length].value]
        : [],
    };
  }
  if (service === "Servicio técnico") {
    const equipmentOptions = fieldOptions(service, "affectedEquipment").options;
    return {
      problem: optionAt(service, "problem", index),
      affectedEquipment: [equipmentOptions[index % equipmentOptions.length].value],
    };
  }
  return {
    reason: optionAt(service, "reason", index),
    equipmentReturn: optionAt(service, "equipmentReturn", index),
  };
};

export const buildClientSeedPlan = (today: string): ClientSeedPlan => {
  const parsedToday = new Date(`${today}T00:00:00.000Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(today) ||
    Number.isNaN(parsedToday.getTime()) ||
    parsedToday.toISOString().slice(0, 10) !== today
  ) {
    throw new Error("La fecha de referencia del seeder debe tener formato YYYY-MM-DD.");
  }

  const clients = Array.from({ length: 20 }, (_, index) => {
    const number = String(index + 1).padStart(2, "0");
    return {
      index: index + 1,
      nombre: `${SEED_MARKER} Cliente ${number}`,
      email: `cliente${number}@seed.invalid`,
    };
  });

  const requests = Array.from({ length: 50 }, (_, index) => {
    const clientIndex = index % clients.length + 1;
    const round = Math.floor(index / clients.length);
    const service = SERVICES[(clientIndex - 1 + round) % SERVICES.length];
    const description = `${SEED_MARKER} ${DESCRIPTION_FRAGMENTS[index % DESCRIPTION_FRAGMENTS.length]} (${String(index + 1).padStart(2, "0")})`;
    const body: ClientSeedPlan["requests"][number]["body"] = {
      description,
      service,
      serviceDetails: buildServiceDetails(service, index),
    };

    if (index % 2 === 0) {
      body.visitDate = addDaysToDateOnly(today, 1 + index % 21);
      body.visitTimeSlot = TASK_VISIT_TIME_SLOTS[index % TASK_VISIT_TIME_SLOTS.length].value;
    }

    return { clientIndex, body };
  });

  return { clients, requests };
};

export const selectClientRequestsToCreate = (
  plan: ClientSeedPlan,
  existingSeededRequestCount: number
) => existingSeededRequestCount > 0 ? [] : plan.requests;

export const hashSeedDevPassword = () => bcrypt.hash(SEED_DEV_PASSWORD, 10);

export const createSeededClientTasks = async (
  plan: ClientSeedPlan,
  usersByClientIndex: ReadonlyMap<number, User>,
  taskService: Pick<ReturnType<typeof createTaskService>, "create">
) => {
  const created = [];
  for (const { clientIndex, body } of plan.requests) {
    const user = usersByClientIndex.get(clientIndex);
    if (!user) throw new Error("Falta un cliente semilla requerido para crear solicitudes.");
    const input = parseTaskCreateInput(body, "cliente") as TaskInput;
    created.push(await taskService.create(input, { id: user.id, role: "cliente" }));
  }
  return created;
};
