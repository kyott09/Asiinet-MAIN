import type { EstadoVehiculo } from "../../modules/vehicle/vehicle.validation.js";

const SEED_MARKER = "[SEED-DEV]";
const COLORS = ["blanco", "gris", "azul", "rojo", "negro"];
const BRAND_NAMES = [
  "Pampa Motriz",
  "Ruta Sur",
  "Cumbre Movilidad",
  "Litoral Vehículos",
  "Andina Transporte",
];
const MODEL_NAMES = ["Urbano", "Carga", "Ruta"];

export type FleetSeedPlan = {
  brands: Array<{ descripcion: string }>;
  models: Array<{ descripcion: string; brandDescripcion: string }>;
  vehicles: Array<{
    patente: string;
    color: string;
    descripcion: string;
    estado: EstadoVehiculo;
    anio: number;
    modelDescripcion: string;
    employee_id: null;
  }>;
};

export const buildFleetSeedPlan = (): FleetSeedPlan => {
  const brands = BRAND_NAMES.map((name) => ({
    descripcion: `${SEED_MARKER} ${name}`,
  }));
  const models = brands.flatMap((brand, brandIndex) =>
    MODEL_NAMES.map((name, modelIndex) => ({
      descripcion: `${SEED_MARKER} ${name} ${String(modelIndex + 1).padStart(2, "0")}`,
      brandDescripcion: brand.descripcion,
    }))
  );
  const vehicles = models.map((model, index) => ({
    patente: `SDV${String(index + 1).padStart(3, "0")}`,
    color: COLORS[index % COLORS.length],
    descripcion: `${SEED_MARKER} Unidad para inspección técnica y traslados operativos.`,
    estado: "disponible" as const,
    anio: 2018 + index % 9,
    modelDescripcion: model.descripcion,
    employee_id: null,
  }));

  return { brands, models, vehicles };
};
