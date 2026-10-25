import { useState, useMemo } from "react";

export default function ModelsTab({
  models = [],
  brands = [],
  canWrite = false,
  onNewModel,
  onEditModel,
  onDeleteModel,
  loading = false,
}) {
  const [selectedBrandId, setSelectedBrandId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredModels = useMemo(() => {
    return models.filter((m) => {
      if (selectedBrandId && String(m.brand?.id) !== String(selectedBrandId)) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const desc = (m.descripcion || "").toLowerCase();
        const brandDesc = (m.brand?.descripcion || "").toLowerCase();
        return desc.includes(q) || brandDesc.includes(q);
      }
      return true;
    });
  }, [models, selectedBrandId, searchQuery]);

  return (
    <div className="vehiculos-tabpanel-inner">
      <div className="vehiculos-toolbar">
        <div className="vehiculos-filters">
          <div className="vehiculos-filter-group">
            <label htmlFor="filter-model-brand">Filtrar por marca</label>
            <select
              id="filter-model-brand"
              className="vehiculos-select"
              value={selectedBrandId}
              onChange={(e) => setSelectedBrandId(e.target.value)}
            >
              <option value="">Todas las marcas</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.descripcion}
                </option>
              ))}
            </select>
          </div>

          <div className="vehiculos-filter-group">
            <label htmlFor="filter-model-search">Buscar modelo</label>
            <input
              id="filter-model-search"
              type="search"
              className="vehiculos-input"
              placeholder="Nombre del modelo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {canWrite && (
          <button
            type="button"
            className="btn-primary"
            onClick={onNewModel}
          >
            <i className="fa-solid fa-plus" aria-hidden="true" />
            <span>Nuevo Modelo</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="vehiculos-empty">
          <i className="fa-solid fa-spinner fa-spin" aria-hidden="true" />
          <p>Cargando modelos...</p>
        </div>
      ) : filteredModels.length === 0 ? (
        <div className="vehiculos-empty">
          <i className="fa-solid fa-car-side" aria-hidden="true" />
          <h3>No se encontraron modelos</h3>
          <p>
            {models.length === 0
              ? "Aún no hay modelos de vehículos registrados."
              : "No hay modelos que coincidan con la búsqueda."}
          </p>
          {canWrite && models.length === 0 && (
            <button
              type="button"
              className="btn-primary"
              onClick={onNewModel}
              style={{ marginTop: "1rem" }}
            >
              <i className="fa-solid fa-plus" aria-hidden="true" />
              <span>Crear primer modelo</span>
            </button>
          )}
        </div>
      ) : (
        <div className="vehiculos-table-wrapper">
          <table className="vehiculos-table">
            <thead>
              <tr>
                <th scope="col" style={{ width: "80px" }}>ID</th>
                <th scope="col">Modelo</th>
                <th scope="col">Marca Asociada</th>
                {canWrite && <th scope="col" style={{ width: "120px" }}>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {filteredModels.map((m) => (
                <tr key={m.id}>
                  <td>
                    <span style={{ fontFamily: "var(--mono)", color: "var(--text-muted)" }}>
                      #{m.id}
                    </span>
                  </td>
                  <td>
                    <strong>{m.descripcion}</strong>
                  </td>
                  <td>{m.brand?.descripcion || "—"}</td>
                  {canWrite && (
                    <td>
                      <div className="table-cell-actions">
                        <button
                          type="button"
                          className="btn-icon-action"
                          onClick={() => onEditModel(m)}
                          title={`Editar modelo ${m.descripcion}`}
                          aria-label={`Editar modelo ${m.descripcion}`}
                        >
                          <i className="fa-solid fa-pen-to-square" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className="btn-icon-action danger"
                          onClick={() => onDeleteModel(m)}
                          title={`Eliminar modelo ${m.descripcion}`}
                          aria-label={`Eliminar modelo ${m.descripcion}`}
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
