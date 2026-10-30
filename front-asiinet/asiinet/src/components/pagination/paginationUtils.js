export const PAGINATION_PAGE_SIZE_OPTIONS = [10, 20, 30];

export function getValidPage(page, totalPages) {
  return Math.min(page, Math.max(totalPages, 1));
}

export function getPaginationRange(page, pageSize, total) {
  if (total <= 0 || (page - 1) * pageSize >= total) {
    return { first: 0, last: 0, total };
  }

  return {
    first: (page - 1) * pageSize + 1,
    last: Math.min(page * pageSize, total),
    total,
  };
}
