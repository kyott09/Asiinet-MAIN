import "dotenv/config";
import { pathToFileURL } from "node:url";
import { In, type EntityManager } from "typeorm";
import { Brand } from "../../modules/brand/brand.entity.js";
import { VehicleModel } from "../../modules/vehicle-model/vehicle-model.entity.js";
import { Vehicle } from "../../modules/vehicle/vehicle.entity.js";
import {
  parseBrandInput,
  parseVehicleCreateInput,
  parseVehicleModelInput,
} from "../../modules/vehicle/vehicle.validation.js";
import { buildFleetSeedPlan } from "./seed-fleet.js";
import {
  assertNoSeedCollisions,
  assertSeedApplyAllowed,
  assertSeedCleanupAllowed,
  createSeedDataSource,
  parseSeedArgs,
  runSeedMode,
  seedDataSourceConfigFromEnvironment,
  selectMissingSeedRecords,
} from "./seed-runtime.js";

const SEED_MARKER = "[SEED-DEV]";
const withoutMarker = (value: string) => value.replace(`${SEED_MARKER} `, "");

const inspectFleet = async (manager: EntityManager, plan: ReturnType<typeof buildFleetSeedPlan>) => {
  const brandRepository = manager.getRepository(Brand);
  const modelRepository = manager.getRepository(VehicleModel);
  const vehicleRepository = manager.getRepository(Vehicle);
  const expectedBrandNames = plan.brands.map(({ descripcion }) => descripcion);
  const expectedModelNames = plan.models.map(({ descripcion }) => descripcion);
  const expectedPlates = plan.vehicles.map(({ patente }) => patente);
  const brands = await brandRepository.find({
    where: { descripcion: In([...expectedBrandNames, ...expectedBrandNames.map(withoutMarker)]) },
    select: { id: true, descripcion: true },
  });
  const existingSeedBrands = brands.filter(({ descripcion }) => expectedBrandNames.includes(descripcion));
  const seedBrandIds = existingSeedBrands.map(({ id }) => id);
  const seedBrandModels = seedBrandIds.length === 0
    ? []
    : await modelRepository.find({
      where: { brand: { id: In(seedBrandIds) } },
      relations: { brand: true },
      select: { id: true, descripcion: true, brand: { id: true, descripcion: true } },
    });
  const models = await modelRepository.find({
    where: { descripcion: In([...expectedModelNames, ...expectedModelNames.map(withoutMarker)]) },
    relations: { brand: true },
    select: { id: true, descripcion: true, brand: { id: true, descripcion: true } },
  });
  const vehicles = await vehicleRepository.find({
    where: { patente: In(expectedPlates) },
    relations: { vehicleModel: { brand: true } },
    select: {
      id: true,
      patente: true,
      descripcion: true,
      vehicleModel: { id: true, descripcion: true, brand: { id: true, descripcion: true } },
    },
  });

  const brandCollisions = brands.filter(({ descripcion }) =>
    !expectedBrandNames.includes(descripcion)
  ).length;
  const knownModelNames = new Set([
    ...expectedModelNames,
    ...expectedModelNames.map(withoutMarker),
  ]);
  const modelCollisionIds = new Set([
    ...models
      .filter(({ descripcion, brand }) =>
        !expectedModelNames.includes(descripcion) ||
        !expectedBrandNames.includes(brand?.descripcion ?? "")
      )
      .map(({ id }) => id),
    ...seedBrandModels
      .filter(({ descripcion }) => !knownModelNames.has(descripcion))
      .map(({ id }) => id),
  ]);
  const modelCollisions = modelCollisionIds.size;
  const expectedModelsByPlate = new Map(plan.vehicles.map(({ patente, modelDescripcion }) => [patente, modelDescripcion]));
  const vehicleCollisions = vehicles.filter(({ patente, descripcion, vehicleModel }) =>
    !descripcion?.startsWith(SEED_MARKER) ||
    vehicleModel?.descripcion !== expectedModelsByPlate.get(patente) ||
    !expectedBrandNames.includes(vehicleModel?.brand?.descripcion ?? "")
  ).length;
  const existingSeedModels = models.filter(({ descripcion, brand }) =>
    expectedModelNames.includes(descripcion) && expectedBrandNames.includes(brand?.descripcion ?? "")
  );
  const existingSeedVehicles = vehicles.filter(({ patente, descripcion, vehicleModel }) =>
    descripcion?.startsWith(SEED_MARKER) &&
    vehicleModel?.descripcion === expectedModelsByPlate.get(patente) &&
    expectedBrandNames.includes(vehicleModel?.brand?.descripcion ?? "")
  );
  const brandNames = new Set(existingSeedBrands.map(({ descripcion }) => descripcion));
  const modelKeys = new Set(existingSeedModels.map(({ descripcion, brand }) => `${brand?.descripcion}|${descripcion}`));
  const vehiclePlates = new Set(existingSeedVehicles.map(({ patente }) => patente));

  return {
    brands,
    models,
    seedBrandModels,
    vehicles,
    counts: {
      brandRowsFound: brands.length,
      brandsToCreate: selectMissingSeedRecords(plan.brands, brandNames, ({ descripcion }) => descripcion).length,
      brandsAlreadyExist: existingSeedBrands.length,
      modelRowsFound: models.length,
      modelsToCreate: selectMissingSeedRecords(plan.models, modelKeys, ({ brandDescripcion, descripcion }) => `${brandDescripcion}|${descripcion}`).length,
      modelsAlreadyExist: existingSeedModels.length,
      plateRowsFound: vehicles.length,
      vehiclesToCreate: selectMissingSeedRecords(plan.vehicles, vehiclePlates, ({ patente }) => patente).length,
      vehiclesAlreadyExist: existingSeedVehicles.length,
      existingBrands: existingSeedBrands.length,
      existingModels: existingSeedModels.length,
      existingPlates: existingSeedVehicles.length,
      brandCollisions,
      modelCollisions,
      vehicleCollisions,
    },
    collisions: {
      brands: brandCollisions,
      models: modelCollisions,
      plates: vehicleCollisions,
    },
    existingSeedBrands,
    existingSeedModels,
    existingSeedVehicles,
  };
};

const persistFleet = async (
  manager: EntityManager,
  plan: ReturnType<typeof buildFleetSeedPlan>,
  inspection: Awaited<ReturnType<typeof inspectFleet>>
) => {
  const brandRepository = manager.getRepository(Brand);
  const modelRepository = manager.getRepository(VehicleModel);
  const vehicleRepository = manager.getRepository(Vehicle);
  const allBrands = [...inspection.existingSeedBrands];
  const existingBrandNames = new Set(allBrands.map(({ descripcion }) => descripcion));
  const missingBrands = selectMissingSeedRecords(plan.brands, existingBrandNames, ({ descripcion }) => descripcion);
  for (const brand of missingBrands) {
    const parsed = parseBrandInput(brand);
    allBrands.push(await brandRepository.save(brandRepository.create(parsed)));
  }

  const brandsByName = new Map(allBrands.map((brand) => [brand.descripcion, brand]));
  const allModels = [...inspection.existingSeedModels];
  const existingModelKeys = new Set(allModels.map(({ descripcion, brand }) => `${brand.descripcion}|${descripcion}`));
  const missingModels = selectMissingSeedRecords(
    plan.models,
    existingModelKeys,
    ({ brandDescripcion, descripcion }) => `${brandDescripcion}|${descripcion}`
  );
  for (const model of missingModels) {
    const brand = brandsByName.get(model.brandDescripcion);
    if (!brand) throw new Error("Falta una marca semilla requerida para sus modelos.");
    const parsed = parseVehicleModelInput({ descripcion: model.descripcion, brandId: brand.id });
    allModels.push(await modelRepository.save(modelRepository.create({
      descripcion: parsed.descripcion,
      brand,
    })));
  }

  const modelsByName = new Map(allModels.map((model) => [model.descripcion, model]));
  const existingPlates = new Set(inspection.existingSeedVehicles.map(({ patente }) => patente));
  const missingVehicles = selectMissingSeedRecords(plan.vehicles, existingPlates, ({ patente }) => patente);
  for (const vehicle of missingVehicles) {
    const model = modelsByName.get(vehicle.modelDescripcion);
    if (!model) throw new Error("Falta un modelo semilla requerido para un vehículo.");
    const parsed = parseVehicleCreateInput({
      patente: vehicle.patente,
      color: vehicle.color,
      descripcion: vehicle.descripcion,
      estado: vehicle.estado,
      anio: vehicle.anio,
      vehicleModelId: model.id,
    });
    await vehicleRepository.save(vehicleRepository.create({
      ...parsed,
      vehicleModel: model,
      employee_id: null,
    }));
  }
};

const inspectFleetCleanup = async (manager: EntityManager, plan: ReturnType<typeof buildFleetSeedPlan>) => {
  const snapshot = await inspectFleet(manager, plan);
  const seededModelIds = snapshot.existingSeedModels.map(({ id }) => id);
  const dependentVehicles = seededModelIds.length === 0
    ? []
    : await manager.getRepository(Vehicle).find({
      where: { vehicleModel: { id: In(seededModelIds) } },
      select: { id: true, patente: true, descripcion: true },
    });
  const seedVehicleIds = new Set(snapshot.existingSeedVehicles.map(({ id }) => id));
  const unmarkedDependentVehicles = dependentVehicles.filter(({ id, descripcion }) =>
    !seedVehicleIds.has(id) || !descripcion?.startsWith(SEED_MARKER)
  ).length;
  return {
    ...snapshot,
    dependentVehicles,
    counts: {
      vehiclesToDelete: snapshot.existingSeedVehicles.length,
      modelsToDelete: unmarkedDependentVehicles === 0 ? snapshot.existingSeedModels.length : 0,
      brandsToDelete: unmarkedDependentVehicles === 0 ? snapshot.existingSeedBrands.length : 0,
      unmarkedDependentVehicles,
      ...snapshot.counts,
    },
    collisions: {
      ...snapshot.collisions,
      dependencies: unmarkedDependentVehicles,
    },
  };
};

const persistFleetCleanup = async (
  manager: EntityManager,
  inspection: Awaited<ReturnType<typeof inspectFleetCleanup>>
) => {
  const vehicleRepository = manager.getRepository(Vehicle);
  const modelRepository = manager.getRepository(VehicleModel);
  const brandRepository = manager.getRepository(Brand);
  if (inspection.existingSeedVehicles.length > 0) {
    await vehicleRepository.delete(inspection.existingSeedVehicles.map(({ id }) => id));
  }
  if (inspection.existingSeedModels.length > 0) {
    await modelRepository.delete(inspection.existingSeedModels.map(({ id }) => id));
  }
  if (inspection.existingSeedBrands.length > 0) {
    await brandRepository.delete(inspection.existingSeedBrands.map(({ id }) => id));
  }
};

export async function runSeedFleet(args = process.argv.slice(2)) {
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

  const plan = buildFleetSeedPlan();
  const dataSource = createSeedDataSource(config);
  await dataSource.initialize();
  try {
    if (options.clean) {
      const execute = async (manager: EntityManager) => runSeedMode({
        apply: options.apply,
        inspect: () => inspectFleetCleanup(manager, plan),
        report: ({ counts }) => console.log(JSON.stringify(counts)),
        validate: ({ collisions }) => assertNoSeedCollisions(collisions),
        persist: (inspection) => persistFleetCleanup(manager, inspection),
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
      inspect: () => inspectFleet(manager, plan),
      report: ({ counts }) => console.log(JSON.stringify(counts)),
      validate: ({ collisions }) => assertNoSeedCollisions(collisions),
      persist: (inspection) => persistFleet(manager, plan, inspection),
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
  runSeedFleet().catch((error: unknown) => {
    const message = error instanceof Error && error.message.startsWith("No se permite")
      ? error.message
      : "Seeder de flota detenido; no se muestran datos de conexión ni datos personales.";
    console.error(message);
    process.exitCode = 1;
  });
}
