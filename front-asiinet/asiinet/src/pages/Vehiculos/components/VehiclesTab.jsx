import { useState, useMemo } from "react";

export default function VehiclesTab({
  vehicles = [],
  brands = [],
  models = [],
  canWrite = false,
  onNewVehicle,
  onEditVehicle,
  onDeleteVehicle,
  loading = false,
}) {
  const [selectedBrandId, setSelectedBrandId] = useState("");
  const [selectedModelId, setSelectedModelId] = useState("");
  const [selectedEstado, setSelectedEstado] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Modelos disponibles filtrados por la marca seleccionada
  const availableModels = useMemo(() => {
    if (!selectedBrandId) return models;
    return models.filter((m) => String(m.brand?.id) === String(selectedBrandId));
  }, [models, selectedBrandId]);

  // Lista filtrada en memoria
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      if (selectedBrandId && String(v.vehicleModel?.brand?.id) !== String(selectedBrandId)) {
        return false;
      }
      if (selectedModelId && String(v.vehicleModel?.id) !== String(selectedModelId)) {
        return false;
      }
      if (selectedEstado && v.estado !== selectedEstado) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const patente = (v.patente || "").toLowerCase();
        const color = (v.color || "").toLowerCase();
        const modelo = (v.vehicleModel?.descripcion || "").toLowerCase();
        const marca = (v.vehicleModel?.brand?.descripcion || "").toLowerCase();
        return (
          patente.includes(q) ||
          color.includes(q) ||
          modelo.includes(q) ||
          marca.includes(q)
        );
      }
      return true;
    });
  }, [vehicles, selectedBrandId, selectedModelId, selectedEstado, searchQuery]);

  return (
    <div className="vehiculos-tabpanel-inner">
      {/* Toolbar & Filters */}
      <div className="vehiculos-toolbar">
        <div className="vehiculos-filters">
          <div className="vehiculos-filter-group">
            <label htmlFor="filter-brand">Marca</label>
            <select
              id="filter-brand"
              className="vehiculos-select"
              value={selectedBrandId}
              onChange={(e) => {
                setSelectedBrandId(e.target.value);
                setSelectedModelId(""); // reset model filter on brand change
              }}
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
            <label htmlFor="filter-model">Modelo</label>
            <select
              id="filter-model"
              className="vehiculos-select"
              value={selectedModelId}
              onChange={(e) => setSelectedModelId(e.target.value)}
            >
              <option value="">Todos los modelos</option>
              {availableModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.brand?.descripcion ? `${m.brand.descripcion} ` : ""}
                  {m.descripcion}
                </option>
              ))}
            </select>
          </div>

          <div className="vehiculos-filter-group">
            <label htmlFor="filter-estado">Estado</label>
            <select
              id="filter-estado"
              className="vehiculos-select"
              value={selectedEstado}
              onChange={(e) => setSelectedEstado(e.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="disponible">Disponible</option>
              <option value="en_uso">En uso</option>
              <option value="mantenimiento">Mantenimiento</option>
            </select>
          </div>

          <div className="vehiculos-filter-group">
            <label htmlFor="filter-search">Buscar</label>
            <input
              id="filter-search"
              type="search"
              className="vehiculos-input"
              placeholder="Patente, color..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {canWrite && (
          <button
            type="button"
            className="btn-primary"
            onClick={onNewVehicle}
          >
            <i className="fa-solid fa-plus" aria-hidden="true" />
            <span>Nuevo Vehículo</span>
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="vehiculos-empty">
          <i className="fa-solid fa-spinner fa-spin" aria-hidden="true" />
          <p>Cargando vehículos...</p>
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="vehiculos-empty">
          <i className="fa-solid fa-truck" aria-hidden="true" />
          <h3>No se encontraron vehículos</h3>
          <p>
            {vehicles.length === 0
              ? "Aún no hay vehículos registrados en la flota."
              : "No hay vehículos que coincidan con los filtros seleccionados."}
          </p>
          {canWrite && vehicles.length === 0 && (
            <button
              type="button"
              className="btn-primary"
              onClick={onNewVehicle}
              style={{ marginTop: "1rem" }}
            >
              <i className="fa-solid fa-plus" aria-hidden="true" />
              <span>Registrar primer vehículo</span>
            </button>
          )}
        </div>
      ) : (
        <div className="vehiculos-table-wrapper">
          <table className="vehiculos-table">
            <thead>
              <tr>
                <th scope="col">Patente</th>
                <th scope="col">Marca y Modelo</th>
                <th scope="col">Color</th>
                <th scope="col">Año</th>
                <th scope="col">Estado</th>
                <th scope="col">Observaciones</th>
                {canWrite && <th scope="col">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.map((v) => (
                <tr key={v.id}>
                  <td>
                    <span className="badge-patente">{v.patente}</span>
                  </td>
                  <td>
                    <strong>{v.vehicleModel?.brand?.descripcion || "—"}</strong>{" "}
                    {v.vehicleModel?.descripcion || ""}
                  </td>
                  <td>{v.color}</td>
                  <td>{v.anio ?? "—"}</td>
                  <td>
                    <span className={`badge-status badge-${v.estado}`}>
                      <span className="badge-dot" aria-hidden="true" />
                      {v.estado === "en_uso"
                        ? "En uso"
                        : v.estado === "mantenimiento"
                        ? "Mantenimiento"
                        : "Disponible"}
                    </span>
                  </td>
                  <td>
                    <small style={{ color: "var(--text-muted)" }}>
                      {v.descripcion || "—"}
                    </small>
                  </td>
                  {canWrite && (
                    <td>
                      <div className="table-cell-actions">
                        <button
                          type="button"
                          className="btn-icon-action"
                          onClick={() => onEditVehicle(v)}
                          title={`Editar vehículo ${v.patente}`}
                          aria-label={`Editar vehículo ${v.patente}`}
                        >
                          <i className="fa-solid fa-pen-to-square" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className="btn-icon-action danger"
                          onClick={() => onDeleteVehicle(v)}
                          title={`Eliminar vehículo ${v.patente}`}
                          aria-label={`Eliminar vehículo ${v.patente}`}
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
