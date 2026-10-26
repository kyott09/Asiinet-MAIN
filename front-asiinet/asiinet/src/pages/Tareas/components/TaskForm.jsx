import ServiceDetailsFields from "./ServiceDetailsFields";

function TaskForm({ form, editingId, isClient, isEmployee, canEditServiceDetails, serviceDetailsErrors, onServiceDetailsChange, tasks, nextTaskNumber, today, clients, employees, loading, handleChange, getTaskStatusLabel, saving, handleSubmit, handleCancel }) {
  return (
        <section className="tasks-panel" aria-labelledby="task-form-title">
          <h2 id="task-form-title">
            {editingId !== null
              ? (isEmployee ? "Actualizar solicitud" : "Editar tarea")
              : (isClient ? "Nueva solicitud" : "Nueva tarea")}
          </h2>

          <form className="tasks-form" onSubmit={handleSubmit}>
            {!isEmployee && !isClient && (
              <div className="tasks-form-row tasks-form-row-meta">
                <label>
                  Número de tarea
                  <input
                    value={editingId !== null
                      ? tasks.find((task) => task.id === editingId)?.number ?? ""
                      : nextTaskNumber}
                    readOnly
                  />
                </label>

                <label>
                  Fecha de creación
                  <input type="date" value={editingId !== null
                    ? tasks.find((task) => task.id === editingId)?.createdAt ?? today()
                    : today()} readOnly />
                </label>
              </div>
            )}

            {!isEmployee && !isClient && (
              <div className="tasks-form-row tasks-assignment-row">
                <label>
                  Cliente
                  <select
                    name="clientId"
                    value={form.clientId}
                    onChange={handleChange}
                    required
                    disabled={loading || clients.length === 0}
                  >
                    <option value="">
                      {clients.length ? "Selecciona un cliente" : "No hay clientes con rol cliente"}
                    </option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.nombre} ({client.email})
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Empleado asignado
                  <select
                    name="employeeId"
                    value={form.employeeId}
                    onChange={handleChange}
                    required
                    disabled={loading || employees.length === 0}
                  >
                    <option value="">
                      {employees.length ? "Selecciona un empleado" : "No hay empleados registrados"}
                    </option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.nombre} ({employee.email})
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}

            {isClient && (
              <div className="tasks-form-row tasks-form-row-meta">
                <label>
                  Tipo de servicio
                  <input value={editingId !== null ? tasks.find((task) => task.id === editingId)?.service ?? "" : form.service} readOnly />
                </label>
                <label>
                  Fecha de creación
                  <input type="date" value={editingId !== null ? tasks.find((task) => task.id === editingId)?.createdAt ?? today() : today()} readOnly />
                </label>
              </div>
            )}

            {isEmployee && (
              <div className="tasks-form-row tasks-form-row-meta">
                <label>
                  Cliente
                  <input value={tasks.find((task) => task.id === editingId)?.client ?? ""} readOnly />
                </label>
                <label>
                  Servicio
                  <input value={tasks.find((task) => task.id === editingId)?.service ?? ""} readOnly />
                </label>
              </div>
            )}

            {!isClient && (
              <div className="tasks-form-row">
                <label>
                  Fecha de finalización
                  <input
                    type="date"
                    name="dueDate"
                    value={form.dueDate}
                    min={editingId !== null
                      ? tasks.find((task) => task.id === editingId)?.createdAt ?? today()
                      : today()}
                    onChange={handleChange}
                    required
                  />
                </label>

                {!isEmployee && (
                  <label>
                    Servicio
                    <select
                      name="service"
                      value={form.service}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Selecciona un servicio</option>
                      <option value="Instalación">Instalación</option>
                      <option value="Reconexión">Reconexión</option>
                      <option value="Servicio técnico">Servicio técnico</option>
                      <option value="Desconexión">Desconexión</option>
                    </select>
                  </label>
                )}

                {!isEmployee && (
                  <label>
                    Prioridad
                    <select
                      name="priority"
                      value={form.priority}
                      onChange={handleChange}
                      required
                    >
                      <option value="Baja">Baja</option>
                      <option value="Media">Media</option>
                      <option value="Alta">Alta</option>
                    </select>
                  </label>
                )}
              </div>
            )}

            {isClient ? (
              editingId !== null ? (
                <>
                  <label>
                    Estado
                    <input
                      value={getTaskStatusLabel(form.status)}
                      readOnly
                    />
                  </label>

                  <label>
                    Descripción
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      placeholder="Describe el trabajo solicitado"
                      rows={4}
                      required
                    />
                  </label>
                </>
              ) : (
                <>
                  <div className="tasks-form-row">
                    <label>
                      Tipo de servicio
                      <select
                        name="service"
                        value={form.service}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Selecciona un servicio</option>
                        <option value="Instalación">Instalación</option>
                        <option value="Reconexión">Reconexión</option>
                        <option value="Servicio técnico">Servicio técnico</option>
                        <option value="Desconexión">Desconexión</option>
                      </select>
                    </label>
                  </div>

                  <label>
                    Descripción
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      placeholder="Describe el trabajo solicitado"
                      rows={4}
                      required
                    />
                  </label>
                </>
              )
            ) : (
              <label>
                Descripción
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Describe el trabajo solicitado"
                  rows={4}
                  required
                />
              </label>
            )}

            {canEditServiceDetails && form.service && (
              <ServiceDetailsFields
                service={form.service}
                value={form.serviceDetails}
                errors={serviceDetailsErrors}
                disabled={saving}
                onChange={onServiceDetailsChange}
              />
            )}

            {(isEmployee || !isClient) && (
              <label>
                Estado
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  required
                >
                  <option value="Vista">Vista</option>
                  <option value="En proceso">En proceso</option>
                  <option value="Terminada">Terminada</option>
                  <option value="No terminada">No terminada</option>
                </select>
              </label>
            )}

            <div className="tasks-actions">
              <button className="tasks-button" type="submit" disabled={saving}>
                {saving ? "Guardando..." : editingId !== null ? (isEmployee ? "Guardá cambios" : "Guardá solicitud") : (isClient ? "Solicitar" : "Registrá tarea")}
              </button>
              <button
                className="tasks-button tasks-button-secondary"
                type="button"
                onClick={handleCancel}
              >
                Cancelar
              </button>
            </div>
          </form>
        </section>
  );
}

export default TaskForm;
