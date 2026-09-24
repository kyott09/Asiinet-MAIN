import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/auth/AuthLayout";
import PasswordField from "../components/auth/PasswordField";
import RememberMe from "../components/auth/RememberMe";
import TextField from "../components/auth/TextField";

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
      const response = await fetch("http://localhost:8080/api/users/login", {
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
    <div className={isLeaving ? "auth-page is-leaving" : "auth-page"}>
      <AuthLayout
        title="Iniciar sesión"
        subtitle="Usá tu cuenta de Asiinet"
        titleId="login-title"
        footer={
          <>
            ¿Es nuevo en Asiinet? <Link to="/register" viewTransition>Crear una cuenta</Link>
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

          <RememberMe />

          {error && <p className="auth-error">{error}</p>}

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? "Ingresando..." : "Siguiente"}
          </button>
        </form>
      </AuthLayout>
    </div>
  );
}

export default Login;