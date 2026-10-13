import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AccountActions from "../components/dashboard/AccountActions";
import DashboardSidebar from "../components/dashboard/DashboardSidebar";
import "./Profile.css";
import "../components/ui/ActionButton.css";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

function getUserSession() {
  try {
    const raw = sessionStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function toProfileForm(payload) {
  return {
    nombre: payload?.nombre || "",
    email: payload?.email || "",
    fechaNacimiento: payload?.fechaNacimiento || "",
    domicilio: payload?.domicilio || "",
    fotoPerfil: payload?.fotoPerfil || "",
  };
}

function Profile() {
  const navigate = useNavigate();

  const [form, setForm] = useState(() => toProfileForm(getUserSession()));
  const [loading, setLoading] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    if (!getUserSession()) {
      navigate("/login");
      return;
    }

    const fetchFreshUser = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/users/me`, {
          method: "GET",
          credentials: "include",
        });

        if (response.status === 401) {
          sessionStorage.removeItem("user");
          navigate("/login", { replace: true });
          return;
        }
        if (!response.ok) {
          throw new Error("No se pudieron actualizar los datos del perfil.");
        }

        const data = await response.json();
        if (data?.user) {
          sessionStorage.setItem("user", JSON.stringify(data.user));
          window.dispatchEvent(new Event("asiinet:user-updated"));
          setForm(toProfileForm(data.user));
        }
      } catch (error) {
        setMessage({
          type: "error",
          text: error instanceof TypeError
            ? "No se pudo conectar con el servidor. Revisá la conexión y probá de nuevo."
            : error.message || "No se pudieron cargar los datos del perfil.",
        });
      } finally {
        setIsProfileLoading(false);
      }
    };

    fetchFreshUser();
  }, [navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({ ...prev, fotoPerfil: reader.result || "" }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage({ type: "", text: "" });
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/me`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre: form.nombre,
          email: form.email,
          fechaNacimiento: form.fechaNacimiento || null,
          domicilio: form.domicilio || null,
          fotoPerfil: form.fotoPerfil || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          sessionStorage.removeItem("user");
          navigate("/login", { replace: true });
          return;
        }
        throw new Error(data.message || "No se pudo actualizar el perfil");
      }

      sessionStorage.setItem("user", JSON.stringify(data.user));
      window.dispatchEvent(new Event("asiinet:user-updated"));
      setMessage({ type: "success", text: "Perfil actualizado." });
      setForm(toProfileForm(data.user));
    } catch (error) {
      setMessage({ type: "error", text: error.message || "Error al guardar" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <DashboardSidebar />
      <main id="main-content" tabIndex="-1" className="dashboard-content profile-content">
        <AccountActions />
        <div className="profile-page">
          <section className="profile-card" aria-labelledby="profile-title">
        <div className="profile-header">
          <div>
            <p className="profile-kicker">Cuenta</p>
            <h1 id="profile-title">Datos personales</h1>
          </div>
        </div>

        {isProfileLoading ? (
          <div className="profile-skeleton" role="status" aria-label="Cargando datos del perfil">
            <span className="profile-skeleton-line profile-skeleton-line-short" aria-hidden="true"></span>
            <span className="profile-skeleton-line" aria-hidden="true"></span>
            <span className="profile-skeleton-line" aria-hidden="true"></span>
            <span className="profile-skeleton-line profile-skeleton-line-tall" aria-hidden="true"></span>
            <span className="profile-skeleton-line" aria-hidden="true"></span>
          </div>
        ) : (
        <form className="profile-form" onSubmit={handleSubmit}>
          <div className="profile-field-row">
            <label className="profile-field">
              <span>Nombre</span>
              <input
                name="nombre"
                type="text"
                value={form.nombre}
                onChange={handleChange}
                placeholder="Ingresá tu nombre"
              />
            </label>
          </div>

          <div className="profile-field-row">
            <label className="profile-field">
              <span>Email</span>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="usuario@email.com"
              />
            </label>
          </div>

          <div className="profile-field-row">
            <label className="profile-field profile-photo-field">
              <span>Foto de perfil</span>
              <div className="profile-photo-upload">
                {form.fotoPerfil ? (
                  <img src={form.fotoPerfil} alt="Vista previa de perfil" className="profile-photo-preview" />
                ) : (
                  <div className="profile-photo-placeholder">Sin foto</div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </div>
            </label>
          </div>

          <div className="profile-field-row two-columns">
            <label className="profile-field">
              <span>Fecha de nacimiento</span>
              <input
                name="fechaNacimiento"
                type="date"
                value={form.fechaNacimiento}
                onChange={handleChange}
              />
            </label>

            <label className="profile-field">
              <span>Domicilio</span>
              <input
                name="domicilio"
                type="text"
                value={form.domicilio}
                onChange={handleChange}
                placeholder="Calle y número"
              />
            </label>
          </div>

          {message.text && (
            <p
              className={message.type === "success" ? "profile-message success" : "profile-message error"}
              role={message.type === "success" ? "status" : "alert"}
            >
              {message.text}
            </p>
          )}

          <div className="profile-actions">
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardá cambios"}
            </button>
          </div>
        </form>
        )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default Profile;
