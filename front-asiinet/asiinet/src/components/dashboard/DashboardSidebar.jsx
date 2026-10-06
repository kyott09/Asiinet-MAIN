import { NavLink, Link } from "react-router-dom";
import logoAsiinet from "../../assets/brand/logos/logo asiinet.png";
import "./DashboardSidebar.css";

function getUserSession() {
  try {
    const raw = sessionStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function DashboardSidebar() {
  const user = getUserSession();
  const isAdmin = user?.role === "admin";

  const links = [
    { label: "Inicio", icon: "fa-house", href: "/home" },
    { label: "Tareas", icon: "fa-list-check", href: "/tareas" },
    { label: "Galería", icon: "fa-images", href: "/galeria" },
    ...(isAdmin ? [{ label: "Usuarios", icon: "fa-users", href: "/users" }] : []),
  ];

  return (
    <aside className="dashboard-sidebar" aria-label="Navegación principal">
      <Link className="sidebar-brand" to="/home" aria-label="Asiinet, ir al inicio">
        <span className="sidebar-brand-mark" aria-hidden="true">
          <img src={logoAsiinet} alt="" />
        </span>
        <span>asiinet</span>
      </Link>

      <p className="sidebar-caption">Operaciones</p>
      <nav className="sidebar-navigation">
        {links.map((item) => (
          <NavLink
            className={({ isActive }) => `sidebar-link${isActive ? " is-active" : ""}`}
            to={item.href}
            key={item.href}
          >
            <i className={`fa-solid ${item.icon}`} aria-hidden="true"></i>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <span className="sidebar-footer-mark" aria-hidden="true"></span>
        <span>Gestión de servicios</span>
      </div>
    </aside>
  );
}

export default DashboardSidebar;
