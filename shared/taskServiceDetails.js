// Opciones de servicio de ejemplo, a confirmar con el área operativa antes de habilitarlas.
export const SERVICE_DETAIL_OPTIONS = {
  "Instalación": [
    {
      name: "equipment",
      label: "Equipamiento solicitado",
      type: "equipmentList",
      required: true,
      minItems: 1,
      maxItems: 3,
      minQuantity: 1,
      maxQuantity: 5,
      options: [
        { value: "modem", label: "Módem" },
        { value: "router", label: "Router" },
        { value: "repetidor", label: "Repetidor" },
      ],
    },
    {
      name: "speed",
      label: "Velocidad solicitada",
      type: "select",
      required: true,
      maxLength: 4,
      options: [
        { value: "50", label: "50 Mbps" },
        { value: "100", label: "100 Mbps" },
        { value: "300", label: "300 Mbps" },
        { value: "500", label: "500 Mbps" },
        { value: "1000", label: "1000 Mbps" },
      ],
    },
    {
      name: "propertyType",
      label: "Tipo de inmueble",
      type: "select",
      required: true,
      maxLength: 12,
      options: [
        { value: "casa", label: "Casa" },
        { value: "departamento", label: "Departamento" },
        { value: "comercio", label: "Comercio" },
        { value: "otro", label: "Otro" },
      ],
    },
  ],
  "Reconexión": [
    {
      name: "reason",
      label: "Motivo de reconexión",
      type: "select",
      required: true,
      maxLength: 23,
      options: [
        { value: "mudanza", label: "Mudanza" },
        { value: "falta_pago_regularizada", label: "Deuda regularizada" },
        { value: "solicitud_cliente", label: "Solicitud del cliente" },
        { value: "otro", label: "Otro" },
      ],
    },
    {
      name: "availableEquipment",
      label: "Equipamiento disponible",
      type: "multiSelect",
      required: false,
      minItems: 0,
      maxItems: 3,
      maxLength: 9,
      options: [
        { value: "modem", label: "Módem" },
        { value: "router", label: "Router" },
        { value: "repetidor", label: "Repetidor" },
      ],
    },
  ],
  "Servicio técnico": [
    {
      name: "problem",
      label: "Problema principal",
      type: "select",
      required: true,
      maxLength: 22,
      options: [
        { value: "sin_conexion", label: "Sin conexión" },
        { value: "conexion_lenta", label: "Conexión lenta" },
        { value: "conexion_intermitente", label: "Conexión intermitente" },
        { value: "problema_wifi", label: "Problema de Wi-Fi" },
        { value: "falla_equipo", label: "Falla de equipo" },
      ],
    },
    {
      name: "affectedEquipment",
      label: "Equipamiento afectado",
      type: "multiSelect",
      required: true,
      minItems: 1,
      maxItems: 4,
      maxLength: 11,
      options: [
        { value: "modem", label: "Módem" },
        { value: "router", label: "Router" },
        { value: "repetidor", label: "Repetidor" },
        { value: "cableado", label: "Cableado" },
      ],
    },
  ],
  "Desconexión": [
    {
      name: "reason",
      label: "Motivo de baja",
      type: "select",
      required: true,
      maxLength: 18,
      options: [
        { value: "mudanza", label: "Mudanza" },
        { value: "costo", label: "Costo del servicio" },
        { value: "sin_uso", label: "Ya no lo necesita" },
        { value: "otro", label: "Otro" },
      ],
    },
    {
      name: "equipmentReturn",
      label: "Retiro de equipos",
      type: "select",
      required: true,
      maxLength: 14,
      options: [
        { value: "si", label: "Sí" },
        { value: "no", label: "No" },
        { value: "no_corresponde", label: "No corresponde" },
      ],
    },
  ],
};

export function validateTaskServiceDetails(service, details) {
  if (details === null || details === undefined) return {};

  const fields = SERVICE_DETAIL_OPTIONS[service];
  if (!fields || typeof details !== "object" || Array.isArray(details)) {
    return { serviceDetails: "Los detalles no corresponden a un servicio válido." };
  }

  const errors = {};
  const allowedNames = new Set(fields.map((field) => field.name));
  if (Object.keys(details).some((key) => !allowedNames.has(key))) {
    errors.serviceDetails = "Los detalles contienen campos no permitidos.";
  }

  for (const field of fields) {
    const value = details[field.name];
    if (value === undefined || value === null || value === "") {
      if (field.required) errors[field.name] = "Completá este campo.";
      continue;
    }

    if (field.type === "select") {
      if (typeof value !== "string" || !field.options.some((option) => option.value === value)) {
        errors[field.name] = "Elegí una opción válida.";
      } else if (field.maxLength && value.length > field.maxLength) {
        errors[field.name] = `Usá hasta ${field.maxLength} caracteres.`;
      }
      continue;
    }

    if (!Array.isArray(value)) {
      errors[field.name] = "El formato de la lista no es válido.";
      continue;
    }
    if (field.minItems !== undefined && value.length < field.minItems) {
      errors[field.name] = `Agregá al menos ${field.minItems} elemento(s).`;
      continue;
    }
    if (field.maxItems !== undefined && value.length > field.maxItems) {
      errors[field.name] = `Agregá como máximo ${field.maxItems} elemento(s).`;
      continue;
    }

    if (field.type === "equipmentList") {
      const equipmentOptions = new Set(field.options.map((option) => option.value));
      const invalidEquipment = value.some((item) => (
        !item ||
        Object.keys(item).some((key) => !["type", "quantity"].includes(key)) ||
        !equipmentOptions.has(item.type) ||
        !Number.isInteger(item.quantity) ||
        item.quantity < field.minQuantity ||
        item.quantity > field.maxQuantity
      ));
      if (invalidEquipment) errors[field.name] = "Revisá el equipamiento y sus cantidades.";
      continue;
    }

    const options = new Set(field.options.map((option) => option.value));
    if (value.some((item) => typeof item !== "string" || !options.has(item))) {
      errors[field.name] = "Elegí opciones válidas.";
    }
  }

  return errors;
}

export function getTaskServiceDetailEntries(service, details) {
  if (!details || !SERVICE_DETAIL_OPTIONS[service]) return [];

  return SERVICE_DETAIL_OPTIONS[service]
    .filter((field) => details[field.name] !== undefined && details[field.name] !== null)
    .map((field) => {
      const value = details[field.name];
      if (field.type === "equipmentList") {
        return {
          label: field.label,
          value: value.map((item) => {
            const option = field.options.find(({ value: optionValue }) => optionValue === item.type);
            return `${option?.label ?? item.type} × ${item.quantity}`;
          }).join(", "),
        };
      }
      if (field.type === "multiSelect") {
        return {
          label: field.label,
          value: value.map((item) => field.options.find(({ value: optionValue }) => optionValue === item)?.label ?? item).join(", "),
        };
      }
      return {
        label: field.label,
        value: field.options.find(({ value: optionValue }) => optionValue === value)?.label ?? value,
      };
    });
}
