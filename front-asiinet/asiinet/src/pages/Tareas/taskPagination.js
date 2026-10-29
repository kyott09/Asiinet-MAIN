import { PAGINATION_PAGE_SIZE_OPTIONS } from "../../components/pagination/paginationUtils.js";

export const TASK_PAGE_SIZE_OPTIONS = PAGINATION_PAGE_SIZE_OPTIONS;

const isPositiveInteger = (value) => Number.isSafeInteger(value) && value > 0;

export function readTaskPaginationState(searchParams) {
  const requestedPage = Number(searchParams.get("page"));
  const requestedPageSize = Number(searchParams.get("pageSize"));
  const status = searchParams.get("status") || "todos";

  return {
    page: isPositiveInteger(requestedPage) ? requestedPage : 1,
    pageSize: TASK_PAGE_SIZE_OPTIONS.includes(requestedPageSize) ? requestedPageSize : 20,
    q: searchParams.get("q") || "",
    status: ["todos", "vista", "en_proceso", "terminada", "cancelacion"].includes(status)
      ? status
      : "todos",
  };
}

export function buildTaskListQuery({ page, pageSize, q, status }) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  const trimmedSearch = q.trim();

  if (trimmedSearch) params.set("q", trimmedSearch);
  if (status !== "todos") params.set("status", status);

  return params.toString();
}
