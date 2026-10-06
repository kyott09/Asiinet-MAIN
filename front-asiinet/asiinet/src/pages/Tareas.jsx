import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AccountActions from "../components/dashboard/AccountActions";
import DashboardSidebar from "../components/dashboard/DashboardSidebar";
import "./Tareas.css";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";
const TASKS_URL = `${API_BASE_URL}/api/tasks`;

async function requestTasks(path = "", options = {}) {
  const response = await fetch(`${TASKS_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(payload.message || "No se pudo completar la operación.");
    error.status = response.status;
    throw error;
  }

  return payload;
}

async function requestAssignableUsers() {
  const response = await fetch(`${API_BASE_URL}/api/users/assignables`, {
    credentials: "include",
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(payload.message || "No se pudieron cargar clientes y empleados.");
    error.status = response.status;
    throw error;
  }

  return payload;
}

function handleTaskRequestError(requestError, navigate, setError) {
  if (requestError.status === 401) {
    sessionStorage.removeItem("user");
    navigate("/login", { replace: true });
    return;
  }

  if (requestError instanceof TypeError) {
    setError("No se pudo conectar con el servidor. Revisá la conexión y probá de nuevo.");
    return;
  }

  setError(requestError.message || "No se pudo completar la operación.");
}

const today = () => new Date().toLocaleDateString("en-CA");

const emptyForm = {
  clientId: "",
  employeeId: "",
  dueDate: "",
  description: "",
  service: "",
  priority: "Baja",
  status: "Vista",
};

function getUserSession() {
  try {
    const raw = sessionStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function normalizeRoleName(role) {
  const value = String(role ?? "cliente").trim().toLowerCase();
  if (!value) return "cliente";
  const aliases = {
    user: "cliente",
    cliente: "cliente",
    client: "cliente",
    empleado: "operador",
    employee: "operador",
    operador: "operador",
    admin: "admin",
    supervisor: "supervisor",
  };

  return aliases[value] ?? value;
}

function isFinalizedStatus(status) {
  return ["terminada", "finalizada", "finalizado"].includes(String(status ?? "").trim().toLowerCase());
}

function getTaskStatusLabel(status) {
  const normalized = String(status ?? "").trim().toLowerCase();

  const labels = {
    vista: "Recibido",
    "en proceso": "En proceso",
    terminada: "Terminada",
    finalizada: "Terminada",
    finalizado: "Terminada",
    "no terminada": "Cancelación",
    cancelada: "Cancelación",
    cancelado: "Cancelación",
  };

  return labels[normalized] ?? String(status ?? "Sin estado");
}

function canClientEditTask(task) {
  const normalized = String(task?.status ?? "").trim().toLowerCase();
  return !["en proceso", "terminada", "finalizada", "finalizado", "no terminada", "cancelada", "cancelado"].includes(normalized);
}

function normalizeTaskStatusValue(status) {
  const normalized = String(status ?? "").trim().toLowerCase();

  if (normalized === "vista") return "vista";
  if (normalized === "en proceso") return "en_proceso";
  if (["terminada", "finalizada", "finalizado"].includes(normalized)) return "terminada";
  if (["no terminada", "no_terminada"].includes(normalized)) return "cancelacion";
  if (["cancelada", "cancelado"].includes(normalized)) return "cancelacion";

  return normalized;
}

function isAssignedTaskForUser(task, user) {
  const taskEmployeeIds = [task?.employeeId, task?.employeeUser?.id, task?.employeeUserId]
    .filter((value) => value !== null && value !== undefined && value !== "");

  return taskEmployeeIds.some((id) => Number(id) === Number(user?.id));
}

function Tareas() {
  const navigate = useNavigate();
  const user = getUserSession();
  const userRole = normalizeRoleName(user?.role);
  const isClient = userRole === "cliente";
  const isEmployee = userRole === "operador";
  const canCreateRequest = !isEmployee;
  const canDeleteTask = !isClient && !isEmployee;
  const pageTitle = isClient ? "Solicitudes" : "Tareas";
  const [tasks, setTasks] = useState([]);
  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const deleteDialogRef = useRef(null);
  const deleteTriggerRef = useRef(null);
  const newTaskButtonRef = useRef(null);

  useEffect(() => {
    const dialog = deleteDialogRef.current;
    if (taskToDelete && dialog) {
      dialog.showModal();
      return () => dialog.close();
    }
  }, [taskToDelete]);

  useEffect(() => {
    let isActive = true;

    async function loadTasks() {
      try {
        const taskPayload = await requestTasks();
        if (!isActive) return;

        setTasks(taskPayload.tasks ?? []);

        if (isEmployee || isClient) {
          setClients([]);
          setEmployees([]);
          setLoading(false);
          return;
        }

        const userPayload = await requestAssignableUsers();
        if (isActive) {
          setClients(userPayload.clients ?? []);
          setEmployees(userPayload.employees ?? []);
        }
      } catch (requestError) {
        if (isActive) handleTaskRequestError(requestError, navigate, setError);
      } finally {
        if (isActive) setLoading(false);
      }
    }

    loadTasks();
    return () => {
      isActive = false;
    };
  }, [navigate, isClient, isEmployee]);

  const roleFilteredTasks = tasks.filter((task) => {
    if (isClient) return Number(task.clientId) === Number(user?.id);
    if (isEmployee) return isAssignedTaskForUser(task, user);
    return true;
  });

  const filteredTasks = roleFilteredTasks.filter((task) => {
    const searchValue = searchTerm.trim().toLowerCase();
    const taskStatus = String(task.status ?? "").trim();
    const translatedStatus = getTaskStatusLabel(taskStatus);
    const normalizedStatus = normalizeTaskStatusValue(taskStatus);

    const matchesSearch =
      searchValue.length === 0 ||
      [
        task.number,
        task.client,
        task.employee,
        task.service,
        task.description,
        taskStatus,
        translatedStatus,
        task.createdAt,
        task.dueDate,
        task.priority,
      ]
        .filter((value) => value !== null && value !== undefined)
        .join(" ")
        .toLowerCase()
        .includes(searchValue);

    const matchesStatus = statusFilter === "todos" || statusFilter === normalizedStatus;

    return matchesSearch && matchesStatus;
  });

  const nextTaskNumber =
    filteredTasks.reduce((max, task) => Math.max(max, task.number), 0) + 1;

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError("");
  }

  function resetForm() {
    setForm({ ...emptyForm });
    setEditingId(null);
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    const createdAt = editingId
      ? tasks.find((task) => task.id === editingId)?.createdAt
      : today();

    if (isClient && editingId === null && form.service && form.service !== "") {
      // no-op: creation validation is handled below for client requests
    }

    if (!isClient && form.dueDate < createdAt) {
      setError("La fecha de finalización no puede ser anterior a la fecha de creación.");
      return;
    }

    if (isClient && !editingId) {
      const hasOpenRequestByService = tasks.some((task) => {
        if (Number(task.clientId) !== Number(user?.id)) return false;
        if (task.service !== form.service) return false;
        return !isFinalizedStatus(task.status);
      });

      if (hasOpenRequestByService) {
        setError("Ya tienes una solicitud activa para este tipo de servicio.");
        return;
      }
    }

    setSaving(true);
    try {
      const payloadBody = isClient
        ? editingId !== null
          ? {
              description: form.description,
            }
          : {
              description: form.description,
              service: form.service,
            }
        : isEmployee
          ? {
              dueDate: form.dueDate,
              status: form.status,
            }
          : form;

      const payload = await requestTasks(editingId !== null ? `/${editingId}` : "", {
        method: editingId !== null ? "PUT" : "POST",
        body: JSON.stringify(payloadBody),
      });

      if (editingId !== null) {
        setTasks((current) => current.map((task) => (
          task.id === editingId ? payload.task : task
        )));
        setMessage(isEmployee ? "Estado actualizado exitosamente." : "Solicitud actualizada exitosamente.");
      } else {
        setTasks((current) => [...current, payload.task]);
        setMessage(isClient ? "Solicitud enviada exitosamente." : "Tarea registrada exitosamente.");
      }

      resetForm();
      setShowForm(false);
    } catch (requestError) {
      handleTaskRequestError(requestError, navigate, setError);
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(task) {
    if (isClient && !canClientEditTask(task)) {
      setError("Esta solicitud ya está cerrada y no puede modificarse.");
      return;
    }

    if (isEmployee) {
      setForm({
        clientId: task.clientId ? String(task.clientId) : "",
        employeeId: task.employeeId ? String(task.employeeId) : "",
        dueDate: task.dueDate,
        description: task.description,
        service: task.service,
        priority: task.priority,
        status: task.status,
      });
    } else {
      setForm({
        clientId: task.clientId ? String(task.clientId) : "",
        employeeId: task.employeeId ? String(task.employeeId) : "",
        dueDate: task.dueDate,
        description: task.description,
        service: task.service,
        priority: task.priority,
        status: task.status,
      });
    }

    setEditingId(task.id);
    setMessage("");
    setError("");
    setShowForm(true);
  }

  async function handleDelete(task) {
    setError("");
    setMessage("");
    setDeletingId(task.id);

    try {
      await requestTasks(`/${task.id}`, { method: "DELETE" });
      setTasks((current) => current.filter((currentTask) => currentTask.id !== task.id));
      setMessage("Tarea eliminada.");
      setTaskToDelete(null);
      window.requestAnimationFrame(() => newTaskButtonRef.current?.focus());
    } catch (requestError) {
      handleTaskRequestError(requestError, navigate, setError);
    } finally {
      setDeletingId(null);
    }
  }

  function requestDelete(task, event) {
    deleteTriggerRef.current = event.currentTarget;
    setTaskToDelete(task);
  }

  function cancelDelete() {
    setTaskToDelete(null);
    setError("");
    window.requestAnimationFrame(() => deleteTriggerRef.current?.focus());
  }

  function handleCancel() {
    resetForm();
    setShowForm(false);
    setMessage("");
  }

  function handleNewTask() {
    resetForm();
    if (isClient) {
      setForm((current) => ({
        ...current,
        clientId: String(user?.id ?? ""),
        employeeId: "",
        dueDate: "",
        priority: "Baja",
        status: "Vista",
      }));
    }
    setMessage("");
    setShowForm(true);
  }

  return (
    <div className="dashboard-layout">
      <DashboardSidebar />
      <main className="dashboard-content tasks-content">
        <AccountActions />
        <div className="tasks-page">
      <header className="tasks-header">
        <h1>{pageTitle}</h1>
        <p>
          {isClient
            ? "Consulta y gestiona tus solicitudes de servicio."
            : "Registra y administra las tareas solicitadas por los clientes."}
        </p>
      </header>

      {message && (
        <p className="tasks-message tasks-message-success" role="status">
          {message}
        </p>
      )}

      {error && (
        <p className="tasks-message tasks-message-error" role="alert">
          {error}
        </p>
      )}

      {showForm ? (
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
                {saving ? "Guardando..." : editingId !== null ? (isEmployee ? "Guardar cambios" : "Guardar solicitud") : (isClient ? "Solicitar" : "Registrar tarea")}
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
      ) : (
        <section className="tasks-panel" aria-labelledby="task-list-title">
          <div className="tasks-list-header">
            <h2 id="task-list-title">Listado de {pageTitle.toLowerCase()}</h2>
            {canCreateRequest && (
              <button
                className="tasks-button"
                type="button"
                onClick={handleNewTask}
                ref={newTaskButtonRef}
              >
                {isClient ? "Solicitar servicio" : "Nueva tarea"}
              </button>
            )}
          </div>

          <div className="tasks-filter-bar" style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "16px", alignItems: "end" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: "6px", minWidth: "220px", color: "#2c3e50", fontWeight: 600 }}>
              Buscar
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={isClient ? "Buscar por servicio, descripción o estado" : "Buscar por cliente, servicio o estado"}
                style={{ padding: "10px 12px", border: "1px solid #d7dfe8", borderRadius: "10px", fontSize: "0.95rem" }}
              />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: "6px", minWidth: "180px", color: "#2c3e50", fontWeight: 600 }}>
              Estado
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                style={{ padding: "10px 12px", border: "1px solid #d7dfe8", borderRadius: "10px", fontSize: "0.95rem" }}
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

          {loading ? (
            <p className="tasks-empty" role="status">Cargando tareas...</p>
          ) : error ? null : filteredTasks.length === 0 ? (
            <p className="tasks-empty">
              {isClient ? "Todavía no tienes solicitudes registradas." : "Todavía no hay tareas registradas."}
            </p>
          ) : (
            <>
              <div className="tasks-table-wrap" role="region" aria-label="Listado de tareas" tabIndex="0">
                <table className="tasks-table">
                <thead>
                  <tr>
                    <th scope="col">N.º</th>
                    <th scope="col">Cliente</th>
                    {!isClient && <th scope="col">Empleado asignado</th>}
                    <th scope="col">Creación</th>
                    {!isClient && <th scope="col">Finalización</th>}
                    <th scope="col">Servicio</th>
                    {!isClient && <th scope="col">Prioridad</th>}
                    <th scope="col">Estado</th>
                    <th scope="col">Descripción</th>
                    <th scope="col">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((task) => (
                    <tr key={task.id}>
                      <td>{task.number}</td>
                      <td>{task.client}</td>
                      {!isClient && <td>{task.employee || "Sin asignar"}</td>}
                      <td>{task.createdAt}</td>
                      {!isClient && <td>{task.dueDate}</td>}
                      <td>{task.service}</td>
                      {!isClient && (
                        <td>
                          <span className={`tasks-priority tasks-priority-${String(task.priority ?? "").toLowerCase()}`}>
                            {task.priority || "Sin asignar"}
                          </span>
                        </td>
                      )}
                      <td>
                        <span className={`tasks-status tasks-status-${String(task.status ?? "").toLowerCase().replaceAll(" ", "-")}`}>
                          {isClient ? getTaskStatusLabel(task.status) : task.status}
                        </span>
                      </td>
                      <td>{task.description}</td>
                      <td>
                        <div className="tasks-actions">
                          {isClient && canClientEditTask(task) && (
                            <button
                              type="button"
                              onClick={() => handleEdit(task)}
                              aria-label={`Editar tarea número ${task.number}`}
                            >
                              Editar
                            </button>
                          )}
                          {!isClient && (
                            <button
                              type="button"
                              onClick={() => handleEdit(task)}
                              aria-label={`Editar tarea número ${task.number}`}
                            >
                              Editar
                            </button>
                          )}
                          {canDeleteTask && (
                            <button
                              className="tasks-delete"
                              type="button"
                              onClick={(event) => requestDelete(task, event)}
                              disabled={deletingId === task.id}
                              aria-label={`Eliminar tarea número ${task.number}`}
                            >
                              Eliminar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                </table>
              </div>

              <div className="tasks-mobile-list" aria-label="Listado de tareas">
                {filteredTasks.map((task) => (
                  <article className="tasks-mobile-item" key={task.id}>
                    <div className="tasks-mobile-heading">
                      <div>
                        <p className="tasks-mobile-service">
                          {pageTitle.slice(0, -1)} n.º {task.number} · {task.service}
                        </p>
                        <h3>{task.client}</h3>
                      </div>
                      {isClient ? (
                        <span className={`tasks-status tasks-status-${String(task.status ?? "").toLowerCase().replaceAll(" ", "-")}`}>
                          {getTaskStatusLabel(task.status)}
                        </span>
                      ) : (
                        <span className={`tasks-status tasks-status-${task.status.toLowerCase().replaceAll(" ", "-")}`}>
                          {task.status}
                        </span>
                      )}
                    </div>

                    {!isClient && (
                      <dl className="tasks-mobile-summary">
                        <div>
                          <dt>Prioridad</dt>
                          <dd>
                            <span className={`tasks-priority tasks-priority-${String(task.priority ?? "").toLowerCase()}`}>
                              {task.priority || "Sin asignar"}
                            </span>
                          </dd>
                        </div>
                        <div>
                          <dt>Finalización</dt>
                          <dd>{task.dueDate}</dd>
                        </div>
                        <div>
                          <dt>Empleado asignado</dt>
                          <dd>{task.employee || "Sin asignar"}</dd>
                        </div>
                      </dl>
                    )}

                    <details className="tasks-mobile-details">
                      <summary>Detalles de la {pageTitle.toLowerCase().slice(0, -1)}</summary>
                      <dl>
                        <div>
                          <dt>Fecha de creación</dt>
                          <dd>{task.createdAt}</dd>
                        </div>
                        <div>
                          <dt>Estado</dt>
                          <dd>{isClient ? getTaskStatusLabel(task.status) : task.status}</dd>
                        </div>
                        <div>
                          <dt>Descripción</dt>
                          <dd>{task.description}</dd>
                        </div>
                      </dl>
                    </details>

                    <div className="tasks-actions tasks-mobile-actions">
                      {(isClient ? canClientEditTask(task) : true) && (
                        <button
                          type="button"
                          onClick={() => handleEdit(task)}
                          aria-label={`Editar tarea número ${task.number}`}
                        >
                          Editar
                        </button>
                      )}
                      {canDeleteTask && (
                        <button
                          className="tasks-delete"
                          type="button"
                          onClick={(event) => requestDelete(task, event)}
                          disabled={deletingId === task.id}
                          aria-label={`Eliminar tarea número ${task.number}`}
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {taskToDelete && (
        <dialog
          className="tasks-delete-dialog"
          ref={deleteDialogRef}
          aria-labelledby="delete-task-title"
          aria-describedby="delete-task-description"
          onCancel={(event) => {
            event.preventDefault();
            if (deletingId === null) cancelDelete();
          }}
        >
          <h2 id="delete-task-title">¿Eliminar esta tarea?</h2>
          <p id="delete-task-description">
            Se eliminará la tarea n.º {taskToDelete.number} de {taskToDelete.client}. Esta acción no se puede deshacer.
          </p>
          {error && (
            <p className="tasks-message tasks-message-error" role="alert">{error}</p>
          )}
          <div className="tasks-actions">
            <button
              className="tasks-button tasks-button-secondary"
              type="button"
              onClick={cancelDelete}
              disabled={deletingId !== null}
              autoFocus
            >
              Conservar tarea
            </button>
            <button
              className="tasks-button tasks-delete"
              type="button"
              onClick={() => handleDelete(taskToDelete)}
              disabled={deletingId !== null}
            >
              {deletingId !== null ? "Eliminando..." : "Eliminar tarea"}
            </button>
          </div>
        </dialog>
      )}
        </div>
      </main>
    </div>
  );
}

export default Tareas;