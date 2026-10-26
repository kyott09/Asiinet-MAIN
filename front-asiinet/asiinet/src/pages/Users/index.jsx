import { useEffect, useRef, useState } from "react";
import AccountActions from "../../components/dashboard/AccountActions";
import DashboardSidebar from "../../components/dashboard/DashboardSidebar";
import "./Users.css";
import UsersTable from "./components/UsersTable";
import UsersCards from "./components/UsersCards";
import UsersDialog from "./components/UsersDialog";
import { buildUserUpdatePayload } from "./userManagementPayload";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";
const USERS_URL = `${API_BASE_URL}/api/users`;
const EMPTY_FORM = {
  nombre: "",
  email: "",
  password: "",
  role: "cliente",
};
const ROLES = [
  { value: "admin", label: "Administrador" },
  { value: "supervisor", label: "Supervisor" },
  { value: "operador", label: "Operador" },
  { value: "cliente", label: "Cliente" },
];

async function requestUsers(path = "", options = {}) {
  const response = await fetch(`${USERS_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error("El servidor devolvió una respuesta no válida.");
  }

  if (!response.ok) {
    const error = new Error(payload.message || "No se pudo completar la operación.");
    error.status = response.status;
    throw error;
  }

  return payload;
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Fecha no disponible";

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getErrorMessage(error) {
  if (error instanceof TypeError) {
    return "No se pudo conectar con el servidor. Revisá la conexión y probá de nuevo.";
  }

  return error.message || "No se pudo completar la operación.";
}

function getUserSession() {
  try {
    const raw = sessionStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function syncCurrentUser(updatedUser) {
  const currentUser = getUserSession();
  if (!currentUser || Number(currentUser.id) !== Number(updatedUser.id)) return;

  const nextUser = {
    ...currentUser,
    nombre: updatedUser.nombre,
    email: updatedUser.email,
    role: updatedUser.role,
  };
  sessionStorage.setItem("user", JSON.stringify(nextUser));
  window.dispatchEvent(new Event("asiinet:user-updated"));
}



function Users() {
  const dialogRef = useRef(null);
  const dialogTriggerRef = useRef(null);
  const addButtonRef = useRef(null);
  const dialogHeadingRef = useRef(null);
  const errorRef = useRef(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [dialogMode, setDialogMode] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const payload = await requestUsers();
      if (!Array.isArray(payload.users)) {
        throw new Error("La respuesta del servidor no contiene un listado válido de usuarios.");
      }
      setUsers(payload.users);
    } catch (error) {
      setLoadError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    requestUsers()
      .then((payload) => {
        if (!Array.isArray(payload.users)) {
          throw new Error("La respuesta del servidor no contiene un listado válido de usuarios.");
        }
        if (active) setUsers(payload.users);
      })
      .catch((error) => {
        if (active) setLoadError(getErrorMessage(error));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (dialogMode && !dialog.open) {
      dialog.showModal();
      dialogHeadingRef.current?.focus();
    } else if (!dialogMode && dialog.open) {
      dialog.close();
    }
  }, [dialogMode]);

  const closeDialog = () => {
    if (saving) return;
    setDialogMode(null);
    setSelectedUser(null);
    setForm(EMPTY_FORM);
    setFormError("");
  };

  const openCreateDialog = (event) => {
    dialogTriggerRef.current = event.currentTarget;
    setSelectedUser(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setDialogMode("create");
  };

  const openEditDialog = (user, event) => {
    dialogTriggerRef.current = event.currentTarget;
    setSelectedUser(user);
    setForm({
      nombre: user.nombre,
      email: user.email,
      password: "",
      role: user.role,
    });
    setFormError("");
    setDialogMode("edit");
  };

  const openDeleteDialog = (user, event) => {
    dialogTriggerRef.current = event.currentTarget;
    setSelectedUser(user);
    setFormError("");
    setDialogMode("delete");
  };

  const handleDialogClose = () => {
    setDialogMode(null);
    setSelectedUser(null);
    setForm(EMPTY_FORM);
    setFormError("");
    if (dialogTriggerRef.current?.isConnected) {
      dialogTriggerRef.current.focus();
    } else {
      addButtonRef.current?.focus();
    }
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFormError("");

    const isCreating = dialogMode === "create";
    try {
      const result = await requestUsers(
        isCreating ? "" : `/${selectedUser.id}`,
        {
          method: isCreating ? "POST" : "PUT",
          body: JSON.stringify(isCreating ? form : buildUserUpdatePayload(form)),
        }
      );
      if (!isCreating) syncCurrentUser(result.user);
      setDialogMode(null);
      setSelectedUser(null);
      setForm(EMPTY_FORM);
      setNotice(isCreating ? "Usuario creado." : "Cambios guardados.");
      await loadUsers();
    } catch (error) {
      setFormError(getErrorMessage(error));
      requestAnimationFrame(() => errorRef.current?.focus());
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    setFormError("");

    try {
      await requestUsers(`/${selectedUser.id}`, { method: "DELETE" });
      setDialogMode(null);
      setSelectedUser(null);
      setForm(EMPTY_FORM);
      setNotice("Usuario eliminado.");
      await loadUsers();
    } catch (error) {
      setFormError(getErrorMessage(error));
      requestAnimationFrame(() => errorRef.current?.focus());
    } finally {
      setSaving(false);
    }
  };

  const renderUserActions = (user) => (
    <div className="users-row-actions">
      <button
        className="users-button users-button-secondary"
        type="button"
        aria-label={`Editar usuario ${user.nombre}`}
        onClick={(event) => openEditDialog(user, event)}
      >
        Editar
      </button>
      <button
        className="users-button users-button-danger"
        type="button"
        aria-label={`Eliminar usuario ${user.nombre}`}
        onClick={(event) => openDeleteDialog(user, event)}
      >
        Eliminar
      </button>
    </div>
  );

  return (
    <div className="dashboard-layout">
      <DashboardSidebar />
      <main id="main-content" tabIndex="-1" className="dashboard-content users-content">
        <AccountActions />
        <section className="users-page" aria-labelledby="users-title">
          <header className="users-header">
            <div>
              <h1 id="users-title">Usuarios</h1>
              <p>Administrá las cuentas y los roles del sistema.</p>
            </div>
            <button
              ref={addButtonRef}
              className="users-button users-button-primary"
              type="button"
              onClick={openCreateDialog}
            >
              Crear usuario
            </button>
          </header>

          {notice && (
            <p className="users-notice" role="status" aria-live="polite">
              {notice}
            </p>
          )}

          {loading && (
            <div className="users-loading" role="status" aria-label="Cargando usuarios…">
              <span className="users-sr-only">Cargando usuarios…</span>
              <span className="users-skeleton users-skeleton-heading" aria-hidden="true" />
              <span className="users-skeleton" aria-hidden="true" />
              <span className="users-skeleton" aria-hidden="true" />
              <span className="users-skeleton" aria-hidden="true" />
            </div>
          )}

          {!loading && loadError && (
            <div className="users-message users-message-error" role="alert">
              <p>{loadError}</p>
              <button className="users-button users-button-secondary" type="button" onClick={loadUsers}>
                Reintentar
              </button>
            </div>
          )}

          {!loading && !loadError && users.length === 0 && (
            <div className="users-message users-empty">
              <h2>Todavía no hay usuarios</h2>
              <p>Creá una cuenta para que pueda ingresar al sistema.</p>
            </div>
          )}

          {!loading && !loadError && users.length > 0 && (
            <>
              <UsersTable users={users} roles={ROLES} formatDate={formatDate} renderUserActions={renderUserActions} />
              <UsersCards users={users} roles={ROLES} formatDate={formatDate} renderUserActions={renderUserActions} />
            </>
          )}
        </section>
      </main>

      <UsersDialog
        dialogRef={dialogRef}
        dialogMode={dialogMode}
        dialogHeadingRef={dialogHeadingRef}
        selectedUser={selectedUser}
        formError={formError}
        errorRef={errorRef}
        saving={saving}
        closeDialog={closeDialog}
        handleDelete={handleDelete}
        handleDialogClose={handleDialogClose}
        handleSubmit={handleSubmit}
        handleFormChange={handleFormChange}
        form={form}
        roles={ROLES}
      />
    </div>
  );
}

export default Users;
