import assert from "node:assert/strict";
import test from "node:test";
import { AppDataSource } from "../../database/data-source.js";
import { findPage } from "./task.repository.js";

type CapturedQuery = {
  clauses: string[];
  parameters: Record<string, unknown>;
};

async function buildSearchQuery(searchText: string): Promise<CapturedQuery> {
  const captured: CapturedQuery = { clauses: [], parameters: {} };
  const builder = {
    leftJoinAndSelect() {
      return this;
    },
    orderBy() {
      return this;
    },
    where(clause: string, parameters?: Record<string, unknown>) {
      captured.clauses.push(clause);
      Object.assign(captured.parameters, parameters);
      return this;
    },
    andWhere(clause: string, parameters?: Record<string, unknown>) {
      captured.clauses.push(clause);
      Object.assign(captured.parameters, parameters);
      return this;
    },
    clone() {
      return {
        skip() {
          return this;
        },
        take() {
          return this;
        },
        getCount: async () => 0,
        getMany: async () => [],
      };
    },
  };
  const originalDescriptor = Object.getOwnPropertyDescriptor(AppDataSource, "getRepository");

  Object.defineProperty(AppDataSource, "getRepository", {
    configurable: true,
    value: () => ({ createQueryBuilder: () => builder }),
  });

  try {
    await findPage({
      page: 1,
      pageSize: 20,
      filters: { q: searchText },
      actor: { id: 1, role: "admin" },
    });
  } finally {
    if (originalDescriptor) {
      Object.defineProperty(AppDataSource, "getRepository", originalDescriptor);
    } else {
      delete (AppDataSource as Partial<typeof AppDataSource>).getRepository;
    }
  }

  return captured;
}

function likeMatches(value: string, pattern: string): boolean {
  let expression = "^";

  for (let index = 0; index < pattern.length; index += 1) {
    const character = pattern[index];
    if (character === "\\") {
      index += 1;
      expression += pattern[index].replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    } else if (character === "%") {
      expression += ".*";
    } else if (character === "_") {
      expression += ".";
    } else {
      expression += character.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }
  }

  return new RegExp(`${expression}$`, "i").test(value);
}

test("la búsqueda trata porcentaje como texto y no como comodín", async () => {
  const query = await buildSearchQuery("%");
  const descriptions = ["Plan 100% fibra", "Plan 100 Mbps", "Plan 50% mensual"];

  assert.deepEqual(query.parameters, { search: "%\\%%" });
  assert.ok(query.clauses.join(" ").includes("ESCAPE '\\\\'"));
  assert.deepEqual(descriptions.filter((description) =>
    likeMatches(description, query.parameters.search as string)
  ), ["Plan 100% fibra", "Plan 50% mensual"]);
  assert.equal(
    descriptions.every((description) =>
      likeMatches(description, query.parameters.search as string)
    ),
    false,
  );
});

test("q=100% solo encuentra descripciones que contienen ese texto exacto", async () => {
  const query = await buildSearchQuery("100%");
  const descriptions = ["Plan 100% fibra", "Plan 100 Mbps", "Plan 1000% fibra"];

  assert.deepEqual(query.parameters, { search: "%100\\%%" });
  assert.deepEqual(descriptions.filter((description) =>
    likeMatches(description, query.parameters.search as string)
  ), ["Plan 100% fibra"]);
});

test("la búsqueda trata guion bajo y barra inversa como texto literal", async () => {
  const underscoreQuery = await buildSearchQuery("_");
  const backslashQuery = await buildSearchQuery("\\");

  assert.deepEqual(underscoreQuery.parameters, { search: "%\\_%" });
  assert.deepEqual(
    ["OLT_01", "OLT-01"].filter((description) =>
      likeMatches(description, underscoreQuery.parameters.search as string)
    ),
    ["OLT_01"],
  );
  assert.deepEqual(backslashQuery.parameters, { search: "%\\\\%" });
  assert.deepEqual(
    ["ruta\\backup", "rutabackup"].filter((description) =>
      likeMatches(description, backslashQuery.parameters.search as string)
    ),
    ["ruta\\backup"],
  );
});

test("la búsqueda común y la fecha YYYY-MM-DD conservan el patrón previo", async () => {
  const regularQuery = await buildSearchQuery("instalación");
  const dateQuery = await buildSearchQuery("2026-03-01");

  assert.deepEqual(regularQuery.parameters, { search: "%instalación%" });
  assert.deepEqual(dateQuery.parameters, { search: "%2026-03-01%" });
  assert.ok(likeMatches("Servicio de instalación", regularQuery.parameters.search as string));
  assert.ok(likeMatches("2026-03-01", dateQuery.parameters.search as string));
  assert.ok(!regularQuery.clauses.join(" ").includes("instalación"));
});
