import { Link } from "react-router-dom";
import logoAsiinet from "../../assets/brand/images/logo-login-sinfondo.png";

function AuthLayout({
  title,
  subtitle,
  children,
  footer,
  titleId = "auth-title",
}) {
  return (
    <div className="auth-page">
      <section className="auth-card" aria-labelledby={titleId}>
        <div className="auth-brand-wrap">
          <img src={logoAsiinet} alt="Asiinet" className="auth-brand-logo" />
        </div>

        <div className="auth-card-header">
          <h1 id={titleId}>{title}</h1>
          {subtitle && <p className="auth-subtitle">{subtitle}</p>}
        </div>

        {children}

        {footer && <p className="auth-footer">{footer}</p>}
      </section>
    </div>
  );
}

export default AuthLayout;
