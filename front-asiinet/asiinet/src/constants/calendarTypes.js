export const EVENT_TYPES = {
  reunion: {
    id: "reunion",
    label: "Reunión",
    color: "#2B6CB0",
    icon: "fa-users",
  },
  cumpleanos: {
    id: "cumpleanos",
    label: "Cumpleaños",
    color: "#805AD5",
    icon: "fa-cake-candles",
  },
  capacitacion: {
    id: "capacitacion",
    label: "Capacitación",
    color: "#2F855A",
    icon: "fa-graduation-cap",
  },
  licencia: {
    id: "licencia",
    label: "Licencia",
    color: "#C05621",
    icon: "fa-calendar-minus",
  },
  otro: {
    id: "otro",
    label: "Otro",
    color: "#64748B",
    icon: "fa-flag",
  },
};

export const EVENT_TYPE_LIST = Object.values(EVENT_TYPES);

export function getEventTypeInfo(type) {
  return (
    EVENT_TYPES[type] ?? {
      id: "otro",
      label: "Otro",
      color: "#64748B",
      icon: "fa-flag",
    }
  );
}
