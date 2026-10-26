import test from "node:test";
import assert from "node:assert/strict";
import express, { type RequestHandler } from "express";
import http from "node:http";
import jwt from "jsonwebtoken";

import { hasPermission } from "../../middlewares/auth.js";
import { createRequireAuth } from "../../middlewares/auth.js";
import {
  parseVehicleCreateInput,
  parseVehicleUpdateInput,
  parsePositiveIntFilter,
  parseBrandInput,
  parseVehicleModelInput,
  formatVehicleResponse,
  isForeignKeyConflict,
} from "./vehicle.validation.js";
import { AppError } from "../../middlewares/errors.js";
import { createBrandRouter } from "../brand/brand.routes.js";
import { createVehicleModelRouter } from "../vehicle-model/vehicle-model.routes.js";
import { createVehicleRouter } from "./vehicle.routes.js";
import { createBrandService } from "../brand/brand.service.js";
import { createVehicleModelService } from "../vehicle-model/vehicle-model.service.js";
import { createVehicleService } from "./vehicle.service.js";

const TEST_JWT_KEY = "vehicle-route-test-key";

function makeTestController(status = 200): RequestHandler {
  return (_req, res) => res.status(status).json({ ok: true });
}

function makeTestApp() {
  const users = new Map([
    [1, { id: 1, email: "admin@test.local", role: "admin" }],
    [2, { id: 2, email: "supervisor@test.local", role: "supervisor" }],
    [3, { id: 3, email: "operador@test.local", role: "operador" }],
    [4, { id: 4, email: "cliente@test.local", role: "cliente" }],
  ]);
  const auth = createRequireAuth(async (id) => users.get(id) ?? null, TEST_JWT_KEY);
  const controllers = {
    getAll: makeTestController(),
    getById: makeTestController(),
    getByBrand: makeTestController(),
    create: makeTestController(),
    update: makeTestController(),
    remove: makeTestController(),
  };
  const app = express();
  app.use(express.json());
  app.use("/brands", createBrandRouter(auth, controllers));
  app.use("/vehicle-models", createVehicleModelRouter(auth, controllers));
  app.use("/vehicles", createVehicleRouter(auth, controllers));
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(err.statusCode ?? 500).json({ message: err.message });
  });
  return app;
}

function tokenFor(id: number) {
  return jwt.sign({ id }, TEST_JWT_KEY, { expiresIn: "5m" });
}

function request(app: express.Express, method: string, path: string, token?: string) {
  return new Promise<{ status: number; body: any }>((resolve, reject) => {
    const server = app.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") return reject(new Error("No port"));
      const req = http.request(
        { hostname: "127.0.0.1", port: address.port, path, method, headers: token ? { cookie: `token=${token}` } : {} },
        (res) => {
          let raw = "";
          res.setEncoding("utf8");
          res.on("data", (chunk) => { raw += chunk; });
          res.on("end", () => {
            server.close();
            resolve({ status: res.statusCode ?? 0, body: raw ? JSON.parse(raw) : null });
          });
        },
      );
      req.on("error", (error) => { server.close(); reject(error); });
      req.end();
    });
  });
}

const routeMatrix = [
  ["GET", "/brands"], ["GET", "/brands/1"], ["POST", "/brands"], ["PUT", "/brands/1"], ["DELETE", "/brands/1"],
  ["GET", "/vehicle-models"], ["GET", "/vehicle-models/by-brand/1"], ["GET", "/vehicle-models/1"], ["POST", "/vehicle-models"], ["PUT", "/vehicle-models/1"], ["DELETE", "/vehicle-models/1"],
  ["GET", "/vehicles"], ["GET", "/vehicles/1"], ["POST", "/vehicles"], ["PUT", "/vehicles/1"], ["DELETE", "/vehicles/1"],
] as const;

test("las 16 rutas de vehículos devuelven 401 sin sesión y 403 para cliente", async () => {
  const app = makeTestApp();
  const clientToken = tokenFor(4);
  for (const [method, path] of routeMatrix) {
    assert.equal((await request(app, method, path)).status, 401, `${method} ${path}`);
    assert.equal((await request(app, method, path, clientToken)).status, 403, `${method} ${path}`);
  }
});

test("operador puede leer y no puede escribir en los tres módulos", async () => {
  const app = makeTestApp();
  const operatorToken = tokenFor(3);
  for (const [method, path] of routeMatrix) {
    const expected = method === "GET" ? 200 : 403;
    assert.equal((await request(app, method, path, operatorToken)).status, expected, `${method} ${path}`);
  }
});

test("admin y supervisor pueden escribir en los tres módulos", async () => {
  const app = makeTestApp();
  for (const id of [1, 2]) {
    const token = tokenFor(id);
    for (const [method, path] of routeMatrix) {
      if (method !== "GET") assert.equal((await request(app, method, path, token)).status, 200, `${method} ${path}`);
    }
  }
});

// ---------------------------------------------------------------------------
// 1. Permisos unificados: vehicles:read y vehicles:write
// ---------------------------------------------------------------------------
test("admin tiene vehicles:read y vehicles:write", () => {
  assert.equal(hasPermission("admin", "vehicles:read"), true);
  assert.equal(hasPermission("admin", "vehicles:write"), true);
});

test("supervisor tiene vehicles:read y vehicles:write", () => {
  assert.equal(hasPermission("supervisor", "vehicles:read"), true);
  assert.equal(hasPermission("supervisor", "vehicles:write"), true);
});

test("operador solo tiene vehicles:read y NO tiene vehicles:write", () => {
  assert.equal(hasPermission("operador", "vehicles:read"), true);
  assert.equal(hasPermission("operador", "vehicles:write"), false);
});

test("cliente NO tiene vehicles:read ni vehicles:write (403)", () => {
  assert.equal(hasPermission("cliente", "vehicles:read"), false);
  assert.equal(hasPermission("cliente", "vehicles:write"), false);
});

// ---------------------------------------------------------------------------
// 2. Validación de Patente (Regex: ^([A-Z]{3}\d{3}|[A-Z]{2}\d{3}[A-Z]{2})$)
// Con trim y toUpperCase ANTES de validar
// ---------------------------------------------------------------------------
test("patente valida formato tradicional argentino (3 letras + 3 numeros)", () => {
  const result = parseVehicleCreateInput({
    patente: "abc123",
    color: "Blanco",
    estado: "disponible",
    vehicleModelId: 1,
  });
  assert.equal(result.patente, "ABC123");
});

test("patente valida formato Mercosur (2 letras + 3 numeros + 2 letras) y aplica trim + upper", () => {
  const result = parseVehicleCreateInput({
    patente: "  ab123cd  ",
    color: "Rojo",
    estado: "en_uso",
    vehicleModelId: 2,
  });
  assert.equal(result.patente, "AB123CD");
});

test("patente rechaza caso invalido: AB123 (muy corta)", () => {
  assert.throws(
    () =>
      parseVehicleCreateInput({
        patente: "AB123",
        color: "Azul",
        estado: "disponible",
        vehicleModelId: 1,
      }),
    (err: any) => err instanceof AppError && err.statusCode === 400
  );
});

test("patente rechaza caso invalido: ABC1234 (demasiados digitos)", () => {
  assert.throws(
    () =>
      parseVehicleCreateInput({
        patente: "ABC1234",
        color: "Azul",
        estado: "disponible",
        vehicleModelId: 1,
      }),
    (err: any) => err instanceof AppError && err.statusCode === 400
  );
});

test("patente rechaza caso invalido: ABC123XYZ (demasiado larga)", () => {
  assert.throws(
    () =>
      parseVehicleCreateInput({
        patente: "ABC123XYZ",
        color: "Azul",
        estado: "disponible",
        vehicleModelId: 1,
      }),
    (err: any) => err instanceof AppError && err.statusCode === 400
  );
});

test("patente rechaza caso invalido: abc 123 (espacio interno)", () => {
  assert.throws(
    () =>
      parseVehicleCreateInput({
        patente: "abc 123",
        color: "Azul",
        estado: "disponible",
        vehicleModelId: 1,
      }),
    (err: any) => err instanceof AppError && err.statusCode === 400
  );
});

// ---------------------------------------------------------------------------
// 3. Campo anio (NULLABLE, rango 1980 hasta año actual + 1)
// ---------------------------------------------------------------------------
test("anio acepta null o undefined (nullable)", () => {
  const res1 = parseVehicleCreateInput({
    patente: "ABC123",
    color: "Gris",
    estado: "disponible",
    vehicleModelId: 1,
    anio: null,
  });
  assert.equal(res1.anio, null);

  const res2 = parseVehicleCreateInput({
    patente: "ABC123",
    color: "Gris",
    estado: "disponible",
    vehicleModelId: 1,
  });
  assert.equal(res2.anio, null);
});

test("anio acepta rango valido [1980 .. anioActual + 1]", () => {
  const currentYear = new Date().getFullYear();
  const resMin = parseVehicleCreateInput({
    patente: "ABC123",
    color: "Gris",
    estado: "disponible",
    vehicleModelId: 1,
    anio: 1980,
  });
  assert.equal(resMin.anio, 1980);

  const resMax = parseVehicleCreateInput({
    patente: "ABC123",
    color: "Gris",
    estado: "disponible",
    vehicleModelId: 1,
    anio: currentYear + 1,
  });
  assert.equal(resMax.anio, currentYear + 1);
});

test("anio rechaza anio anterior a 1980", () => {
  assert.throws(
    () =>
      parseVehicleCreateInput({
        patente: "ABC123",
        color: "Gris",
        estado: "disponible",
        vehicleModelId: 1,
        anio: 1979,
      }),
    (err: any) => err instanceof AppError && err.statusCode === 400
  );
});

test("anio rechaza anio posterior a anioActual + 1", () => {
  const futureYear = new Date().getFullYear() + 2;
  assert.throws(
    () =>
      parseVehicleCreateInput({
        patente: "ABC123",
        color: "Gris",
        estado: "disponible",
        vehicleModelId: 1,
        anio: futureYear,
      }),
    (err: any) => err instanceof AppError && err.statusCode === 400
  );
});

test("anio rechaza numero no entero", () => {
  assert.throws(
    () =>
      parseVehicleCreateInput({
        patente: "ABC123",
        color: "Gris",
        estado: "disponible",
        vehicleModelId: 1,
        anio: 2020.5,
      }),
    (err: any) => err instanceof AppError && err.statusCode === 400
  );
});

// ---------------------------------------------------------------------------
// 4. Estados permitidos: disponible, en_uso, mantenimiento
// ---------------------------------------------------------------------------
test("estado acepta solo disponible, en_uso, mantenimiento", () => {
  for (const estado of ["disponible", "en_uso", "mantenimiento"] as const) {
    const res = parseVehicleCreateInput({
      patente: "ABC123",
      color: "Blanco",
      estado,
      vehicleModelId: 1,
    });
    assert.equal(res.estado, estado);
  }
});

test("estado rechaza cualquier otro valor", () => {
  assert.throws(
    () =>
      parseVehicleCreateInput({
        patente: "ABC123",
        color: "Blanco",
        estado: "inactivo" as any,
        vehicleModelId: 1,
      }),
    (err: any) => err instanceof AppError && err.statusCode === 400
  );
});

// ---------------------------------------------------------------------------
// 5. employee_id no se acepta en payload y se excluye de la respuesta API
// ---------------------------------------------------------------------------
test("employee_id se rechaza al crear o actualizar", () => {
  assert.throws(
    () => parseVehicleCreateInput({
      patente: "ABC123",
      color: "Negro",
      estado: "disponible",
      vehicleModelId: 1,
      employee_id: 99,
    } as any),
    (err: any) => err instanceof AppError && err.statusCode === 400,
  );
  assert.throws(
    () => parseVehicleUpdateInput({ color: "Negro", employee_id: 99 } as any),
    (err: any) => err instanceof AppError && err.statusCode === 400,
  );
});

test("formatVehicleResponse excluye employee_id de la respuesta", () => {
  const vehicle = {
    id: 1,
    patente: "ABC123",
    color: "Rojo",
    descripcion: null,
    estado: "disponible",
    anio: 2022,
    employee_id: 15,
    vehicleModel: { id: 1, descripcion: "Corolla", brand: { id: 1, descripcion: "Toyota" } },
  };

  const formatted = formatVehicleResponse(vehicle as any);
  assert.equal("employee_id" in formatted, false);
  assert.equal(formatted.patente, "ABC123");
  assert.equal(formatted.id, 1);
});

// ---------------------------------------------------------------------------
// 6. Filtros ?brandId y ?modelId validados como enteros positivos
// ---------------------------------------------------------------------------
test("parsePositiveIntFilter acepta enteros positivos validos", () => {
  assert.equal(parsePositiveIntFilter("1", "brandId"), 1);
  assert.equal(parsePositiveIntFilter("42", "modelId"), 42);
  assert.equal(parsePositiveIntFilter(undefined, "brandId"), undefined);
});

test("parsePositiveIntFilter rechaza valores que no sean enteros positivos", () => {
  for (const invalid of ["0", "-5", "abc", "1.2", ""]) {
    assert.throws(
      () => parsePositiveIntFilter(invalid, "brandId"),
      (err: any) => err instanceof AppError && err.statusCode === 400
    );
  }
});

// ---------------------------------------------------------------------------
// 7. Validación de Marcas y Modelos
// ---------------------------------------------------------------------------
test("parseBrandInput valida descripcion requerida", () => {
  const res = parseBrandInput({ descripcion: "  Toyota  " });
  assert.equal(res.descripcion, "Toyota");

  assert.throws(
    () => parseBrandInput({ descripcion: "   " }),
    (err: any) => err instanceof AppError && err.statusCode === 400
  );
});

test("parseVehicleModelInput valida descripcion y brandId positivo", () => {
  const res = parseVehicleModelInput({ descripcion: "Hilux", brandId: 3 });
  assert.equal(res.descripcion, "Hilux");
  assert.equal(res.brandId, 3);

  assert.throws(
    () => parseVehicleModelInput({ descripcion: "Hilux", brandId: -1 }),
    (err: any) => err instanceof AppError && err.statusCode === 400
  );
});

test("parseVehicleUpdateInput permite actualizacion parcial y valida campos presentes", () => {
  const res = parseVehicleUpdateInput({
    color: "Azul Marino",
    estado: "mantenimiento",
  });
  assert.equal(res.color, "Azul Marino");
  assert.equal(res.estado, "mantenimiento");
  assert.equal(res.patente, undefined);
});

// ---------------------------------------------------------------------------
// 8. Detección de errores de clave foránea de base de datos
// ---------------------------------------------------------------------------
test("isForeignKeyConflict detecta errores de FK en MySQL/TypeORM", () => {
  assert.equal(isForeignKeyConflict({ code: "ER_ROW_IS_REFERENCED_2" }), true);
  assert.equal(isForeignKeyConflict({ errno: 1451 }), true);
  assert.equal(isForeignKeyConflict({ driverError: { code: "ER_ROW_IS_REFERENCED_2" } }), true);
  assert.equal(isForeignKeyConflict(new Error("otro error")), false);
});

test("rechaza id y employee_id como campos extra en vehículos", () => {
  for (const extraField of ["id", "employee_id"]) {
    assert.throws(
      () => parseVehicleCreateInput({
        patente: "ABC123",
        color: "Blanco",
        estado: "disponible",
        vehicleModelId: 1,
        [extraField]: 99,
      }),
      (err: any) => err instanceof AppError && err.statusCode === 400,
    );
  }

  assert.throws(
    () => parseVehicleUpdateInput({ color: "Azul", id: 1, employee_id: 9 }),
    (err: any) => err instanceof AppError && err.statusCode === 400,
  );
});

test("rechaza campos extra en marcas y modelos", () => {
  assert.throws(
    () => parseBrandInput({ descripcion: "Toyota", id: 1 }),
    (err: any) => err instanceof AppError && err.statusCode === 400,
  );
  assert.throws(
    () => parseVehicleModelInput({ descripcion: "Hilux", brandId: 1, id: 1 }),
    (err: any) => err instanceof AppError && err.statusCode === 400,
  );
});

test("rechaza color y descripción demasiado largos", () => {
  assert.throws(
    () => parseVehicleCreateInput({
      patente: "ABC123",
      color: "x".repeat(51),
      estado: "disponible",
      vehicleModelId: 1,
    }),
    (err: any) => err instanceof AppError && err.statusCode === 400,
  );
  assert.throws(
    () => parseVehicleCreateInput({
      patente: "ABC123",
      color: "Blanco",
      descripcion: "x".repeat(501),
      estado: "disponible",
      vehicleModelId: 1,
    }),
    (err: any) => err instanceof AppError && err.statusCode === 400,
  );
});

test("marca duplicada devuelve conflicto y el borrado con modelos devuelve conflicto", async () => {
  const deleteBrand = async () => undefined;
  const service = createBrandService({
    findAll: async () => [],
    findById: async () => ({ id: 1, descripcion: "Toyota" }),
    findByDescripcion: async () => ({ id: 2, descripcion: "Toyota" }),
    createBrand: async () => ({ id: 3, descripcion: "Toyota" }),
    updateBrand: async () => ({ id: 1, descripcion: "Toyota" }),
    deleteBrand,
    findByBrandId: async () => [{ id: 5 }],
  } as any);

  await assert.rejects(() => service.create({ descripcion: "Toyota" }), (err: any) => err.statusCode === 409);
  await assert.rejects(() => service.remove(1), (err: any) => err.statusCode === 409);
});

test("borrar una marca sin dependencias es válido y el conflicto FK se traduce a 409", async () => {
  const base = {
    findAll: async () => [],
    findById: async () => ({ id: 1, descripcion: "Toyota" }),
    findByDescripcion: async () => null,
    createBrand: async () => ({ id: 1, descripcion: "Toyota" }),
    updateBrand: async () => ({ id: 1, descripcion: "Toyota" }),
    findByBrandId: async () => [],
  };
  const deleted = createBrandService({ ...base, deleteBrand: async () => undefined } as any);
  await deleted.remove(1);

  const fk = createBrandService({ ...base, deleteBrand: async () => { throw { errno: 1451 }; } } as any);
  await assert.rejects(() => fk.remove(1), (err: any) => err.statusCode === 409);
});

test("borrar un modelo con vehículos devuelve conflicto y sin dependencias es válido", async () => {
  const service = createVehicleModelService({
    findAll: async () => [],
    findById: async () => ({ id: 1, descripcion: "Hilux", brand: { id: 1 } }),
    findByBrandId: async () => [],
    createVehicleModel: async () => ({ id: 2, descripcion: "Hilux" }),
    updateVehicleModel: async () => ({ id: 1, descripcion: "Hilux" }),
    deleteVehicleModel: async () => undefined,
    findBrandById: async () => ({ id: 1, descripcion: "Toyota" }),
    findVehiclesByModelId: async () => [{ id: 8 }],
  } as any);

  await assert.rejects(() => service.remove(1), (err: any) => err.statusCode === 409);

  const clearService = createVehicleModelService({
    findAll: async () => [],
    findById: async () => ({ id: 1, descripcion: "Hilux", brand: { id: 1 } }),
    findByBrandId: async () => [],
    createVehicleModel: async () => ({ id: 2, descripcion: "Hilux" }),
    updateVehicleModel: async () => ({ id: 1, descripcion: "Hilux" }),
    deleteVehicleModel: async () => undefined,
    findBrandById: async () => ({ id: 1, descripcion: "Toyota" }),
    findVehiclesByModelId: async () => [],
  } as any);
  await clearService.remove(1);
});

test("patente duplicada devuelve conflicto", async () => {
  const service = createVehicleService({
    findAll: async () => [],
    findById: async () => null,
    findByPatente: async () => ({ id: 8, patente: "ABC123" }),
    createVehicle: async () => ({ id: 9 }),
    updateVehicle: async () => null,
    deleteVehicle: async () => undefined,
    findVehicleModelById: async () => ({ id: 1 }),
  } as any);

  await assert.rejects(
    () => service.create({ patente: "ABC123", color: "Blanco", estado: "disponible", vehicleModelId: 1 }),
    (err: any) => err.statusCode === 409,
  );
});
