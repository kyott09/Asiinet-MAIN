import assert from "node:assert/strict";
import express, { type NextFunction, type Request, type Response } from "express";
import http from "node:http";
import jwt from "jsonwebtoken";
import test from "node:test";
import { createRequireAuth } from "../../middlewares/auth.js";
import { createTaskRouter } from "./task.routes.js";
import { createGetAllTasksController, parseTaskListQuery } from "./task.controller.js";
import { createTaskService } from "./task.service.js";

const TEST_JWT_SECRET = "task-pagination-test-secret";
const actors = new Map([
  [1, { id: 1, email: "operator@example.invalid", role: "operador" }],
  [2, { id: 2, email: "client@example.invalid", role: "cliente" }],
  [3, { id: 3, email: "admin@example.invalid", role: "admin" }],
  [4, { id: 4, email: "supervisor@example.invalid", role: "supervisor" }],
]);

const rows = [
  { id: 10, clientId: 2, employeeId: 1, client: "Cliente", employee: "Operador", service: "Instalación", status: "Vista" },
  { id: 11, clientId: 2, employeeId: 8, client: "Cliente", employee: "Otro", service: "Reconexión", status: "Vista" },
  { id: 12, clientId: 9, employeeId: 1, client: "Otro cliente", employee: "Operador", service: "Instalación", status: "Vista" },
  { id: 13, clientId: 9, employeeId: 8, client: "Otro cliente", employee: "Otro", service: "Reconexión", status: "Terminada" },
].map((row) => ({
  ...row,
  createdAt: "2026-03-01",
  dueDate: null,
  description: `Solicitud ${row.id}`,
  priority: "Baja",
  serviceDetails: null,
  visitDate: null,
  visitTimeSlot: null,
}));

function createHarness() {
  const repositoryCalls: any[] = [];
  const taskService = createTaskService({
    tasks: {
      findAll: async () => rows,
      findPage: async (input: any) => {
        repositoryCalls.push(input);
        const scopedRows = rows.filter((row) => {
          if (input.actor?.role === "operador") return row.employeeId === input.actor.id;
          if (input.actor?.role === "cliente") return row.clientId === input.actor.id;
          return true;
        });
        const filteredRows = scopedRows.filter((row) =>
          (!input.filters.status || input.filters.status === "todos"
            || (input.filters.status === "vista" && row.status === "Vista")
            || (input.filters.status === "en_proceso" && row.status === "En proceso")
            || (input.filters.status === "terminada" && row.status === "Terminada")
            || (input.filters.status === "cancelacion" && row.status === "No terminada"))
          && (!input.filters.q || `${row.id} ${row.client} ${row.employee} ${row.service} ${row.description} ${row.status}`
            .toLowerCase().includes(input.filters.q.toLowerCase()))
        );
        const orderedRows = [...filteredRows].sort((a, b) => a.id - b.id);
        const start = (input.page - 1) * input.pageSize;
        return {
          tasks: orderedRows.slice(start, start + input.pageSize),
          total: orderedRows.length,
        };
      },
      findById: async () => null,
      create: async () => { throw new Error("not used"); },
      save: async () => { throw new Error("not used"); },
      remove: async () => undefined,
    } as any,
    users: {
      findById: async () => null,
      findByRoles: async () => [],
    } as any,
  });
  const auth = createRequireAuth(async (id) => actors.get(id) ?? null, TEST_JWT_SECRET);
  const app = express();
  app.use(express.json());
  app.use("/api/tasks", createTaskRouter(auth, undefined, {
    getAll: createGetAllTasksController(taskService),
    create: (_req: Request, res: Response) => res.status(201).json({}),
    update: (_req: Request, res: Response) => res.status(200).json({}),
    remove: (_req: Request, res: Response) => res.status(200).json({}),
  }));
  app.use((error: any, _req: Request, res: Response, _next: NextFunction) => {
    res.status(error.statusCode ?? 500).json({
      status: "error",
      code: error.code,
      message: error.message,
    });
  });
  return { app, repositoryCalls };
}

async function request(app: express.Express, path: string, userId?: number) {
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
        method: "GET",
        headers: userId
          ? { cookie: `token=${jwt.sign({ id: userId }, TEST_JWT_SECRET, { expiresIn: "5m" })}` }
          : {},
      }, (response) => {
        let raw = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => { raw += chunk; });
        response.on("end", () => resolve({
          status: response.statusCode ?? 0,
          body: raw ? JSON.parse(raw) : null,
        }));
      });
      request.on("error", reject);
      request.end();
    });
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) =>
      error ? reject(error) : resolve()
    ));
  }
}

test("el parser estricto acepta parámetros válidos y rechaza valores inválidos o extras", () => {
  assert.deepEqual(parseTaskListQuery({
    page: "2",
    pageSize: "30",
    q: "instalación",
    status: "vista",
  }), {
    page: 2,
    pageSize: 30,
    q: "instalación",
    status: "vista",
  });

  for (const query of [
    { page: "abc" },
    { page: "0" },
    { page: "9007199254740991" },
    { pageSize: "101" },
    { page: "1", other: "unexpected" },
    { page: ["1", "2"] },
    { q: "sin paginación" },
  ]) {
    assert.throws(() => parseTaskListQuery(query), { code: "BAD_REQUEST" });
  }
});

test("la compatibilidad sin parámetros mantiene colección completa y forma original", async () => {
  const { app, repositoryCalls } = createHarness();
  const response = await request(app, "/api/tasks", 3);

  assert.equal(response.status, 200);
  assert.deepEqual(Object.keys(response.body), ["tasks"]);
  assert.deepEqual(response.body.tasks.map((task: any) => task.id), [10, 11, 12, 13]);
  assert.equal(repositoryCalls.length, 0);
});

test("sin parámetros, supervisor mantiene la colección completa y la respuesta heredada", async () => {
  const { app, repositoryCalls } = createHarness();
  const response = await request(app, "/api/tasks", 4);

  assert.equal(response.status, 200);
  assert.deepEqual(Object.keys(response.body), ["tasks"]);
  assert.deepEqual(response.body.tasks.map((task: any) => task.id), [10, 11, 12, 13]);
  assert.equal(repositoryCalls.length, 0);
});

test("sin parámetros, operador y cliente mantienen el alcance y la respuesta heredada", async () => {
  const { app } = createHarness();
  const operatorResponse = await request(app, "/api/tasks", 1);
  const clientResponse = await request(app, "/api/tasks", 2);

  assert.deepEqual(operatorResponse.body, {
    tasks: rows.filter((row) => row.employeeId === 1).map((row) => ({
      ...row,
      number: row.id,
      dueDate: "",
    })),
  });
  assert.deepEqual(clientResponse.body, {
    tasks: rows.filter((row) => row.clientId === 2).map((row) => ({
      ...row,
      number: row.id,
      dueDate: "",
    })),
  });
});

test("middleware devuelve 400 con error estándar para query inválida", async () => {
  const { app } = createHarness();
  const response = await request(app, "/api/tasks?page=0", 3);

  assert.equal(response.status, 400);
  assert.equal(response.body.status, "error");
  assert.equal(response.body.code, "BAD_REQUEST");
  assert.equal(response.body.message, "Debe ser un entero positivo");
});

test("middleware y repositorio simulado cuentan tareas del operador antes de paginar", async () => {
  const { app, repositoryCalls } = createHarness();
  const response = await request(app, "/api/tasks?page=1&pageSize=1", 1);

  assert.equal(response.status, 200);
  assert.deepEqual(response.body.tasks.map((task: any) => task.id), [10]);
  assert.deepEqual(response.body.meta, {
    page: 1,
    pageSize: 1,
    total: 2,
    totalPages: 2,
  });
  assert.deepEqual(repositoryCalls[0].actor, { id: 1, role: "operador" });
});

test("middleware y repositorio simulado no exponen al cliente el total global", async () => {
  const { app, repositoryCalls } = createHarness();
  const response = await request(app, "/api/tasks?page=1&pageSize=10", 2);

  assert.equal(response.status, 200);
  assert.deepEqual(response.body.tasks.map((task: any) => task.id), [10, 11]);
  assert.equal(response.body.meta.total, 2);
  assert.notEqual(response.body.meta.total, rows.length);
  assert.deepEqual(repositoryCalls[0].actor, { id: 2, role: "cliente" });
});

test("filas con los mismos valores de estado y fecha mantienen el desempate por id", async () => {
  const { app } = createHarness();
  const response = await request(app, "/api/tasks?page=1&pageSize=10&status=vista", 3);

  assert.equal(response.status, 200);
  assert.deepEqual(response.body.tasks.map((task: any) => task.id), [10, 11, 12]);
  assert.equal(new Set(response.body.tasks.map((task: any) => task.createdAt)).size, 1);
  assert.equal(new Set(response.body.tasks.map((task: any) => task.status)).size, 1);
});

test("el orden mantiene desempate estable por id y la página fuera de rango es vacía", async () => {
  const { app } = createHarness();
  const response = await request(app, "/api/tasks?page=9&pageSize=2", 3);

  assert.equal(response.status, 200);
  assert.deepEqual(response.body.tasks, []);
  assert.deepEqual(response.body.meta, {
    page: 9,
    pageSize: 2,
    total: 4,
    totalPages: 2,
  });
});
