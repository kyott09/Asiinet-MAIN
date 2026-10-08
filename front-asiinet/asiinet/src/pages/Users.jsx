import { useEffect, useRef, useState } from "react";
import AccountActions from "../components/dashboard/AccountActions";
import DashboardSidebar from "../components/dashboard/DashboardSidebar";
import "./Users.css";

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

function UserFields({ form, onChange, isCreating, passwordHelpId }) {
  return (
    <>
      <label className="users-field">
        <span>Nombre completo</span>
        <input
          autoComplete="name"
          name="nombre"
          value={form.nombre}
          onChange={onChange}
          required
        />
      </label>
      <label className="users-field">
        <span>Email</span>
        <input
          autoComplete="email"
          name="email"
          type="email"
          spellCheck="false"
          value={form.email}
          onChange={onChange}
          required
        />
      </label>
      {isCreating && (
        <label className="users-field">
          <span>Contraseña inicial</span>
          <input
            autoComplete="new-password"
            name="password"
            type="password"
            minLength={8}
            aria-describedby={passwordHelpId}
            value={form.password}
            onChange={onChange}
            required
          />
          <small id={passwordHelpId}>
            Usá entre 8 y 72 bytes. No hace falta combinar tipos de caracteres.
          </small>
        </label>
      )}
      <label className="users-field">
        <span>Rol</span>
        <select name="role" value={form.role} onChange={onChange} required>
          {ROLES.map((role) => (
            <option key={role.value} value={role.value}>
              {role.label}
            </option>
          ))}
        </select>
      </label>
    </>
  );
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
          body: JSON.stringify(form),
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
              <div className="users-table-wrap">
                <table className="users-table">
                  <caption className="users-sr-only">Cuentas registradas en Asiinet</caption>
                  <thead>
                    <tr>
                      <th scope="col">Nombre</th>
                      <th scope="col">Email</th>
                      <th scope="col">Rol</th>
                      <th scope="col">Creado</th>
                      <th scope="col">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="users-name-cell">{user.nombre}</td>
                        <td className="users-email-cell">{user.email}</td>
                        <td>
                          <span className="users-role">{ROLES.find((role) => role.value === user.role)?.label ?? user.role}</span>
                        </td>
                        <td>{formatDate(user.creadoEn)}</td>
                        <td>{renderUserActions(user)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ul className="users-cards" aria-label="Usuarios">
                {users.map((user) => (
                  <li className="users-card" key={user.id}>
                    <div className="users-card-heading">
                      <h2>{user.nombre}</h2>
                      <span className="users-role">{ROLES.find((role) => role.value === user.role)?.label ?? user.role}</span>
                    </div>
                    <p className="users-email-cell">{user.email}</p>
                    <p className="users-created">Creado {formatDate(user.creadoEn)}</p>
                    {renderUserActions(user)}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </main>

      <dialog
        ref={dialogRef}
        className="users-dialog"
        aria-labelledby="users-dialog-title"
        aria-describedby={dialogMode === "delete" ? "users-delete-description" : undefined}
        onClose={handleDialogClose}
        onCancel={(event) => {
          if (saving) event.preventDefault();
        }}
      >
        {dialogMode === "delete" ? (
          <div className="users-dialog-content">
            <h2 id="users-dialog-title" ref={dialogHeadingRef} tabIndex="-1">
              Eliminar usuario
            </h2>
            <p id="users-delete-description">
              ¿Querés eliminar la cuenta de <strong>{selectedUser?.nombre}</strong>?
              Esta acción no se puede deshacer. Si tiene tareas asociadas, el
              servidor rechazará la eliminación para conservarlas. También se
              eliminarán sus eventos del calendario.
            </p>
            {formError && (
              <p className="users-form-error" role="alert" tabIndex="-1" ref={errorRef}>
                {formError}
              </p>
            )}
            <div className="users-dialog-actions">
              <button className="users-button users-button-secondary" type="button" onClick={closeDialog} disabled={saving}>
                Cancelar
              </button>
              <button className="users-button users-button-danger" type="button" onClick={handleDelete} disabled={saving}>
                {saving ? "Eliminando…" : "Eliminar usuario"}
              </button>
            </div>
          </div>
        ) : (
          <form className="users-dialog-content users-form" onSubmit={handleSubmit}>
            <h2 id="users-dialog-title" ref={dialogHeadingRef} tabIndex="-1">
              {dialogMode === "create" ? "Crear usuario" : "Editar usuario"}
            </h2>
            <UserFields
              form={form}
              onChange={handleFormChange}
              isCreating={dialogMode === "create"}
              passwordHelpId="users-password-help"
            />
            {formError && (
              <p className="users-form-error" role="alert" tabIndex="-1" ref={errorRef}>
                {formError}
              </p>
            )}
            <div className="users-dialog-actions">
              <button className="users-button users-button-secondary" type="button" onClick={closeDialog} disabled={saving}>
                Cancelar
              </button>
              <button className="users-button users-button-primary" type="submit" disabled={saving}>
                {saving
                  ? "Guardando…"
                  : dialogMode === "create"
                    ? "Crear usuario"
                    : "Guardar cambios"}
              </button>
            </div>
          </form>
        )}
      </dialog>
    </div>
  );
}

export default Users;
