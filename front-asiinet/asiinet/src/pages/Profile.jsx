import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function getUserSession() {
  try {
    const raw = sessionStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function Profile() {
  const navigate = useNavigate();
  const user = getUserSession();

  const [form, setForm] = useState({
    nombre: "",
    email: "",
    fechaNacimiento: "",
    domicilio: "",
    fotoPerfil: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const applyUserToForm = (payload) => {
    setForm({
      nombre: payload?.nombre || "",
      email: payload?.email || "",
      fechaNacimiento: payload?.fechaNacimiento || "",
      domicilio: payload?.domicilio || "",
      fotoPerfil: payload?.fotoPerfil || "",
    });
  };

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    applyUserToForm(user);

    const fetchFreshUser = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/users/me", {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) return;

        const data = await response.json();
        if (data?.user) {
          sessionStorage.setItem("user", JSON.stringify(data.user));
          applyUserToForm(data.user);
        }
      } catch {
        // Se mantiene la sesión actual si no puede cargar desde el back.
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
      const response = await fetch("http://localhost:8080/api/users/me", {
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
        throw new Error(data.message || "No se pudo actualizar el perfil");
      }

      sessionStorage.setItem("user", JSON.stringify(data.user));
      setMessage({ type: "success", text: "Perfil actualizado correctamente" });
      applyUserToForm(data.user);
    } catch (error) {
      setMessage({ type: "error", text: error.message || "Error al guardar" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-page">
      <section className="profile-card" aria-labelledby="profile-title">
        <div className="profile-header">
          <div>
            <p className="profile-kicker">Cuenta</p>
            <h1 id="profile-title">Datos personales</h1>
          </div>
        </div>

        <form className="profile-form" onSubmit={handleSubmit}>
          <div className="profile-field-row">
            <label className="profile-field">
              <span>Nombre</span>
              <input
                name="nombre"
                type="text"
                value={form.nombre}
                onChange={handleChange}
                placeholder="Ingrese su nombre"
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
            <p className={message.type === "success" ? "profile-message success" : "profile-message error"}>
              {message.text}
            </p>
          )}

          <div className="profile-actions">
            <button type="button" className="profile-secondary-button" onClick={() => navigate(-1)}>
              Volver
            </button>
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default Profile;
