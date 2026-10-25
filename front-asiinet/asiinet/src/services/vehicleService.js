const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

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

export const vehicleService = {
  // --- Vehículos ---
  getVehicles: async ({ brandId, modelId } = {}) => {
    const params = new URLSearchParams();
    if (brandId) params.append("brandId", brandId);
    if (modelId) params.append("modelId", modelId);
    const qs = params.toString() ? `?${params.toString()}` : "";
    return apiRequest(`/api/vehicles${qs}`, { method: "GET" });
  },

  getVehicleById: async (id) => {
    return apiRequest(`/api/vehicles/${id}`, { method: "GET" });
  },

  createVehicle: async (payload) => {
    return apiRequest("/api/vehicles", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  updateVehicle: async (id, payload) => {
    return apiRequest(`/api/vehicles/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  deleteVehicle: async (id) => {
    return apiRequest(`/api/vehicles/${id}`, { method: "DELETE" });
  },

  // --- Marcas ---
  getBrands: async () => {
    return apiRequest("/api/brands", { method: "GET" });
  },

  createBrand: async (payload) => {
    return apiRequest("/api/brands", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  updateBrand: async (id, payload) => {
    return apiRequest(`/api/brands/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  deleteBrand: async (id) => {
    return apiRequest(`/api/brands/${id}`, { method: "DELETE" });
  },

  // --- Modelos ---
  getModels: async (brandId) => {
    const endpoint = brandId
      ? `/api/vehicle-models/by-brand/${brandId}`
      : "/api/vehicle-models";
    return apiRequest(endpoint, { method: "GET" });
  },

  createModel: async (payload) => {
    return apiRequest("/api/vehicle-models", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  updateModel: async (id, payload) => {
    return apiRequest(`/api/vehicle-models/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  deleteModel: async (id) => {
    return apiRequest(`/api/vehicle-models/${id}`, { method: "DELETE" });
  },
};
