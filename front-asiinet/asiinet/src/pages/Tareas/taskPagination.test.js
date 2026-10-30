import assert from "node:assert/strict";
import test from "node:test";
import {
  buildTaskListQuery,
  readTaskPaginationState,
  TASK_PAGE_SIZE_OPTIONS,
} from "./taskPagination.js";
import {
  getPaginationRange,
  getValidPage,
} from "../../components/pagination/paginationUtils.js";

test("la consulta contiene page, pageSize y los filtros activos", () => {
  assert.equal(
    buildTaskListQuery({
      page: 2,
      pageSize: 30,
      q: "router de casa",
      status: "vista",
    }),
    "page=2&pageSize=30&q=router+de+casa&status=vista"
  );
});

test("la consulta omite búsqueda vacía y el filtro Todos", () => {
  assert.equal(
    buildTaskListQuery({ page: 1, pageSize: 20, q: "  ", status: "todos" }),
    "page=1&pageSize=20"
  );
});

test("la URL restaura los valores y usa defaults para una vista sin parámetros", () => {
  assert.deepEqual(readTaskPaginationState(new URLSearchParams()), {
    page: 1,
    pageSize: 20,
    q: "",
    status: "todos",
  });
  assert.deepEqual(
    readTaskPaginationState(new URLSearchParams("page=3&pageSize=30&q=cliente&status=terminada")),
    { page: 3, pageSize: 30, q: "cliente", status: "terminada" }
  );
});

test("los tamaños disponibles de la interfaz son 10, 20 y 30", () => {
  assert.deepEqual(TASK_PAGE_SIZE_OPTIONS, [10, 20, 30]);
});

test("el rango visible cubre las páginas y representa cero resultados", () => {
  assert.deepEqual(getPaginationRange(2, 10, 58), {
    first: 11,
    last: 20,
    total: 58,
  });
  assert.deepEqual(getPaginationRange(1, 20, 0), {
    first: 0,
    last: 0,
    total: 0,
  });
  assert.deepEqual(getPaginationRange(4, 20, 58), {
    first: 0,
    last: 0,
    total: 58,
  });
});

test("al desaparecer la última página vuelve a una página válida", () => {
  assert.equal(getValidPage(4, 3), 3);
  assert.equal(getValidPage(2, 0), 1);
});
