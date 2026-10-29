import "reflect-metadata";
import { DataSource } from "typeorm";
import { Brand } from "../../modules/brand/brand.entity.js";
import { Event } from "../../modules/event/event.entity.js";
import { Task } from "../../modules/task/task.entity.js";
import { User } from "../../modules/user/user.entity.js";
import { VehicleModel } from "../../modules/vehicle-model/vehicle-model.entity.js";
import { Vehicle } from "../../modules/vehicle/vehicle.entity.js";

export type SeedDataSourceConfig = {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
};

export const seedDataSourceConfigFromEnvironment = (): SeedDataSourceConfig => {
  const host = process.env.DB_HOST?.trim();
  const database = process.env.DB_NAME?.trim();
  const username = process.env.DB_USER;
  const password = process.env.DB_PASS;
  const port = Number(process.env.DB_PORT || 3306);

  if (!host || !database || username === undefined || password === undefined) {
    throw new Error("Falta configuración de base de datos para el seeder.");
  }
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("El puerto configurado para la base no es válido.");
  }

  return { host, port, username, password, database };
};

export const createSeedDataSource = (config: SeedDataSourceConfig) => new DataSource({
  type: "mysql",
  ...config,
  synchronize: false,
  migrationsRun: false,
  entities: [User, Task, Event, Brand, VehicleModel, Vehicle],
});

export const isLocalDatabaseHost = (host: string) => {
  const normalizedHost = host.trim().toLowerCase().replace(/^\[|\]$/g, "");
  return ["localhost", "127.0.0.1", "::1"].includes(normalizedHost);
};

export const assertSeedApplyAllowed = ({
  apply,
  nodeEnv,
  host,
  database,
  confirmedDatabase,
}: {
  apply: boolean;
  nodeEnv?: string;
  host: string;
  database: string;
  confirmedDatabase?: string;
}) => {
  if (!apply) return;
  if (nodeEnv?.trim().toLowerCase() === "production") {
    throw new Error("No se permite aplicar seeders en producción.");
  }
  if (!isLocalDatabaseHost(host)) {
    throw new Error("No se permite aplicar seeders en un host no local.");
  }
  if (!database || confirmedDatabase !== database) {
    throw new Error("La confirmación de base de datos no coincide.");
  }
};

export const assertSeedCleanupAllowed = ({
  apply,
  confirmedCleanup,
}: {
  apply: boolean;
  confirmedCleanup?: string;
}) => {
  if (apply && confirmedCleanup !== "DELETE-SEED-DATA") {
    throw new Error("La limpieza requiere confirmación explícita independiente.");
  }
};

export const assertNoSeedCollisions = (collisions: Record<string, number>) => {
  if (Object.values(collisions).some((count) => count > 0)) {
    throw new Error("Se detectaron colisiones sin marcador; no se aplicaron cambios.");
  }
};

export const selectMissingSeedRecords = <T, K>(
  planned: readonly T[],
  existingKeys: ReadonlySet<K>,
  getKey: (record: T) => K
) => planned.filter((record) => !existingKeys.has(getKey(record)));

export async function runSeedMode<T>({
  apply,
  inspect,
  persist,
  report,
  validate,
}: {
  apply: boolean;
  inspect: () => Promise<T>;
  persist: (inspection: T) => Promise<void>;
  report?: (inspection: T) => void;
  validate?: (inspection: T) => void;
}): Promise<T> {
  const inspection = await inspect();
  report?.(inspection);
  validate?.(inspection);
  if (apply) await persist(inspection);
  return inspection;
}

export const formatBuenosAiresDate = (date: Date) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
};

export const addDaysToDateOnly = (value: string, days: number) => {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
};

export const parseSeedArgs = (args: string[]) => {
  const confirmedDatabase = args.find((arg) => arg.startsWith("--confirm-database="))
    ?.slice("--confirm-database=".length);
  const confirmedCleanup = args.find((arg) => arg.startsWith("--confirm-cleanup="))
    ?.slice("--confirm-cleanup=".length);
  return {
    apply: args.includes("--apply"),
    clean: args.includes("--clean"),
    confirmedDatabase,
    confirmedCleanup,
  };
};
