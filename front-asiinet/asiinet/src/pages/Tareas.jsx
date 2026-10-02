import { useEffect, useState } from "react";
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

  setError(requestError.message);
}

const today = () => new Date().toLocaleDateString("en-CA");

const emptyForm = {
  clientId: "",
  employeeId: "",
  dueDate: "",
  description: "",
  service: "",
  priority: "Media",
  status: "Vista",
};

function Tareas() {
  const navigate = useNavigate();
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

  useEffect(() => {
    let isActive = true;

    async function loadTasks() {
      try {
        const [taskPayload, userPayload] = await Promise.all([
          requestTasks(),
          requestAssignableUsers(),
        ]);
        if (isActive) {
          setTasks(taskPayload.tasks ?? []);
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
  }, [navigate]);

  const nextTaskNumber =
    tasks.reduce((max, task) => Math.max(max, task.number), 0) + 1;

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

    if (form.dueDate < createdAt) {
      setError("La fecha de finalización no puede ser anterior a la fecha de creación.");
      return;
    }

    setSaving(true);
    try {
      const payload = await requestTasks(editingId !== null ? `/${editingId}` : "", {
        method: editingId !== null ? "PUT" : "POST",
        body: JSON.stringify(form),
      });

      if (editingId !== null) {
        setTasks((current) => current.map((task) => (
          task.id === editingId ? payload.task : task
        )));
        setMessage("Tarea actualizada exitosamente.");
      } else {
        setTasks((current) => [...current, payload.task]);
        setMessage("Tarea registrada exitosamente.");
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
    setForm({
      clientId: task.clientId ? String(task.clientId) : "",
      employeeId: task.employeeId ? String(task.employeeId) : "",
      dueDate: task.dueDate,
      description: task.description,
      service: task.service,
      priority: task.priority,
      status: task.status,
    });
    setEditingId(task.id);
    setMessage("");
    setError("");
    setShowForm(true);
  }

  async function handleDelete(id) {
    setError("");
    setMessage("");
    setDeletingId(id);

    try {
      await requestTasks(`/${id}`, { method: "DELETE" });
      setTasks((current) => current.filter((task) => task.id !== id));
      setMessage("Tarea eliminada.");
    } catch (requestError) {
      handleTaskRequestError(requestError, navigate, setError);
    } finally {
      setDeletingId(null);
    }
  }

  function handleCancel() {
    resetForm();
    setShowForm(false);
    setMessage("");
  }

  function handleNewTask() {
    resetForm();
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
        <h1>Tareas</h1>
        <p>Registra y administra las tareas solicitadas por los clientes.</p>
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
            {editingId !== null ? "Editar tarea" : "Nueva tarea"}
          </h2>

          <form className="tasks-form" onSubmit={handleSubmit}>
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

            <div className="tasks-form-row">
              <label>
                Fecha de finalización
                <input
                  type="date"
                  name="dueDate"
                  value={form.dueDate}
                  min={editingId !== null
                    ? tasks.find((task) => task.id === editingId)?.createdAt
                    : today()}
                  onChange={handleChange}
                  required
                />
              </label>

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

            <div className="tasks-actions">
              <button className="tasks-button" type="submit" disabled={saving}>
                {saving ? "Guardando..." : editingId !== null ? "Guardar cambios" : "Registrar tarea"}
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
            <h2 id="task-list-title">Listado de tareas</h2>
            <button className="tasks-button" type="button" onClick={handleNewTask}>
              Nueva tarea
            </button>
          </div>

          {loading ? (
            <p className="tasks-empty" role="status">Cargando tareas...</p>
          ) : tasks.length === 0 ? (
            <p className="tasks-empty">Todavía no hay tareas registradas.</p>
          ) : (
            <div className="tasks-table-wrap">
              <table className="tasks-table">
                <thead>
                  <tr>
                    <th scope="col">N.º</th>
                    <th scope="col">Cliente</th>
                    <th scope="col">Empleado asignado</th>
                    <th scope="col">Creación</th>
                    <th scope="col">Finalización</th>
                    <th scope="col">Servicio</th>
                    <th scope="col">Prioridad</th>
                    <th scope="col">Estado</th>
                    <th scope="col">Descripción</th>
                    <th scope="col">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr key={task.id}>
                      <td>{task.number}</td>
                      <td>{task.client}</td>
                      <td>{task.employee || "Sin asignar"}</td>
                      <td>{task.createdAt}</td>
                      <td>{task.dueDate}</td>
                      <td>{task.service}</td>
                      <td>
                        <span className={`tasks-priority tasks-priority-${task.priority.toLowerCase()}`}>
                          {task.priority}
                        </span>
                      </td>
                      <td>
                        <span className={`tasks-status tasks-status-${task.status.toLowerCase().replaceAll(" ", "-")}`}>
                          {task.status}
                        </span>
                      </td>
                      <td>{task.description}</td>
                      <td>
                        <div className="tasks-actions">
                          <button type="button" onClick={() => handleEdit(task)}>
                            Editar
                          </button>
                          <button
                            className="tasks-delete"
                            type="button"
                            onClick={() => handleDelete(task.id)}
                            disabled={deletingId === task.id}
                          >
                            {deletingId === task.id ? "Eliminando..." : "Eliminar"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
        </div>
      </main>
    </div>
  );
}

export default Tareas;