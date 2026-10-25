import { useEffect, useRef, useState } from "react";

export default function ModelModal({
  isOpen,
  model = null, // null = crear, object = editar
  brands = [],
  onClose,
  onSave,
  loading = false,
  error = "",
}) {
  const [descripcion, setDescripcion] = useState("");
  const [brandId, setBrandId] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const inputRef = useRef(null);

  const isEditing = Boolean(model?.id);

  useEffect(() => {
    if (isOpen) {
      setDescripcion(model?.descripcion ?? "");
      setBrandId(model?.brand?.id ? String(model.brand.id) : "");
      setFieldErrors({});
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, model]);

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
    const errors = {};

    const cleanDesc = descripcion.trim();
    if (!cleanDesc) {
      errors.descripcion = "La descripción del modelo es obligatoria";
    } else if (cleanDesc.length > 100) {
      errors.descripcion = "La descripción no puede superar 100 caracteres";
    }

    const numBrandId = Number(brandId);
    if (!brandId || !Number.isSafeInteger(numBrandId) || numBrandId <= 0) {
      errors.brandId = "Debes seleccionar una marca válida";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    onSave(
      {
        descripcion: cleanDesc,
        brandId: numBrandId,
      },
      model?.id
    );
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
        aria-labelledby="model-modal-title"
      >
        <div className="modal-header">
          <h2 id="model-modal-title">
            {isEditing ? "Editar Modelo" : "Nuevo Modelo de Vehículo"}
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
              <label htmlFor="model-brand-id">
                Marca asociada <span aria-hidden="true">*</span>
              </label>
              <select
                id="model-brand-id"
                className="vehiculos-select"
                value={brandId}
                onChange={(e) => {
                  setBrandId(e.target.value);
                  if (fieldErrors.brandId) {
                    setFieldErrors((prev) => ({ ...prev, brandId: "" }));
                  }
                }}
                required
                disabled={loading}
              >
                <option value="">Seleccione una marca...</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.descripcion}
                  </option>
                ))}
              </select>
              {fieldErrors.brandId && (
                <span className="form-error">{fieldErrors.brandId}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="model-descripcion">
                Descripción del modelo <span aria-hidden="true">*</span>
              </label>
              <input
                id="model-descripcion"
                ref={inputRef}
                type="text"
                className="vehiculos-input"
                placeholder="Ej: Hilux, Ranger, Corolla, Kangoo"
                value={descripcion}
                onChange={(e) => {
                  setDescripcion(e.target.value);
                  if (fieldErrors.descripcion) {
                    setFieldErrors((prev) => ({ ...prev, descripcion: "" }));
                  }
                }}
                maxLength={100}
                required
                disabled={loading}
              />
              {fieldErrors.descripcion && (
                <span className="form-error">{fieldErrors.descripcion}</span>
              )}
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
                <span>{isEditing ? "Actualizar Modelo" : "Guardar Modelo"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
