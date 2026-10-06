import logoAsiinet from "../../assets/brand/images/logo-login-sinfondo.png";
import { Link } from "react-router-dom";
import "./AuthLayout.css";
import "../ui/ActionButton.css";

function AuthLayout({
  title,
  subtitle,
  children,
  footer,
  titleId = "auth-title",
  isLeaving = false,
}) {
  return (
    <div className={`auth-page${isLeaving ? " is-leaving" : ""}`}>
      <div className="auth-layout">
        <aside className="auth-story">
          <Link className="auth-brand-wrap" to="/login" aria-label="Asiinet, ir al inicio de sesión">
            <img src={logoAsiinet} alt="" className="auth-brand-logo" />
          </Link>
          <div className="auth-story-copy">
            <p>Gestión de operaciones</p>
            <h2>El trabajo de campo, conectado.</h2>
            <span>
              Asiinet reúne las tareas de servicio para que cada solicitud
              llegue al equipo indicado.
            </span>
          </div>
          <div className="auth-route" aria-hidden="true">
            <span className="auth-route-point"></span>
            <span className="auth-route-line"></span>
            <span className="auth-route-node"><i className="fa-solid fa-tower-broadcast"></i></span>
            <span className="auth-route-line"></span>
            <span className="auth-route-point"></span>
          </div>
          <p className="auth-story-foot">Conectividad que se construye en equipo.</p>
        </aside>

        <section className="auth-card" aria-labelledby={titleId}>
          <div className="auth-card-header">
            <h1 id={titleId}>{title}</h1>
            {subtitle && <p className="auth-subtitle">{subtitle}</p>}
          </div>

          {children}

          {footer && <p className="auth-footer">{footer}</p>}
        </section>
      </div>
    </div>
  );
}

export default AuthLayout;
