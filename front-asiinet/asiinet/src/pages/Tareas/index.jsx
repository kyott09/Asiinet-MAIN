import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AccountActions from "../../components/dashboard/AccountActions";
import DashboardSidebar from "../../components/dashboard/DashboardSidebar";
import "./Tareas.css";
import TaskSkeleton from "./components/TaskSkeleton";
import DeleteConfirm from "./components/DeleteConfirm";
import TaskFilters from "./components/TaskFilters";
import TaskTable from "./components/TaskTable";
import TaskCards from "./components/TaskCards";
import TaskForm from "./components/TaskForm";
import Pagination from "../../components/pagination/Pagination";
import { getValidPage } from "../../components/pagination/paginationUtils.js";
import { buildTaskPayload } from "../../../../../shared/taskPayload.js";
import { validateTaskServiceDetails } from "../../../../../shared/taskServiceDetails.js";
import { buildTaskListQuery, readTaskPaginationState } from "./taskPagination.js";

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
  serviceDetails: null,
  visitDate: "",
  visitTimeSlot: "",
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

function Tareas() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = getUserSession();
  const userRole = normalizeRoleName(user?.role);
  const isClient = userRole === "cliente";
  const isEmployee = userRole === "operador";
  const canCreateRequest = !isEmployee;
  const canDeleteTask = !isClient && !isEmployee;
  const pageTitle = isClient ? "Solicitudes" : "Tareas";
  const { page, pageSize, q: searchTerm, status: statusFilter } =
    readTaskPaginationState(searchParams);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  const [tasks, setTasks] = useState([]);
  const [taskMeta, setTaskMeta] = useState(null);
  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [serviceDetailsErrors, setServiceDetailsErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [assignablesLoading, setAssignablesLoading] = useState(!isClient && !isEmployee);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const deleteDialogRef = useRef(null);
  const deleteTriggerRef = useRef(null);
  const newTaskButtonRef = useRef(null);
  const searchEditStartedRef = useRef(false);

  useEffect(() => {
    const dialog = deleteDialogRef.current;
    if (taskToDelete && dialog) {
      dialog.showModal();
      return () => dialog.close();
    }
  }, [taskToDelete]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearchTerm(searchTerm), 250);
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    let isActive = true;

    async function loadTasks() {
      if (searchTerm !== debouncedSearchTerm) {
        setLoading(true);
        return;
      }

      setLoading(true);
      setError("");
      try {
        const query = buildTaskListQuery({
          page,
          pageSize,
          q: debouncedSearchTerm,
          status: statusFilter,
        });
        const taskPayload = await requestTasks(`?${query}`);
        if (!isActive) return;

        if (!Array.isArray(taskPayload.tasks) || !taskPayload.meta) {
          throw new Error("La respuesta del servidor no contiene una página válida de tareas.");
        }

        setTasks(taskPayload.tasks);
        setTaskMeta(taskPayload.meta);

        const lastValidPage = getValidPage(page, taskPayload.meta.totalPages);
        if (page !== lastValidPage) {
          setSearchParams((current) => {
            const next = new URLSearchParams(current);
            next.set("page", String(lastValidPage));
            return next;
          }, { replace: true });
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
  }, [
    navigate,
    page,
    pageSize,
    searchTerm,
    debouncedSearchTerm,
    statusFilter,
    refreshKey,
    setSearchParams,
  ]);

  useEffect(() => {
    let isActive = true;

    async function loadAssignableUsers() {
      if (isClient || isEmployee) {
        setClients([]);
        setEmployees([]);
        setAssignablesLoading(false);
        return;
      }

      try {
        const userPayload = await requestAssignableUsers();
        if (!isActive) return;
        setClients(userPayload.clients ?? []);
        setEmployees(userPayload.employees ?? []);
      } catch (requestError) {
        if (isActive) handleTaskRequestError(requestError, navigate, setError);
      } finally {
        if (isActive) setAssignablesLoading(false);
      }
    }

    loadAssignableUsers();
    return () => {
      isActive = false;
    };
  }, [navigate, isClient, isEmployee]);

  const filteredTasks = tasks;

  function updateListParams(updates, { replace = false, resetPage = true } = {}) {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === undefined || value === "") {
          next.delete(key);
        } else {
          next.set(key, String(value));
        }
      }
      if (resetPage) next.set("page", "1");
      return next;
    }, { replace });
  }

  function handleSearchTermChange(value) {
    updateListParams({ q: value.trim() ? value : null }, {
      replace: searchEditStartedRef.current,
    });
    searchEditStartedRef.current = true;
  }

  function handlePageChange(nextPage) {
    updateListParams({ page: nextPage }, { resetPage: false });
  }

  function handlePageSizeChange(nextPageSize) {
    updateListParams({ pageSize: nextPageSize });
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === "service" ? { serviceDetails: null } : {}),
    }));
    if (name === "service") setServiceDetailsErrors({});
    setError("");
  }

  function handleServiceDetailsChange(serviceDetails) {
    setForm((current) => ({ ...current, serviceDetails }));
    setServiceDetailsErrors({});
    setError("");
  }

  function handleClearVisit() {
    setForm((current) => ({ ...current, visitDate: "", visitTimeSlot: "" }));
    setError("");
  }

  function resetForm() {
    setForm({ ...emptyForm });
    setEditingId(null);
    setError("");
    setServiceDetailsErrors({});
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    const createdAt = editingId
      ? tasks.find((task) => task.id === editingId)?.createdAt
      : today();

    if (!isClient && form.dueDate && form.dueDate < createdAt) {
      setError("La fecha de finalización no puede ser anterior a la fecha de creación.");
      return;
    }

    const canWriteVisit = !isEmployee && (!isClient || editingId === null);
    if (canWriteVisit && Boolean(form.visitDate) !== Boolean(form.visitTimeSlot)) {
      setError("Seleccioná una fecha y una franja para la visita, o quitá ambos campos.");
      return;
    }

    const employeeRequired = !isClient && !isEmployee
      && (editingId === null || form.status !== "Vista");
    if (employeeRequired && !form.employeeId) {
      setError("Selecciona un operador registrado con rol operador.");
      return;
    }

    const canWriteDetails = isClient ? editingId === null : !isEmployee;
    if (canWriteDetails && form.serviceDetails !== null) {
      const detailErrors = validateTaskServiceDetails(form.service, form.serviceDetails);
      if (Object.keys(detailErrors).length > 0) {
        setServiceDetailsErrors(detailErrors);
        setError("Revisá los detalles del servicio antes de continuar.");
        return;
      }
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
      const payloadBody = buildTaskPayload({ role: userRole, editingId, form, canWriteVisit });
      if (!payloadBody) {
        setError("No se puede crear una tarea desde esta cuenta.");
        return;
      }

      await requestTasks(editingId !== null ? `/${editingId}` : "", {
        method: editingId !== null ? "PUT" : "POST",
        body: JSON.stringify(payloadBody),
      });

      if (editingId !== null) {
        setMessage(isEmployee ? "Estado actualizado exitosamente." : "Solicitud actualizada exitosamente.");
      } else {
        setMessage(isClient ? "Solicitud enviada exitosamente." : "Tarea registrada exitosamente.");
      }

      setRefreshKey((current) => current + 1);
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

    setForm({
      clientId: task.clientId ? String(task.clientId) : "",
      employeeId: task.employeeId ? String(task.employeeId) : "",
      dueDate: task.dueDate ?? "",
      description: task.description,
      service: task.service,
      priority: task.priority,
      status: task.status,
      serviceDetails: task.serviceDetails ?? null,
      visitDate: task.visitDate ?? "",
      visitTimeSlot: task.visitTimeSlot ?? "",
    });

    setEditingId(task.id);
    setMessage("");
    setError("");
    setServiceDetailsErrors({});
    setShowForm(true);
  }

  async function handleDelete(task) {
    setError("");
    setMessage("");
    setDeletingId(task.id);

    try {
      await requestTasks(`/${task.id}`, { method: "DELETE" });
      setMessage("Tarea eliminada.");
      setRefreshKey((current) => current + 1);
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
      <main id="main-content" tabIndex="-1" className="dashboard-content tasks-content">
        <AccountActions />
        <div className="tasks-page">
      <header className="tasks-header">
        <h1>{pageTitle}</h1>
        <p>
          {isClient
            ? "Consultá y gestioná tus solicitudes de servicio."
            : "Registrá y administrá las tareas solicitadas por los clientes."}
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
        <TaskForm
          form={form}
          editingId={editingId}
          isClient={isClient}
          isEmployee={isEmployee}
          canEditServiceDetails={isClient ? editingId === null : !isEmployee}
          canEditVisit={!isEmployee && (!isClient || editingId === null)}
          onClearVisit={handleClearVisit}
          serviceDetailsErrors={serviceDetailsErrors}
          onServiceDetailsChange={handleServiceDetailsChange}
          tasks={tasks}
          today={today}
          clients={clients}
          employees={employees}
          loading={loading || assignablesLoading}
          handleChange={handleChange}
          getTaskStatusLabel={getTaskStatusLabel}
          saving={saving}
          handleSubmit={handleSubmit}
          handleCancel={handleCancel}
        />
      ) : (
        <section className="tasks-panel" aria-labelledby="task-list-title" aria-busy={loading}>
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

          <TaskFilters
            isClient={isClient}
            searchTerm={searchTerm}
            setSearchTerm={handleSearchTermChange}
            statusFilter={statusFilter}
            setStatusFilter={(value) => updateListParams({ status: value === "todos" ? null : value })}
            onSearchFocus={() => { searchEditStartedRef.current = false; }}
            onSearchBlur={() => { searchEditStartedRef.current = false; }}
          />

          {loading ? (
            <TaskSkeleton />
          ) : error ? null : filteredTasks.length === 0 ? (
            <p className="tasks-empty">
              {searchTerm || statusFilter !== "todos"
                ? "No hay tareas que coincidan con los filtros."
                : isClient ? "Todavía no tenés solicitudes registradas." : "Todavía no hay tareas registradas."}
            </p>
          ) : (
            <>
              <TaskTable filteredTasks={filteredTasks} isClient={isClient} getTaskStatusLabel={getTaskStatusLabel} canClientEditTask={canClientEditTask} handleEdit={handleEdit} canDeleteTask={canDeleteTask} requestDelete={requestDelete} deletingId={deletingId} />

              <TaskCards filteredTasks={filteredTasks} pageTitle={pageTitle} isClient={isClient} getTaskStatusLabel={getTaskStatusLabel} canClientEditTask={canClientEditTask} handleEdit={handleEdit} canDeleteTask={canDeleteTask} requestDelete={requestDelete} deletingId={deletingId} />
            </>
          )}
          {!loading && !error && taskMeta && (
            <Pagination
              ariaLabel="Paginación de tareas"
              page={page}
              pageSize={pageSize}
              total={taskMeta.total}
              totalPages={taskMeta.totalPages}
              loading={loading}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          )}
        </section>
      )}

      <DeleteConfirm taskToDelete={taskToDelete} deleteDialogRef={deleteDialogRef} error={error} deletingId={deletingId} cancelDelete={cancelDelete} handleDelete={handleDelete} />
        </div>
      </main>
    </div>
  );
}

export default Tareas;