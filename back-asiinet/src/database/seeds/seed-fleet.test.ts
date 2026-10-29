import assert from "node:assert/strict";
import test from "node:test";
import {
  parseBrandInput,
  parseVehicleCreateInput,
  parseVehicleModelInput,
} from "../../modules/vehicle/vehicle.validation.js";
import { buildFleetSeedPlan } from "./seed-fleet.js";

test("genera cinco marcas, quince modelos y quince vehículos válidos", () => {
  const plan = buildFleetSeedPlan();

  assert.equal(plan.brands.length, 5);
  assert.equal(plan.models.length, 15);
  assert.equal(plan.vehicles.length, 15);

  for (const brand of plan.brands) {
    assert.match(brand.descripcion, /^\[SEED-DEV\]/);
    assert.doesNotThrow(() => parseBrandInput({ descripcion: brand.descripcion }));
  }

  for (const model of plan.models) {
    assert.match(model.descripcion, /^\[SEED-DEV\]/);
    assert.doesNotThrow(() => parseVehicleModelInput({
      descripcion: model.descripcion,
      brandId: 1,
    }));
  }

  for (const vehicle of plan.vehicles) {
    assert.match(vehicle.descripcion, /^\[SEED-DEV\]/);
    assert.doesNotThrow(() => parseVehicleCreateInput({
      patente: vehicle.patente,
      color: vehicle.color,
      descripcion: vehicle.descripcion,
      estado: vehicle.estado,
      anio: vehicle.anio,
      vehicleModelId: 1,
    }));
    assert.equal(vehicle.employee_id, null);
  }
});

test("usa patentes deterministas únicas que cumplen el formato aceptado", () => {
  const { vehicles } = buildFleetSeedPlan();
  const plates = vehicles.map(({ patente }) => patente);

  assert.equal(new Set(plates).size, 15);
  assert.ok(plates.every((plate) => /^[A-Z]{3}\d{3}$/.test(plate)));
});
