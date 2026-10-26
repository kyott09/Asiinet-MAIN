import { useState, useEffect, useRef, useCallback } from "react";
import DashboardSidebar from "../../components/dashboard/DashboardSidebar";
import AccountActions from "../../components/dashboard/AccountActions";
import VehiclesTab from "./components/VehiclesTab";
import ModelsTab from "./components/ModelsTab";
import BrandsTab from "./components/BrandsTab";
import VehicleModal from "./components/VehicleModal";
import ModelModal from "./components/ModelModal";
import BrandModal from "./components/BrandModal";
import ConfirmDeleteModal from "./components/ConfirmDeleteModal";
import { vehicleService } from "../../services/vehicleService";
import "./Vehiculos.css";

const TABS = [
  { id: "vehicles", label: "Vehículos", icon: "fa-truck" },
  { id: "models", label: "Modelos", icon: "fa-car-side" },
  { id: "brands", label: "Marcas", icon: "fa-tag" },
];

function getUserSession() {
  try {
    const raw = sessionStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function Vehiculos() {
  const user = getUserSession();
  const role = (user?.role ?? "cliente").toLowerCase();
  const canWrite = role === "admin" || role === "supervisor";

  const [activeTab, setActiveTab] = useState("vehicles");
  const tabRefs = useRef([]);
  const returnFocusRef = useRef(null);
  const visibleTabs = canWrite ? TABS : [TABS[0]];

  // Data states
  const [vehicles, setVehicles] = useState([]);
  const [models, setModels] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalError, setGlobalError] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  // Modals state
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const [modelModalOpen, setModelModalOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState(null);

  const [brandModalOpen, setBrandModalOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState(null);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'vehicle' | 'model' | 'brand', item }
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Form submit loading / errors
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 4000);
  };

  // Carga inicial de datos
  const loadAllData = useCallback(async () => {
    setLoading(true);
    setGlobalError("");
    try {
      const [vehiclesRes, modelsRes, brandsRes] = await Promise.all([
        vehicleService.getVehicles(),
        vehicleService.getModels(),
        vehicleService.getBrands(),
      ]);

      setVehicles(vehiclesRes?.vehicles || []);
      setModels(modelsRes?.vehicleModels || []);
      setBrands(brandsRes?.brands || []);
    } catch (err) {
      setGlobalError(
        err.message || "No se pudieron cargar los datos de la flota vehicular."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      vehicleService.getVehicles(),
      vehicleService.getModels(),
      vehicleService.getBrands(),
    ])
      .then(([vehiclesRes, modelsRes, brandsRes]) => {
        if (!active) return;
        setVehicles(vehiclesRes?.vehicles || []);
        setModels(modelsRes?.vehicleModels || []);
        setBrands(brandsRes?.brands || []);
        setGlobalError("");
      })
      .catch((err) => {
        if (!active) return;
        setGlobalError(
          err.message || "No se pudieron cargar los datos de la flota vehicular."
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // WAI-ARIA Keyboard navigation on tabs (Arrows, Home, End)
  const handleTabKeyDown = (event, currentIndex) => {
    let nextIndex;
    const total = visibleTabs.length;

    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        nextIndex = (currentIndex + 1) % total;
        break;
      case "ArrowLeft":
      case "ArrowUp":
        nextIndex = (currentIndex - 1 + total) % total;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = total - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    const nextTab = visibleTabs[nextIndex];
    setActiveTab(nextTab.id);
    tabRefs.current[nextIndex]?.focus();
  };

  // --- Handlers Vehículos ---
  const handleOpenCreateVehicle = () => {
    returnFocusRef.current = document.activeElement;
    setSelectedVehicle(null);
    setModalError("");
    setVehicleModalOpen(true);
  };

  const handleOpenEditVehicle = (vehicle) => {
    returnFocusRef.current = document.activeElement;
    setSelectedVehicle(vehicle);
    setModalError("");
    setVehicleModalOpen(true);
  };

  const handleSaveVehicle = async (payload, id) => {
    setModalLoading(true);
    setModalError("");
    try {
      if (id) {
        await vehicleService.updateVehicle(id, payload);
        showToast("Vehículo actualizado exitosamente.");
      } else {
        await vehicleService.createVehicle(payload);
        showToast("Vehículo registrado exitosamente.");
      }
      setVehicleModalOpen(false);
      loadAllData();
    } catch (err) {
      setModalError(err.message || "Error al guardar el vehículo.");
    } finally {
      setModalLoading(false);
    }
  };

  // --- Handlers Modelos ---
  const handleOpenCreateModel = () => {
    returnFocusRef.current = document.activeElement;
    setSelectedModel(null);
    setModalError("");
    setModelModalOpen(true);
  };

  const handleOpenEditModel = (model) => {
    returnFocusRef.current = document.activeElement;
    setSelectedModel(model);
    setModalError("");
    setModelModalOpen(true);
  };

  const handleSaveModel = async (payload, id) => {
    setModalLoading(true);
    setModalError("");
    try {
      if (id) {
        await vehicleService.updateModel(id, payload);
        showToast("Modelo actualizado exitosamente.");
      } else {
        await vehicleService.createModel(payload);
        showToast("Modelo creado exitosamente.");
      }
      setModelModalOpen(false);
      loadAllData();
    } catch (err) {
      setModalError(err.message || "Error al guardar el modelo.");
    } finally {
      setModalLoading(false);
    }
  };

  // --- Handlers Marcas ---
  const handleOpenCreateBrand = () => {
    returnFocusRef.current = document.activeElement;
    setSelectedBrand(null);
    setModalError("");
    setBrandModalOpen(true);
  };

  const handleOpenEditBrand = (brand) => {
    returnFocusRef.current = document.activeElement;
    setSelectedBrand(brand);
    setModalError("");
    setBrandModalOpen(true);
  };

  const handleSaveBrand = async (payload, id) => {
    setModalLoading(true);
    setModalError("");
    try {
      if (id) {
        await vehicleService.updateBrand(id, payload);
        showToast("Marca actualizada exitosamente.");
      } else {
        await vehicleService.createBrand(payload);
        showToast("Marca creada exitosamente.");
      }
      setBrandModalOpen(false);
      loadAllData();
    } catch (err) {
      setModalError(err.message || "Error al guardar la marca.");
    } finally {
      setModalLoading(false);
    }
  };

  // --- Handlers Delete ---
  const handleOpenDelete = (type, item) => {
    returnFocusRef.current = document.activeElement;
    setDeleteTarget({ type, item });
    setDeleteError("");
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    setDeleteError("");

    try {
      if (deleteTarget.type === "vehicle") {
        await vehicleService.deleteVehicle(deleteTarget.item.id);
        showToast("Vehículo eliminado correctamente.");
      } else if (deleteTarget.type === "model") {
        await vehicleService.deleteModel(deleteTarget.item.id);
        showToast("Modelo eliminado correctamente.");
      } else if (deleteTarget.type === "brand") {
        await vehicleService.deleteBrand(deleteTarget.item.id);
        showToast("Marca eliminada correctamente.");
      }

      setDeleteModalOpen(false);
      setDeleteTarget(null);
      returnFocusRef.current?.focus();
      returnFocusRef.current = null;
      loadAllData();
    } catch (err) {
      setDeleteError(err.message || "No se pudo eliminar el registro.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const closeDialog = (setOpen) => {
    setOpen(false);
    requestAnimationFrame(() => {
      returnFocusRef.current?.focus();
      returnFocusRef.current = null;
    });
  };

  // Delete modal texts
  const getDeleteModalInfo = () => {
    if (!deleteTarget) return {};
    if (deleteTarget.type === "vehicle") {
      return {
        title: "Eliminar Vehículo",
        message: `¿Estás seguro de que deseas eliminar el vehículo con patente ${deleteTarget.item.patente}?`,
      };
    }
    if (deleteTarget.type === "model") {
      return {
        title: "Eliminar Modelo",
        message: `¿Estás seguro de que deseas eliminar el modelo "${deleteTarget.item.descripcion}"? Si tiene vehículos asociados, no se podrá eliminar.`,
      };
    }
    if (deleteTarget.type === "brand") {
      return {
        title: "Eliminar Marca",
        message: `¿Estás seguro de que deseas eliminar la marca "${deleteTarget.item.descripcion}"? Si tiene modelos asociados, no se podrá eliminar.`,
      };
    }
    return {};
  };

  const getTabBadgeCount = (tabId) => {
    if (tabId === "vehicles") return vehicles.length;
    if (tabId === "models") return models.length;
    if (tabId === "brands") return brands.length;
    return 0;
  };

  return (
    <div className="dashboard-layout">
      <DashboardSidebar />

      <main className="dashboard-content vehiculos-content" id="main-content">
        <AccountActions />

        <div className="vehiculos-page">
          <header className="vehiculos-header">
            <div>
              <h1>Gestión de Vehículos</h1>
              <p>
                Control integral de la flota vehicular, marcas y modelos de la empresa.
              </p>
            </div>
          </header>

          {/* Toast Notification */}
          {toastMessage && (
            <div
              className="vehiculos-alert vehiculos-alert-success"
              role="status"
              aria-live="polite"
            >
              <i className="fa-solid fa-circle-check" aria-hidden="true" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Error General */}
          {globalError && (
            <div className="vehiculos-alert vehiculos-alert-error" role="alert">
              <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />
              <span>{globalError}</span>
              <button
                type="button"
                className="btn-secondary"
                style={{ marginLeft: "auto", minHeight: "32px", padding: "4px 10px" }}
                onClick={loadAllData}
              >
                Reintentar
              </button>
            </div>
          )}

          {/* WAI-ARIA Tablist Pattern */}
          <div
            role="tablist"
            aria-label="Secciones de flota y vehículos"
            className="vehiculos-tablist"
          >
            {visibleTabs.map((tab, idx) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  ref={(el) => (tabRefs.current[idx] = el)}
                  role="tab"
                  id={`tab-${tab.id}`}
                  aria-selected={isSelected}
                  aria-controls={`panel-${tab.id}`}
                  tabIndex={isSelected ? 0 : -1}
                  className={`vehiculos-tab${isSelected ? " is-active" : ""}`}
                  onClick={() => setActiveTab(tab.id)}
                  onKeyDown={(e) => handleTabKeyDown(e, idx)}
                  type="button"
                >
                  <i className={`fa-solid ${tab.icon}`} aria-hidden="true" />
                  <span>{tab.label}</span>
                  <span className="vehiculos-tab-badge">
                    {getTabBadgeCount(tab.id)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Tabpanels */}
          {canWrite && <div
            role="tabpanel"
            id="panel-vehicles"
            aria-labelledby="tab-vehicles"
            tabIndex={0}
            hidden={activeTab !== "vehicles"}
            className="vehiculos-tabpanel"
          >
            {activeTab === "vehicles" && (
              <VehiclesTab
                vehicles={vehicles}
                brands={brands}
                models={models}
                canWrite={canWrite}
                onNewVehicle={handleOpenCreateVehicle}
                onEditVehicle={handleOpenEditVehicle}
                onDeleteVehicle={(v) => handleOpenDelete("vehicle", v)}
                loading={loading}
              />
            )}
          </div>}

          {canWrite && <div
            role="tabpanel"
            id="panel-models"
            aria-labelledby="tab-models"
            tabIndex={0}
            hidden={activeTab !== "models"}
            className="vehiculos-tabpanel"
          >
            {activeTab === "models" && (
              <ModelsTab
                models={models}
                brands={brands}
                canWrite={canWrite}
                onNewModel={handleOpenCreateModel}
                onEditModel={handleOpenEditModel}
                onDeleteModel={(m) => handleOpenDelete("model", m)}
                loading={loading}
              />
            )}
          </div>}

          <div
            role="tabpanel"
            id="panel-brands"
            aria-labelledby="tab-brands"
            tabIndex={0}
            hidden={activeTab !== "brands"}
            className="vehiculos-tabpanel"
          >
            {activeTab === "brands" && (
              <BrandsTab
                brands={brands}
                canWrite={canWrite}
                onNewBrand={handleOpenCreateBrand}
                onEditBrand={handleOpenEditBrand}
                onDeleteBrand={(b) => handleOpenDelete("brand", b)}
                loading={loading}
              />
            )}
          </div>
        </div>
      </main>

      {/* Modales */}
      {vehicleModalOpen && (
        <VehicleModal
          isOpen={vehicleModalOpen}
          vehicle={selectedVehicle}
          models={models}
          onClose={() => closeDialog(setVehicleModalOpen)}
          onSave={handleSaveVehicle}
          loading={modalLoading}
          error={modalError}
        />
      )}

      {modelModalOpen && (
        <ModelModal
          isOpen={modelModalOpen}
          model={selectedModel}
          brands={brands}
          onClose={() => closeDialog(setModelModalOpen)}
          onSave={handleSaveModel}
          loading={modalLoading}
          error={modalError}
        />
      )}

      {brandModalOpen && (
        <BrandModal
          isOpen={brandModalOpen}
          brand={selectedBrand}
          onClose={() => closeDialog(setBrandModalOpen)}
          onSave={handleSaveBrand}
          loading={modalLoading}
          error={modalError}
        />
      )}

      {deleteModalOpen && (
        <ConfirmDeleteModal
          isOpen={deleteModalOpen}
          title={getDeleteModalInfo().title}
          message={getDeleteModalInfo().message}
          onClose={() => closeDialog(setDeleteModalOpen)}
          onConfirm={handleConfirmDelete}
          loading={deleteLoading}
          error={deleteError}
        />
      )}
    </div>
  );
}
