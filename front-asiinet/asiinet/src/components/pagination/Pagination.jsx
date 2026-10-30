import "./Pagination.css";
import {
  getPaginationRange,
  PAGINATION_PAGE_SIZE_OPTIONS,
} from "./paginationUtils.js";

function getVisiblePages(page, totalPages) {
  const visibleCount = Math.min(totalPages, 5);
  const firstPage = Math.max(1, Math.min(page - 2, totalPages - visibleCount + 1));
  return Array.from({ length: visibleCount }, (_, index) => firstPage + index);
}

function Pagination({
  page,
  pageSize,
  pageSizeOptions = PAGINATION_PAGE_SIZE_OPTIONS,
  total,
  totalPages,
  ariaLabel,
  onPageChange,
  onPageSizeChange,
  loading = false,
}) {
  const { first, last } = getPaginationRange(page, pageSize, total);

  return (
    <div className="pagination">
      <p className="pagination-range" aria-live="polite">
        {total === 0 ? "No hay resultados" : `Mostrando ${first} a ${last} de ${total}`}
      </p>

      {total > 0 && (
        <div className="pagination-controls">
          <label className="pagination-size">
            Elementos por página
            <select
              value={pageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
              disabled={loading}
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>

          <nav aria-label={ariaLabel} className="pagination-nav">
            <button
              type="button"
              aria-label="Página anterior"
              onClick={() => onPageChange(page - 1)}
              disabled={loading || page <= 1}
            >
              Anterior
            </button>
            {getVisiblePages(page, totalPages).map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                aria-label={`Página ${pageNumber}`}
                aria-current={pageNumber === page ? "page" : undefined}
                onClick={() => onPageChange(pageNumber)}
                disabled={loading}
              >
                {pageNumber}
              </button>
            ))}
            <button
              type="button"
              aria-label="Página siguiente"
              onClick={() => onPageChange(page + 1)}
              disabled={loading || page >= totalPages}
            >
              Siguiente
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}

export default Pagination;
