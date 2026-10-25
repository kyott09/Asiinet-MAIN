import { useEffect, useRef, useState } from "react";

const PATENTE_REGEX = /^([A-Z]{3}\d{3}|[A-Z]{2}\d{3}[A-Z]{2})$/;

export default function VehicleModal({
  isOpen,
  vehicle = null, // null = crear, object = editar
  models = [],
  onClose,
  onSave,
  loading = false,
  error = "",
}) {
  const currentMaxYear = new Date().getFullYear() + 1;

  const [patente, setPatente] = useState("");
  const [color, setColor] = useState("");
  const [vehicleModelId, setVehicleModelId] = useState("");
  const [anio, setAnio] = useState("");
  const [estado, setEstado] = useState("disponible");
  const [descripcion, setDescripcion] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const patenteInputRef = useRef(null);
  const isEditing = Boolean(vehicle?.id);

  useEffect(() => {
    if (isOpen) {
      setPatente(vehicle?.patente ?? "");
      setColor(vehicle?.color ?? "");
      setVehicleModelId(vehicle?.vehicleModel?.id ? String(vehicle.vehicleModel.id) : "");
      setAnio(vehicle?.anio !== undefined && vehicle?.anio !== null ? String(vehicle.anio) : "");
      setEstado(vehicle?.estado ?? "disponible");
      setDescripcion(vehicle?.descripcion ?? "");
      setFieldErrors({});
      setTimeout(() => patenteInputRef.current?.focus(), 50);
    }
  }, [isOpen, vehicle]);

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

    // 1. Patente
    const normalizedPatente = patente.trim().toUpperCase();
    if (!normalizedPatente) {
      errors.patente = "La patente es obligatoria";
    } else if (!PATENTE_REGEX.test(normalizedPatente)) {
      errors.patente = "Formato de patente inválido (ej: ABC123 o AB123CD)";
    }

    // 2. Color
    const cleanColor = color.trim();
    if (!cleanColor) {
      errors.color = "El color es obligatorio";
    } else if (cleanColor.length > 50) {
      errors.color = "El color no puede superar 50 caracteres";
    }

    // 3. Modelo
    const numModelId = Number(vehicleModelId);
    if (!vehicleModelId || !Number.isSafeInteger(numModelId) || numModelId <= 0) {
      errors.vehicleModelId = "Debes seleccionar un modelo de vehículo";
    }

    // 4. Año (nullable)
    let parsedAnio = null;
    if (anio.trim()) {
      const numAnio = Number(anio.trim());
      if (!Number.isInteger(numAnio) || numAnio < 1980 || numAnio > currentMaxYear) {
        errors.anio = `El año debe ser un número entero entre 1980 y ${currentMaxYear}`;
      } else {
        parsedAnio = numAnio;
      }
    }

    // 5. Estado
    if (!["disponible", "en_uso", "mantenimiento"].includes(estado)) {
      errors.estado = "Estado inválido";
    }

    // 6. Descripción (opcional)
    const cleanDesc = descripcion.trim() || null;
    if (cleanDesc && cleanDesc.length > 500) {
      errors.descripcion = "La descripción no puede superar 500 caracteres";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    onSave(
      {
        patente: normalizedPatente,
        color: cleanColor,
        vehicleModelId: numModelId,
        anio: parsedAnio,
        estado,
        descripcion: cleanDesc,
      },
      vehicle?.id
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
        aria-labelledby="vehicle-modal-title"
      >
        <div className="modal-header">
          <h2 id="vehicle-modal-title">
            {isEditing ? "Editar Vehículo" : "Nuevo Vehículo"}
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

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="vehicle-patente">
                  Patente <span aria-hidden="true">*</span>
                </label>
                <input
                  id="vehicle-patente"
                  ref={patenteInputRef}
                  type="text"
                  className="vehiculos-input"
                  placeholder="Ej: ABC123 o AB123CD"
                  value={patente}
                  onChange={(e) => {
                    setPatente(e.target.value.toUpperCase());
                    if (fieldErrors.patente) {
                      setFieldErrors((prev) => ({ ...prev, patente: "" }));
                    }
                  }}
                  maxLength={10}
                  required
                  disabled={loading}
                  style={{ textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}
                />
                {fieldErrors.patente && (
                  <span className="form-error">{fieldErrors.patente}</span>
                )}
                <span className="form-hint">Formato argentino viejo o Mercosur</span>
              </div>

              <div className="form-group">
                <label htmlFor="vehicle-color">
                  Color <span aria-hidden="true">*</span>
                </label>
                <input
                  id="vehicle-color"
                  type="text"
                  className="vehiculos-input"
                  placeholder="Ej: Blanco, Plata, Azul"
                  value={color}
                  onChange={(e) => {
                    setColor(e.target.value);
                    if (fieldErrors.color) {
                      setFieldErrors((prev) => ({ ...prev, color: "" }));
                    }
                  }}
                  maxLength={50}
                  required
                  disabled={loading}
                />
                {fieldErrors.color && (
                  <span className="form-error">{fieldErrors.color}</span>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="vehicle-model-select">
                  Modelo y Marca <span aria-hidden="true">*</span>
                </label>
                <select
                  id="vehicle-model-select"
                  className="vehiculos-select"
                  value={vehicleModelId}
                  onChange={(e) => {
                    setVehicleModelId(e.target.value);
                    if (fieldErrors.vehicleModelId) {
                      setFieldErrors((prev) => ({ ...prev, vehicleModelId: "" }));
                    }
                  }}
                  required
                  disabled={loading}
                >
                  <option value="">Seleccione un modelo...</option>
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.brand?.descripcion ? `${m.brand.descripcion} - ` : ""}
                      {m.descripcion}
                    </option>
                  ))}
                </select>
                {fieldErrors.vehicleModelId && (
                  <span className="form-error">{fieldErrors.vehicleModelId}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="vehicle-anio">Año (opcional)</label>
                <input
                  id="vehicle-anio"
                  type="number"
                  min="1980"
                  max={currentMaxYear}
                  className="vehiculos-input"
                  placeholder={`1980 - ${currentMaxYear}`}
                  value={anio}
                  onChange={(e) => {
                    setAnio(e.target.value);
                    if (fieldErrors.anio) {
                      setFieldErrors((prev) => ({ ...prev, anio: "" }));
                    }
                  }}
                  disabled={loading}
                />
                {fieldErrors.anio && (
                  <span className="form-error">{fieldErrors.anio}</span>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="vehicle-estado">
                Estado operativo <span aria-hidden="true">*</span>
              </label>
              <select
                id="vehicle-estado"
                className="vehiculos-select"
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                required
                disabled={loading}
              >
                <option value="disponible">Disponible</option>
                <option value="en_uso">En uso</option>
                <option value="mantenimiento">Mantenimiento</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="vehicle-descripcion">Notas / Observaciones</label>
              <textarea
                id="vehicle-descripcion"
                className="vehiculos-textarea"
                rows="3"
                placeholder="Detalles sobre equipamiento, historial o asignación..."
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                maxLength={500}
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
                <span>{isEditing ? "Actualizar Vehículo" : "Guardar Vehículo"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
