import test from "node:test";
import assert from "node:assert/strict";

import { hasPermission } from "../../middlewares/auth.js";
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
test("employee_id es ignorado/excluido al crear o actualizar", () => {
  const result = parseVehicleCreateInput({
    patente: "ABC123",
    color: "Negro",
    estado: "disponible",
    vehicleModelId: 1,
    employee_id: 99,
  } as any);

  assert.equal((result as any).employee_id, undefined);
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
