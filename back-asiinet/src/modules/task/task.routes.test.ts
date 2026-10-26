import assert from "node:assert/strict";
import express, { type NextFunction, type Request, type Response } from "express";
import http from "node:http";
import jwt from "jsonwebtoken";
import test from "node:test";
import { createRequireAuth, createRequireTaskAccess, type AuthenticatedRequest } from "../../middlewares/auth.js";
import { createTaskRouter } from "./task.routes.js";
import { parseTaskCreateInput, parseTaskUpdateInput } from "./task.controller.js";

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
    dueDate: "2026-10-27",
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
    dueDate: "2026-10-27",
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
    dueDate: "2026-10-27",
    status: "En proceso",
  });
  assert.equal(assignedOperatorUpdate.status, 200);

  const foreignOperatorUpdate = await request(app, "PUT", "/api/tasks/43", 3, {
    dueDate: "2026-10-27",
    status: "En proceso",
  });
  assert.equal(foreignOperatorUpdate.status, 403);

  const operatorCannotWriteDetails = await request(app, "PUT", "/api/tasks/42", 3, {
    dueDate: "2026-10-27",
    status: "En proceso",
    serviceDetails: clientCreateBody.serviceDetails,
  });
  assert.equal(operatorCannotWriteDetails.status, 400);

  assert.equal((await request(app, "DELETE", "/api/tasks/42", 3)).status, 403);
  assert.equal((await request(app, "DELETE", "/api/tasks/42", 1)).status, 200);
});