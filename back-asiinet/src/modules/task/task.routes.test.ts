import assert from "node:assert/strict";
import express, { type NextFunction, type Request, type Response } from "express";
import http from "node:http";
import jwt from "jsonwebtoken";
import test from "node:test";
import { createRequireAuth, createRequireTaskAccess, type AuthenticatedRequest } from "../../middlewares/auth.js";
import { createTaskRouter } from "./task.routes.js";
import { parseTaskCreateInput, parseTaskUpdateInput } from "./task.controller.js";
import { getBuenosAiresDateOffset } from "./task.test-helpers.js";
import { createTaskService } from "./task.service.js";

const futureDueDate = getBuenosAiresDateOffset(30);

const TEST_JWT_SECRET = "task-route-test-secret";
const testUsers = new Map([
  [1, { id: 1, email: "admin@example.invalid", role: "admin" }],
  [2, { id: 2, email: "supervisor@example.invalid", role: "supervisor" }],
  [3, { id: 3, email: "operator@example.invalid", role: "operador" }],
  [4, { id: 4, email: "client@example.invalid", role: "cliente" }],
]);

const testTasks = new Map([
  [42, { id: 42, clientId: 4, employeeId: 3 }],
  [43, { id: 43, clientId: 20, employeeId: 21 }],
]);

const controllers = {
  getAll: (_req: Request, res: Response) => res.status(200).json({ tasks: [] }),
  create: (req: Request, res: Response) => {
    const role = (req as AuthenticatedRequest).user?.role;
    const payload = parseTaskCreateInput(req.body, role);
    return res.status(201).json({ payload, actorId: (req as AuthenticatedRequest).user?.id });
  },
  update: (req: Request, res: Response) => {
    const actor = (req as AuthenticatedRequest).user!;
    const payload = parseTaskUpdateInput(req.body, actor.role);
    return res.status(200).json({ payload, actorId: actor.id });
  },
  remove: (_req: Request, res: Response) => res.status(200).json({ message: "Tarea eliminada" }),
};

function createTestApp() {
  const auth = createRequireAuth(async (id) => testUsers.get(id) ?? null, TEST_JWT_SECRET);
  const taskAccess = createRequireTaskAccess(async (id) => (testTasks.get(id) ?? null) as any);
  const app = express();
  app.use(express.json());
  app.use("/api/tasks", createTaskRouter(auth, taskAccess, controllers));
  app.use((error: any, _req: Request, res: Response, _next: NextFunction) => {
    res.status(error.statusCode ?? 500).json({ code: error.code, message: error.message });
  });
  return app;
}

function tokenFor(userId: number) {
  return jwt.sign({ id: userId }, TEST_JWT_SECRET, { expiresIn: "5m" });
}

async function request(
  app: express.Express,
  method: string,
  path: string,
  userId?: number,
  body?: unknown
) {
  const server = await new Promise<http.Server>((resolve) => {
    const listeningServer = app.listen(0, "127.0.0.1", () => resolve(listeningServer));
  });
  const address = server.address();
  assert.ok(address && typeof address !== "string");

  try {
    return await new Promise<{ status: number; body: any }>((resolve, reject) => {
      const request = http.request({
        hostname: "127.0.0.1",
        port: address.port,
        path,
        method,
        headers: {
          ...(userId ? { cookie: `token=${tokenFor(userId)}` } : {}),
          ...(body ? { "content-type": "application/json" } : {}),
        },
      }, (response) => {
        let raw = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => { raw += chunk; });
        response.on("end", () => resolve({ status: response.statusCode ?? 0, body: raw ? JSON.parse(raw) : null }));
      });
      request.on("error", reject);
      if (body) request.write(JSON.stringify(body));
      request.end();
    });
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

test("rutas reales aplican auth y permissions; ownership usa un task repository simulado", async () => {
  const app = createTestApp();
  const clientCreateBody = {
    service: "Instalación",
    description: "Solicitud del cliente",
    serviceDetails: {
      equipment: [{ type: "modem", quantity: 1 }],
      speed: "300",
      propertyType: "casa",
    },
  };
  const administrativeCreateBody = {
    clientId: "4",
    employeeId: "3",
    dueDate: futureDueDate,
    description: "Solicitud asignada",
    service: "Instalación",
    priority: "Media",
    status: "Vista",
    serviceDetails: clientCreateBody.serviceDetails,
  };

  assert.equal((await request(app, "POST", "/api/tasks", undefined, clientCreateBody)).status, 401);
  assert.equal((await request(app, "GET", "/api/tasks")).status, 401);

  for (const userId of [1, 2, 3, 4]) {
    assert.equal((await request(app, "GET", "/api/tasks", userId)).status, 200);
  }

  const created = await request(app, "POST", "/api/tasks", 4, clientCreateBody);
  assert.equal(created.status, 201);
  assert.equal(created.body.actorId, 4);
  assert.deepEqual(created.body.payload.serviceDetails, clientCreateBody.serviceDetails);
  assert.equal((await request(app, "POST", "/api/tasks", 4, {
    ...clientCreateBody,
    clientId: 1,
  })).status, 400);

  for (const userId of [1, 2]) {
    const administrativeCreate = await request(app, "POST", "/api/tasks", userId, administrativeCreateBody);
    assert.equal(administrativeCreate.status, 201);
    assert.deepEqual(administrativeCreate.body.payload.serviceDetails, clientCreateBody.serviceDetails);

    const administrativeUpdate = await request(app, "PUT", "/api/tasks/43", userId, administrativeCreateBody);
    assert.equal(administrativeUpdate.status, 200);
    assert.deepEqual(administrativeUpdate.body.payload.serviceDetails, clientCreateBody.serviceDetails);
  }

  const operatorCreateWithDetails = await request(app, "POST", "/api/tasks", 3, administrativeCreateBody);
  assert.equal(operatorCreateWithDetails.status, 400);
  const operatorLegacyCreate = await request(app, "POST", "/api/tasks", 3, {
    clientId: "4",
    employeeId: "3",
    dueDate: futureDueDate,
    description: "Tarea legacy sin detalles",
    service: "Instalación",
  });
  assert.equal(operatorLegacyCreate.status, 201);

  const clientUpdate = await request(app, "PUT", "/api/tasks/42", 4, { description: "Actualización" });
  assert.equal(clientUpdate.status, 200);
  assert.equal(clientUpdate.body.actorId, 4);
  assert.equal((await request(app, "PUT", "/api/tasks/43", 4, { description: "Ajena" })).status, 403);
  assert.equal((await request(app, "PUT", "/api/tasks/43", 4, { description: "Ajena" })).status, 403);

  const assignedOperatorUpdate = await request(app, "PUT", "/api/tasks/42", 3, {
    dueDate: futureDueDate,
    status: "En proceso",
  });
  assert.equal(assignedOperatorUpdate.status, 200);

  const foreignOperatorUpdate = await request(app, "PUT", "/api/tasks/43", 3, {
    dueDate: futureDueDate,
    status: "En proceso",
  });
  assert.equal(foreignOperatorUpdate.status, 403);

  const operatorCannotWriteDetails = await request(app, "PUT", "/api/tasks/42", 3, {
    dueDate: futureDueDate,
    status: "En proceso",
    serviceDetails: clientCreateBody.serviceDetails,
  });
  assert.equal(operatorCannotWriteDetails.status, 400);

  assert.equal((await request(app, "DELETE", "/api/tasks/42", 3)).status, 403);
  assert.equal((await request(app, "DELETE", "/api/tasks/42", 1)).status, 200);
});

test("middleware y servicio permiten gestionar tareas sin operador solo en Vista", async () => {
  const taskStore = new Map<number, any>();
  const taskService = createTaskService({
    tasks: {
      findAll: async () => [...taskStore.values()],
      findById: async (id: number) => taskStore.get(id) ?? null,
      create: async (data: any) => {
        const task = { ...data, id: 44 };
        taskStore.set(task.id, task);
        return task;
      },
      save: async (task: any) => {
        const saved = structuredClone(task);
        taskStore.set(saved.id, saved);
        return saved;
      },
      remove: async (task: any) => taskStore.delete(task.id),
    },
    users: {
      findById: async (id: number) => testUsers.get(id) ?? null,
      findByRoles: async () => [testUsers.get(3)!],
    },
    today: () => getBuenosAiresDateOffset(0),
  } as any);
  const auth = createRequireAuth(async (id) => testUsers.get(id) ?? null, TEST_JWT_SECRET);
  const taskAccess = createRequireTaskAccess(async (id) => taskStore.get(id) ?? null);
  const app = express();
  app.use(express.json());
  app.use("/api/tasks", createTaskRouter(auth, taskAccess, {
    getAll: (_req, res) => res.status(200).json({ tasks: [] }),
    create: async (req, res, next) => {
      try {
        const actor = (req as AuthenticatedRequest).user!;
        const input = parseTaskCreateInput(req.body, actor.role);
        const task = await taskService.create(input as any, actor);
        return res.status(201).json({ task });
      } catch (error) {
        return next(error);
      }
    },
    update: async (req, res, next) => {
      try {
        const actor = (req as AuthenticatedRequest).user!;
        const input = parseTaskUpdateInput(req.body, actor.role);
        const task = await taskService.update(Number(req.params.id), input, actor);
        return res.status(200).json({ task });
      } catch (error) {
        return next(error);
      }
    },
    remove: (_req, res) => res.status(204).end(),
  }));
  app.use((error: any, _req: Request, res: Response, _next: NextFunction) => {
    res.status(error.statusCode ?? 500).json({ code: error.code, message: error.message });
  });

  const details = {
    equipment: [{ type: "modem", quantity: 1 }],
    speed: "300",
    propertyType: "casa",
  };
  const adminUserIds = [1, 2];
  const statuses = ["Vista", "En proceso", "Terminada", "No terminada"];
  const createTask = (employeeAssigned: boolean, status: string) => ({
    id: 42,
    client: "Cliente",
    clientId: 4,
    employee: employeeAssigned ? "Operador" : null,
    employeeId: employeeAssigned ? 3 : null,
    clientUser: testUsers.get(4),
    employeeUser: employeeAssigned ? testUsers.get(3) : null,
    createdAt: getBuenosAiresDateOffset(0),
    dueDate: futureDueDate,
    description: "Descripción inicial",
    service: "Instalación",
    serviceDetails: { ...details, speed: "100" },
    priority: "Media",
    status,
    visitDate: null,
    visitTimeSlot: null,
  });
  const bodyFor = (action: string, employeeAssigned: boolean, status: string) => ({
    clientId: "4",
    ...(employeeAssigned ? { employeeId: "3" } : { employeeId: null }),
    dueDate: futureDueDate,
    description: action === "description" ? "Descripción modificada" : "Descripción inicial",
    service: "Instalación",
    priority: "Media",
    status,
    ...(action === "serviceDetails" ? { serviceDetails: details } : {}),
    ...(action === "visit" ? { visitDate: futureDueDate, visitTimeSlot: "tarde" } : {}),
  });

  for (const visitTimeSlot of [undefined, "manana", "tarde", "noche"]) {
    taskStore.clear();
    const body = {
      service: "Instalación",
      description: "Solicitud del cliente",
      ...(visitTimeSlot ? { visitDate: futureDueDate, visitTimeSlot } : {}),
    };
    const response = await request(app, "POST", "/api/tasks", 4, body);
    assert.equal(response.status, 201);
    assert.equal(response.body.task.visitDate, visitTimeSlot ? futureDueDate : null);
    assert.equal(response.body.task.visitTimeSlot, visitTimeSlot ?? null);
  }
  taskStore.clear();
  const incompleteClientVisit = await request(app, "POST", "/api/tasks", 4, {
    service: "Instalación",
    description: "Solicitud incompleta",
    visitDate: futureDueDate,
  });
  assert.equal(incompleteClientVisit.status, 400);
  assert.equal(incompleteClientVisit.body.code, "BAD_REQUEST");

  for (const userId of adminUserIds) {
    const role = userId === 1 ? "admin" : "supervisor";
    for (const status of statuses) {
      for (const action of ["serviceDetails", "visit", "description"]) {
        taskStore.set(42, createTask(true, status));
        const response = await request(
          app,
          "PUT",
          "/api/tasks/42",
          userId,
          bodyFor(action, true, status)
        );

        assert.equal(response.status, 200, `${role}, ${status}, ${action}: ${response.body?.message}`);
        if (action === "serviceDetails") {
          assert.deepEqual(response.body.task.serviceDetails, details, `${role}, ${status}`);
        }
        if (action === "visit") {
          assert.equal(response.body.task.visitDate, futureDueDate, `${role}, ${status}`);
          assert.equal(response.body.task.visitTimeSlot, "tarde", `${role}, ${status}`);
        }
      }
    }

    for (const action of ["serviceDetails", "visit", "description"]) {
      taskStore.set(42, createTask(false, "Vista"));
      const response = await request(
        app,
        "PUT",
        "/api/tasks/42",
        userId,
        bodyFor(action, false, "Vista")
      );
      assert.equal(response.status, 200, `${role}, Vista sin operador, ${action}: ${response.body?.message}`);
      assert.equal(response.body.task.employeeId, null);
    }

    taskStore.set(42, createTask(false, "Vista"));
    const transition = await request(app, "PUT", "/api/tasks/42", userId, {
      ...bodyFor("description", false, "En proceso"),
    });
    assert.equal(transition.status, 400);
    assert.equal(transition.body.code, "BAD_REQUEST");
    assert.equal(transition.body.message, "Selecciona un operador registrado con rol operador.");

    taskStore.set(42, createTask(true, "Vista"));
    const removeEmployee = await request(app, "PUT", "/api/tasks/42", userId, {
      ...bodyFor("description", true, "Vista"),
      employeeId: null,
    });
    assert.equal(removeEmployee.status, 400);
    assert.equal(removeEmployee.body.code, "BAD_REQUEST");

    const createWithoutEmployee = await request(app, "POST", "/api/tasks", userId, {
      clientId: "4",
      dueDate: futureDueDate,
      description: "Tarea sin operador",
      service: "Instalación",
      priority: "Media",
      status: "Vista",
    });
    assert.equal(createWithoutEmployee.status, 400);
    assert.equal(createWithoutEmployee.body.code, "BAD_REQUEST");
    assert.equal(createWithoutEmployee.body.message, "Selecciona un empleado para asignar la tarea.");
  }
});
