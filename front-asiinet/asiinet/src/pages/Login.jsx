import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/auth/AuthLayout";
import PasswordField from "../components/auth/PasswordField";
import TextField from "../components/auth/TextField";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al iniciar sesión");
      }

      sessionStorage.setItem("user", JSON.stringify(data.user));

      setIsLeaving(true);
      await new Promise((resolve) => setTimeout(resolve, 350));
      navigate("/home", { viewTransition: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
      <AuthLayout
        title="Iniciar sesión"
        subtitle="Usá tu cuenta de Asiinet"
        titleId="login-title"
        isLeaving={isLeaving}
        footer={
          <>
            ¿Todavía no tenés cuenta? <Link to="/register" viewTransition>Creá una cuenta</Link>
          </>
        }
      >
        <form className="auth-form" onSubmit={handleSubmit}>
          <TextField
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Correo electrónico"
            label="Email"
          />

          <PasswordField
            id="login-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            label="Contraseña"
          />

          {error && <p className="auth-error" role="alert">{error}</p>}

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? "Ingresando..." : "Siguiente"}
          </button>
        </form>
      </AuthLayout>
  );
}

export default Login;