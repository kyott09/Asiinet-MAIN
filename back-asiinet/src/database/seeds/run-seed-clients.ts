import "dotenv/config";
import { pathToFileURL } from "node:url";
import { In, type EntityManager } from "typeorm";
import { Task } from "../../modules/task/task.entity.js";
import { User } from "../../modules/user/user.entity.js";
import {
  buildClientSeedPlan,
  createSeededClientTasks,
  hashSeedDevPassword,
  selectClientRequestsToCreate,
} from "./seed-clients.js";
import {
  assertNoSeedCollisions,
  assertSeedApplyAllowed,
  assertSeedCleanupAllowed,
  createSeedDataSource,
  formatBuenosAiresDate,
  parseSeedArgs,
  runSeedMode,
  seedDataSourceConfigFromEnvironment,
  selectMissingSeedRecords,
} from "./seed-runtime.js";

const SEED_MARKER = "[SEED-DEV]";

const inspectClients = async (manager: EntityManager, plan: ReturnType<typeof buildClientSeedPlan>) => {
  const usersRepository = manager.getRepository(User);
  const tasksRepository = manager.getRepository(Task);
  const plannedByEmail = new Map(plan.clients.map((client) => [client.email, client]));
  const existingUsers = await usersRepository.find({
    where: { email: In([...plannedByEmail.keys()]) },
    select: { id: true, email: true, nombre: true, role: true },
  });
  const clientIds = existingUsers.map(({ id }) => id);
  const existingTasks = clientIds.length === 0
    ? []
    : await tasksRepository.createQueryBuilder("task")
      .innerJoin("task.clientUser", "client")
      .select(["task.id", "task.description"])
      .where("client.id IN (:...clientIds)", { clientIds })
      .getMany();
  const emailCollisions = existingUsers.filter((user) => {
    const planned = plannedByEmail.get(user.email);
    return !planned || user.nombre !== planned.nombre || user.role !== "cliente";
  }).length;
  const markedTasks = existingTasks.filter((task) => task.description.startsWith(SEED_MARKER));
  const unmarkedTaskCount = existingTasks.length - markedTasks.length;
  const counts = {
    emailRowsFound: existingUsers.length,
    emailsToCreate: plan.clients.length - existingUsers.length,
    emailsAlreadyExist: existingUsers.length,
    taskRowsFound: existingTasks.length,
    requestsToCreate: selectClientRequestsToCreate(plan, markedTasks.length).length,
    requestsAlreadyExist: markedTasks.length,
    requestRowsWithoutMarker: unmarkedTaskCount,
    emailCollisions,
    requestCollisions: unmarkedTaskCount,
  };

  return {
    existingUsers,
    existingTasks,
    markedTaskCount: markedTasks.length,
    counts,
    collisions: {
      emails: emailCollisions,
      requests: unmarkedTaskCount,
    },
  };
};

const persistClients = async (
  manager: EntityManager,
  plan: ReturnType<typeof buildClientSeedPlan>,
  inspection: Awaited<ReturnType<typeof inspectClients>>
) => {
  const usersRepository = manager.getRepository(User);
  const existingEmails = new Set(inspection.existingUsers.map(({ email }) => email));
  const missingClients = selectMissingSeedRecords(plan.clients, existingEmails, ({ email }) => email);
  if (missingClients.length > 0) {
    const passwordHash = await hashSeedDevPassword();
    for (const client of missingClients) {
      await usersRepository.save(usersRepository.create({
        nombre: client.nombre,
        email: client.email,
        passwordHash,
        role: "cliente",
      }));
    }
  }

  const allUsers = await usersRepository.find({
    where: { email: In(plan.clients.map(({ email }) => email)) },
    select: { id: true, email: true, nombre: true, role: true },
  });
  const usersByClientIndex = new Map(
    plan.clients.map((client, index) => {
      const user = allUsers.find(({ email }) => email === client.email);
      if (!user) throw new Error("No se pudo resolver una cuenta semilla.");
      return [index + 1, user] as const;
    })
  );
  const requests = selectClientRequestsToCreate(plan, inspection.markedTaskCount);
  if (requests.length === 0) return;

  const ids = allUsers.map(({ id }) => id);
  const taskRepository = manager.getRepository(Task);
  const taskService = (await import("../../modules/task/task.service.js")).createTaskService({
    tasks: {
      findAll: () => taskRepository.find({ where: { clientUser: { id: In(ids) } } }),
      findById: (id) => taskRepository.findOne({ where: { id } }),
      create: (data) => taskRepository.save(taskRepository.create(data)),
      save: (task) => taskRepository.save(task),
      remove: (task) => taskRepository.remove(task),
    },
    users: {
      findById: (id) => usersRepository.findOneBy({ id }),
      findByRoles: async () => [],
    },
  });

  await createSeededClientTasks({ ...plan, requests }, usersByClientIndex, taskService);
};

const inspectClientCleanup = async (
  manager: EntityManager,
  plan: ReturnType<typeof buildClientSeedPlan>
) => {
  const users = await manager.getRepository(User).find({
    where: { email: In(plan.clients.map(({ email }) => email)) },
    select: { id: true, email: true, nombre: true, role: true },
  });
  const ids = users.map(({ id }) => id);
  const tasks = ids.length === 0
    ? []
    : await manager.getRepository(Task).createQueryBuilder("task")
      .innerJoin("task.clientUser", "client")
      .select(["task.id", "task.description"])
      .where("client.id IN (:...ids)", { ids })
      .getMany();
  const markedTasks = tasks.filter(({ description }) => description.startsWith(SEED_MARKER));
  const collisions = tasks.length - markedTasks.length;
  const emailCollisions = users.filter((user) =>
    !user.nombre.startsWith(SEED_MARKER) || user.role !== "cliente"
  ).length;
  return {
    users,
    tasks: markedTasks,
    counts: {
      emailRowsFound: users.length,
      clientsToDelete: users.length,
      taskRowsFound: tasks.length,
      requestsToDelete: markedTasks.length,
      unmarkedLinkedRequests: collisions,
      emailCollisions,
    },
    collisions: { requests: collisions, emails: emailCollisions },
  };
};

const persistClientCleanup = async (
  manager: EntityManager,
  inspection: Awaited<ReturnType<typeof inspectClientCleanup>>
) => {
  const taskRepository = manager.getRepository(Task);
  const userRepository = manager.getRepository(User);
  if (inspection.tasks.length > 0) {
    await taskRepository.delete(inspection.tasks.map(({ id }) => id));
  }
  if (inspection.users.length > 0) {
    await userRepository.delete(inspection.users.map(({ id }) => id));
  }
};

export async function runSeedClients(args = process.argv.slice(2)) {
  const options = parseSeedArgs(args);
  const config = seedDataSourceConfigFromEnvironment();
  assertSeedApplyAllowed({
    apply: options.apply,
    nodeEnv: process.env.NODE_ENV,
    host: config.host,
    database: config.database,
    confirmedDatabase: options.confirmedDatabase,
  });
  assertSeedCleanupAllowed({ apply: options.apply && options.clean, confirmedCleanup: options.confirmedCleanup });

  const plan = buildClientSeedPlan(formatBuenosAiresDate(new Date()));
  const dataSource = createSeedDataSource(config);
  await dataSource.initialize();
  try {
    if (options.clean) {
      const execute = async (manager: EntityManager) => runSeedMode({
        apply: options.apply,
        inspect: () => inspectClientCleanup(manager, plan),
        report: ({ counts }) => console.log(JSON.stringify(counts)),
        validate: ({ collisions }) => assertNoSeedCollisions(collisions),
        persist: (inspection) => persistClientCleanup(manager, inspection),
      });
      if (options.apply) {
        await dataSource.transaction(execute);
      } else {
        await execute(dataSource.manager);
      }
      return;
    }

    const execute = async (manager: EntityManager) => runSeedMode({
      apply: options.apply,
      inspect: () => inspectClients(manager, plan),
      report: ({ counts }) => console.log(JSON.stringify(counts)),
      validate: ({ collisions }) => assertNoSeedCollisions(collisions),
      persist: (inspection) => persistClients(manager, plan, inspection),
    });
    if (options.apply) {
      await dataSource.transaction(execute);
    } else {
      await execute(dataSource.manager);
    }
  } finally {
    await dataSource.destroy();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runSeedClients().catch((error: unknown) => {
    const message = error instanceof Error && error.message.startsWith("No se permite")
      ? error.message
      : "Seeder de clientes detenido; no se muestran datos de conexión ni datos personales.";
    console.error(message);
    process.exitCode = 1;
  });
}
