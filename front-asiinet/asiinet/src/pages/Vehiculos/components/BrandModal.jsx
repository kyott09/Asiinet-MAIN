import { useEffect, useRef, useState } from "react";

export default function BrandModal({
  isOpen,
  brand = null, // null = crear, object = editar
  onClose,
  onSave,
  loading = false,
  error = "",
}) {
  const [descripcion, setDescripcion] = useState("");
  const [fieldError, setFieldError] = useState("");
  const inputRef = useRef(null);

  const isEditing = Boolean(brand?.id);

  useEffect(() => {
    if (isOpen) {
      setDescripcion(brand?.descripcion ?? "");
      setFieldError("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, brand]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !loading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanDesc = descripcion.trim();
    if (!cleanDesc) {
      setFieldError("La descripción de la marca es obligatoria");
      return;
    }
    if (cleanDesc.length > 100) {
      setFieldError("La descripción no puede superar 100 caracteres");
      return;
    }

    onSave({ descripcion: cleanDesc }, brand?.id);
  };

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
        aria-labelledby="brand-modal-title"
      >
        <div className="modal-header">
          <h2 id="brand-modal-title">
            {isEditing ? "Editar Marca" : "Nueva Marca"}
          </h2>
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

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div className="vehiculos-alert vehiculos-alert-error" role="alert">
                <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="brand-descripcion">
                Descripción de la marca <span aria-hidden="true">*</span>
              </label>
              <input
                id="brand-descripcion"
                ref={inputRef}
                type="text"
                className="vehiculos-input"
                placeholder="Ej: Toyota, Ford, Chevrolet"
                value={descripcion}
                onChange={(e) => {
                  setDescripcion(e.target.value);
                  if (fieldError) setFieldError("");
                }}
                maxLength={100}
                required
                disabled={loading}
              />
              {fieldError && <span className="form-error">{fieldError}</span>}
              <span className="form-hint">
                Nombre de la marca comercial del fabricante.
              </span>
            </div>
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
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin" aria-hidden="true" />
                  <span>Guardando...</span>
                </>
              ) : (
                <span>{isEditing ? "Actualizar Marca" : "Guardar Marca"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
