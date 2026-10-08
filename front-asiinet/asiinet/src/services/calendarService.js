const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";
const EVENTS_URL = `${API_BASE_URL}/api/events`;

async function request(path = "", options = {}) {
  const response = await fetch(`${EVENTS_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.message || "Ocurrió un error al procesar la solicitud.";
    const error = new Error(message);
    error.statusCode = response.status;
    error.payload = data;
    throw error;
  }

  return data;
}

export const calendarService = {
  getEvents: async (month) => {
    const query = month ? `?month=${encodeURIComponent(month)}` : "";
    return request(query, { method: "GET" });
  },

  createEvent: async (eventData) => {
    return request("", {
      method: "POST",
      body: JSON.stringify(eventData),
    });
  },

  updateEvent: async (id, eventData) => {
    return request(`/${id}`, {
      method: "PUT",
      body: JSON.stringify(eventData),
    });
  },

  deleteEvent: async (id) => {
    return request(`/${id}`, {
      method: "DELETE",
    });
  },
};
