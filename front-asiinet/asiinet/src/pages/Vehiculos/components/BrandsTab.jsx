import { useState, useMemo } from "react";

export default function BrandsTab({
  brands = [],
  canWrite = false,
  onNewBrand,
  onEditBrand,
  onDeleteBrand,
  loading = false,
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredBrands = useMemo(() => {
    if (!searchQuery.trim()) return brands;
    const q = searchQuery.toLowerCase().trim();
    return brands.filter((b) => (b.descripcion || "").toLowerCase().includes(q));
  }, [brands, searchQuery]);

  return (
    <div className="vehiculos-tabpanel-inner">
      <div className="vehiculos-toolbar">
        <div className="vehiculos-filters">
          <div className="vehiculos-filter-group">
            <label htmlFor="filter-brand-search">Buscar marca</label>
            <input
              id="filter-brand-search"
              type="search"
              className="vehiculos-input"
              placeholder="Nombre de la marca..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {canWrite && (
          <button
            type="button"
            className="btn-primary"
            onClick={onNewBrand}
          >
            <i className="fa-solid fa-plus" aria-hidden="true" />
            <span>Nueva Marca</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="vehiculos-empty">
          <i className="fa-solid fa-spinner fa-spin" aria-hidden="true" />
          <p>Cargando marcas...</p>
        </div>
      ) : filteredBrands.length === 0 ? (
        <div className="vehiculos-empty">
          <i className="fa-solid fa-tag" aria-hidden="true" />
          <h3>No se encontraron marcas</h3>
          <p>
            {brands.length === 0
              ? "Aún no hay marcas registradas en el sistema."
              : "No hay marcas que coincidan con la búsqueda."}
          </p>
          {canWrite && brands.length === 0 && (
            <button
              type="button"
              className="btn-primary"
              onClick={onNewBrand}
              style={{ marginTop: "1rem" }}
            >
              <i className="fa-solid fa-plus" aria-hidden="true" />
              <span>Crear primera marca</span>
            </button>
          )}
        </div>
      ) : (
        <div className="vehiculos-table-wrapper">
          <table className="vehiculos-table">
            <thead>
              <tr>
                <th scope="col" style={{ width: "80px" }}>ID</th>
                <th scope="col">Descripción de la Marca</th>
                {canWrite && <th scope="col" style={{ width: "120px" }}>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {filteredBrands.map((b) => (
                <tr key={b.id}>
                  <td>
                    <span style={{ fontFamily: "var(--mono)", color: "var(--text-muted)" }}>
                      #{b.id}
                    </span>
                  </td>
                  <td>
                    <strong>{b.descripcion}</strong>
                  </td>
                  {canWrite && (
                    <td>
                      <div className="table-cell-actions">
                        <button
                          type="button"
                          className="btn-icon-action"
                          onClick={() => onEditBrand(b)}
                          title={`Editar marca ${b.descripcion}`}
                          aria-label={`Editar marca ${b.descripcion}`}
                        >
                          <i className="fa-solid fa-pen-to-square" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className="btn-icon-action danger"
                          onClick={() => onDeleteBrand(b)}
                          title={`Eliminar marca ${b.descripcion}`}
                          aria-label={`Eliminar marca ${b.descripcion}`}
                        >
                          <i className="fa-solid fa-trash-can" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
