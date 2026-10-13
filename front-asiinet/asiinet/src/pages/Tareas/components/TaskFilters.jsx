function TaskFilters({ isClient, searchTerm, setSearchTerm, statusFilter, setStatusFilter }) {
  return (
          <div className="tasks-filter-bar">
            <label className="tasks-filter-field">
              Buscar
              <input
                className="tasks-filter-control"
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={isClient ? "Buscar por servicio, descripción o estado" : "Buscar por cliente, servicio o estado"}
              />
            </label>

            <label className="tasks-filter-field tasks-filter-field-status">
              Estado
              <select
                className="tasks-filter-control"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="todos">Todos</option>
                {isClient ? (
                  <>
                    <option value="vista">Recibido</option>
                    <option value="en_proceso">En proceso</option>
                    <option value="terminada">Terminada</option>
                    <option value="cancelacion">Cancelación</option>
                  </>
                ) : (
                  <>
                    <option value="vista">Vista</option>
                    <option value="en_proceso">En proceso</option>
                    <option value="terminada">Terminada</option>
                    <option value="cancelacion">No terminada</option>
                  </>
                )}
              </select>
            </label>
          </div>
  );
}

export default TaskFilters;
