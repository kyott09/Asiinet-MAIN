import { SERVICE_DETAIL_OPTIONS } from "../../../../../../shared/taskServiceDetails.js";

function FieldError({ id, message }) {
  if (!message) return null;
  return <span className="tasks-field-error" id={id} role="alert">{message}</span>;
}

function ServiceDetailsFields({ service, value, errors = {}, disabled = false, onChange }) {
  const fields = SERVICE_DETAIL_OPTIONS[service];
  if (!fields) return null;

  const updateField = (fieldName, nextValue) => {
    onChange({ ...(value ?? {}), [fieldName]: nextValue });
  };

  if (value === null || value === undefined) {
    return (
      <div className="tasks-service-details-optional">
        <p>Los detalles específicos del servicio son opcionales.</p>
        <button
          className="tasks-button tasks-button-secondary"
          type="button"
          onClick={() => onChange({})}
          disabled={disabled}
        >
          Agregar detalles del servicio
        </button>
      </div>
    );
  }

  return (
    <fieldset className="tasks-service-details">
      <legend>Detalles para {service.toLowerCase()}</legend>
      <div className="tasks-service-details-grid">
        {fields.map((field) => {
          const errorId = `service-details-${field.name}-error`;
          const error = errors[field.name];
          const describedBy = error ? errorId : undefined;
          const fieldValue = value[field.name];

          if (field.type === "equipmentList") {
            const equipment = Array.isArray(fieldValue) ? fieldValue : [];
            return (
              <div className="tasks-detail-field tasks-detail-field-wide" key={field.name}>
                <span className="tasks-detail-label">{field.label}</span>
                <div className="tasks-equipment-list">
                  {equipment.map((item, index) => (
                    <div className="tasks-equipment-row" key={`${field.name}-${index}`}>
                      <label>
                        <span>Equipo {index + 1}</span>
                        <select
                          value={item.type ?? ""}
                          onChange={(event) => updateField(field.name, equipment.map((current, currentIndex) => (
                            currentIndex === index ? { ...current, type: event.target.value } : current
                          )))}
                          required={field.required}
                          disabled={disabled}
                          aria-describedby={describedBy}
                          aria-invalid={Boolean(error)}
                        >
                          <option value="">Seleccioná un equipo</option>
                          {field.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                      </label>
                      <label>
                        <span>Cantidad</span>
                        <input
                          type="number"
                          min={field.minQuantity}
                          max={field.maxQuantity}
                          step="1"
                          value={item.quantity ?? ""}
                          onChange={(event) => updateField(field.name, equipment.map((current, currentIndex) => (
                            currentIndex === index
                              ? { ...current, quantity: event.target.value === "" ? "" : Number(event.target.value) }
                              : current
                          )))}
                          required={field.required}
                          disabled={disabled}
                          aria-describedby={describedBy}
                          aria-invalid={Boolean(error)}
                        />
                      </label>
                      <button
                        className="tasks-button tasks-button-secondary tasks-equipment-remove"
                        type="button"
                        onClick={() => updateField(field.name, equipment.filter((_, currentIndex) => currentIndex !== index))}
                        disabled={disabled || equipment.length <= (field.minItems ?? 0)}
                        aria-label={`Quitar equipo ${index + 1}`}
                      >
                        Quitar
                      </button>
                    </div>
                  ))}
                </div>
                {equipment.length < field.maxItems && (
                  <button
                    className="tasks-button tasks-button-secondary"
                    type="button"
                    onClick={() => updateField(field.name, [...equipment, { type: "", quantity: field.minQuantity ?? 1 }])}
                    disabled={disabled}
                  >
                    Agregar equipo
                  </button>
                )}
                <FieldError id={errorId} message={error} />
              </div>
            );
          }

          if (field.type === "multiSelect") {
            const selected = Array.isArray(fieldValue) ? fieldValue : [];
            return (
              <fieldset className="tasks-detail-checks" key={field.name} aria-describedby={describedBy}>
                <legend>{field.label}</legend>
                <div>
                  {field.options.map((option) => (
                    <label className="tasks-detail-checkbox" key={option.value}>
                      <input
                        type="checkbox"
                        checked={selected.includes(option.value)}
                        onChange={(event) => updateField(field.name, event.target.checked
                          ? [...selected, option.value]
                          : selected.filter((item) => item !== option.value))}
                        disabled={disabled || (!selected.includes(option.value) && selected.length >= field.maxItems)}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
                <FieldError id={errorId} message={error} />
              </fieldset>
            );
          }

          return (
            <label className="tasks-detail-field" key={field.name}>
              <span>{field.label}</span>
              <select
                value={fieldValue ?? ""}
                onChange={(event) => updateField(field.name, event.target.value)}
                required={field.required}
                disabled={disabled}
                aria-describedby={describedBy}
                aria-invalid={Boolean(error)}
              >
                <option value="">Seleccioná una opción</option>
                {field.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              <FieldError id={errorId} message={error} />
            </label>
          );
        })}
      </div>
      <button
        className="tasks-button tasks-button-secondary"
        type="button"
        onClick={() => onChange(null)}
        disabled={disabled}
      >
        Quitar detalles
      </button>
    </fieldset>
  );
}

export default ServiceDetailsFields;
