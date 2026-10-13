import { AppDataSource } from "../../database/data-source.js";
import { Event } from "./event.entity.js";

const repo = () => AppDataSource.getRepository(Event);

export interface IEventRepository {
  findAll: () => Promise<Event[]>;
  findById: (id: number) => Promise<Event | null>;
  create: (data: Partial<Event>) => Promise<Event>;
  save: (event: Event) => Promise<Event>;
  remove: (event: Event) => Promise<void>;
}

export const eventRepository: IEventRepository = {
  findAll: async () =>
    repo().find({
      relations: { creador: true },
      order: { fecha: "ASC", id: "ASC" },
    }),

  findById: async (id: number) =>
    repo().findOne({
      where: { id },
      relations: { creador: true },
    }),

  create: async (data: Partial<Event>) =>
    repo().save(repo().create(data)),

  save: async (event: Event) =>
    repo().save(event),

  remove: async (event: Event) => {
    await repo().remove(event);
  },
};
