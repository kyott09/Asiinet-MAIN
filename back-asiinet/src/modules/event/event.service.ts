import { AppError } from "../../middlewares/errors.js";
import { eventRepository, IEventRepository } from "./event.repository.js";

export interface EventActor {
  id: number;
}

export interface CreateEventData {
  titulo: string;
  tipo: string;
  fecha: string;
  descripcion?: string | null;
}

export interface UpdateEventData {
  titulo?: string;
  tipo?: string;
  fecha?: string;
  descripcion?: string | null;
}

export interface EventItemLike {
  id: number;
  titulo: string;
  tipo: string;
  fecha: string;
  descripcion: string | null;
  creadorId: number;
}

export interface IEventStore<T extends EventItemLike = EventItemLike> {
  findAll: () => Promise<T[]>;
  findById: (id: number) => Promise<T | null>;
  create: (data: any) => Promise<T>;
  save: (event: T) => Promise<T>;
  remove: (event: T) => Promise<void>;
}

export function createEventService<T extends EventItemLike = EventItemLike>(
  eventStore: IEventStore<T>,
  _userStore?: unknown
) {
  return {
    getAll: async (actor: EventActor, month?: string) => {
      let events = await eventStore.findAll();
      if (month) {
        events = events.filter(
          (e) => typeof e.fecha === "string" && e.fecha.startsWith(month)
        );
      }
      return events.map((e) => ({
        ...e,
        esPropio: e.creadorId === actor.id,
      }));
    },

    getById: async (id: number, actor: EventActor) => {
      const event = await eventStore.findById(id);
      if (!event) {
        throw AppError.notFound("Evento no encontrado");
      }
      return {
        ...event,
        esPropio: event.creadorId === actor.id,
      };
    },

    create: async (data: CreateEventData, actor: EventActor) => {
      const created = await eventStore.create({
        ...data,
        descripcion: data.descripcion ?? null,
        creadorId: actor.id,
      });

      return {
        ...created,
        esPropio: true,
      };
    },

    update: async (id: number, data: UpdateEventData, actor: EventActor) => {
      const event = await eventStore.findById(id);
      if (!event) {
        throw AppError.notFound("Evento no encontrado");
      }

      if (event.creadorId !== actor.id) {
        throw AppError.forbidden("Solo el creador puede modificar este evento");
      }

      Object.assign(event, data);
      const saved = await eventStore.save(event);

      return {
        ...saved,
        esPropio: true,
      };
    },

    remove: async (id: number, actor: EventActor) => {
      const event = await eventStore.findById(id);
      if (!event) {
        throw AppError.notFound("Evento no encontrado");
      }

      if (event.creadorId !== actor.id) {
        throw AppError.forbidden("Solo el creador puede eliminar este evento");
      }

      await eventStore.remove(event);
    },
  };
}

export const eventService = createEventService(eventRepository);
