/**
 * Pruebas para el módulo de eventos del calendario.
 *
 * Cubren: permisos (middleware simulado), propiedad del creador (servicio
 * simulado), validación Zod del controlador, serialización de esPropio y
 * desfase de zona horaria en fechas.
 *
 * Estilo: node:test + tsx con almacenes simulados, igual que
 * user-management.service.test.ts.
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
  parseEventCreateInput,
  parseEventUpdateInput,
  parseMonthParam,
} from "./event.controller.js";
import { createEventService } from "./event.service.js";
import { hasPermission } from "../../middlewares/auth.js";

// ---------------------------------------------------------------------------
// Helpers de almacén simulado
// ---------------------------------------------------------------------------

type StoredEvent = {
  id: number;
  titulo: string;
  tipo: string;
  fecha: string;
  descripcion: string | null;
  creadorId: number;
  creador: { id: number; nombre: string };
  creadoEn: Date;
  actualizadoEn: Date;
};

function makeStore(initial: StoredEvent[] = []) {
  let nextId = (initial[initial.length - 1]?.id ?? 0) + 1;
  const events = new Map<number, StoredEvent>(initial.map((e) => [e.id, e]));

  return {
    findAll: async () => Array.from(events.values()),
    findById: async (id: number) => events.get(id) ?? null,
    create: async (data: Omit<StoredEvent, "id" | "creadoEn" | "actualizadoEn">) => {
      const now = new Date();
      const ev: StoredEvent = {
        ...data,
        id: nextId++,
        creadoEn: now,
        actualizadoEn: now,
      };
      events.set(ev.id, ev);
      return ev;
    },
    save: async (ev: StoredEvent) => {
      events.set(ev.id, { ...ev, actualizadoEn: new Date() });
      return events.get(ev.id)!;
    },
    remove: async (ev: StoredEvent) => {
      events.delete(ev.id);
    },
  };
}

function makeUserStore(users: Array<{ id: number; nombre: string }>) {
  return {
    findById: async (id: number) => users.find((u) => u.id === id) ?? null,
  };
}

// ---------------------------------------------------------------------------
// 1. Permisos en ROLE_PERMISSIONS
// ---------------------------------------------------------------------------

test("admin tiene calendar:read y calendar:write", () => {
  assert.ok(hasPermission("admin", "calendar:read"));
  assert.ok(hasPermission("admin", "calendar:write"));
});

test("supervisor tiene calendar:read y calendar:write", () => {
  assert.ok(hasPermission("supervisor", "calendar:read"));
  assert.ok(hasPermission("supervisor", "calendar:write"));
});

test("operador tiene calendar:read y calendar:write", () => {
  assert.ok(hasPermission("operador", "calendar:read"));
  assert.ok(hasPermission("operador", "calendar:write"));
});

test("cliente NO tiene calendar:read ni calendar:write", () => {
  assert.equal(hasPermission("cliente", "calendar:read"), false);
  assert.equal(hasPermission("cliente", "calendar:write"), false);
});

// ---------------------------------------------------------------------------
// 2. parseEventCreateInput
// ---------------------------------------------------------------------------

test("parseEventCreateInput acepta payload válido", () => {
  const result = parseEventCreateInput({
    titulo: "Reunión de equipo",
    tipo: "reunion",
    fecha: "2026-10-15",
  });
  assert.equal(result.titulo, "Reunión de equipo");
  assert.equal(result.tipo, "reunion");
  assert.equal(result.fecha, "2026-10-15");
});

test("parseEventCreateInput rechaza título vacío", () => {
  assert.throws(() =>
    parseEventCreateInput({ titulo: "", tipo: "reunion", fecha: "2026-10-15" })
  );
});

test("parseEventCreateInput rechaza título demasiado largo", () => {
  assert.throws(() =>
    parseEventCreateInput({
      titulo: "a".repeat(121),
      tipo: "reunion",
      fecha: "2026-10-15",
    })
  );
});

test("parseEventCreateInput rechaza tipo inválido", () => {
  assert.throws(() =>
    parseEventCreateInput({ titulo: "Test", tipo: "fiesta", fecha: "2026-10-15" })
  );
});

test("parseEventCreateInput rechaza fecha inválida", () => {
  assert.throws(() =>
    parseEventCreateInput({ titulo: "Test", tipo: "reunion", fecha: "2026-13-45" })
  );
});

test("parseEventCreateInput rechaza campos extra como ownerId", () => {
  assert.throws(() =>
    parseEventCreateInput({
      titulo: "Test",
      tipo: "reunion",
      fecha: "2026-10-15",
      ownerId: 99,
    } as object)
  );
});

test("parseEventCreateInput rechaza campo color enviado por el cliente", () => {
  assert.throws(() =>
    parseEventCreateInput({
      titulo: "Test",
      tipo: "reunion",
      fecha: "2026-10-15",
      color: "red",
    } as object)
  );
});

// ---------------------------------------------------------------------------
// 3. parseEventUpdateInput
// ---------------------------------------------------------------------------

test("parseEventUpdateInput acepta actualización parcial válida", () => {
  const result = parseEventUpdateInput({ titulo: "Nuevo título" });
  assert.equal(result.titulo, "Nuevo título");
});

test("parseEventUpdateInput rechaza campos extra", () => {
  assert.throws(() =>
    parseEventUpdateInput({ titulo: "OK", creadorId: 1 } as object)
  );
});

// ---------------------------------------------------------------------------
// 4. parseMonthParam
// ---------------------------------------------------------------------------

test("parseMonthParam acepta formato YYYY-MM", () => {
  const result = parseMonthParam("2026-10");
  assert.equal(result, "2026-10");
});

test("parseMonthParam rechaza formato incorrecto", () => {
  assert.throws(() => parseMonthParam("octubre-2026"));
  assert.throws(() => parseMonthParam("2026/10"));
  assert.throws(() => parseMonthParam("2026-1"));
});

test("parseMonthParam acepta undefined (sin filtro)", () => {
  const result = parseMonthParam(undefined);
  assert.equal(result, undefined);
});

// ---------------------------------------------------------------------------
// 5. Desfase de zona horaria en fechas
// ---------------------------------------------------------------------------

test("la fecha se guarda como YYYY-MM-DD sin desfase de zona horaria", () => {
  const input = parseEventCreateInput({
    titulo: "Test",
    tipo: "reunion",
    fecha: "2026-10-15",
  });
  // La cadena no debe cambiar al parsearse
  assert.equal(input.fecha, "2026-10-15");
  // Verificar que interpretar como UTC local no produce desfase
  const date = new Date(`${input.fecha}T00:00:00.000Z`);
  assert.equal(date.toISOString().slice(0, 10), "2026-10-15");
});

// ---------------------------------------------------------------------------
// 6. Propiedad del creador — servicio simulado
// ---------------------------------------------------------------------------

test("el dueño puede editar su propio evento", async () => {
  const store = makeStore([
    {
      id: 1,
      titulo: "Evento original",
      tipo: "reunion",
      fecha: "2026-10-15",
      descripcion: null,
      creadorId: 10,
      creador: { id: 10, nombre: "Ana" },
      creadoEn: new Date(),
      actualizadoEn: new Date(),
    },
  ]);
  const userStore = makeUserStore([{ id: 10, nombre: "Ana" }]);
  const service = createEventService(store, userStore);

  const result = await service.update(1, { titulo: "Evento editado" }, { id: 10 });
  assert.equal(result.titulo, "Evento editado");
});

test("el dueño puede borrar su propio evento", async () => {
  const store = makeStore([
    {
      id: 2,
      titulo: "A borrar",
      tipo: "otro",
      fecha: "2026-10-20",
      descripcion: null,
      creadorId: 10,
      creador: { id: 10, nombre: "Ana" },
      creadoEn: new Date(),
      actualizadoEn: new Date(),
    },
  ]);
  const userStore = makeUserStore([{ id: 10, nombre: "Ana" }]);
  const service = createEventService(store, userStore);

  await service.remove(2, { id: 10 });
  const found = await store.findById(2);
  assert.equal(found, null);
});

test("otro usuario recibe 403 al intentar editar un evento ajeno", async () => {
  const store = makeStore([
    {
      id: 3,
      titulo: "Evento de Ana",
      tipo: "reunion",
      fecha: "2026-10-15",
      descripcion: null,
      creadorId: 10,
      creador: { id: 10, nombre: "Ana" },
      creadoEn: new Date(),
      actualizadoEn: new Date(),
    },
  ]);
  const userStore = makeUserStore([{ id: 10, nombre: "Ana" }, { id: 20, nombre: "Carlos" }]);
  const service = createEventService(store, userStore);

  await assert.rejects(
    () => service.update(3, { titulo: "Hackeado" }, { id: 20 }),
    (err: { statusCode?: number }) => {
      assert.equal(err.statusCode, 403);
      return true;
    }
  );
});

test("admin recibe 403 al intentar editar un evento ajeno", async () => {
  const store = makeStore([
    {
      id: 4,
      titulo: "Evento de Ana",
      tipo: "capacitacion",
      fecha: "2026-10-15",
      descripcion: null,
      creadorId: 10,
      creador: { id: 10, nombre: "Ana" },
      creadoEn: new Date(),
      actualizadoEn: new Date(),
    },
  ]);
  const userStore = makeUserStore([{ id: 10, nombre: "Ana" }, { id: 1, nombre: "Admin" }]);
  const service = createEventService(store, userStore);

  // El admin (id=1) intenta editar el evento de Ana (creadorId=10)
  await assert.rejects(
    () => service.update(4, { titulo: "Editado por admin" }, { id: 1 }),
    (err: { statusCode?: number }) => {
      assert.equal(err.statusCode, 403);
      return true;
    }
  );
});

test("admin recibe 403 al intentar borrar un evento ajeno", async () => {
  const store = makeStore([
    {
      id: 5,
      titulo: "Evento de Ana",
      tipo: "licencia",
      fecha: "2026-10-15",
      descripcion: null,
      creadorId: 10,
      creador: { id: 10, nombre: "Ana" },
      creadoEn: new Date(),
      actualizadoEn: new Date(),
    },
  ]);
  const userStore = makeUserStore([{ id: 10, nombre: "Ana" }, { id: 1, nombre: "Admin" }]);
  const service = createEventService(store, userStore);

  await assert.rejects(
    () => service.remove(5, { id: 1 }),
    (err: { statusCode?: number }) => {
      assert.equal(err.statusCode, 403);
      return true;
    }
  );
});

// ---------------------------------------------------------------------------
// 7. esPropio en la serialización
// ---------------------------------------------------------------------------

test("esPropio es true cuando el actor es el creador", async () => {
  const store = makeStore([
    {
      id: 6,
      titulo: "Mi evento",
      tipo: "otro",
      fecha: "2026-10-15",
      descripcion: null,
      creadorId: 10,
      creador: { id: 10, nombre: "Ana" },
      creadoEn: new Date(),
      actualizadoEn: new Date(),
    },
  ]);
  const userStore = makeUserStore([{ id: 10, nombre: "Ana" }]);
  const service = createEventService(store, userStore);

  const events = await service.getAll({ id: 10 });
  assert.equal(events[0].esPropio, true);
});

test("esPropio es false para un usuario distinto al creador", async () => {
  const store = makeStore([
    {
      id: 7,
      titulo: "Evento ajeno",
      tipo: "reunion",
      fecha: "2026-10-15",
      descripcion: null,
      creadorId: 10,
      creador: { id: 10, nombre: "Ana" },
      creadoEn: new Date(),
      actualizadoEn: new Date(),
    },
  ]);
  const userStore = makeUserStore([{ id: 10, nombre: "Ana" }, { id: 20, nombre: "Carlos" }]);
  const service = createEventService(store, userStore);

  const events = await service.getAll({ id: 20 });
  assert.equal(events[0].esPropio, false);
});
