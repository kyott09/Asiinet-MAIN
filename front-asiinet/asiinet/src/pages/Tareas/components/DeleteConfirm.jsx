function DeleteConfirm({ taskToDelete, deleteDialogRef, error, deletingId, cancelDelete, handleDelete }) {
  return (
    <>
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
    </>
  );
}

export default DeleteConfirm;
