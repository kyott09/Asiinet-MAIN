import UserFields from "./UserFields";
function UsersDialog({ dialogRef, dialogMode, dialogHeadingRef, selectedUser, formError, errorRef, saving, closeDialog, handleDelete, handleDialogClose, handleSubmit, handleFormChange, form, roles }) {
  return (
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
              roles={roles}
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
  );
}

export default UsersDialog;
