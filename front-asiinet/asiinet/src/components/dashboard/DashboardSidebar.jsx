import { NavLink, Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuToggleRef = useRef(null);
  const user = getUserSession();
  const role = (user?.role ?? "cliente").toLowerCase();
  const isAdmin = role === "admin";
  const isClient = role === "cliente";

  const links = [
    { label: "Inicio", icon: "fa-house", href: "/home" },
    { label: isClient ? "Solicitudes" : "Tareas", icon: "fa-list-check", href: "/tareas" },
    { label: "Galería", icon: "fa-images", href: "/galeria" },
    ...(!isClient ? [{ label: "Calendario", icon: "fa-calendar-days", href: "/calendario" }] : []),
    ...(isAdmin ? [{ label: "Usuarios", icon: "fa-users", href: "/users" }] : []),
  ];
  const upcomingLinks = [
    { label: "Vehículos", icon: "fa-truck" },
    { label: "Empleados", icon: "fa-people-group" },
    { label: "Roles", icon: "fa-user-shield" },
    { label: "Documentación", icon: "fa-file-lines" },
  ];

  useEffect(() => {
    if (!isMobileMenuOpen) return undefined;

    function handleKeyDown(event) {
      if (
        event.key !== "Escape" ||
        !window.matchMedia("(max-width: 760px)").matches
      ) {
        return;
      }

      setIsMobileMenuOpen(false);
      menuToggleRef.current?.focus();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileMenuOpen]);

  return (
    <aside className={`dashboard-sidebar${isMobileMenuOpen ? " mobile-menu-open" : ""}`}>
      <Link className="sidebar-brand" to="/home" aria-label="Asiinet, ir al inicio">
        <span className="sidebar-brand-mark" aria-hidden="true">
          <img src={logoAsiinet} alt="" />
        </span>
        <span>Asiinet</span>
      </Link>

      <button
        type="button"
        className="sidebar-mobile-toggle"
        ref={menuToggleRef}
        aria-expanded={isMobileMenuOpen}
        aria-controls="sidebar-navigation"
        onClick={() => setIsMobileMenuOpen((isOpen) => !isOpen)}
      >
        <i className={`fa-solid ${isMobileMenuOpen ? "fa-xmark" : "fa-bars"}`} aria-hidden="true"></i>
        <span>{isMobileMenuOpen ? "Cerrar menú" : "Menú"}</span>
      </button>

      <nav id="sidebar-navigation" className="sidebar-navigation" aria-label="Navegación principal">
        <p className="sidebar-caption">Operaciones</p>
        {links.map((item) => (
          <NavLink
            className={({ isActive }) => `sidebar-link${isActive ? " is-active" : ""}`}
            to={item.href}
            key={item.href}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <i className={`fa-solid ${item.icon}`} aria-hidden="true"></i>
            <span>{item.label}</span>
          </NavLink>
        ))}

        <p className="sidebar-caption sidebar-caption-upcoming">Próximamente</p>
        {upcomingLinks.map((item) => (
          <span className="sidebar-link sidebar-link-disabled" aria-disabled="true" key={item.label}>
            <i className={`fa-solid ${item.icon}`} aria-hidden="true"></i>
            <span>{item.label}</span>
            <small>Próximamente</small>
          </span>
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
