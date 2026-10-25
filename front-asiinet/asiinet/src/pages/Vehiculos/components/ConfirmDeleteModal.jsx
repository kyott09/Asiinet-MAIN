import { useEffect, useRef } from "react";

export default function ConfirmDeleteModal({
  isOpen,
  title = "Confirmar eliminación",
  message = "¿Estás seguro de que deseas eliminar este elemento? Esta acción no se puede deshacer.",
  onClose,
  onConfirm,
  loading = false,
  error = "",
}) {
  const confirmBtnRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    confirmBtnRef.current?.focus();

    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !loading) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-desc"
        style={{ maxWidth: "460px" }}
      >
        <div className="modal-header">
          <h2 id="confirm-dialog-title">{title}</h2>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            disabled={loading}
            aria-label="Cerrar modal"
          >
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>

        <div className="modal-body">
          <p id="confirm-dialog-desc" style={{ margin: 0, fontSize: "0.95rem" }}>
            {message}
          </p>

          {error && (
            <div className="vehiculos-alert vehiculos-alert-error" role="alert">
              <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn-danger"
            ref={confirmBtnRef}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin" aria-hidden="true" />
                <span>Eliminando...</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-trash-can" aria-hidden="true" />
                <span>Eliminar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
