import { AppDataSource } from "../../database/data-source.js";
import { Task } from "../task/task.entity.js";
import { User } from "./user.entity.js";
import type { UserManagementStore } from "./user-management.service.js";

export const userManagementStore: UserManagementStore = {
  async findAll() {
    return AppDataSource.getRepository(User).find({
      order: { id: "ASC" },
    });
  },

  async findByEmail(email) {
    return AppDataSource.getRepository(User).findOneBy({ email });
  },

  async create(data) {
    const repository = AppDataSource.getRepository(User);
    return repository.save(repository.create(data));
  },

  async withAdminRowsLocked(operation) {
    return AppDataSource.transaction(async (manager) => {
      const users = manager.getRepository(User);
      const admins = await users
        .createQueryBuilder("user")
        .setLock("pessimistic_write")
        .where("user.role = :role", { role: "admin" })
        .orderBy("user.id", "ASC")
        .getMany();
      const tasks = manager.getRepository(Task);

      return operation(admins, {
        findByIdForUpdate: (id) =>
          users.findOne({
            where: { id },
            lock: { mode: "pessimistic_write" },
          }),
        findByEmail: (email) => users.findOneBy({ email }),
        countTaskAssignments: async (id) => ({
          client: await tasks.count({ where: { clientUser: { id } } }),
          employee: await tasks.count({ where: { employeeUser: { id } } }),
        }),
        updateUser: async (id, data) => {
          const user = await users.findOneBy({ id });
          if (!user) return null;

          Object.assign(user, data);
          return users.save(user);
        },
        deleteUser: async (id) => {
          const user = await users.findOneBy({ id });
          if (!user) return false;

          await users.remove(user);
          return true;
        },
      });
    });
  },
};
