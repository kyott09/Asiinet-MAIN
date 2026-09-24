import { useState } from "react";

function PasswordField({
  id,
  value,
  onChange,
  placeholder,
  required = true,
  minLength,
  label = "Contraseña",
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <label className="auth-field auth-field-password" htmlFor={id}>
      <span className="sr-only">{label}</span>
      <input
        id={id}
        type={showPassword ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        minLength={minLength}
      />
      <button
        className="password-toggle"
        type="button"
        aria-label={showPassword ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`}
        onClick={() => setShowPassword((isVisible) => !isVisible)}
      >
        <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`} aria-hidden="true"></i>
      </button>
    </label>
  );
}

export default PasswordField;
